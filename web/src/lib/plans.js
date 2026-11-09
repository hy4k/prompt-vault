/** Free-plan limits — mirrored by RLS policies in the database. */
export const FREE_PROMPT_LIMIT = 50

export const PRO_FEATURES = [
  'Unlimited saved prompts',
  'Unlimited collections',
  'AI Prompt Enhancer (coming soon)',
  'Prompt Tester — compare outputs (coming soon)',
  'Analytics on your shared prompts',
  'Sell prompt packs in the marketplace (coming soon)',
  'Support an indie platform',
]

export const isPro = (profile) => profile?.plan === 'pro'
