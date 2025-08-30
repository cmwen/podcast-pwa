import { render } from 'preact'
import { App } from './components/App'
import './styles/main.css'
import { registerSW } from 'virtual:pwa-register'

// [Design → Execution] Initialize Podcast PWA with Preact
console.log('[Execution] Starting Podcast PWA with Preact + TypeScript...')

// Render the main app component
render(<App />, document.getElementById('app')!)

// Register service worker for offline functionality using vite-plugin-pwa
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[Execution] New content available, reload required')
    // You can show a prompt to user here
    updateSW(true)
  },
  onOfflineReady() {
    console.log('[Execution] App ready to work offline')
  },
  onRegistered(r: ServiceWorkerRegistration | undefined) {
    console.log('[Execution] Service Worker registered:', r?.scope)
  },
  onRegisterError(error: any) {
    console.error('[Execution] Service Worker registration failed:', error)
  },
})

// Handle PWA installation prompt
window.addEventListener('beforeinstallprompt', e => {
  console.log('[Execution] PWA install prompt available')
  // Store the event for later use
  ;(window as any).deferredPrompt = e
})
