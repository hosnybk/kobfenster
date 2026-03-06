export function ensureCanonical() {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', window.location.href)
}

export function setMeta(title: string, description: string, locale: string) {
  document.title = title
  let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
  if (!desc) {
    desc = document.createElement('meta')
    desc.setAttribute('name', 'description')
    document.head.appendChild(desc)
  }
  desc.setAttribute('content', description)
  setOg('og:title', title)
  setOg('og:description', description)
  setOg('og:locale', locale.startsWith('en') ? 'en_US' : 'de_DE')
  ensureCanonical()
}

function setOg(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
