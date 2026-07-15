import axios from 'axios';
import logger from './logger.js';

export async function invalidateKVCache(prefix: string, locationId?: string) {
  const accountId = process.env.CF_ACCOUNT_ID;
  const namespaceId = process.env.CF_KV_NAMESPACE_ID;
  const apiToken = process.env.CF_API_TOKEN;

  if (!accountId || !namespaceId || !apiToken) {
    logger.warn('Cloudflare KV credentials missing. Skipping cache invalidation.');
    return;
  }

  try {
    // If a location is provided, we can clear specifically for that location.
    // However, since KV keys can be dynamic (e.g. ?locationId=123), Cloudflare does not support wildcard deletions via API directly.
    // The standard way to purge a prefix in KV programmatically without looping through thousands of keys is to use the bulk delete endpoint,
    // or specifically delete known keys. For menu and categories, we can delete the global key and the specific location key.

    const keysToDelete = locationId 
      ? [`${prefix}?locationId=${locationId}`]
      : [`${prefix}`, `${prefix}?locationId=undefined`, `${prefix}?locationId=null`];

    // For comprehensive invalidation, if no locationId is specified (e.g. global category changed),
    // ideally we would list keys by prefix and bulk delete them.
    // Let's implement the list & bulk delete approach for robustness.

    // 1. List keys matching the prefix
    const listRes = await axios.get(`https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys?prefix=${prefix}`, {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });

    const keys = listRes.data.result.map((k: any) => k.name);
    
    if (keys.length === 0) {
      return; // Nothing to delete
    }

    // 2. Bulk delete keys
    await axios.post(`https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/bulk`, keys, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    logger.info(`Successfully invalidated ${keys.length} Cloudflare KV cache keys with prefix: ${prefix}`);
  } catch (error: any) {
    logger.error('Failed to invalidate Cloudflare KV cache', error.response?.data || error.message);
  }
}
