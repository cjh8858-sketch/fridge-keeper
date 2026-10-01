# 0001 MVP 핵심 흐름

- 상태: active
- 관련 스펙: [auth](../../product-specs/auth.md), [family-sharing](../../product-specs/family-sharing.md), [items](../../product-specs/items.md), [expiry-rules](../../product-specs/expiry-rules.md)

## 목표

로그인 → 가족 만들기/참여 → 음식 추가 → 휴대폰·PC에서 실시간으로 같은 목록 보기.

## 수용 기준

- [ ] 두 계정(같은 가족)이 서로 다른 기기에서 같은 목록을 실시간으로 본다
- [ ] 다른 가족 계정에는 아무것도 보이지 않는다
- [ ] 모바일(375px)·PC(1280px) 모두 레이아웃 정상
- [ ] `npm run check` + CI(RLS, E2E) 통과

## 마일스톤

- [x] M0 하네스 셋업 — CLAUDE.md, docs, skills, hooks, 린트 불변식, 초기 마이그레이션 (검증: `npm run check`)
- [x] M1 Supabase 연결 — 사용자가 프로젝트 생성·`.env` 입력, `supabase db push` (검증: 앱이 "로그인" 화면 표시) → [supabase-setup](../../references/supabase-setup.md)
- [x] M2 로그인 화면 — 매직링크 전송/안내/로그아웃 (검증: 실제 메일로 로그인)
- [ ] M3 가족 화면 — 만들기, 초대코드 생성·복사, 코드로 참여 (검증: `/verify-sync` 2계정)
- [ ] M4 음식 목록·추가·먹음 처리 + 상태 배지 + 요약 (검증: E2E + 브라우저)
- [ ] M5 실시간 동기화 + 동기화 상태 표시 (검증: `/verify-sync`)
- [x] M6 PWA — Service Worker 셸 캐시, 오프라인 읽기 전용 캐시(IndexedDB) (검증: 오프라인 모드에서 목록 표시)
- [ ] M7 GitHub 배포 — Pages + 마이그레이션 자동 적용 (검증: 휴대폰에서 배포 URL 접속, 홈 화면 추가)

## 결정 기록

- 2026-10-02: 스택 = Vanilla JS + Vite + Supabase. 이유: 빌드·프레임워크 최소화로 에이전트가 다룰 표면적을 줄이고, 가족 공유 권한을 RLS로 DB에서 강제.
- 2026-10-02: 로그인 = 이메일 매직링크. Google 로그인은 외부 설정 부담으로 연기.
- 2026-10-02: 로컬 Docker 없이 클라우드 dev DB 사용, RLS 테스트는 GitHub Actions에서.
- 2026-10-02: 매직링크 flowType = implicit. 이유: 휴대폰에서 요청한 링크를 PC 메일에서 열어도 로그인되게(PKCE는 요청한 브라우저에서만 가능).
- 2026-10-02: 푸시 알림 연기 → [notifications](../../product-specs/notifications.md)

## 진행 로그

- 2026-10-02: M0 완료.
- 2026-10-02: M1 완료. 초기 마이그레이션을 SQL Editor로 수동 적용(GitHub 자동 배포 전환 시 `migration repair --status applied 20261002000000` 필요). REST로 검증: 4개 테이블 존재, anon insert·RPC 거부(42501).
- 2026-10-02: 주의 — 대시보드 자동 번역이 SQL을 번역해 실패한 적 있음. SQL 붙여넣기 전 번역 끄기.
- 2026-10-02: M2 구현 — 로그인 화면(`src/ui/views/login.js`), `services/auth.js`, `domain/validation.js`, 헤더 로그아웃, 인증 변경 시 자동 재렌더. 단위 34개 통과, 브라우저(375px·1280px·다크) 확인. **남은 검증: 사용자가 실제 메일로 로그인** → 확인되면 M2 체크.
- 2026-10-02: M2 완료. 사용자가 실제 메일 매직링크로 로그인 확인 → 헤더 이메일·로그아웃, "가족 만들기" 상태로 전환. 대시보드 Site URL을 localhost:5173으로 수정.
- 2026-10-02: M3 구현 — 가족 만들기/코드 참여 화면(`household-setup.js`), 가족 화면(`family.js`: 구성원·초대코드 복사/공유·나가기/내보내기), `SingleFieldForm` 컴포넌트, `services/household.js`. 구성원 이메일용 RPC `household_member_list` 마이그레이션(20261002010000) + pgTAP. 단위 58개 통과. **남은 것: 사용자가 마이그레이션 SQL 적용 + 2계정 확인.**
- 2026-10-02: M3 화면 확인은 사용자 결정으로 연기(테스트용 가족 미생성). `household_member_list` 마이그레이션은 DB에 아직 없음(REST 404) — 화면 확인 때 재적용. M4 착수.
- 2026-10-02: M4 구현 — `views/home.js`(탭바), `views/fridge.js`(요약·필터·목록·패널), `components/item-card.js`·`item-form.js`·`toast.js`, `services/items.js`, `domain/inventory.js`, `date.nowTimestamp`. 단위 82개 통과. 브라우저(로그아웃 상태 미리보기): 빈 상태, 필드 오류, +3일 빠른 선택, RLS 거부 메시지, 모바일 하단 시트/PC 2열, 샘플 카드 렌더 확인. **남은 검증: 가족을 만든 뒤 실제 추가→목록→먹음/되돌리기.**
- 2026-10-02: M5 구현 — `services/sync.js`(구독·300ms 디바운스·상태), `items-repo.subscribeItems` 상태 콜백 + DELETE 무필터 구독, 냉장고 화면 동기화 표시, 화면 복귀/온라인 복귀 시 재조회, `dispose`로 채널 정리(main.js cleanup). 단위 91개 통과. 브라우저: 연결 중→실시간(약 4초 내)→오프라인 표시, WebSocket phx_join/phx_leave 확인. **남은 검증: 두 계정·두 기기에서 3초 이내 반영.**
- 2026-10-02: M6 완료 — `public/sw.js`(셸 캐시, 다른 출처 무시), `data/offline-cache.js`(IndexedDB 스냅샷·가족 목록, 로그아웃 시 삭제), `loadFridge`/`resolveAppState` 캐시 폴백, 냉장고 화면 읽기 전용 모드, PNG 아이콘(`scripts/generate-icons.mjs`)·매니페스트·iOS 메타. 단위 101개. 브라우저: 배포 빌드에서 SW 등록→서버 종료 후 새로고침해도 앱 열림, 스냅샷 저장, 오프라인→읽기 전용→온라인 복귀. 버그 수정: 온라인 복귀 시 "연결 중" 고착(마지막 채널 상태 복원), 정리 후 늦은 CLOSED 콜백 무시.
- 2026-10-02: 결정 — SW는 Supabase 응답을 캐시하지 않는다(사용자 간 데이터 섞임 방지). 데이터 오프라인은 IndexedDB만.
