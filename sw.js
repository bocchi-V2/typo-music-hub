const CACHE_NAME = 'haimiya-typo-v12';

// ไฟล์ที่ต้องแคชเพื่อให้แอพทำงานแบบ offline ได้ 100%
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './data.js',
  './manifest.json',
  './favicon-logo.jpg',
  './app-icon.jpg',
  './splash-cover.jpg',
  './bg-hero.jpg',
  './loading-chibi.jpg',
  './haimiya_yaho.mp3',
  './dice-roll.mp3',
  './blue_relax.m4a'
];

// ติดตั้ง SW: แคชไฟล์ทั้งหมดทันที
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] กำลังแคชไฟล์ทั้งหมดสำหรับ Offline...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate: ลบแคชเก่าทิ้ง
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: ใช้ Cache-First + Stale-While-Revalidate
// 1. เช็คแคชก่อนเสมอ (ทำงาน offline ได้เลย)
// 2. ถ้ามีเน็ต จะอัปเดตแคชในเบื้องหลังเพื่อให้ได้ข้อมูลใหม่ครั้งถัดไป
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ข้าม request ที่ไม่ใช่ GET หรือ request ไปยัง external API
  if (event.request.method !== 'GET') return;
  if (!url.origin.includes(self.location.origin) && !url.href.includes('itunes.apple.com')) {
    // สำหรับ external URL (เช่น ปกเพลง, preview) ใช้ network-first + cache fallback
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // สำหรับไฟล์ภายในแอพ: Cache-First + Background Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // อัปเดตแคชในเบื้องหลัง (ถ้ามีเน็ต)
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return networkResponse;
      }).catch(() => null);

      // ส่ง cache กลับทันที ไม่ต้องรอเน็ต!
      return cached || fetchPromise;
    })
  );
});
