// Service Worker 등록 — 배포 빌드에서만 (개발 중 캐시가 HMR을 방해하지 않도록). 문서: docs/references/pwa.md

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // 등록 실패해도 앱은 온라인으로 정상 동작한다
    });
  });
}
