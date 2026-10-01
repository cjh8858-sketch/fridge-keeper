// Service Worker — 앱 셸(HTML·JS·CSS·아이콘)만 캐시해서 오프라인에서도 앱이 열리게 한다.
// Supabase API(다른 출처)는 절대 캐시하지 않는다: 사용자별 데이터는 IndexedDB(src/data/offline-cache.js)가 담당.
// 문서: docs/references/pwa.md
const CACHE = 'fridge-shell-v1';
const SCOPE = new URL(self.registration.scope);
const INDEX = new URL('index.html', SCOPE).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([SCOPE.href, INDEX]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== SCOPE.origin) return;

  // 페이지 이동: 네트워크 우선(새 배포 반영), 실패하면 캐시된 index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(INDEX, copy));
          return res;
        })
        .catch(() => caches.match(INDEX).then((r) => r ?? Response.error())),
    );
    return;
  }

  // 정적 파일: 캐시 우선 + 백그라운드 갱신 (Vite 빌드 파일은 이름에 해시가 있어 안전)
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached ?? Response.error());
      return cached ?? network;
    }),
  );
});
