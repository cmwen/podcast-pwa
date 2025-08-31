import { useState, useEffect } from 'preact/hooks'
import { appState } from '../App'
import { storageService } from '../../services/storage'
import { rssService } from '../../services/rss'
import type { Subscription } from '../../types'

/**
 * Subscriptions View Component
 * [Design → Execution] RSS subscription management with validation
 */
export function SubscriptionsView() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isAddingSubscription, setIsAddingSubscription] = useState(false)
  const [newFeedUrl, setNewFeedUrl] = useState('')

  // Load subscriptions on component mount
  useEffect(() => {
    loadSubscriptions()
  }, [])

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

      // Save to storage
      await storageService.addSubscription(subscription)

      // Update local state
      setSubscriptions(prev => [...prev, subscription])
      setNewFeedUrl('')
      setIsAddingSubscription(false)

      console.log('[Execution] Subscription added successfully:', subscription.title)
    } catch (error) {
      console.error('[Execution] Add subscription failed:', error)
      alert(
        `Failed to add subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
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
      console.log('[Execution] Subscription removed:', id)
    } catch (error) {
      console.error('[Execution] Failed to remove subscription:', error)
      alert('Failed to remove subscription')
    }
  }

  const showAddForm = () => {
    setIsAddingSubscription(true)
  }

  const cancelAdd = () => {
    setIsAddingSubscription(false)
    setNewFeedUrl('')
  }

  return (
    <section>
      <div className="section-header">
        <h2>Subscriptions</h2>
        {!isAddingSubscription && (
          <button className="btn-primary" onClick={showAddForm} disabled={appState.value.isLoading}>
            Add Podcast
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

      <div className="subscriptions-list">
        {subscriptions.length === 0 && !isAddingSubscription ? (
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
    </section>
  )
}
