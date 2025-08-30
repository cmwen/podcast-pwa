/**
 * Storage Service
 * [Design → Execution] IndexedDB wrapper for subscriptions, episodes, playlists
 */

import { openDB, type IDBPDatabase } from 'idb'
import type { Subscription, Episode, Playlist } from '@/types'

const DB_NAME = 'podcast-pwa'
const DB_VERSION = 1

class StorageService {
  private db: IDBPDatabase | null = null

  async init() {
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Subscriptions store
          if (!db.objectStoreNames.contains('subscriptions')) {
            const subscriptionsStore = db.createObjectStore('subscriptions', { keyPath: 'id' })
            subscriptionsStore.createIndex('url', 'url', { unique: true })
          }

          // Episodes store
          if (!db.objectStoreNames.contains('episodes')) {
            const episodesStore = db.createObjectStore('episodes', { keyPath: 'id' })
            episodesStore.createIndex('subscriptionId', 'subscriptionId')
            episodesStore.createIndex('publishDate', 'publishDate')
          }

          // Playlists store
          if (!db.objectStoreNames.contains('playlists')) {
            db.createObjectStore('playlists', { keyPath: 'id' })
          }
        },
      })
      console.log('[Storage] IndexedDB initialized')
    } catch (error) {
      console.error('[Storage] Failed to initialize IndexedDB:', error)
      throw error
    }
  }

  // Subscription methods
  async addSubscription(subscription: Subscription): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.add('subscriptions', subscription)
  }

  async getSubscriptions(): Promise<Subscription[]> {
    if (!this.db) throw new Error('Database not initialized')
    return this.db.getAll('subscriptions')
  }

  async removeSubscription(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.delete('subscriptions', id)
  }

  // Episode methods
  async addEpisode(episode: Episode): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.add('episodes', episode)
  }

  async getEpisodesBySubscription(subscriptionId: string): Promise<Episode[]> {
    if (!this.db) throw new Error('Database not initialized')
    return this.db.getAllFromIndex('episodes', 'subscriptionId', subscriptionId)
  }

  async updateEpisode(episode: Episode): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.put('episodes', episode)
  }

  // Playlist methods
  async addPlaylist(playlist: Playlist): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.add('playlists', playlist)
  }

  async getPlaylists(): Promise<Playlist[]> {
    if (!this.db) throw new Error('Database not initialized')
    return this.db.getAll('playlists')
  }

  async updatePlaylist(playlist: Playlist): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.put('playlists', playlist)
  }
}

// Export singleton instance
export const storageService = new StorageService()
