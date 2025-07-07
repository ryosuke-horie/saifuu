/**
 * Saifuu PWA Service Worker
 * 家計管理アプリ用のサービスワーカー
 * 
 * 機能:
 * - 静的リソースのキャッシュ
 * - オフライン対応
 * - セキュアなデータ処理
 * - プッシュ通知サポート
 */

// サービスワーカーのバージョン - 更新時に変更してください
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `saifuu-${CACHE_VERSION}`;

// キャッシュするリソースのパターン
const CACHE_PATTERNS = {
  // 静的リソース（アグレッシブキャッシュ）
  STATIC: [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/favicon.svg',
    '/robots.txt',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/apple-touch-icon.png'
  ],
  
  // Next.js静的ファイル
  NEXTJS_STATIC: /\/_next\/static\/.+/,
  
  // 画像ファイル
  IMAGES: /\.(png|jpg|jpeg|gif|svg|webp|ico)$/,
  
  // フォントファイル
  FONTS: /\.(woff|woff2|eot|ttf|otf)$/,
  
  // APIエンドポイント（慎重にキャッシュ）
  API_SAFE: /\/api\/(categories|ping|health)/,
  
  // 機密データAPI（キャッシュしない）
  API_SENSITIVE: /\/api\/(subscriptions|transactions|auth)/
};

// オフライン時のフォールバックページ
const OFFLINE_FALLBACK = '/offline.html';

// プッシュ通知設定
const PUSH_NOTIFICATION_CONFIG = {
  // 将来的にVAPIDキーを設定
  // vapidKey: 'YOUR_VAPID_KEY_HERE',
  // serverKey: 'YOUR_SERVER_KEY_HERE'
};

/**
 * サービスワーカーインストール時の処理
 * 基本的な静的リソースをプリキャッシュ
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching initial resources');
        return cache.addAll(CACHE_PATTERNS.STATIC);
      })
      .then(() => {
        console.log('[SW] Initial resources cached successfully');
        // 新しいサービスワーカーをすぐにアクティブにする
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache initial resources:', error);
      })
  );
});

/**
 * サービスワーカーアクティベート時の処理
 * 古いキャッシュを削除
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // 現在のキャッシュ名と異なる古いキャッシュを削除
              return cacheName.startsWith('saifuu-') && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated successfully');
        // すべてのタブで新しいサービスワーカーを有効にする
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('[SW] Failed to activate service worker:', error);
      })
  );
});

/**
 * フェッチイベントの処理
 * キャッシュ戦略を適用
 */
self.addEventListener('fetch', (event) => {
  // GET リクエストのみ処理
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  const pathname = url.pathname;

  // 機密データAPIリクエストの場合はキャッシュしない
  if (CACHE_PATTERNS.API_SENSITIVE.test(pathname)) {
    event.respondWith(handleSensitiveAPI(event.request));
    return;
  }

  // 静的リソースの場合はキャッシュファースト戦略
  if (isStaticResource(pathname)) {
    event.respondWith(handleStaticResource(event.request));
    return;
  }

  // 安全なAPIリクエストの場合はネットワークファースト戦略
  if (CACHE_PATTERNS.API_SAFE.test(pathname)) {
    event.respondWith(handleSafeAPI(event.request));
    return;
  }

  // HTMLページの場合はネットワークファースト戦略
  if (pathname.endsWith('/') || pathname.endsWith('.html')) {
    event.respondWith(handleHTMLPage(event.request));
    return;
  }

  // その他のリクエストは通常の処理
  event.respondWith(handleDefault(event.request));
});

/**
 * 静的リソースかどうかを判定
 */
function isStaticResource(pathname) {
  return CACHE_PATTERNS.NEXTJS_STATIC.test(pathname) ||
         CACHE_PATTERNS.IMAGES.test(pathname) ||
         CACHE_PATTERNS.FONTS.test(pathname) ||
         CACHE_PATTERNS.STATIC.includes(pathname);
}

/**
 * 静的リソースの処理（キャッシュファースト戦略）
 */
async function handleStaticResource(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // キャッシュからレスポンスを返す
      return cachedResponse;
    }
    
    // キャッシュにない場合はネットワークから取得してキャッシュに保存
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static resource fetch failed:', error);
    // 基本的な画像のフォールバック
    if (CACHE_PATTERNS.IMAGES.test(request.url)) {
      return new Response('', { status: 404 });
    }
    throw error;
  }
}

/**
 * 機密データAPIの処理（キャッシュしない）
 */
