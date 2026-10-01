# PWA · 오프라인

두 층으로 나뉜다. **섞지 않는 것**이 핵심 규칙이다.

| 층     | 무엇을             | 어디서                                                                   | 왜                                |
| ------ | ------------------ | ------------------------------------------------------------------------ | --------------------------------- |
| 앱 셸  | HTML·JS·CSS·아이콘 | Service Worker [`public/sw.js`](../../public/sw.js)                      | 오프라인에서도 앱이 열리도록      |
| 데이터 | 마지막 음식 목록   | IndexedDB [`src/data/offline-cache.js`](../../src/data/offline-cache.js) | 사용자별로 분리, 로그아웃 시 삭제 |

- **Service Worker는 Supabase(다른 출처) 요청을 절대 캐시하지 않는다.** API 응답을 SW에 캐시하면 사용자 구분 없이 남아 다른 계정에 보일 수 있다.
- 오프라인 데이터는 **읽기 전용**. 편집은 비활성화(TD-1: 오프라인 편집).

## Service Worker 전략

| 요청                   | 전략                                                         |
| ---------------------- | ------------------------------------------------------------ |
| 페이지 이동            | 네트워크 우선 → 실패 시 캐시된 `index.html`                  |
| 같은 출처 정적 파일    | 캐시 우선 + 백그라운드 갱신 (Vite 파일명에 해시가 있어 안전) |
| 다른 출처(Supabase 등) | 관여하지 않음                                                |

- 등록은 **배포 빌드에서만** (`src/ui/pwa.js`, `import.meta.env.PROD`). 개발 서버에서는 HMR과 충돌하므로 등록하지 않는다.
- 캐시 이름 `fridge-shell-v1`: SW 로직을 바꾸면 버전을 올린다(activate에서 옛 캐시 삭제).
- 로컬 확인: `.claude/launch.json`의 `preview`(npm run build 후 `vite preview`, 4173 포트) → 서버를 끄고 새로고침해도 앱이 열리는지.

## 오프라인 데이터 흐름

1. `services/session.resolveAppState` — 세션은 기기에 저장돼 있어 오프라인에서도 바로 결정된다
2. `services/items.loadFridge(userId)` — 음식 목록: 성공 시 `saveSnapshot`, 실패 시 `readSnapshot` → `{ offline: true, cachedAt }`
3. `ui/views/fridge.js` — `navigator.onLine === false` 또는 `offline` 이면 읽기 전용:
   - 상태 표시 `오프라인 — 읽기 전용 (10월 2일 14:05 기준)`, 추가/수정 패널 대신 안내, 카드의 먹음·수정 버튼 비활성
   - `online` 이벤트 → 다시 불러오기 → 편집 가능 복귀
4. `services/auth.logout` → `clearOfflineCache()` (공용 기기 대비)

## 설치 (홈 화면 추가)

- 매니페스트 [`public/manifest.webmanifest`](../../public/manifest.webmanifest): 192/512 PNG + maskable 512 + SVG
- iOS: `apple-touch-icon.png`(180) + `apple-mobile-web-app-*` 메타 (`index.html`)
- 아이콘 다시 만들기: `node scripts/generate-icons.mjs` (도형은 `public/icon.svg`와 동일하게 유지)
