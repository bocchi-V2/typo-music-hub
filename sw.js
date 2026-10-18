const CACHE_NAME = 'haimiya-typo-v37';
const AUDIO_CACHE_NAME = 'haimiya-audio-vault';

// ไฟล์ที่ต้องแคชเพื่อให้แอพทำงานแบบ offline ได้ 100%
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './data.js',
  './version.json',
  './manifest.json',
  './haimiya-typo.mobileconfig',
  './favicon-logo.jpg',
  './app-icon.jpg',
  './splash-cover.jpg',
  './notification-mascot.jpg',
  './bg-hero.jpg',
  './loading-chibi.jpg',
  './haimiya_yaho.wav',
  './haimiya_yaho.mp3',
  './dice-roll.mp3',
  './blue_relax.m4a',
  './update_voice.wav',
  './update_voice.m4a',
  './update_voice.mp4',
  './update_voice.mp3'
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

// Activate: ลบแคชเก่าทิ้ง (เก็บ AUDIO_CACHE_NAME ไว้ไม่ให้เพลงที่โหลดไว้หาย)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== AUDIO_CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ฟังก์ชันรองรับ Range Request สำหรับไฟล์เสียง (206 Partial Content) เมื่อเล่นแบบ Offline บน Chrome / Android
async function handleAudioRangeRequest(request) {
  let response = await caches.match(request.url, { ignoreSearch: true });
  if (!response) {
    try {
      const audioCache = await caches.open(AUDIO_CACHE_NAME);
      response = await audioCache.match(request.url, { ignoreSearch: true });
    } catch (e) {}
  }

  // ถ้าไม่มีในแคชและมีเน็ต ให้ดึงจากเน็ตและเก็บลง Audio Vault
  if (!response) {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 206)) {
        // บันทึกลง cache ในเบื้องหลัง
        fetch(request.url).then(fullRes => {
          if (fullRes && fullRes.status === 200) {
            caches.open(AUDIO_CACHE_NAME).then(c => c.put(request.url, fullRes));
          }
        }).catch(() => {});
      }
      return networkResponse;
    } catch (err) {
      // เมื่อออฟไลน์ และไม่มีแคชเพลงนี้ ให้ตอบกลับด้วย blue_relax.m4a แทนที่จะเกิด Error
      const fallbackAudio = await caches.match('./blue_relax.m4a');
      if (fallbackAudio) return fallbackAudio;
      return new Response('Offline audio not cached', { status: 503, statusText: 'Offline' });
    }
  }

  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) {
    return response;
  }

  try {
    const arrayBuffer = await response.arrayBuffer();
    const totalLength = arrayBuffer.byteLength;
    const match = /^bytes=(\d+)-(\d+)?$/.exec(rangeHeader);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : totalLength - 1;
      const chunk = arrayBuffer.slice(start, end + 1);

      const contentType = response.headers.get('content-type') || 
        (request.url.includes('.m4a') ? 'audio/mp4' : 
         request.url.includes('.wav') ? 'audio/wav' :
         request.url.includes('.mp3') ? 'audio/mpeg' : 'audio/mp4');

      return new Response(chunk, {
        status: 206,
        statusText: 'Partial Content',
        headers: [
          ['Content-Range', `bytes ${start}-${end}/${totalLength}`],
          ['Content-Length', `${chunk.byteLength}`],
          ['Content-Type', contentType],
          ['Accept-Ranges', 'bytes']
        ]
      });
    }
  } catch (e) {}

  return response;
}

// Fetch: ใช้ Cache-First + Stale-While-Revalidate + Audio Range Support
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // 1. ตรวจสอบไฟล์เสียงที่มี Range Header หรือไฟล์เพลง .m4a / .wav / .mp3 / itunes audio preview
  const isAudioFile = url.pathname.endsWith('.m4a') || 
                      url.pathname.endsWith('.wav') || 
                      url.pathname.endsWith('.mp3') || 
                      url.hostname.includes('apple.com') ||
                      event.request.headers.get('range');

  if (isAudioFile) {
    event.respondWith(handleAudioRangeRequest(event.request));
    return;
  }

  // 2. สำหรับ version.json, data.js, app.js หรือ request ที่มี _t/v ให้ดึงสดจากเน็ตก่อนเสมอ (Network-First)
  if (url.pathname.endsWith('version.json') || url.pathname.endsWith('data.js') || url.pathname.endsWith('app.js') || url.searchParams.has('_t') || url.searchParams.has('v')) {
    event.respondWith(
      fetch(event.request).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkRes;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. สำหรับรูปภาพหรือข้อมูลภายนอก (CDN / Covers / Posters / Apple / Deezer / Kitsu)
  if (!url.origin.includes(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        }).catch(() => {
          // หากออฟไลน์และเป็นรูปภาพ ให้ตอบกลับด้วยรูป splash-cover.jpg ในเครื่อง
          const isImg = event.request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|webp|gif)/i);
          if (isImg) {
            return caches.match('./splash-cover.jpg');
          }
          return null;
        });
      })
    );
    return;
  }

  // 3. สำหรับไฟล์ภายในแอพ (HTML, CSS, JS, Images): Cache-First + Background Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return networkResponse;
      }).catch(() => null);

      return cached || fetchPromise;
    })
  );
});

// ============================================
//  REAL SYSTEM PUSH NOTIFICATIONS & CLICKS
//  รองรับการแจ้งเตือนบนแถบแจ้งเตือนจริงของโทรศัพท์ (Lock Screen / Notification Bar)
// ============================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './index.html';

  if (event.action === 'download' && event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});

// ตรวจสอบอัปเดตอัตโนมัติในเบื้องหลังผ่าน Background Periodic Sync แม้ผู้ใช้ไม่ได้เปิดแอป
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'haimiya-update-check') {
    event.waitUntil(
      fetch('version.json?_t=' + Date.now())
        .then((res) => res.json())
        .then((data) => {
          if (data && data.version) {
            self.registration.showNotification('🚀 Haimiya Typo – มีอัปเดตใหม่!', {
              body: `✨ อัปเดต ${data.version} พร้อมแล้ว! มีเพลงใหม่เพิ่มเข้ามา แตะเพื่ออัปเดตทันที`,
              icon: 'app-icon.jpg',
              badge: 'favicon-logo.jpg',
              image: 'notification-mascot.jpg',
              requireInteraction: true,
              tag: 'haimiya-update-' + data.version,
              data: { url: data.releaseUrl || './index.html' }
            });
          }
        })
        .catch(() => {})
    );
  }
});
