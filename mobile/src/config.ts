/** Production web app loaded inside the native shell. */
export const APP_URL =
  process.env.EXPO_PUBLIC_APP_URL ?? 'https://dubai-market-wine.vercel.app'

/** Allowed hosts the WebView may navigate to (auth/storage redirects included). */
export const ALLOWED_HOST_SUFFIXES = [
  'dubai-market-wine.vercel.app',
  'supabase.co',
  'google.com',
  'apple.com',
] as const

export const APP_NAME = 'Dubai Market'
export const SUPPORT_EMAIL = 'support@dubaimarket.app'
export const PRIVACY_URL = `${APP_URL}/privacy`
export const TERMS_URL = `${APP_URL}/terms`
export const SUPPORT_URL = `${APP_URL}/support`
