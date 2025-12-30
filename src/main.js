import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const GOOGLE_ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID
const THEME_STORAGE_KEY = 'gpf-theme'

const resolveInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // ignore storage access
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const loadAnalytics = () => {
  if (!GOOGLE_ANALYTICS_ID || typeof window === 'undefined') return

  if (!document.getElementById('ga-gtag-script')) {
    const script = document.createElement('script')
    script.id = 'ga-gtag-script'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`
    document.head.appendChild(script)
  }

  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = window.gtag || gtag

  window.gtag('js', new Date())
  window.gtag('config', GOOGLE_ANALYTICS_ID, {
    anonymize_ip: true,
    send_page_view: true,
  })
}

const hasAnalyticsConsent = () => {
  try {
    return localStorage.getItem('analytics-consent') === 'true'
  } catch {
    return false
  }
}

const initialTheme = resolveInitialTheme()
document.documentElement.setAttribute('data-theme', initialTheme)

const app = mount(App, {
  target: document.getElementById('app'),
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}

if (hasAnalyticsConsent()) {
  loadAnalytics()
}

window.addEventListener('analytics-consent-granted', () => {
  loadAnalytics()
})

export default app
