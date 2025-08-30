import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rssService } from '@/services/rss'

describe('RSS Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateFeedUrl', () => {
    it('should validate valid HTTP URLs', () => {
      expect(rssService.validateFeedUrl('http://example.com/rss')).toBe(true)
      expect(rssService.validateFeedUrl('https://example.com/feed.xml')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(rssService.validateFeedUrl('not-a-url')).toBe(false)
      expect(rssService.validateFeedUrl('ftp://example.com/rss')).toBe(false)
      expect(rssService.validateFeedUrl('')).toBe(false)
    })
  })

  describe('fetchFeed', () => {
    it('should throw error for invalid URLs', async () => {
      await expect(rssService.fetchFeed('invalid-url')).rejects.toThrow()
    })

    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(rssService.fetchFeed('https://example.com/rss')).rejects.toThrow(
        'Failed to fetch RSS feed'
      )
    })

    it('should handle HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(rssService.fetchFeed('https://example.com/rss')).rejects.toThrow('HTTP 404')
    })
  })
})
