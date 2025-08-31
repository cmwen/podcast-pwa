/**
 * RSS Service
 * [Design → Execution] RSS feed parsing with validation and error handling
 */

import { XMLParser } from 'fast-xml-parser'
import type { RSSFeed, RSSEpisode } from '@/types'

class RSSService {
  private parser: XMLParser

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    })
  }

  /**
   * Fetch and parse RSS feed
   */
  async fetchFeed(url: string): Promise<RSSFeed> {
    try {
      console.log(`[RSS] Fetching feed: ${url}`)

      // Handle mock feeds for testing
      if (url.startsWith('test://')) {
        return this.getMockFeed(url)
      }

      // Use CORS proxy for development (would need serverless function for production)
      const isDev = import.meta.env?.DEV || false

      if (isDev) {
        // Try multiple CORS proxy services
        const proxies = [
          `https://corsproxy.io/?${encodeURIComponent(url)}`,
          `https://cors-anywhere.herokuapp.com/${url}`,
          `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        ]

        let lastError
        for (const proxyUrl of proxies) {
          try {
            console.log(`[RSS] Trying proxy: ${proxyUrl}`)
            const response = await fetch(proxyUrl)
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            // Handle different proxy response formats
            const responseText = await response.text()
            let text

            if (proxyUrl.includes('allorigins.win')) {
              const parsed = JSON.parse(responseText)
              text = parsed.contents
            } else {
              text = responseText
            }

            return this.parseFeed(text, url)
          } catch (error) {
            console.warn(`[RSS] Proxy failed: ${proxyUrl}`, error)
            lastError = error
            continue
          }
        }

        throw lastError || new Error('All CORS proxies failed')
      } else {
        // Production: direct fetch (would fail due to CORS, needs server-side proxy)
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const text = await response.text()
        return this.parseFeed(text, url)
      }
    } catch (error) {
      console.error(`[RSS] Failed to fetch feed ${url}:`, error)
      throw new Error(`Failed to fetch RSS feed: ${error}`)
    }
  }

  /**
   * Parse RSS/Atom feed content
   */
  private parseFeed(xmlContent: string, feedUrl: string): RSSFeed {
    try {
      const parsed = this.parser.parse(xmlContent)

      // Handle RSS 2.0
      if (parsed.rss?.channel) {
        return this.parseRSS2(parsed.rss.channel, feedUrl)
      }

      // Handle Atom
      if (parsed.feed) {
        return this.parseAtom(parsed.feed, feedUrl)
      }

      throw new Error('Unsupported feed format')
    } catch (error) {
      console.error('[RSS] Failed to parse feed:', error)
      throw new Error(`Invalid RSS feed format: ${error}`)
    }
  }

  /**
   * Parse RSS 2.0 format
   */
  private parseRSS2(channel: any, feedUrl: string): RSSFeed {
    const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean)

    return {
      title: this.extractText(channel.title),
      description: this.extractText(channel.description),
      link: feedUrl,
      episodes: items.map((item: any) => this.parseRSSEpisode(item)),
    }
  }

  /**
   * Parse Atom format
   */
  private parseAtom(feed: any, feedUrl: string): RSSFeed {
    const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry].filter(Boolean)

    return {
      title: this.extractText(feed.title),
      description: this.extractText(feed.subtitle || feed.summary),
      link: feedUrl,
      episodes: entries.map((entry: any) => this.parseAtomEntry(entry)),
    }
  }

  /**
   * Parse RSS episode item
   */
  private parseRSSEpisode(item: any): RSSEpisode {
    const enclosure = item.enclosure
    const audioUrl = enclosure?.['@_url'] || ''

    return {
      title: this.extractText(item.title),
      description: this.extractText(item.description),
      url: audioUrl,
      duration: this.parseDuration(item['itunes:duration']),
      publishDate: new Date(item.pubDate || Date.now()),
    }
  }

  /**
   * Parse Atom entry
   */
  private parseAtomEntry(entry: any): RSSEpisode {
    const link = Array.isArray(entry.link)
      ? entry.link.find((l: any) => l['@_type']?.includes('audio'))
      : entry.link

    return {
      title: this.extractText(entry.title),
      description: this.extractText(entry.summary || entry.content),
      url: link?.['@_href'] || '',
      duration: this.parseDuration(entry['itunes:duration']),
      publishDate: new Date(entry.published || entry.updated || Date.now()),
    }
  }

  /**
   * Extract text content from parsed element
   */
  private extractText(element: any): string {
    if (typeof element === 'string') return element.trim()
    if (element?.['#text']) return element['#text'].trim()
    return ''
  }

  /**
   * Parse duration from various formats
   */
  private parseDuration(duration: any): number {
    if (!duration) return 0

    const durationStr = this.extractText(duration)
    if (!durationStr) return 0

    // Handle HH:MM:SS or MM:SS format
    const parts = durationStr.split(':').map(Number)
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    }

    // Handle seconds only
    return parseInt(durationStr) || 0
  }

  /**
   * Validate RSS feed URL format
   */
  validateFeedUrl(url: string): boolean {
    if (url.startsWith('test://')) return true // Allow mock feeds

    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  /**
   * Get mock RSS feed for testing
   */
  private getMockFeed(url: string): RSSFeed {
    const mockFeeds: Record<string, RSSFeed> = {
      'test://huberman': {
        title: 'Huberman Lab (Demo)',
        description: 'Mock podcast feed for testing the app functionality',
        link: url,
        episodes: [
          {
            title: 'Episode 1: Demo Episode About Sleep',
            description:
              'This is a mock episode about sleep optimization. In a real app, this would contain the full episode description with detailed show notes.',
            url: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
            duration: 3600, // 1 hour
            publishDate: new Date('2024-01-15'),
          },
          {
            title: 'Episode 2: Demo Episode About Exercise',
            description:
              'This is a mock episode about exercise and fitness. This demonstrates how episodes would appear in the app.',
            url: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
            duration: 4200, // 70 minutes
            publishDate: new Date('2024-01-08'),
          },
          {
            title: 'Episode 3: Demo Episode About Nutrition',
            description:
              'This is a mock episode about nutrition and diet. Perfect for testing the podcast player functionality.',
            url: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
            duration: 3300, // 55 minutes
            publishDate: new Date('2024-01-01'),
          },
        ],
      },
      'test://rogan': {
        title: 'Joe Rogan Experience (Demo)',
        description: 'Mock JRE feed for testing',
        link: url,
        episodes: [
          {
            title: 'JRE #1999: Demo Guest',
            description: 'A mock episode featuring a demo guest discussing interesting topics.',
            url: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
            duration: 7200, // 2 hours
            publishDate: new Date('2024-01-10'),
          },
        ],
      },
    }

    return (
      mockFeeds[url] || {
        title: 'Unknown Mock Feed',
        description: 'This mock feed was not found',
        link: url,
        episodes: [],
      }
    )
  }
}

// Export singleton instance
export const rssService = new RSSService()