async function handleSensitiveAPI(request) {
  try {
    const response = await fetch(request);
    
    // セキュリティヘッダーを追加
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
  } catch (error) {
    console.error('[SW] Sensitive API fetch failed:', error);
    return new Response(
      JSON.stringify({
        error: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * 安全なAPIの処理（ネットワークファースト戦略）
 */
async function handleSafeAPI(request) {
  try {
    const networkResponse = await fetch(request);
    
    // 成功したレスポンスのみキャッシュ
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Safe API fetch failed:', error);
    
    // キャッシュからフォールバック
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // オフライン用のフォールバック
    return new Response(
      JSON.stringify({
        error: 'オフライン状態です。一部の機能が利用できません。',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * HTMLページの処理（ネットワークファースト戦略）
 */
async function handleHTMLPage(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] HTML page fetch failed:', error);
    
    // キャッシュからフォールバック
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // オフライン用フォールバックページ
    return createOfflineFallback();
  }
}

/**
 * デフォルトの処理
 */
async function handleDefault(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('[SW] Default fetch failed:', error);
    
    // キャッシュからフォールバック
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * オフライン用フォールバックページを作成
 */
function createOfflineFallback() {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Saifuu - オフライン</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 2rem;
          background-color: #f9fafb;
          color: #374151;
          text-align: center;
        }
        .container {
          max-width: 32rem;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #1f2937;
          margin-bottom: 1rem;
        }
        .icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .retry-button {
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 1rem;
          margin-top: 1rem;
        }
        .retry-button:hover {
          background-color: #1d4ed8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>Saifuu</h1>
        <p>現在オフライン状態です。</p>
        <p>インターネット接続を確認してから、もう一度お試しください。</p>
        <button class="retry-button" onclick="window.location.reload()">
          再読み込み
        </button>
        <p style="margin-top: 2rem; font-size: 0.875rem; color: #6b7280;">
          キャッシュされたデータは引き続き利用可能です。
        </p>
      </div>
    </body>
    </html>
  `;
  
  return new Response(htmlContent, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * プッシュ通知イベントの処理
 * 将来的な機能拡張のための基盤
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  if (!event.data) {
    console.warn('[SW] Push notification without data');
    return;
  }
  
  try {
    const payload = event.data.json();
    const options = {
      body: payload.body || 'Saifuuからの通知です',
      icon: '/icon-192x192.png',
      badge: '/icon-maskable-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: payload.url || '/',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'open',
          title: '開く',
          icon: '/icon-192x192.png'
        },
        {
          action: 'close',
          title: '閉じる'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(
        payload.title || 'Saifuu',
        options
      )
    );
  } catch (error) {
    console.error('[SW] Push notification error:', error);
  }
});

/**
 * プッシュ通知クリック時の処理
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 既存のタブがあれば、そのタブをアクティブにする
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // 新しいタブを開く
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
      .catch((error) => {
        console.error('[SW] Notification click handling error:', error);
      })
  );
});

/**
 * バックグラウンド同期イベントの処理
 * 将来的な機能拡張のための基盤
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

/**
 * 取引データの同期（将来的な実装）
 */
async function syncTransactions() {
  try {
    console.log('[SW] Syncing transactions...');
    
    // 将来的にオフライン時に蓄積されたデータを同期する処理を実装
    // 例：
    // - IndexedDBからオフライン時のデータを取得
    // - APIに送信
    // - 成功時にローカルデータを削除
    
    console.log('[SW] Transactions sync completed');
  } catch (error) {
    console.error('[SW] Transactions sync failed:', error);
    throw error;
  }
}

/**
 * メッセージイベントの処理
 * アプリケーションからのメッセージを処理
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  
  if (event.data.type === 'CACHE_CLEAR') {
    event.waitUntil(clearCache());
    return;
  }
  
  if (event.data.type === 'CACHE_STATUS') {
    event.waitUntil(getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    }));
    return;
  }
});

/**
 * キャッシュをクリア
 */
async function clearCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(cacheName => cacheName.startsWith('saifuu-'))
        .map(cacheName => caches.delete(cacheName))
    );
    console.log('[SW] Cache cleared successfully');
  } catch (error) {
    console.error('[SW] Cache clear failed:', error);
  }
}

/**
 * キャッシュステータスを取得
 */
async function getCacheStatus() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    return {
      version: CACHE_VERSION,
      cacheSize: keys.length,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[SW] Cache status check failed:', error);
    return {
      version: CACHE_VERSION,
      cacheSize: 0,
      timestamp: Date.now(),
      error: error.message
    };
  }
}

console.log('[SW] Saifuu Service Worker loaded successfully');