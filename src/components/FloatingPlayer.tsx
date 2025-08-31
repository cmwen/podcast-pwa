import { useState, useEffect } from 'preact/hooks'
import { appState } from './App'

/**
 * Floating Player Component
 * Shows a minimized player when audio is playing and user is not on player view
 * Displays current episode, progress, and basic controls
 */
export function FloatingPlayer() {
  const [state, setState] = useState(appState.value)
  const [showDetails, setShowDetails] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Subscribe to app state changes
  useEffect(() => {
    const unsubscribe = appState.subscribe(newState => {
      setState(newState)
    })
    return unsubscribe
  }, [])

  // Monitor audio progress
  useEffect(() => {
    const updateProgress = () => {
      const audio = document.querySelector('audio') as HTMLAudioElement
      if (audio) {
        setCurrentTime(audio.currentTime || 0)
        setDuration(audio.duration || 0)
      }
    }

    const audio = document.querySelector('audio') as HTMLAudioElement
    if (audio) {
      audio.addEventListener('timeupdate', updateProgress)
      audio.addEventListener('loadedmetadata', updateProgress)

      return () => {
        audio.removeEventListener('timeupdate', updateProgress)
        audio.removeEventListener('loadedmetadata', updateProgress)
      }
    }
  }, [state.currentEpisode])

  // Don't show floating player if no episode or already on player view
  if (!state.currentEpisode || state.currentView === 'player') {
    return null
  }

  const handlePlayerClick = () => {
    setShowDetails(!showDetails)
  }

  const handlePlayPause = (e: Event) => {
    e.stopPropagation()
    appState.value = {
      ...appState.value,
      isPlaying: !state.isPlaying,
    }
  }

  const handleGoToPlayer = (e: Event) => {
    e.stopPropagation()
    appState.value = {
      ...appState.value,
      currentView: 'player',
    }
    setShowDetails(false)
  }

  const handleCloseDetails = (e: Event) => {
    e.stopPropagation()
    setShowDetails(false)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      {/* Floating Player Bar */}
      <div
        className={`floating-player ${state.currentEpisode ? 'playing' : ''}`}
        onClick={handlePlayerClick}
      >
        <div className="floating-player-progress">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="floating-player-content">
          <div className="floating-player-info">
            <div className="episode-title">{state.currentEpisode.title}</div>
            <div className="episode-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="floating-player-controls">
            <button
              className="play-pause-btn-mini"
              onClick={handlePlayPause}
              title={state.isPlaying ? 'Pause' : 'Play'}
            >
              {state.isPlaying ? '⏸️' : '▶️'}
            </button>

            <button className="expand-btn" onClick={handleGoToPlayer} title="Open full player">
              ⬆️
            </button>
          </div>
        </div>
      </div>

      {/* Episode Details Modal */}
      {showDetails && (
        <div className="episode-details-overlay" onClick={handleCloseDetails}>
          <div className="episode-details-modal" onClick={e => e.stopPropagation()}>
            <div className="episode-details-header">
              <h3>{state.currentEpisode.title}</h3>
              <button className="close-btn" onClick={handleCloseDetails}>
                ✕
              </button>
            </div>

            <div className="episode-details-content">
              <div className="episode-meta">
                <div className="publish-date">
                  Published: {state.currentEpisode.publishDate.toLocaleDateString()}
                </div>
                {state.currentEpisode.duration > 0 && (
                  <div className="duration">
                    Duration: {Math.floor(state.currentEpisode.duration / 60)}:
                    {(state.currentEpisode.duration % 60).toString().padStart(2, '0')}
                  </div>
                )}
                {state.currentEpisode.downloadStatus === 'downloaded' && (
                  <div className="offline-badge">Downloaded</div>
                )}
              </div>

              <div className="episode-description">
                <h4>Show Notes</h4>
                <div className="description-text">{state.currentEpisode.description}</div>
              </div>

              <div className="episode-details-actions">
                <button className="btn-primary" onClick={handleGoToPlayer}>
                  Open Full Player
                </button>
                <button className="btn-secondary" onClick={handleCloseDetails}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
