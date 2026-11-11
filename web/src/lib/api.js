/**
 * API base for server endpoints (Stripe checkout/portal, stats…).
 *
 * Web deploys hit same-origin `/api` (proxied by nginx). Mobile builds set
 * VITE_API_URL to the production origin at build time, because a bundled
 * native app has no same origin to speak of.
 */
const BASE = import.meta.env.VITE_API_URL ?? ''

export const apiUrl = (path) => `${BASE}${path}`
