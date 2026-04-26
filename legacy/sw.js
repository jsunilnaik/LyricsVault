// ============================================
// SERVICE WORKER - LyricVault
// Complete PWA implementation with offline support
// Version: 1.0.0
// ============================================

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `lyricvault-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `lyricvault-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `lyricvault-images-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json'
];

// Cache size limits
const CACHE_LIMITS = {
    dynamic: 50,
    images: 30
};

// ============================================
// INSTALL EVENT
// ============================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker version:', CACHE_VERSION);
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache static assets:', error);
            })
    );
});

// ============================================
// ACTIVATE EVENT
// ============================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            // Delete old caches that don't match current version
                            return name.startsWith('lyricvault-') && 
                                   name !== STATIC_CACHE && 
                                   name !== DYNAMIC_CACHE &&
                                   name !== IMAGE_CACHE;
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// ============================================
// FETCH EVENT
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip requests to different origins that might cause issues
    if (url.origin !== location.origin && !isCDNRequest(url)) {
        return;
    }

    // Handle different types of requests with appropriate strategies
    if (isNavigationRequest(request)) {
        // Navigation requests - Network first, fall back to cache
        event.respondWith(handleNavigationRequest(request));
    } else if (isStaticAsset(url)) {
        // Static assets - Cache first
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (isImageRequest(request, url)) {
        // Images - Cache first with image cache
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
    } else if (isCDNRequest(url)) {
        // CDN requests - Stale while revalidate
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    } else {
        // Other requests - Stale while revalidate
        event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    }
});

// ============================================
// CACHING STRATEGIES
// ============================================

/**
 * Handle navigation requests (HTML pages)
 * Network first with offline fallback
 */
async function handleNavigationRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache the successful response
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        // If network response is not ok, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return network response even if not ok
        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Try to return cached index.html for SPA
        const indexResponse = await caches.match('./index.html');
        if (indexResponse) {
            return indexResponse;
        }
        
        // All else fails, return offline page
        return createOfflineResponse();
    }
}

/**
 * Cache First Strategy
 * Best for static assets that don't change often
 */
async function cacheFirst(request, cacheName) {
    try {
        // Check cache first
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }

        // Not in cache, fetch from network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
            
            // Trim cache if needed
            if (cacheName === IMAGE_CACHE) {
                trimCache(cacheName, CACHE_LIMITS.images);
            }
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache first failed:', error);
        
        // For images, return a placeholder or empty response
        if (cacheName === IMAGE_CACHE) {
            return new Response('', { status: 404, statusText: 'Not Found' });
        }
        
        return createOfflineResponse();
    }
}

/**
 * Network First Strategy
 * Best for API requests and dynamic content
 */
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
            trimCache(cacheName, CACHE_LIMITS.dynamic);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network first falling back to cache');
        
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return createOfflineResponse();
    }
}

/**
 * Stale While Revalidate Strategy
 * Best for assets that can be slightly stale
 */
async function staleWhileRevalidate(request, cacheName) {
    const cachedResponse = await caches.match(request);
    
    // Start fetch in background
    const fetchPromise = fetch(request)
        .then(async (networkResponse) => {
            if (networkResponse.ok) {
                const cache = await caches.open(cacheName);
                cache.put(request, networkResponse.clone());
                trimCache(cacheName, CACHE_LIMITS.dynamic);
            }
            return networkResponse;
        })
        .catch((error) => {
            console.log('[SW] Background fetch failed:', error);
            return null;
        });

    // Return cached response immediately, or wait for network
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // No cache, wait for network
    const networkResponse = await fetchPromise;
    if (networkResponse) {
        return networkResponse;
    }
    
    return createOfflineResponse();
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if request is a navigation request
 */
function isNavigationRequest(request) {
    return request.mode === 'navigate' ||
           (request.method === 'GET' && 
            request.headers.get('accept')?.includes('text/html'));
}

/**
 * Check if request is for static asset
 */
function isStaticAsset(url) {
    const staticExtensions = [
        '.html', '.css', '.js', '.json', 
        '.woff', '.woff2', '.ttf', '.eot'
    ];
    
    return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
           url.pathname === '/' ||
           url.pathname === '/index.html';
}

/**
 * Check if request is for image
 */
function isImageRequest(request, url) {
    const acceptHeader = request.headers.get('Accept') || '';
    const imageExtensions = /\.(png|jpg|jpeg|gif|svg|webp|ico|bmp)$/i;
    
    return acceptHeader.includes('image') || imageExtensions.test(url.pathname);
}

/**
 * Check if request is to CDN
 */
function isCDNRequest(url) {
    const cdnHosts = [
        'cdn.tailwindcss.com',
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'cdnjs.cloudflare.com',
        'unpkg.com',
        'cdn.jsdelivr.net'
    ];
    
    return cdnHosts.some(host => url.hostname === host || url.hostname.endsWith('.' + host));
}

/**
 * Trim cache to specified limit (FIFO)
 */
async function trimCache(cacheName, maxItems) {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        if (keys.length > maxItems) {
            const keysToDelete = keys.slice(0, keys.length - maxItems);
            await Promise.all(
                keysToDelete.map(key => cache.delete(key))
            );
            console.log(`[SW] Trimmed ${keysToDelete.length} items from ${cacheName}`);
        }
    } catch (error) {
        console.error('[SW] Error trimming cache:', error);
    }
}

/**
 * Create offline fallback response
 */
function createOfflineResponse() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - LyricVault</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            padding: 20px;
        }
        .container {
            text-align: center;
            max-width: 400px;
        }
        .icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            background: linear-gradient(135deg, #6366F1 0%, #EC4899 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 40px rgba(99, 102, 241, 0.3);
        }
        .icon svg {
            width: 40px;
            height: 40px;
        }
        h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 12px;
        }
        p {
            color: #9CA3AF;
            margin-bottom: 24px;
            line-height: 1.6;
            font-size: 16px;
        }
        .buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }
        button {
            background: #6366F1;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        button:hover {
            background: #4F46E5;
            transform: translateY(-1px);
        }
        button:active {
            transform: translateY(0);
        }
        button.secondary {
            background: rgba(255, 255, 255, 0.1);
        }
        button.secondary:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        button svg {
            width: 20px;
            height: 20px;
        }
        .status {
            margin-top: 32px;
            padding: 16px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            font-size: 14px;
            color: #6B7280;
        }
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #EF4444;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"/>
            </svg>
        </div>
        <h1>You're Offline</h1>
        <p>It looks like you've lost your internet connection. Your lyrics are saved locally and will sync when you reconnect.</p>
        <div class="buttons">
            <button onclick="window.location.reload()">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Try Again
            </button>
            <button class="secondary" onclick="history.back()">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Go Back
            </button>
        </div>
        <div class="status">
            <span class="status-indicator"></span>
            Waiting for connection...
        </div>
    </div>
    <script>
        // Auto-reload when back online
        window.addEventListener('online', () => {
            window.location.reload();
        });
        
        // Check connection status periodically
        setInterval(() => {
            if (navigator.onLine) {
                window.location.reload();
            }
        }, 5000);
    </script>
</body>
</html>
    `.trim();

    return new Response(html, {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}

// ============================================
// BACKGROUND SYNC
// ============================================
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync event:', event.tag);
    
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
    
    if (event.tag === 'sync-backup') {
        event.waitUntil(syncBackup());
    }
});

