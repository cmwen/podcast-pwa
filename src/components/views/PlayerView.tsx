import { useState, useEffect, useRef } from 'preact/hooks'
import { appState } from '../App'
import { storageService } from '../../services/storage'

/**
 * Player View Component
 * [Design → Execution] Audio player with variable speed controls
 */
export function PlayerView() {
  const [state, setState] = useState(appState.value)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  // Subscribe to app state changes
  useEffect(() => {
    const unsubscribe = appState.subscribe((newState) => {
      setState(newState)
    })
    return unsubscribe
  }, [])

  // Load episode when currentEpisode changes
  useEffect(() => {
    if (state.currentEpisode && audioRef.current) {
      const audio = audioRef.current
      console.log(`[Player] Loading episode: ${state.currentEpisode.title}`)
      console.log(`[Player] Audio URL: ${state.currentEpisode.audioUrl}`)
      
      // Only update src if it's different to avoid unnecessary reloads
      if (audio.src !== state.currentEpisode.audioUrl) {
        audio.src = state.currentEpisode.audioUrl
        audio.load()
      }
      
      audio.currentTime = state.currentEpisode.playbackPosition
      audio.playbackRate = state.playbackSpeed
      audio.volume = volume
      
      console.log(`[Player] Episode loaded, ready to play`)
    }
  }, [state.currentEpisode?.id]) // Only depend on episode ID, not the whole object

  // Update playback speed when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = state.playbackSpeed
    }
  }, [state.playbackSpeed])

  // Handle play/pause state changes
  useEffect(() => {
    if (audioRef.current && state.currentEpisode) {
      const audio = audioRef.current
      console.log(`[Player] Play state changed to: ${state.isPlaying}`)
      
      if (state.isPlaying) {
        // Check if audio is ready before trying to play
        if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          audio.play()
            .then(() => {
              console.log('[Player] Audio started playing successfully')
            })
            .catch((error) => {
              console.error('[Player] Failed to start audio:', error)
              // Don't automatically reset state to prevent infinite loop
              // Just log the error and let user try again
            })
        } else {
          console.log('[Player] Audio not ready yet, waiting...')
          // Don't reset state, just wait for audio to be ready
        }
      } else {
        audio.pause()
        console.log('[Player] Audio paused')
      }
    }
  }, [state.isPlaying]) // Only depend on isPlaying, not currentEpisode

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime
      setCurrentTime(time)
      
      // Save playback position periodically
      if (state.currentEpisode && Math.floor(time) % 5 === 0) {
        savePlaybackPosition(time)
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      console.log(`[Player] Audio metadata loaded, duration: ${audioRef.current.duration}s`)
    }
  }

  const handleCanPlay = () => {
    console.log('[Player] Audio can start playing')
    
    // If user clicked play but audio wasn't ready, try to play now
    if (state.isPlaying && audioRef.current) {
      audioRef.current.play()
        .then(() => {
          console.log('[Player] Audio started playing after becoming ready')
        })
        .catch((error) => {
          console.error('[Player] Failed to start audio even after ready:', error)
        })
    }
  }

  const handleEnded = () => {
    appState.value = { ...appState.value, isPlaying: false }
    if (state.currentEpisode) {
      savePlaybackPosition(0) // Reset position when episode ends
    }
  }

  const handleError = (error: Event) => {
    const audioError = (error.target as HTMLAudioElement)?.error
    console.error('[Player] Audio error:', error)
    console.error('[Player] Audio error details:', {
      code: audioError?.code,
      message: audioError?.message,
      src: audioRef.current?.src
    })
    
    // Don't automatically reset playing state to prevent loops
    // Let the user handle the error by trying again or switching episodes
    
    // Show user-friendly error message
    let errorMessage = 'Failed to load audio.'
    if (audioError) {
      switch (audioError.code) {
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error while loading audio. Please check your internet connection and try again.'
          break
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Audio format not supported or file is corrupted.'
          break
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Audio source not supported by your browser.'
          break
        default:
          errorMessage = 'Unknown audio error occurred.'
      }
    }
    
    // Show error but don't auto-reset state
    console.warn('[Player] Error message would show:', errorMessage)
    // Commenting out alert to prevent interrupting user experience
    // alert(errorMessage)
  }

  const savePlaybackPosition = async (position: number) => {
    if (state.currentEpisode) {
      try {
        const updatedEpisode = { ...state.currentEpisode, playbackPosition: position }
        await storageService.updateEpisode(updatedEpisode)
        appState.value = { ...appState.value, currentEpisode: updatedEpisode }
      } catch (error) {
        console.error('[Player] Failed to save playback position:', error)
      }
    }
  }

  const togglePlayPause = () => {
    console.log(`[Player] Toggle play/pause clicked. Current state: ${state.isPlaying}`)
    console.log(`[Player] Current episode:`, state.currentEpisode?.title)
    
    if (!state.currentEpisode) {
      console.warn('[Player] No episode loaded')
      alert('No episode loaded. Please select an episode first.')
      return
    }
    
    if (!audioRef.current) {
      console.warn('[Player] Audio element not available')
      return
    }
    
    // Check if this is a real URL that might have CORS issues
    if (state.currentEpisode.audioUrl.includes('megaphone.fm') || 
        state.currentEpisode.audioUrl.includes('libsyn.com') ||
        (!state.currentEpisode.audioUrl.startsWith('test://') && 
         !state.currentEpisode.audioUrl.includes('learningcontainer.com'))) {
      console.warn('[Player] Real podcast URL detected - may have CORS issues')
      alert('This appears to be a real podcast URL which may not work due to CORS restrictions. Try using test://huberman or test://rogan for demo purposes.')
    }
    
    const newPlayingState = !state.isPlaying
    console.log(`[Player] Setting playing state to: ${newPlayingState}`)
    
    appState.value = {
      ...appState.value,
      isPlaying: newPlayingState,
    }
  }

  const handleSeek = (e: Event) => {
    const target = e.target as HTMLInputElement
    const newTime = parseFloat(target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const newVolume = parseFloat(target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 30, duration)
    }
  }

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 15, 0)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <section>
      <div className="player-container">
        {state.currentEpisode ? (
          <div className="player-active">
            <div className="player-info">
              <h3>{state.currentEpisode.title}</h3>
              <p className="episode-description">
                {state.currentEpisode.description.length > 200
                  ? state.currentEpisode.description.substring(0, 200) + '...'
                  : state.currentEpisode.description}
              </p>
            </div>

            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={handleCanPlay}
              onEnded={handleEnded}
              onError={handleError}
              preload="metadata"
            />

            <div className="player-controls">
              <div className="main-controls">
                <button
                  className="skip-btn"
                  onClick={skipBackward}
                  title="Skip back 15 seconds"
                >
                  ⏪ 15s
                </button>
                
                <button
                  className="play-pause-btn"
                  onClick={togglePlayPause}
                  title={state.isPlaying ? 'Pause' : 'Play'}
                >
                  {state.isPlaying ? '⏸️' : '▶️'}
                </button>
                
                <button
                  className="skip-btn"
                  onClick={skipForward}
                  title="Skip forward 30 seconds"
                >
                  30s ⏩
                </button>
              </div>

              <div className="progress-controls">
                <span className="time-display">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  className="progress-bar"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                />
                <span className="time-display">{formatTime(duration)}</span>
              </div>

              <div className="secondary-controls">
                <div className="volume-control">
                  <button onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                </div>

                <div className="playback-speed">
                  <label htmlFor="speed-control">Speed: {state.playbackSpeed}x</label>
                  <input
                    id="speed-control"
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.25"
                    value={state.playbackSpeed}
                    onChange={e => {
                      const speed = parseFloat((e.target as HTMLInputElement).value)
                      appState.value = { ...appState.value, playbackSpeed: speed }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="episode-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  appState.value = { ...appState.value, currentView: 'subscriptions' }
                }}
              >
                Back to Subscriptions
              </button>
              
              {/* Debug button for audio testing */}
              <button
                className="btn-secondary"
                onClick={() => {
                  if (audioRef.current) {
                    console.log('[Player] Audio element debug info:', {
                      src: audioRef.current.src,
                      readyState: audioRef.current.readyState,
                      networkState: audioRef.current.networkState,
                      paused: audioRef.current.paused,
                      currentTime: audioRef.current.currentTime,
                      duration: audioRef.current.duration,
                      volume: audioRef.current.volume,
                      muted: audioRef.current.muted,
                      error: audioRef.current.error
                    })
                  }
                }}
                title="Debug audio element"
              >
                Debug Audio
              </button>
              
              {/* Reset player button */}
              <button
                className="btn-secondary"
                onClick={() => {
                  console.log('[Player] Resetting player state')
                  appState.value = { 
                    ...appState.value, 
                    isPlaying: false,
                    currentEpisode: null
                  }
                  if (audioRef.current) {
                    audioRef.current.pause()
                    audioRef.current.currentTime = 0
                  }
                }}
                title="Reset player"
              >
                Reset Player
              </button>
            </div>
          </div>
        ) : (
          <div className="player-placeholder">
            <h3>No episode selected</h3>
            <p>Select an episode from your subscriptions to start playing</p>
            <button
              className="btn-primary"
              onClick={() => {
                appState.value = { ...appState.value, currentView: 'subscriptions' }
              }}
            >
              Browse Podcasts
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
