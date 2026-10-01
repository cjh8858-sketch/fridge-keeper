# Architecture

## 한눈에 보기

```
 휴대폰 PWA ─┐                         ┌─ Postgres (+RLS)
             ├─ 같은 웹앱 (GitHub Pages) ─┤─ Auth (이메일 매직링크)
 PC 브라우저 ─┘        supabase-js        └─ Realtime (items 변경 브로드캐스트)
```

- 프론트엔드: Vanilla JS(ES Modules) + JSDoc 타입(`tsc --checkJs`) + Vite. 프레임워크 없음.
- 백엔드: Supabase. 서버 코드 없음 — 권한은 **RLS**, 특권 동작은 **DB 함수(RPC)**.
- 동기화: 모든 기기는 같은 DB를 보고, `items` 변경은 Realtime으로 즉시 반영.
- 가족 공유: `household` 단위로 데이터가 묶이고 RLS가 구성원만 접근하게 한다. → [data-model](data-model.md)

## 계층

`src/` 아래 5개 계층. **오른쪽은 왼쪽만 import 가능** (I1, dependency-cruiser가 강제).

```
types  →  domain  →  data  →  services  →  ui
```

| 계층        | 책임                                               | 금지                       |
| ----------- | -------------------------------------------------- | -------------------------- |
| `types/`    | JSDoc typedef                                      | 런타임 코드                |
| `domain/`   | 순수 함수: 날짜, 유통기한 상태, 정렬               | 네트워크, DOM, 외부 패키지 |
| `data/`     | Supabase 호출(repo), Realtime 구독, 로컬 캐시      | UI·서비스 참조             |
| `services/` | 유스케이스 조합: 세션 상태, 가족 참여, 동기화 상태 | DOM                        |
| `ui/`       | 화면·컴포넌트, `h()`로 DOM 생성                    | Supabase 직접 호출 (I2)    |

스타일은 `src/styles/` (tokens → base → components). → [design-system](design-system/README.md)

## 데이터 흐름 (음식 추가)

1. `ui` 폼 제출 → `services`(검증·기본값) → `data/items-repo.addItem()`
2. Supabase가 RLS로 권한 확인 후 insert
3. Realtime이 같은 household 구독자에게 변경 알림 → 각 기기에서 `listActiveItems()` 재조회 → 다시 렌더
4. 화면의 상태 배지는 `domain/expiry.getExpiryStatus(expiry_date, today(household.timezone))`

## 오프라인

MVP: 온라인 편집 + 오프라인 읽기 전용 캐시(IndexedDB) + Service Worker 셸 캐시. 오프라인 편집은 기술부채. → [pwa](references/pwa.md), [tech-debt-tracker](exec-plans/tech-debt-tracker.md)

## 환경

| 환경 | 프론트                         | DB                                                   |
| ---- | ------------------------------ | ---------------------------------------------------- |
| 로컬 | `npm run dev` (localhost:5173) | Supabase 클라우드 dev 프로젝트                       |
| CI   | GitHub Actions                 | 컨테이너 Supabase(일회용) — RLS 테스트               |
| 운영 | GitHub Pages                   | Supabase 클라우드 (마이그레이션은 main 머지 시 자동) |

→ [github-deploy](references/github-deploy.md), [supabase-setup](references/supabase-setup.md)