/**
 * Sync data when back online
 */
async function syncData() {
    console.log('[SW] Syncing data...');
    // Future: Implement cloud sync when backend is available
    // For now, just notify clients that we're back online
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'SYNC_COMPLETE',
            timestamp: Date.now()
        });
    });
}

/**
 * Sync backup when back online
 */
async function syncBackup() {
    console.log('[SW] Syncing backup...');
    // Future: Upload pending backups to cloud
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');
    
    if (!event.data) {
        console.log('[SW] Push event has no data');
        return;
    }

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'LyricVault',
            body: event.data.text()
        };
    }
    
    const options = {
        body: data.body || 'New update from LyricVault',
        icon: './assets/icons/icon-192.png',
        badge: './assets/icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || './',
            timestamp: Date.now()
        },
        actions: [
            { 
                action: 'open', 
                title: 'Open',
                icon: './assets/icons/action-open.png'
            },
            { 
                action: 'dismiss', 
                title: 'Dismiss',
                icon: './assets/icons/action-dismiss.png'
            }
        ],
        tag: data.tag || 'lyricvault-notification',
        renotify: data.renotify || false,
        requireInteraction: data.requireInteraction || false
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'LyricVault', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);
    
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const urlToOpen = event.notification.data?.url || './';

    event.waitUntil(
        self.clients.matchAll({ 
            type: 'window', 
            includeUncontrolled: true 
        })
        .then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // No window open, open a new one
            return self.clients.openWindow(urlToOpen);
        })
    );
});

