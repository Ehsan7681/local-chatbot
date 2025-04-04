const CACHE_NAME = 'chatbot-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/favicon.ico',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700&display=swap'
];

// نصب سرویس ورکر و ذخیره فایل‌ها در کش
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('کش باز شد');
        return cache.addAll(urlsToCache);
      })
  );
});

// فعال‌سازی سرویس ورکر و حذف کش‌های قدیمی
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف کش قدیمی', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// استراتژی کش: ابتدا شبکه، سپس کش
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // کپی پاسخ برای ذخیره در کش
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            // فقط درخواست‌های GET را کش کن
            if (event.request.method === 'GET') {
              cache.put(event.request, responseToCache);
            }
          });
        
        return response;
      })
      .catch(() => {
        // اگر شبکه در دسترس نبود، از کش استفاده کن
        return caches.match(event.request);
      })
  );
}); 