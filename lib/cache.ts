import { LRUCache } from "lru-cache"

// 5-minute TTL per (token/address, chain) key to conserve GoPlus quota
export const goPlusCache = new LRUCache<string, object>({
  max: 2000,
  ttl: 5 * 60 * 1000,
})
