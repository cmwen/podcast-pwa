import { useState, useEffect } from 'preact/hooks'
import { signal } from '@preact/signals'
import type { AppState } from '@/types'
import { Navigation } from './Navigation'
import { SubscriptionsView } from './views/SubscriptionsView'
import { PlayerView } from './views/PlayerView'
import { PlaylistsView } from './views/PlaylistsView'
import { LoadingOverlay } from './LoadingOverlay'

// Global app state using Preact signals
export const appState = signal<AppState>({
  currentView: 'subscriptions',
  isOnline: navigator.onLine,
  isLoading: false,
  currentEpisode: null,
  isPlaying: false,
  playbackSpeed: 1,
})

/**
 * Main App Component
 * [Design → Execution] App Shell with progressive loading
 */
export function App() {
  const [state, setState] = useState(appState.value)

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = appState.subscribe(newState => {
      setState(newState)
    })
    return unsubscribe
  }, [])

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      appState.value = { ...appState.value, isOnline: true }
      console.log('[Execution] App is online')
    }

    const handleOffline = () => {
      appState.value = { ...appState.value, isOnline: false }
      console.log('[Execution] App is offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleViewChange = (view: AppState['currentView']) => {
    console.log(`[Execution] Navigating to view: ${view}`)
    appState.value = { ...appState.value, currentView: view }
  }

  return (
    <div id="app-shell" className="app-shell">
      <header className="app-header">
        <h1>Podcast PWA</h1>
        <Navigation currentView={state.currentView} onViewChange={handleViewChange} />
      </header>

      <main className="main-content">
        <div className={`view ${state.currentView === 'subscriptions' ? 'active' : ''}`}>
          <SubscriptionsView />
        </div>
        <div className={`view ${state.currentView === 'player' ? 'active' : ''}`}>
          <PlayerView />
        </div>
        <div className={`view ${state.currentView === 'playlists' ? 'active' : ''}`}>
          <PlaylistsView />
        </div>
      </main>

      {/* Online/Offline indicator */}
      {!state.isOnline && (
        <div className="offline-indicator">
          <span>Offline mode</span>
        </div>
      )}

      <LoadingOverlay show={state.isLoading} />
    </div>
  )
}
