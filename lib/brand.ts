export const BRAND_NAME = 'Plauda'
export const BRAND_DOMAIN = 'plauda.app'

export function chatUrl(slug: string) {
  return `${BRAND_DOMAIN}/chat/${slug}`
}
