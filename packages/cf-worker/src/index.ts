export interface Env {
  MENU_CACHE: KVNamespace;
  ORIGIN_URL?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 0. Determine target URL
    const targetUrl = new URL(request.url);
    if (env.ORIGIN_URL) {
      const origin = new URL(env.ORIGIN_URL);
      targetUrl.protocol = origin.protocol;
      targetUrl.hostname = origin.hostname;
      targetUrl.port = origin.port;
    }
    const targetRequest = new Request(targetUrl.toString(), request);

    // Only cache GET requests to public menu and category API endpoints
    if (request.method === 'GET' && (url.pathname.startsWith('/api/menu/items') || url.pathname.startsWith('/api/menu/categories'))) {
      
      // We'll use the full path + query string as the cache key
      // Example: categories_?locationId=123 or items_?locationId=123
      const keyPrefix = url.pathname.includes('/categories') ? 'categories_' : 'menu_';
      const cacheKey = `${keyPrefix}${url.search}`;
      
      try {
        // 1. Check KV Cache
        const cachedResponse = await env.MENU_CACHE.get(cacheKey);
        if (cachedResponse) {
          return new Response(cachedResponse, {
            headers: { 
              'Content-Type': 'application/json',
              'X-Cache': 'HIT',
              // Allow CORS for frontends
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
            }
          });
        }

        // 2. Cache MISS: Forward the request to the origin
        const response = await fetch(targetRequest);
        
        // Only cache successful 200 responses
        if (response.status === 200) {
          const responseBody = await response.text();
          
          // 3. Save to KV Cache asynchronously (TTL: 1 Hour)
          ctx.waitUntil(env.MENU_CACHE.put(cacheKey, responseBody, { expirationTtl: 3600 }));

          return new Response(responseBody, {
            status: response.status,
            headers: {
              ...Object.fromEntries(response.headers),
              'X-Cache': 'MISS'
            }
          });
        }

        // If not a 200, just return the response directly without caching
        return response;

      } catch (err) {
        // Fallback to origin if KV fails
        return fetch(targetRequest);
      }
    }

    // For all other requests, just pass through
    return fetch(targetRequest);
  }
};
