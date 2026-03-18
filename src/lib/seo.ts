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
  setNameMeta('description', description)
  setNameMeta('robots', 'index,follow')
  setOg('og:title', title)
  setOg('og:description', description)
  setOg('og:locale', locale.startsWith('en') ? 'en_US' : 'de_DE')
  setOg('og:url', window.location.href)
  setNameMeta('twitter:title', title)
  setNameMeta('twitter:description', description)
  ensureCanonical()
}

export function setJsonLd(id: string, data: unknown) {
  const scriptId = `jsonld-${id}`
  let el = document.getElementById(scriptId) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = scriptId
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.text = JSON.stringify(data)
}

function setNameMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
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
