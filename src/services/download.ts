/**
 * Download Service
 * Handles downloading audio files for offline playback
 */

import { storageService } from './storage'
import type { Episode, DownloadProgress } from '../types'

class DownloadService {
  private activeDownloads = new Map<string, AbortController>()
  private downloadCallbacks = new Map<string, (progress: DownloadProgress) => void>()

  /**
   * Download an episode for offline playback
   */
  async downloadEpisode(
    episode: Episode,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    if (episode.downloadStatus === 'downloading' || episode.downloadStatus === 'downloaded') {
      console.log(`[Download] Episode ${episode.id} already downloading or downloaded`)
      return
    }

    const abortController = new AbortController()
    this.activeDownloads.set(episode.id, abortController)

    if (onProgress) {
      this.downloadCallbacks.set(episode.id, onProgress)
    }

    try {
      // Update episode status to downloading
      const updatedEpisode = { ...episode, downloadStatus: 'downloading' as const }
      await storageService.updateEpisode(updatedEpisode)

      // Report initial progress
      this.reportProgress(episode.id, 0, 'downloading')

      // Fetch the audio file
      const response = await fetch(episode.audioUrl, {
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0

      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      const chunks: Uint8Array[] = []
      let receivedLength = 0

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        if (abortController.signal.aborted) {
          throw new Error('Download cancelled')
        }

        chunks.push(value)
        receivedLength += value.length

        // Report progress
        if (total > 0) {
          const progress = Math.round((receivedLength / total) * 100)
          this.reportProgress(episode.id, progress, 'downloading')
        }
      }

      // Combine chunks into a single Uint8Array
      const audioData = new Uint8Array(receivedLength)
      let position = 0
      for (const chunk of chunks) {
        audioData.set(chunk, position)
        position += chunk.length
      }

      // Store the audio data in IndexedDB
      await this.storeAudioData(episode.id, audioData)

      // Update episode status to downloaded
      const downloadedEpisode = { ...episode, downloadStatus: 'downloaded' as const }
      await storageService.updateEpisode(downloadedEpisode)

      // Report completion
      this.reportProgress(episode.id, 100, 'completed')

      console.log(`[Download] Successfully downloaded episode: ${episode.title}`)
    } catch (error) {
      console.error(`[Download] Failed to download episode ${episode.title}:`, error)

      // Update episode status to error
      const errorEpisode = { ...episode, downloadStatus: 'error' as const }
      await storageService.updateEpisode(errorEpisode)

      // Report error
      this.reportProgress(episode.id, 0, 'error')

      if (error instanceof Error && error.name !== 'AbortError') {
        throw error
      }
    } finally {
      this.activeDownloads.delete(episode.id)
      this.downloadCallbacks.delete(episode.id)
    }
  }

  /**
   * Cancel an active download
   */
  cancelDownload(episodeId: string): void {
    const controller = this.activeDownloads.get(episodeId)
    if (controller) {
      controller.abort()
      this.activeDownloads.delete(episodeId)
      this.downloadCallbacks.delete(episodeId)
      console.log(`[Download] Cancelled download for episode ${episodeId}`)
    }
  }

  /**
   * Delete downloaded episode data
   */
  async deleteDownload(episode: Episode): Promise<void> {
    try {
      await this.deleteAudioData(episode.id)

      const updatedEpisode = { ...episode, downloadStatus: 'none' as const }
      await storageService.updateEpisode(updatedEpisode)

      console.log(`[Download] Deleted download for episode: ${episode.title}`)
    } catch (error) {
      console.error(`[Download] Failed to delete download for episode ${episode.title}:`, error)
      throw error
    }
  }

  /**
   * Get a blob URL for a downloaded episode
   */
  async getDownloadedEpisodeUrl(episodeId: string): Promise<string | null> {
    try {
      const audioData = await this.getAudioData(episodeId)
      if (!audioData) return null

      // Create a blob and return its URL
      const blob = new Blob([audioData], { type: 'audio/mpeg' })
      return URL.createObjectURL(blob)
    } catch (error) {
      console.error(`[Download] Failed to get downloaded episode URL for ${episodeId}:`, error)
      return null
    }
  }

  /**
   * Check if an episode is downloaded
   */
  async isEpisodeDownloaded(episodeId: string): Promise<boolean> {
    try {
      const audioData = await this.getAudioData(episodeId)
      return audioData !== null
    } catch (error) {
      console.error(`[Download] Failed to check if episode is downloaded ${episodeId}:`, error)
      return false
    }
  }

  /**
   * Get download progress for all active downloads
   */
  getActiveDownloads(): string[] {
    return Array.from(this.activeDownloads.keys())
  }

  private reportProgress(
    episodeId: string,
    progress: number,
    status: DownloadProgress['status']
  ): void {
    const callback = this.downloadCallbacks.get(episodeId)
    if (callback) {
      callback({ episodeId, progress, status })
    }
  }

  private async storeAudioData(episodeId: string, audioData: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('podcast-pwa-downloads', 1)

      request.onerror = () => reject(request.error)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('audio')) {
          db.createObjectStore('audio', { keyPath: 'episodeId' })
        }
      }

      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['audio'], 'readwrite')
        const store = transaction.objectStore('audio')

        // Store as ArrayBuffer to avoid type issues
        const storeRequest = store.put({
          episodeId,
          audioData: audioData.buffer.slice(0), // Copy the ArrayBuffer
          timestamp: Date.now(),
        })

        storeRequest.onerror = () => reject(storeRequest.error)
        storeRequest.onsuccess = () => resolve()

        transaction.oncomplete = () => db.close()
      }
    })
  }

  private async getAudioData(episodeId: string): Promise<ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('podcast-pwa-downloads', 1)

      request.onerror = () => reject(request.error)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('audio')) {
          db.createObjectStore('audio', { keyPath: 'episodeId' })
        }
      }

      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['audio'], 'readonly')
        const store = transaction.objectStore('audio')

        const getRequest = store.get(episodeId)

        getRequest.onerror = () => reject(getRequest.error)
        getRequest.onsuccess = () => {
          const result = getRequest.result
          resolve(result ? result.audioData : null)
        }

        transaction.oncomplete = () => db.close()
      }
    })
  }

  private async deleteAudioData(episodeId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('podcast-pwa-downloads', 1)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['audio'], 'readwrite')
        const store = transaction.objectStore('audio')

        const deleteRequest = store.delete(episodeId)

        deleteRequest.onerror = () => reject(deleteRequest.error)
        deleteRequest.onsuccess = () => resolve()

        transaction.oncomplete = () => db.close()
      }
    })
  }
}

export const downloadService = new DownloadService()
