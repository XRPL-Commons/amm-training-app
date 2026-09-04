// Fathom analytics (privacy-friendly, cookie-free, no consent banner).
// Org reference plugin: loads the tracking script in production builds only.
// The site id is public (it ships in this client script), so it is hard-coded
// in nuxt.config.ts rather than read from an env var.
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const siteId = config.public.fathomSiteId

  if (!siteId || process.env.NODE_ENV !== 'production') {
    return
  }

  // Load Fathom script
  const script = document.createElement('script')
  script.src = 'https://cdn.usefathom.com/script.js'
  script.setAttribute('data-site', siteId)
  script.defer = true
  document.head.appendChild(script)
})
