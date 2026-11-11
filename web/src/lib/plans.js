/** Free-plan limits — mirrored by RLS policies in the database. */
export const FREE_PROMPT_LIMIT = 50

/** Student-friendly Pro pricing (display values — set Stripe products to match). */
export const PRICES = { monthly: 4.99, yearly: 29.99 }

/** What Pro unlocks TODAY. */
export const PRO_SHIPPED = [
  'Unlimited saved prompts',
  'One-tap Save to Vault from the community feed',
  'Early access to every new Pro feature as it ships',
]

/** Clearly-labelled roadmap — included in Pro once they ship. */
export const PRO_ROADMAP = [
  'AI Prompt Enhancer — rewrites weak prompts into strong ones',
  'Collections & folders to organize your vault',
  'Prompt Tester — compare outputs side by side',
  'Analytics on your shared prompts',
  'Sell prompt packs in the marketplace',
]

export const FREE_FEATURES = [
  'Save up to 50 prompts',
  'Save community prompts to your vault',
  'Share public prompts with the community',
  'Follow creators, like and copy prompts',
  'Category + audience discovery',
]

export const isPro = (profile) => profile?.plan === 'pro'
