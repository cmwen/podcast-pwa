import { useState } from 'preact/hooks'
import { appState } from '../App'

/**
 * Subscriptions View Component
 * [Design → Execution] RSS subscription management with validation
 */
export function SubscriptionsView() {
  const [subscriptions] = useState([]) // TODO: Connect to storage service

  const handleAddSubscription = async () => {
    console.log('[Execution] Add subscription triggered')

    const rssUrl = prompt('Enter RSS feed URL:')
    if (!rssUrl) return

    // Show loading state
    appState.value = { ...appState.value, isLoading: true }

    try {
      // TODO: Validate and add RSS feed using RSS service
      console.log(`[Execution] Adding subscription: ${rssUrl}`)

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000))

      alert('Subscription added successfully! (Placeholder)')
    } catch (error) {
      console.error('[Execution] Add subscription failed:', error)
      alert(`Failed to add subscription: ${error}`)
    } finally {
      appState.value = { ...appState.value, isLoading: false }
    }
  }

  return (
    <section className="view">
      <div className="section-header">
        <h2>Subscriptions</h2>
        <button
          className="btn-primary"
          onClick={handleAddSubscription}
          disabled={appState.value.isLoading}
        >
          Add Podcast
        </button>
      </div>

      <div className="subscriptions-list">
        {subscriptions.length === 0 ? (
          <div className="empty-state">
            <p>No subscriptions yet. Add your first podcast!</p>
          </div>
        ) : (
          <div className="subscription-grid">{/* TODO: Render subscription items */}</div>
        )}
      </div>
    </section>
  )
}
