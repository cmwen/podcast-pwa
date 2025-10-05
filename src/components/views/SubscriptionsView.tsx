import { useState, useEffect } from 'preact/hooks'
import { appState } from '../App'
import { storageService } from '../../services/storage'
import { rssService } from '../../services/rss'
import { downloadService } from '../../services/download'
import type { Subscription, Episode, DownloadProgress, Playlist } from '../../types'

/**
 * Subscriptions View Component
 * [Design → Execution] RSS subscription management with validation
 */
export function SubscriptionsView() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isAddingSubscription, setIsAddingSubscription] = useState(false)
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map())
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [showPlaylistMenu, setShowPlaylistMenu] = useState<string | null>(null)

  // Load subscriptions on component mount
  useEffect(() => {
    loadSubscriptions()
    loadPlaylists()
    initializeDefaultPodcast()
  }, [])

  // Close playlist menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showPlaylistMenu) {
        const target = e.target as HTMLElement
        if (!target.closest('.playlist-menu-container')) {
          setShowPlaylistMenu(null)
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showPlaylistMenu])

  const initializeDefaultPodcast = async () => {
    try {
      await storageService.init()
      const subs = await storageService.getSubscriptions()
      
      // If no subscriptions exist, add the default podcast
      if (subs.length === 0) {
        console.log('[Execution] No subscriptions found, adding default podcast')
        const defaultFeedUrl = 'https://cmwen.github.io/podcasts/feed.xml'
        
        try {
          const feed = await rssService.fetchFeed(defaultFeedUrl)
          
          const subscription: Subscription = {
            id: crypto.randomUUID(),
            title: feed.title || 'Default Podcast',
            url: defaultFeedUrl,
            description: feed.description,
            imageUrl: undefined,
            lastFetched: new Date(),
            isActive: true,
          }
          
          await storageService.addSubscription(subscription)
          await fetchAndStoreEpisodes(subscription, feed)
          
          // Reload subscriptions to show the new one
          await loadSubscriptions()
          
          console.log('[Execution] Default podcast added successfully')
        } catch (error) {
          console.error('[Execution] Failed to add default podcast:', error)
          // Don't show error to user on initial load, just log it
        }
      }
    } catch (error) {
      console.error('[Execution] Failed to initialize default podcast:', error)
    }
  }

  const loadPlaylists = async () => {
    try {
      await storageService.init()
      const playlistList = await storageService.getPlaylists()
      setPlaylists(playlistList)
    } catch (error) {
      console.error('[Execution] Failed to load playlists:', error)
    }
  }

  const loadSubscriptions = async () => {
    try {
      await storageService.init()
      const subs = await storageService.getSubscriptions()
      setSubscriptions(subs)
      console.log('[Execution] Loaded subscriptions:', subs.length)
    } catch (error) {
      console.error('[Execution] Failed to load subscriptions:', error)
    }
  }

  const loadEpisodesForSubscription = async (subscriptionId: string) => {
    setLoadingEpisodes(true)
    try {
      const episodeList = await storageService.getEpisodesBySubscription(subscriptionId)
      setEpisodes(episodeList)
      console.log(
        `[Execution] Loaded ${episodeList.length} episodes for subscription ${subscriptionId}`
      )
    } catch (error) {
      console.error('[Execution] Failed to load episodes:', error)
    } finally {
      setLoadingEpisodes(false)
    }
  }

  const fetchAndStoreEpisodes = async (subscription: Subscription, feed: any) => {
    try {
      const episodes: Episode[] = feed.episodes.map((rssEpisode: any) => ({
        id: crypto.randomUUID(),
        subscriptionId: subscription.id,
        title: rssEpisode.title,
        description: rssEpisode.description,
        audioUrl: rssEpisode.url,
        duration: rssEpisode.duration || 0,
        publishDate: rssEpisode.publishDate,
        downloadStatus: 'none' as const,
        playbackPosition: 0,
      }))

      if (episodes.length > 0) {
        await storageService.addEpisodes(episodes)
        console.log(`[Execution] Stored ${episodes.length} episodes for ${subscription.title}`)
      }
    } catch (error) {
      console.error('[Execution] Failed to store episodes:', error)
    }
  }

  const handleAddSubscription = async () => {
    if (!newFeedUrl.trim()) {
      alert('Please enter a valid RSS feed URL')
      return
    }

    if (!rssService.validateFeedUrl(newFeedUrl)) {
      alert('Please enter a valid HTTP/HTTPS URL')
      return
    }

    setIsAddingSubscription(true)
    appState.value = { ...appState.value, isLoading: true }

    try {
      console.log(`[Execution] Adding subscription: ${newFeedUrl}`)

      // Fetch and validate the RSS feed
      const feed = await rssService.fetchFeed(newFeedUrl)

      // Create subscription object
      const subscription: Subscription = {
        id: crypto.randomUUID(),
        title: feed.title || 'Unknown Podcast',
        url: newFeedUrl,
        description: feed.description,
        imageUrl: undefined, // TODO: Extract from feed
        lastFetched: new Date(),
        isActive: true,
      }

      // Save subscription to storage
      await storageService.addSubscription(subscription)

      // Fetch and store episodes
      await fetchAndStoreEpisodes(subscription, feed)

      // Update local state
      setSubscriptions(prev => [...prev, subscription])
      setNewFeedUrl('')
      setIsAddingSubscription(false)

      console.log('[Execution] Subscription added successfully:', subscription.title)
    } catch (error) {
      console.error('[Execution] Add subscription failed:', error)

      // Check if it's a CORS error and provide helpful message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
        alert(
          `Unable to fetch RSS feed due to CORS restrictions. This is a common limitation when accessing RSS feeds directly from web browsers.\n\nTo test the app:\n1. Try a CORS-enabled feed\n2. Use a browser extension to disable CORS (for testing only)\n3. For production, a server-side proxy would be needed.\n\nError: ${errorMessage}`
        )
      } else {
        alert(`Failed to add subscription: ${errorMessage}`)
      }
    } finally {
      setIsAddingSubscription(false)
      appState.value = { ...appState.value, isLoading: false }
    }
  }

  const handleRemoveSubscription = async (id: string) => {
    if (!confirm('Are you sure you want to remove this subscription?')) return

    try {
      await storageService.removeSubscription(id)
      setSubscriptions(prev => prev.filter(sub => sub.id !== id))
      // Clear episodes if the selected subscription is being removed
      if (selectedSubscription === id) {
        setSelectedSubscription(null)
        setEpisodes([])
      }
      console.log('[Execution] Subscription removed:', id)
    } catch (error) {
      console.error('[Execution] Failed to remove subscription:', error)
      alert('Failed to remove subscription')
    }
  }

  const handleViewEpisodes = async (subscriptionId: string) => {
    setSelectedSubscription(subscriptionId)
    await loadEpisodesForSubscription(subscriptionId)
  }

  const handlePlayEpisode = (episode: Episode) => {
    console.log('[Execution] Playing episode:', episode.title)
    appState.value = {
      ...appState.value,
      currentEpisode: episode,
      currentView: 'player',
      isPlaying: false, // Will be controlled by the player
    }
  }

  const handleDownloadEpisode = async (episode: Episode) => {
    try {
      console.log('[Execution] Starting download for episode:', episode.title)

      await downloadService.downloadEpisode(episode, progress => {
        setDownloadProgress(prev => new Map(prev.set(episode.id, progress)))
      })

      // Reload episodes to update download status
      if (selectedSubscription) {
        await loadEpisodesForSubscription(selectedSubscription)
      }

      console.log('[Execution] Episode downloaded successfully:', episode.title)
    } catch (error) {
      console.error('[Execution] Failed to download episode:', error)
      alert(
        `Failed to download episode: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setDownloadProgress(prev => {
        const newMap = new Map(prev)
        newMap.delete(episode.id)
        return newMap
      })
    }
  }

  const handleDeleteDownload = async (episode: Episode) => {
    if (!confirm('Are you sure you want to delete this downloaded episode?')) return

    try {
      console.log('[Execution] Deleting download for episode:', episode.title)
      await downloadService.deleteDownload(episode)

      // Reload episodes to update download status
      if (selectedSubscription) {
        await loadEpisodesForSubscription(selectedSubscription)
      }

      console.log('[Execution] Download deleted successfully:', episode.title)
    } catch (error) {
      console.error('[Execution] Failed to delete download:', error)
      alert(
        `Failed to delete download: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const handleCancelDownload = (episode: Episode) => {
    console.log('[Execution] Cancelling download for episode:', episode.title)
    downloadService.cancelDownload(episode.id)
    setDownloadProgress(prev => {
      const newMap = new Map(prev)
      newMap.delete(episode.id)
      return newMap
    })
  }

  const handleRefreshEpisodes = async (subscription: Subscription) => {
    appState.value = { ...appState.value, isLoading: true }
    try {
      console.log(`[Execution] Refreshing episodes for: ${subscription.title}`)
      const feed = await rssService.fetchFeed(subscription.url)

      // Update last fetched time
      const updatedSubscription = { ...subscription, lastFetched: new Date() }
      await storageService.updateSubscription(updatedSubscription)

      // Clear existing episodes and add new ones
      await storageService.deleteEpisodesBySubscription(subscription.id)
      await fetchAndStoreEpisodes(updatedSubscription, feed)

      // Reload episodes if this subscription is currently selected
      if (selectedSubscription === subscription.id) {
        await loadEpisodesForSubscription(subscription.id)
      }

      // Update subscription in local state
      setSubscriptions(prev =>
        prev.map(sub => (sub.id === subscription.id ? updatedSubscription : sub))
      )

      console.log('[Execution] Episodes refreshed successfully')
    } catch (error) {
      console.error('[Execution] Failed to refresh episodes:', error)
      alert('Failed to refresh episodes')
    } finally {
      appState.value = { ...appState.value, isLoading: false }
    }
  }

  const showAddForm = () => {
    setIsAddingSubscription(true)
  }

  const cancelAdd = () => {
    setIsAddingSubscription(false)
    setNewFeedUrl('')
  }

  const handleAddToPlaylist = async (episode: Episode, playlistId: string) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId)
      if (!playlist) return

      if (playlist.episodeIds.includes(episode.id)) {
        alert('Episode is already in this playlist')
        return
      }

      const updatedPlaylist = {
        ...playlist,
        episodeIds: [...playlist.episodeIds, episode.id],
        updatedAt: new Date(),
      }

      await storageService.updatePlaylist(updatedPlaylist)
      setPlaylists(prev => prev.map(p => (p.id === playlistId ? updatedPlaylist : p)))
      setShowPlaylistMenu(null)

      console.log('[Execution] Episode added to playlist:', playlist.name)
      alert(`Added "${episode.title}" to "${playlist.name}"`)
    } catch (error) {
      console.error('[Execution] Failed to add episode to playlist:', error)
      alert('Failed to add episode to playlist')
    }
  }

  const handleCreatePlaylistWithEpisode = async (episode: Episode) => {
    const playlistName = prompt('Enter new playlist name:')
    if (!playlistName?.trim()) return

    try {
      const newPlaylist: Playlist = {
        id: crypto.randomUUID(),
        name: playlistName.trim(),
        episodeIds: [episode.id],
        isQueue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await storageService.addPlaylist(newPlaylist)
      setPlaylists(prev => [...prev, newPlaylist])
      setShowPlaylistMenu(null)

      console.log('[Execution] Created playlist with episode:', playlistName)
      alert(`Created playlist "${playlistName}" with episode`)
    } catch (error) {
      console.error('[Execution] Failed to create playlist:', error)
      alert('Failed to create playlist')
    }
  }

  return (
    <section>
      <div className="section-header">
        <h2>Subscriptions</h2>
        {!isAddingSubscription && !selectedSubscription && (
          <button className="btn-primary" onClick={showAddForm} disabled={appState.value.isLoading}>
            Add Podcast
          </button>
        )}
        {selectedSubscription && (
          <button
            className="btn-secondary"
            onClick={() => {
              setSelectedSubscription(null)
              setEpisodes([])
            }}
          >
            Back to Subscriptions
          </button>
        )}
      </div>

      {isAddingSubscription && (
        <div className="add-subscription-form">
          <h3>Add New Podcast</h3>
          <div className="form-group">
            <label htmlFor="feed-url">RSS Feed URL:</label>
            <input
              id="feed-url"
              type="url"
              value={newFeedUrl}
              onInput={e => setNewFeedUrl((e.target as HTMLInputElement).value)}
              placeholder="https://example.com/podcast/feed.xml"
              disabled={appState.value.isLoading}
            />
            <p className="help-text">
              Try these demo feeds: <code>test://huberman</code> or <code>test://rogan</code>
              <br />
              Or enter your own RSS feed URL (e.g., <code>https://cmwen.github.io/podcasts/feed.xml</code>)
              <br />
              <small>Real RSS feeds may be blocked by CORS policy in browsers.</small>
            </p>
          </div>
          <div className="form-actions">
            <button
              className="btn-primary"
              onClick={handleAddSubscription}
              disabled={appState.value.isLoading || !newFeedUrl.trim()}
            >
              {appState.value.isLoading ? 'Adding...' : 'Add Subscription'}
            </button>
            <button
              className="btn-secondary"
              onClick={cancelAdd}
              disabled={appState.value.isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!selectedSubscription && !isAddingSubscription && (
        <div className="subscriptions-list">
          {subscriptions.length === 0 ? (
            <div className="empty-state">
              <p>No subscriptions yet. Add your first podcast!</p>
              <p className="help-text">
                You can subscribe to any podcast by entering its RSS feed URL.
              </p>
            </div>
          ) : (
            <div className="subscription-grid">
              {subscriptions.map(subscription => (
                <div key={subscription.id} className="subscription-card">
                  <div className="subscription-info">
                    <h3 className="subscription-title">{subscription.title}</h3>
                    <p className="subscription-description">
                      {subscription.description
                        ? subscription.description.length > 100
                          ? subscription.description.substring(0, 100) + '...'
                          : subscription.description
                        : 'No description available'}
                    </p>
                    <p className="subscription-url">{subscription.url}</p>
                    <p className="subscription-meta">
                      Last updated: {subscription.lastFetched.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="subscription-actions">
                    <button
                      className="btn-primary"
                      onClick={() => handleViewEpisodes(subscription.id)}
                      title="View episodes"
                    >
                      View Episodes
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleRefreshEpisodes(subscription)}
                      title="Refresh episodes"
                      disabled={appState.value.isLoading}
                    >
                      Refresh
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleRemoveSubscription(subscription.id)}
                      title="Remove subscription"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSubscription && (
        <div className="episodes-list">
          <div className="episodes-header">
            <h3>Episodes</h3>
            {loadingEpisodes && <span className="loading-text">Loading episodes...</span>}
          </div>

          {episodes.length === 0 && !loadingEpisodes ? (
            <div className="empty-state">
              <p>No episodes found for this podcast.</p>
            </div>
          ) : (
            <div className="episode-grid">
              {episodes.map(episode => (
                <div key={episode.id} className="episode-card">
                  <div className="episode-info">
                    <h4 className="episode-title">{episode.title}</h4>
                    <p className="episode-description">
                      {episode.description.length > 200
                        ? episode.description.substring(0, 200) + '...'
                        : episode.description}
                    </p>
                    <div className="episode-meta">
                      <span className="episode-date">
                        {episode.publishDate.toLocaleDateString()}
                      </span>
                      {episode.duration > 0 && (
                        <span className="episode-duration">
                          {Math.floor(episode.duration / 60)}:
                          {(episode.duration % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                      {episode.downloadStatus === 'downloaded' && (
                        <span className="offline-badge">Offline</span>
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

                    {/* Add to Playlist button */}
                    <div className="playlist-menu-container" style={{ position: 'relative' }}>
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          setShowPlaylistMenu(
                            showPlaylistMenu === episode.id ? null : episode.id
                          )
                        }
                        title="Add to playlist"
                      >
                        ➕ Playlist
                      </button>
                      {showPlaylistMenu === episode.id && (
                        <div className="playlist-dropdown">
                          {playlists.length === 0 ? (
                            <button
                              className="playlist-menu-item"
                              onClick={() => handleCreatePlaylistWithEpisode(episode)}
                            >
                              Create New Playlist
                            </button>
                          ) : (
                            <>
                              {playlists.map(playlist => (
                                <button
                                  key={playlist.id}
                                  className="playlist-menu-item"
                                  onClick={() => handleAddToPlaylist(episode, playlist.id)}
                                >
                                  {playlist.name}
                                </button>
                              ))}
                              <button
                                className="playlist-menu-item playlist-menu-create"
                                onClick={() => handleCreatePlaylistWithEpisode(episode)}
                              >
                                + Create New Playlist
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Download controls */}
                    {episode.downloadStatus === 'none' && (
                      <button
                        className="btn-secondary"
                        onClick={() => handleDownloadEpisode(episode)}
                        title="Download for offline listening"
                      >
                        📥 Download
                      </button>
                    )}

                    {episode.downloadStatus === 'downloading' && (
                      <>
                        <button
                          className="btn-secondary"
                          onClick={() => handleCancelDownload(episode)}
                          title="Cancel download"
                        >
                          ❌ Cancel
                        </button>
                        {downloadProgress.has(episode.id) && (
                          <div className="download-progress">
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${downloadProgress.get(episode.id)?.progress || 0}%`,
                                }}
                              />
                            </div>
                            <span className="progress-text">
                              {downloadProgress.get(episode.id)?.progress || 0}%
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {episode.downloadStatus === 'downloaded' && (
                      <button
                        className="btn-success"
                        onClick={() => handleDeleteDownload(episode)}
                        title="Delete downloaded file"
                      >
                        ✅ Downloaded
                      </button>
                    )}

                    {episode.downloadStatus === 'error' && (
                      <button
                        className="btn-danger"
                        onClick={() => handleDownloadEpisode(episode)}
                        title="Retry download"
                      >
                        ⚠️ Retry
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
