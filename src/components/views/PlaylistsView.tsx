import { useState, useEffect } from 'preact/hooks'
import { appState } from '../App'
import { storageService } from '../../services/storage'
import type { Playlist, Episode } from '../../types'

/**
 * Playlists View Component
 * [Design → Execution] Playlist management with drag-drop reordering
 */
export function PlaylistsView() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [playlistEpisodes, setPlaylistEpisodes] = useState<Episode[]>([])
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPlaylists()
    loadAllEpisodes()
  }, [])

  const loadPlaylists = async () => {
    try {
      await storageService.init()
      const playlistList = await storageService.getPlaylists()
      setPlaylists(playlistList)
      console.log('[Execution] Loaded playlists:', playlistList.length)
    } catch (error) {
      console.error('[Execution] Failed to load playlists:', error)
    }
  }

  const loadAllEpisodes = async () => {
    try {
      await storageService.init()
      const episodes = await storageService.getAllEpisodes()
      setAllEpisodes(episodes)
    } catch (error) {
      console.error('[Execution] Failed to load episodes:', error)
    }
  }

  const loadPlaylistEpisodes = async (playlistId: string) => {
    setLoading(true)
    try {
      const playlist = playlists.find(p => p.id === playlistId)
      if (playlist) {
        const episodes = await Promise.all(
          playlist.episodeIds.map(async (episodeId) => {
            const episode = await storageService.getEpisodeById(episodeId)
            return episode
          })
        )
        setPlaylistEpisodes(episodes.filter(Boolean) as Episode[])
      }
    } catch (error) {
      console.error('[Execution] Failed to load playlist episodes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlaylist = async () => {
    const playlistName = prompt('Enter playlist name:')
    if (!playlistName?.trim()) return

    setLoading(true)
    appState.value = { ...appState.value, isLoading: true }

    try {
      console.log(`[Execution] Creating playlist: ${playlistName}`)

      const newPlaylist: Playlist = {
        id: crypto.randomUUID(),
        name: playlistName.trim(),
        episodeIds: [],
        isQueue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await storageService.addPlaylist(newPlaylist)
      setPlaylists(prev => [...prev, newPlaylist])

      console.log('[Execution] Playlist created successfully')
    } catch (error) {
      console.error('[Execution] Create playlist failed:', error)
      alert(`Failed to create playlist: ${error}`)
    } finally {
      setLoading(false)
      appState.value = { ...appState.value, isLoading: false }
    }
  }

  const handleDeletePlaylist = async (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId)
    if (!playlist) return

    if (!confirm(`Are you sure you want to delete the playlist "${playlist.name}"?`)) return

    try {
      await storageService.deletePlaylist(playlistId)
      setPlaylists(prev => prev.filter(p => p.id !== playlistId))
      if (selectedPlaylist === playlistId) {
        setSelectedPlaylist(null)
        setPlaylistEpisodes([])
      }
      console.log('[Execution] Playlist deleted:', playlist.name)
    } catch (error) {
      console.error('[Execution] Failed to delete playlist:', error)
      alert('Failed to delete playlist')
    }
  }

  const handleSelectPlaylist = async (playlistId: string) => {
    setSelectedPlaylist(playlistId)
    await loadPlaylistEpisodes(playlistId)
  }

  const handlePlayEpisode = (episode: Episode) => {
    console.log('[Execution] Playing episode from playlist:', episode.title)
    appState.value = {
      ...appState.value,
      currentEpisode: episode,
      currentView: 'player',
      isPlaying: false,
    }
  }

  const handleAddEpisodeToPlaylist = async (playlistId: string, episodeId: string) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId)
      if (!playlist) return

      if (playlist.episodeIds.includes(episodeId)) {
        alert('Episode is already in this playlist')
        return
      }

      const updatedPlaylist = {
        ...playlist,
        episodeIds: [...playlist.episodeIds, episodeId],
        updatedAt: new Date(),
      }

      await storageService.updatePlaylist(updatedPlaylist)
      setPlaylists(prev => prev.map(p => p.id === playlistId ? updatedPlaylist : p))

      if (selectedPlaylist === playlistId) {
        await loadPlaylistEpisodes(playlistId)
      }

      console.log('[Execution] Episode added to playlist')
    } catch (error) {
      console.error('[Execution] Failed to add episode to playlist:', error)
      alert('Failed to add episode to playlist')
    }
  }

  const handleRemoveEpisodeFromPlaylist = async (playlistId: string, episodeId: string) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId)
      if (!playlist) return

      const updatedPlaylist = {
        ...playlist,
        episodeIds: playlist.episodeIds.filter(id => id !== episodeId),
        updatedAt: new Date(),
      }

      await storageService.updatePlaylist(updatedPlaylist)
      setPlaylists(prev => prev.map(p => p.id === playlistId ? updatedPlaylist : p))

      if (selectedPlaylist === playlistId) {
        await loadPlaylistEpisodes(playlistId)
      }

      console.log('[Execution] Episode removed from playlist')
    } catch (error) {
      console.error('[Execution] Failed to remove episode from playlist:', error)
      alert('Failed to remove episode from playlist')
    }
  }

  return (
    <section>
      <div className="section-header">
        <h2>Playlists</h2>
        {!selectedPlaylist && (
          <button
            className="btn-primary"
            onClick={handleCreatePlaylist}
            disabled={loading}
          >
            Create Playlist
          </button>
        )}
        {selectedPlaylist && (
          <button 
            className="btn-secondary" 
            onClick={() => {
              setSelectedPlaylist(null)
              setPlaylistEpisodes([])
            }}
          >
            Back to Playlists
          </button>
        )}
      </div>

      {!selectedPlaylist && (
        <div className="playlists-list">
          {playlists.length === 0 ? (
            <div className="empty-state">
              <p>No playlists yet. Create your first playlist!</p>
              <p className="help-text">
                Organize your favorite episodes into custom playlists.
              </p>
            </div>
          ) : (
            <div className="playlist-grid">
              {playlists.map(playlist => (
                <div key={playlist.id} className="playlist-card">
                  <div className="playlist-info">
                    <h3 className="playlist-name">{playlist.name}</h3>
                    <p className="playlist-meta">
                      {playlist.episodeIds.length} episode(s)
                    </p>
                    <p className="playlist-date">
                      Created: {playlist.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="playlist-actions">
                    <button
                      className="btn-primary"
                      onClick={() => handleSelectPlaylist(playlist.id)}
                      title="View playlist"
                    >
                      View
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDeletePlaylist(playlist.id)}
                      title="Delete playlist"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedPlaylist && (
        <div className="playlist-details">
          {(() => {
            const playlist = playlists.find(p => p.id === selectedPlaylist)
            return playlist ? (
              <>
                <div className="playlist-header">
                  <h3>{playlist.name}</h3>
                  {loading && <span className="loading-text">Loading episodes...</span>}
                </div>

                <div className="playlist-episodes">
                  {playlistEpisodes.length === 0 && !loading ? (
                    <div className="empty-state">
                      <p>This playlist is empty.</p>
                      <p className="help-text">
                        Add episodes from your subscriptions to build your playlist.
                      </p>
                    </div>
                  ) : (
                    <div className="episode-grid">
                      {playlistEpisodes.map(episode => (
                        <div key={episode.id} className="episode-card">
                          <div className="episode-info">
                            <h4 className="episode-title">{episode.title}</h4>
                            <p className="episode-description">
                              {episode.description.length > 150
                                ? episode.description.substring(0, 150) + '...'
                                : episode.description}
                            </p>
                            <div className="episode-meta">
                              <span className="episode-date">
                                {episode.publishDate.toLocaleDateString()}
                              </span>
                              {episode.duration > 0 && (
                                <span className="episode-duration">
                                  {Math.floor(episode.duration / 60)}:{(episode.duration % 60).toString().padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="episode-actions">
                            <button
                              className="btn-primary"
                              onClick={() => handlePlayEpisode(episode)}
                              title="Play episode"
                            >
                              Play
                            </button>
                            <button
                              className="btn-danger"
                              onClick={() => handleRemoveEpisodeFromPlaylist(selectedPlaylist, episode.id)}
                              title="Remove from playlist"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {allEpisodes.length > 0 && (
                  <div className="add-episodes-section">
                    <h4>Add Episodes to Playlist</h4>
                    <div className="available-episodes">
                      {allEpisodes
                        .filter(episode => !playlist.episodeIds.includes(episode.id))
                        .slice(0, 10) // Show only first 10 to avoid overwhelming
                        .map(episode => (
                          <div key={episode.id} className="episode-card compact">
                            <div className="episode-info">
                              <h5 className="episode-title">{episode.title}</h5>
                              <span className="episode-date">
                                {episode.publishDate.toLocaleDateString()}
                              </span>
                            </div>
                            <button
                              className="btn-secondary"
                              onClick={() => handleAddEpisodeToPlaylist(selectedPlaylist, episode.id)}
                              title="Add to playlist"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : null
          })()}
        </div>
      )}
    </section>
  )
}
