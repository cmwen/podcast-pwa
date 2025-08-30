/**
 * Service Worker for Podcast PWA
 * [Design → Execution] Cache-first app shell with network fallback
 * Implements offline functionality and background sync
 */

const CACHE_NAME = 'podcast-pwa-v1';
const APP_SHELL_CACHE = 'app-shell-v1';
const AUDIO_CACHE = 'audio-files-v1';
const RSS_CACHE = 'rss-feeds-v1';

// App Shell files - critical for offline functionality
const APP_SHELL_FILES = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/js/app.js',
    '/manifest.json'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
    console.log('[SW] Install event');
    
    event.waitUntil(
        caches.open(APP_SHELL_CACHE)
            .then((cache) => {
                console.log('[SW] Caching app shell files');
                return cache.addAll(APP_SHELL_FILES);
            })
            .then(() => {
                console.log('[SW] App shell cached successfully');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activate event');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old cache versions
                        if (cacheName !== APP_SHELL_CACHE && 
                            cacheName !== AUDIO_CACHE && 
                            cacheName !== RSS_CACHE) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Cache cleanup complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Handle different types of requests with appropriate strategies
    if (isAppShellRequest(request)) {
        // App Shell: Cache-first with network fallback
        event.respondWith(cacheFirstStrategy(request, APP_SHELL_CACHE));
    } else if (isAudioRequest(request)) {
        // Audio files: Cache-only (explicitly downloaded)
        event.respondWith(cacheOnlyStrategy(request, AUDIO_CACHE));
    } else if (isRSSRequest(request)) {
        // RSS feeds: Network-first with cache fallback
        event.respondWith(networkFirstStrategy(request, RSS_CACHE));
    } else if (isImageRequest(request)) {
        // Images: Stale-while-revalidate
        event.respondWith(staleWhileRevalidateStrategy(request, CACHE_NAME));
    } else {
        // Default: Network-first
        event.respondWith(networkFirstStrategy(request, CACHE_NAME));
    }
});

/**
 * Check if request is for app shell files
 */
function isAppShellRequest(request) {
    const url = new URL(request.url);
    return APP_SHELL_FILES.some(file => 
        url.pathname === file || url.pathname === file.substring(1)
    );
}

/**
 * Check if request is for audio files
 */
function isAudioRequest(request) {
    return request.url.includes('.mp3') || 
           request.url.includes('.m4a') || 
           request.url.includes('.ogg') ||
           request.headers.get('accept')?.includes('audio');
}

/**
 * Check if request is for RSS feeds
 */
function isRSSRequest(request) {
    return request.url.includes('rss') || 
           request.url.includes('feed') ||
           request.headers.get('accept')?.includes('xml');
}

/**
 * Check if request is for images
 */
function isImageRequest(request) {
    return request.headers.get('accept')?.includes('image');
}

/**
 * Cache-first strategy: Check cache first, fallback to network
 * [Design → Execution] Ideal for app shell and static assets
 */
async function cacheFirstStrategy(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('[SW] Serving from cache:', request.url);
            return cachedResponse;
        }
        
        console.log('[SW] Cache miss, fetching from network:', request.url);
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache-first strategy failed:', error);
        
        // Return offline fallback if available
        if (request.destination === 'document') {
            const cache = await caches.open(APP_SHELL_CACHE);
            return cache.match('/index.html');
        }
        
        throw error;
    }
}

/**
 * Network-first strategy: Try network first, fallback to cache
 * [Design → Execution] Ideal for RSS feeds and dynamic content
 */
async function networkFirstStrategy(request, cacheName) {
    try {
        console.log('[SW] Trying network first:', request.url);
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        console.error('[SW] Network-first strategy failed:', error);
        throw error;
    }
}

/**
 * Cache-only strategy: Only serve from cache
 * [Design → Execution] For explicitly downloaded audio files
 */
async function cacheOnlyStrategy(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('[SW] Serving audio from cache:', request.url);
            return cachedResponse;
        }
        
        console.warn('[SW] Audio file not in cache:', request.url);
        throw new Error('Audio file not downloaded');
    } catch (error) {
        console.error('[SW] Cache-only strategy failed:', error);
        throw error;
    }
}

