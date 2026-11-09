import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const app = express()
app.use(cors())

// The React client talks to Supabase directly for auth/CRUD (RLS-protected).
// This server hosts custom backend logic: platform stats + Stripe monetization.

const APP_URL = process.env.APP_URL || 'http://localhost:5173'

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

const stripeReady = () =>
  Boolean(stripe && process.env.STRIPE_PRICE_PRO_MONTHLY && process.env.STRIPE_PRICE_PRO_YEARLY)

function requireSupabase(_req, res) {
  if (!supabase) {
    res.status(503).json({ error: 'Server-side Supabase not configured (see server/.env.example)' })
    return false
  }
  return true
}

function requireStripe(res) {
  if (!stripeReady()) {
    res.status(503).json({
      error:
        'Stripe not configured. Set STRIPE_SECRET_KEY, STRIPE_PRICE_PRO_MONTHLY and STRIPE_PRICE_PRO_YEARLY in server/.env',
    })
    return false
  }
  return true
}

/** Verify the caller's Supabase JWT and return their user, or respond 401. */
async function requireUser(req, res) {
  if (!requireSupabase(req, res)) return null
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization bearer token' })
    return null
  }
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return null
  }
  return data.user
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'promptvault-api', time: new Date().toISOString() })
})

// ---------------------------------------------------------------------------
// Stripe webhook — MUST be registered before express.json() so we keep the
// raw body needed for signature verification.
// ---------------------------------------------------------------------------
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Stripe webhook not configured' })
  }
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const subscription = event.data.object
  const proStatuses = ['active', 'trialing']

  try {
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      // user_id travels in the subscription metadata (set at checkout creation)
      const userId = subscription.metadata?.user_id
      if (userId) {
        await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: subscription.customer,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items.data[0]?.price.id ?? null,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        await supabase
          .from('profiles')
          .update({ plan: proStatuses.includes(subscription.status) ? 'pro' : 'free' })
          .eq('id', userId)
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const { data: row } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .maybeSingle()
      if (row?.user_id) {
        await supabase.from('profiles').update({ plan: 'free' }).eq('id', row.user_id)
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', cancel_at_period_end: false, updated_at: new Date().toISOString() })
          .eq('user_id', row.user_id)
      }
    }

    if (event.type === 'checkout.session.completed') {
      const userId = event.data.object.metadata?.user_id ?? event.data.object.subscription_details?.metadata?.user_id
      if (userId && event.data.object.subscription) {
        // subscription.updated will carry the full state; make sure a row exists
        await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: event.data.object.customer,
            stripe_subscription_id: event.data.object.subscription,
            status: 'active',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        await supabase.from('profiles').update({ plan: 'pro' }).eq('id', userId)
      }
    }
  } catch (err) {
    console.error('[stripe webhook]', err.message)
    return res.status(500).json({ error: err.message })
  }

  res.json({ received: true })
})

// ---------------------------------------------------------------------------
// JSON API below
// ---------------------------------------------------------------------------
app.use(express.json())

app.get('/api/stats', async (_req, res) => {
  if (!requireSupabase(_req, res)) return
  try {
    const [prompts, likes, follows, copies] = await Promise.all([
      supabase.from('prompts').select('id', { count: 'exact', head: true }),
      supabase.from('likes').select('prompt_id', { count: 'exact', head: true }),
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }),
      supabase.rpc('platform_copy_total'),
    ])
    res.json({
      prompts: prompts.count ?? 0,
      likes: likes.count ?? 0,
      follows: follows.count ?? 0,
      total_copies: copies.data ?? 0,
      generated_at: new Date().toISOString(),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create a Stripe Checkout session for the signed-in user
app.post('/api/stripe/checkout', async (req, res) => {
  if (!requireStripe(res)) return
  const user = await requireUser(req, res)
  if (!user) return

  const interval = req.body?.interval === 'yearly' ? 'yearly' : 'monthly'
  const priceId =
    interval === 'yearly' ? process.env.STRIPE_PRICE_PRO_YEARLY : process.env.STRIPE_PRICE_PRO_MONTHLY

  try {
    // Reuse the Stripe customer if this user subscribed before
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const customerId =
      existing?.stripe_customer_id ??
      (await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } })).id

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/pricing?upgraded=1`,
      cancel_url: `${APP_URL}/pricing`,
      allow_promotion_codes: true,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
    })

    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Customer portal — manage / cancel the subscription
app.post('/api/stripe/portal', async (req, res) => {
  if (!requireStripe(res)) return
  const user = await requireUser(req, res)
  if (!user) return

  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!sub?.stripe_customer_id) {
      return res.status(404).json({ error: 'No Stripe customer found for this account' })
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${APP_URL}/pricing`,
    })
    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`PromptVault API listening on http://localhost:${PORT}`)
  if (!stripeReady()) {
    console.log('[stripe] not configured — set STRIPE_* env vars to enable subscriptions')
  }
})
