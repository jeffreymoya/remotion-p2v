/**
 * Google Trends Service
 * Fetches trending topics from Google Trends
 */

import { XMLParser } from 'fast-xml-parser';
import { logger } from '../../utils/logger';

export interface TrendingTopic {
  query: string;
  traffic?: string;
  exploreLink?: string;
}

export interface GoogleTrendsOptions {
  geo?: string; // Country code (e.g., 'US', 'GB', 'IN')
  category?: number; // Category ID (optional)
  count?: number; // Number of trends to fetch
}

export class GoogleTrendsService {
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: 'text',
    trimValues: true,
  });

  private readonly userAgent =
    'Mozilla/5.0 (compatible; RemotionP2V/1.0; +https://github.com/remotion-dev)';

  private async fetchRssFeed(url: string) {
    logger.debug(`Fetching Google Trends RSS feed: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
      },
    });

    const xml = await response.text();

    if (!response.ok) {
      const bodySnippet = xml.slice(0, 200).replace(/\s+/g, ' ');
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${bodySnippet}`);
    }

    try {
      return this.parser.parse(xml);
    } catch (error: any) {
      logger.error('Failed to parse Google Trends RSS feed', error.message);
      throw new Error(`Unable to parse Google Trends feed: ${error.message}`);
    }
  }

  private getFeedItems(feed: any): any[] {
    const items = feed?.rss?.channel?.item;
    if (!items) {
      return [];
    }
    return Array.isArray(items) ? items : [items];
  }

  private stripSourceFromTitle(title: string): string {
    if (!title.includes(' - ')) {
      return title;
    }
    const parts = title.split(' - ');
    if (parts.length <= 1) {
      return title;
    }
    return parts.slice(0, -1).join(' - ').trim();
  }

  private buildExploreLink(query: string, geo: string): string {
    const encodedQuery = encodeURIComponent(query);
    return `https://trends.google.com/trends/explore?geo=${geo}&q=${encodedQuery}`;
  }

  private toTrendingTopic(item: any, geo: string): TrendingTopic {
    const hasTraffic = typeof item?.['ht:approx_traffic'] === 'string';
    const rawTitle = typeof item?.title === 'string' ? item.title.trim() : 'Unknown';
    const query = hasTraffic ? rawTitle : this.stripSourceFromTitle(rawTitle);

    return {
      query,
      traffic: hasTraffic ? item['ht:approx_traffic'] : 'unknown',
      exploreLink: this.buildExploreLink(query, geo),
    };
  }

  private normalizeGeo(geo?: string) {
    return (geo || 'US').toUpperCase();
  }

  private buildNewsFeedUrl(geo: string) {
    const normalizedGeo = this.normalizeGeo(geo);
    const hl = normalizedGeo === 'US' ? 'en-US' : `en-${normalizedGeo}`;
    const langCode = hl.split('-')[0];
    return `https://news.google.com/rss?hl=${hl}&gl=${normalizedGeo}&ceid=${normalizedGeo}:${langCode}`;
  }

  /**
   * Fetch daily trending searches using the public RSS feed
   */
  async fetchDailyTrends(options: GoogleTrendsOptions = {}): Promise<TrendingTopic[]> {
    const { geo = 'US', count = 20 } = options;

    try {
      logger.debug(`Fetching daily RSS trends for ${geo}...`);
      const feed = await this.fetchRssFeed(`https://trends.google.com/trending/rss?geo=${geo}`);
      const items = this.getFeedItems(feed);

      if (items.length === 0) {
        throw new Error('No RSS items returned');
      }

      const topics = items.slice(0, count).map((item) => this.toTrendingTopic(item, geo));
      logger.info(`Fetched ${topics.length} trending topics from Google Trends RSS`);
      return topics;
    } catch (error: any) {
      logger.error('Failed to fetch Google Trends RSS:', error.message);
      throw new Error(`Google Trends RSS error: ${error.message}`);
    }
  }

  /**
   * Fetch real-time trending searches using Google News RSS as a fallback signal
   */
  async fetchRealTimeTrends(options: GoogleTrendsOptions = {}): Promise<TrendingTopic[]> {
    const { geo = 'US', count = 20 } = options;

    try {
      logger.debug(`Fetching Google News RSS trends for ${geo}...`);
      const feed = await this.fetchRssFeed(this.buildNewsFeedUrl(geo));
      const items = this.getFeedItems(feed);

      if (items.length === 0) {
        throw new Error('No RSS items returned');
      }

      const topics = items.slice(0, count).map((item) => this.toTrendingTopic(item, geo));
      logger.info(`Fetched ${topics.length} topics from Google News RSS fallback`);
      return topics;
    } catch (error: any) {
      logger.error('Failed to fetch Google News RSS trends:', error.message);
      throw new Error(`Google News RSS error: ${error.message}`);
    }
  }

  /**
   * Fetch trending searches with fallback
   * Tries daily trends first, falls back to real-time if that fails
   */
  async fetchTrendsWithFallback(options: GoogleTrendsOptions = {}): Promise<TrendingTopic[]> {
    try {
      // Try daily trends first (more reliable)
      return await this.fetchDailyTrends(options);
    } catch (dailyError) {
      logger.warn('Daily trends failed, trying real-time trends...');
      try {
        // Fallback to real-time trends
        return await this.fetchRealTimeTrends(options);
      } catch (realtimeError) {
        logger.error('Both trending methods failed');
        throw new Error('Unable to fetch trending topics from Google Trends');
      }
    }
  }
}
