import { appState } from '../App'

/**
 * Player View Component
 * [Design → Execution] Audio player with variable speed controls
 */
export function PlayerView() {
  const state = appState.value

  return (
    <section className="view">
      <div className="player-container">
        {state.currentEpisode ? (
          <div className="player-active">
            <div className="player-info">
              <h3>{state.currentEpisode.title}</h3>
              <p>Episode info and controls will be implemented here</p>
            </div>

            <div className="player-controls">
              <button
                className="play-pause-btn"
                onClick={() => {
                  appState.value = {
                    ...appState.value,
                    isPlaying: !state.isPlaying,
                  }
                }}
              >
                {state.isPlaying ? 'Pause' : 'Play'}
              </button>

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
        ) : (
          <div className="player-placeholder">
            <p>Select an episode to start playing</p>
          </div>
        )}
      </div>
    </section>
  )
}