/**
 * Stale-while-revalidate strategy: Serve from cache, update in background
 * [Design → Execution] Good for images and non-critical resources
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    
    // Get from cache immediately
    const cachedResponse = await cache.match(request);
    
    // Update cache in background
    const networkResponsePromise = fetch(request)
        .then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(error => {
            console.warn('[SW] Background update failed:', error);
        });
    
    // Return cached version immediately, or wait for network if no cache
    return cachedResponse || networkResponsePromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync event:', event.tag);
    
    if (event.tag === 'rss-sync') {
        event.waitUntil(handleRSSSync());
    } else if (event.tag === 'download-sync') {
        event.waitUntil(handleDownloadSync());
    }
});

/**
 * Handle RSS feed sync when back online
 */
async function handleRSSSync() {
    try {
        console.log('[SW] Syncing RSS feeds...');
        // This would integrate with the RSS module
        // TODO: Implement RSS sync logic
    } catch (error) {
        console.error('[SW] RSS sync failed:', error);
    }
}

/**
 * Handle episode download sync when back online
 */
async function handleDownloadSync() {
    try {
        console.log('[SW] Syncing downloads...');
        // This would integrate with the download manager
        // TODO: Implement download sync logic
    } catch (error) {
        console.error('[SW] Download sync failed:', error);
    }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'DOWNLOAD_EPISODE':
                handleEpisodeDownload(event.data.payload);
                break;
            case 'CLEAR_CACHE':
                handleClearCache(event.data.payload);
                break;
            case 'GET_CACHE_STATUS':
                handleGetCacheStatus(event);
                break;
            default:
                console.warn('[SW] Unknown message type:', event.data.type);
        }
    }
});

/**
 * Handle episode download request
 */
async function handleEpisodeDownload(payload) {
    try {
        const { audioUrl, metadata } = payload;
        console.log('[SW] Downloading episode:', audioUrl);
        
        const response = await fetch(audioUrl);
        if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
        }
        
        const cache = await caches.open(AUDIO_CACHE);
        await cache.put(audioUrl, response);
        
        console.log('[SW] Episode downloaded successfully:', audioUrl);
        
        // Notify main thread
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'DOWNLOAD_COMPLETE',
                    payload: { audioUrl, metadata }
                });
            });
        });
    } catch (error) {
        console.error('[SW] Episode download failed:', error);
        
        // Notify main thread of failure
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'DOWNLOAD_FAILED',
                    payload: { audioUrl: payload.audioUrl, error: error.message }
                });
            });
        });
    }
}

/**
 * Handle cache clearing request
 */
async function handleClearCache(payload) {
    try {
        const { cacheType } = payload;
        
        if (cacheType === 'audio' || cacheType === 'all') {
            await caches.delete(AUDIO_CACHE);
            console.log('[SW] Audio cache cleared');
        }
        
        if (cacheType === 'rss' || cacheType === 'all') {
            await caches.delete(RSS_CACHE);
            console.log('[SW] RSS cache cleared');
        }
        
        if (cacheType === 'all') {
            await caches.delete(CACHE_NAME);
            console.log('[SW] General cache cleared');
        }
    } catch (error) {
        console.error('[SW] Cache clearing failed:', error);
    }
}

/**
 * Handle cache status request
 */
async function handleGetCacheStatus(event) {
    try {
        const audioCache = await caches.open(AUDIO_CACHE);
        const audioKeys = await audioCache.keys();
        
        const rssCache = await caches.open(RSS_CACHE);
        const rssKeys = await rssCache.keys();
        
        const status = {
            audioFiles: audioKeys.length,
            rssFeeds: rssKeys.length,
            totalSize: await estimateCacheSize()
        };
        
        event.ports[0].postMessage(status);
    } catch (error) {
        console.error('[SW] Cache status failed:', error);
        event.ports[0].postMessage({ error: error.message });
    }
}

/**
 * Estimate total cache size
 */
async function estimateCacheSize() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
    }
    return 0;
}