self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed');
    // Track notification dismissal if needed
});

// ============================================
// MESSAGE HANDLING
// ============================================
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data?.type);
    
    const { type, payload } = event.data || {};

    switch (type) {
        case 'SKIP_WAITING':
            console.log('[SW] Skip waiting requested');
            self.skipWaiting();
            break;
            
        case 'CLEAR_CACHE':
            console.log('[SW] Clear cache requested');
            event.waitUntil(
                caches.keys()
                    .then((names) => {
                        return Promise.all(
                            names.map(name => {
                                console.log('[SW] Deleting cache:', name);
                                return caches.delete(name);
                            })
                        );
                    })
                    .then(() => {
                        if (event.ports && event.ports[0]) {
                            event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
                        }
                    })
            );
            break;
            
        case 'GET_CACHE_SIZE':
            event.waitUntil(
                getCacheSize().then((size) => {
                    if (event.ports && event.ports[0]) {
                        event.ports[0].postMessage({ 
                            type: 'CACHE_SIZE', 
                            size: size 
                        });
                    }
                })
            );
            break;
            
        case 'CACHE_URLS':
            if (payload && Array.isArray(payload.urls)) {
                event.waitUntil(
                    caches.open(STATIC_CACHE)
                        .then(cache => cache.addAll(payload.urls))
                        .then(() => {
                            if (event.ports && event.ports[0]) {
                                event.ports[0].postMessage({ type: 'URLS_CACHED' });
                            }
                        })
                );
            }
            break;
            
        case 'GET_VERSION':
            if (event.ports && event.ports[0]) {
                event.ports[0].postMessage({ 
                    type: 'VERSION', 
                    version: CACHE_VERSION 
                });
            }
            break;
            
        default:
            console.log('[SW] Unknown message type:', type);
    }
});

/**
 * Calculate total cache size
 */
async function getCacheSize() {
    try {
        const cacheNames = await caches.keys();
        let totalSize = 0;

        for (const name of cacheNames) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            
            for (const request of keys) {
                try {
                    const response = await cache.match(request);
                    if (response) {
                        const blob = await response.clone().blob();
                        totalSize += blob.size;
                    }
                } catch (e) {
                    // Skip items that can't be measured
                }
            }
        }

        return totalSize;
    } catch (error) {
        console.error('[SW] Error calculating cache size:', error);
        return 0;
    }
}

// ============================================
// ERROR HANDLING
// ============================================
self.addEventListener('error', (event) => {
    console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Unhandled rejection:', event.reason);
});

// ============================================
// INITIALIZATION LOG
// ============================================
console.log('[SW] Service Worker loaded - Version:', CACHE_VERSION);
console.log('[SW] Caches:', { STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE });