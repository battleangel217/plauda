export const BRAND_NAME = 'Plauda'
export const BRAND_DOMAIN = 'plauda.app'

export function storeUrl(slug: string) {
  if (typeof window !== 'undefined' && window.location?.host) {
    return `${window.location.host}/store/${slug}`
  }
  return `${BRAND_DOMAIN}/store/${slug}`
}

export function storeFullUrl(slug: string) {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/store/${slug}`
  }
  return `https://${BRAND_DOMAIN}/store/${slug}`
}
