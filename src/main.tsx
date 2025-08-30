import { render } from 'preact'
import { App } from './components/App'
import './styles/main.css'

// [Design → Execution] Initialize Podcast PWA with Preact
console.log('[Execution] Starting Podcast PWA with Preact + TypeScript...')

// Render the main app component
render(<App />, document.getElementById('app')!)

// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('[Execution] Service Worker registered:', registration.scope)
    } catch (error) {
      console.error('[Execution] Service Worker registration failed:', error)
    }
  })
}

// Handle PWA installation prompt
window.addEventListener('beforeinstallprompt', e => {
  console.log('[Execution] PWA install prompt available')
  // Store the event for later use
  ;(window as any).deferredPrompt = e
})
