export const BRAND_NAME = 'Plauda'
export const BRAND_DOMAIN = 'plauda.app'

export function chatUrl(slug: string) {
  if (typeof window !== 'undefined' && window.location?.host) {
    return `${window.location.host}/chat/${slug}`
  }
  return `${BRAND_DOMAIN}/chat/${slug}`
}

export function chatFullUrl(slug: string) {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/chat/${slug}`
  }
  return `https://${BRAND_DOMAIN}/chat/${slug}`
}
