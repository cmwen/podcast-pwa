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
    // Remove subscription and all associated episodes
    await this.deleteEpisodesBySubscription(id)
    await this.db.delete('subscriptions', id)
  }

  async getSubscriptionById(id: string): Promise<Subscription | undefined> {
    if (!this.db) throw new Error('Database not initialized')
    return this.db.get('subscriptions', id)
  }

  async updateSubscription(subscription: Subscription): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.put('subscriptions', subscription)
  }

  // Episode methods
  async addEpisode(episode: Episode): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.add('episodes', episode)
  }

  async addEpisodes(episodes: Episode[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    const tx = this.db.transaction('episodes', 'readwrite')
    await Promise.all(episodes.map(episode => tx.store.put(episode)))
    await tx.done
  }

  async getEpisodesBySubscription(subscriptionId: string): Promise<Episode[]> {
    if (!this.db) throw new Error('Database not initialized')
    const episodes = await this.db.getAllFromIndex('episodes', 'subscriptionId', subscriptionId)
    // Sort by publish date, newest first
    return episodes.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime())
  }

  async getAllEpisodes(): Promise<Episode[]> {
    if (!this.db) throw new Error('Database not initialized')
    const episodes = await this.db.getAll('episodes')
    return episodes.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime())
  }

  async getEpisodeById(id: string): Promise<Episode | undefined> {
    if (!this.db) throw new Error('Database not initialized')
    return this.db.get('episodes', id)
  }

  async updateEpisode(episode: Episode): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.put('episodes', episode)
  }

  async deleteEpisodesBySubscription(subscriptionId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    const episodes = await this.getEpisodesBySubscription(subscriptionId)
    const tx = this.db.transaction('episodes', 'readwrite')
    await Promise.all(episodes.map(episode => tx.store.delete(episode.id)))
    await tx.done
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

  async getPlaylistById(id: string): Promise<Playlist | undefined> {
    if (!this.db) throw new Error('Database not initialized')
    return this.db.get('playlists', id)
  }

  async updatePlaylist(playlist: Playlist): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.put('playlists', playlist)
  }

  async deletePlaylist(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.delete('playlists', id)
  }
}

// Export singleton instance
export const storageService = new StorageService()
