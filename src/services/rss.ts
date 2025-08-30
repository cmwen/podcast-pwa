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

      // Use CORS proxy for development (would need serverless function for production)
      const isDev = import.meta.env?.DEV || false
      const proxyUrl = isDev ? `https://api.allorigins.win/get?url=${encodeURIComponent(url)}` : url

      const response = await fetch(proxyUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const text = isDev ? JSON.parse(await response.text()).contents : await response.text()

      return this.parseFeed(text, url)
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
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const rssService = new RSSService()
