import { useState } from 'preact/hooks'
import { appState } from '../App'

/**
 * Playlists View Component
 * [Design → Execution] Playlist management with drag-drop reordering
 */
export function PlaylistsView() {
  const [playlists] = useState([]) // TODO: Connect to storage service

  const handleCreatePlaylist = async () => {
    console.log('[Execution] Create playlist triggered')

    const playlistName = prompt('Enter playlist name:')
    if (!playlistName) return

    // Show loading state
    appState.value = { ...appState.value, isLoading: true }

    try {
      console.log(`[Execution] Creating playlist: ${playlistName}`)

      // TODO: Create playlist in storage
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500))

      alert('Playlist created successfully! (Placeholder)')
    } catch (error) {
      console.error('[Execution] Create playlist failed:', error)
      alert(`Failed to create playlist: ${error}`)
    } finally {
      appState.value = { ...appState.value, isLoading: false }
    }
  }

  return (
    <section className="view">
      <div className="section-header">
        <h2>Playlists</h2>
        <button
          className="btn-primary"
          onClick={handleCreatePlaylist}
          disabled={appState.value.isLoading}
        >
          Create Playlist
        </button>
      </div>

      <div className="playlists-list">
        {playlists.length === 0 ? (
          <div className="empty-state">
            <p>No playlists yet. Create your first playlist!</p>
          </div>
        ) : (
          <div className="playlist-grid">{/* TODO: Render playlist items with drag-drop */}</div>
        )}
      </div>

      {/* Special Queue Playlist */}
      <div className="queue-section">
        <h3>Play Queue</h3>
        <div className="queue-list">
          <p>Queue functionality will be implemented here</p>
          {/* TODO: Implement draggable queue with SortableJS */}
        </div>
      </div>
    </section>
  )
}
