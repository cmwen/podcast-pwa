/**
 * Core type definitions for Podcast PWA
 * [Design → Execution] Following design.md data models
 */

export interface Subscription {
  id: string
  title: string
  url: string
  description?: string
  imageUrl?: string
  lastFetched: Date
  isActive: boolean
}

export interface Episode {
  id: string
  subscriptionId: string
  title: string
  description: string
  audioUrl: string
  duration: number
  publishDate: Date
  downloadStatus: 'none' | 'downloading' | 'downloaded' | 'error'
  playbackPosition: number // seconds
}

export interface Playlist {
  id: string
  name: string
  episodeIds: string[]
  isQueue: boolean // Special flag for main queue
  createdAt: Date
  updatedAt: Date
}

export interface AppState {
  currentView: 'subscriptions' | 'player' | 'playlists'
  isOnline: boolean
  isLoading: boolean
  currentEpisode: Episode | null
  isPlaying: boolean
  playbackSpeed: number
}

export interface RSSFeed {
  title: string
  description: string
  link: string
  episodes: RSSEpisode[]
}

export interface RSSEpisode {
  title: string
  description: string
  url: string
  duration?: number
  publishDate: Date
}

export interface DownloadProgress {
  episodeId: string
  progress: number // 0-100
  status: 'downloading' | 'completed' | 'error'
}

export interface PlaybackState {
  currentTime: number
  duration: number
  isPlaying: boolean
  speed: number
  volume: number
}
