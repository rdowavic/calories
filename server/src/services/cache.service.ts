import { LRUCache } from 'lru-cache';
import { FoodSearchResult, FoodDetail } from '@calories/shared';

/**
 * LRU cache for food search results.
 * Max 10,000 entries, 5-minute TTL.
 */
export const foodCache = new LRUCache<string, FoodSearchResult[]>({
  max: 10_000,
  ttl: 5 * 60 * 1000, // 5 minutes
});

/**
 * LRU cache for barcode lookup results.
 * Max 5,000 entries, 24-hour TTL.
 */
export const barcodeCache = new LRUCache<string, FoodDetail>({
  max: 5_000,
  ttl: 24 * 60 * 60 * 1000, // 24 hours
});
