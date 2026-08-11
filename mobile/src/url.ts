import { Linking } from 'react-native'
import { ALLOWED_HOST_SUFFIXES, APP_URL } from './config'

export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    const host = parsed.hostname.toLowerCase()
    return ALLOWED_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`)
    )
  } catch {
    return false
  }
}

/** Map deep link dubai-market://path → https://host/path */
export function deepLinkToWebUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'dubai-market:' && parsed.protocol !== 'dubaimarket:') {
      return null
    }
    // `dubai-market://items/abc` → host=items, pathname=/abc
    // `dubai-market:///search`   → host="", pathname=/search
    const host = parsed.hostname
    const nestedPath =
      parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : ''
    const pathFromHost = host ? `/${host}${nestedPath}` : parsed.pathname || '/'
    const path = `${pathFromHost}${parsed.search}${parsed.hash}`
    return `${APP_URL}${path.startsWith('/') ? path : `/${path}`}`
  } catch {
    return null
  }
}

export async function openExternal(url: string): Promise<void> {
  const can = await Linking.canOpenURL(url)
  if (can) await Linking.openURL(url)
}
