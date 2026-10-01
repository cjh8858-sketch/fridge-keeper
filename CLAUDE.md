# 냉장고 지킴이 — CLAUDE.md (지도)

나 혼자 쓰는 **냉장고 유통기한 알림 웹앱**. 같은 계정으로 휴대폰·PC에서 같은 목록을 실시간으로 본다.
이 파일은 **목차**다. 상세는 링크된 문서를 필요할 때 읽는다. (≤200줄 유지 — I10)

## 작업 시작 전에

1. 진행 중인 계획 확인: [docs/exec-plans/active/](docs/exec-plans/active/) — 세션 시작 hook이 다음 마일스톤을 알려준다.
2. 새 기능·여러 단계 작업 → **`/plan-feature`** 로 계획부터.
3. 끝내기 전 → `npm run check` 통과 (Stop hook이 강제).

## 스택

| 영역    | 선택                                                                                        |
| ------- | ------------------------------------------------------------------------------------------- |
| 프론트  | Vanilla JS (ES Modules) + JSDoc 타입(`tsc --checkJs`) + Vite, 프레임워크 없음               |
| 백엔드  | Supabase — Postgres + RLS, Auth(이메일 매직링크), Realtime                                  |
| 테스트  | Vitest(단위, `tests/unit/`) · Playwright(E2E, `tests/e2e/`) · pgTAP(RLS, `supabase/tests/`) |
| CI/배포 | GitHub Actions → GitHub Pages, main 머지 시 마이그레이션 자동 적용                          |
| 로컬    | Node만 필요. Docker 없음 → DB 테스트는 CI/Codespaces                                        |

## 명령어

```bash
npm run dev        # 개발 서버 (localhost:5173)
npm run check      # lint + typecheck + deps + invariants + unit  ← 완료 기준
npm run test:e2e   # Playwright (브라우저 설치 필요: npx playwright install chromium)
npm run db:new <name>   # 새 마이그레이션 파일
npm run db:test    # RLS pgTAP (Docker 필요 — CI에서 실행)
```

## 지도 (docs/)

| 알고 싶은 것                          | 문서                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 원칙·**불변식 전체 목록**·고치는 법   | [docs/core-beliefs.md](docs/core-beliefs.md)                                                            |
| 계층 구조·데이터 흐름·환경            | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                                                            |
| 테이블·RLS 권한·RPC                   | [docs/data-model.md](docs/data-model.md)                                                                |
| 제품 스펙 (로그인·음식·유통기한·알림) | [docs/product-specs/](docs/product-specs/README.md)                                                     |
| 디자인 시스템 (토큰·컴포넌트·접근성)  | [docs/design-system/](docs/design-system/README.md)                                                     |
| 실행 계획·기술부채                    | [docs/exec-plans/](docs/exec-plans/README.md)                                                           |
| 품질 등급 (다음 작업 후보)            | [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md)                                                          |
| 키 관리·권한·XSS                      | [docs/SECURITY.md](docs/SECURITY.md)                                                                    |
| Supabase/GitHub 설정 (사람이 하는 일) | [supabase-setup](docs/references/supabase-setup.md) · [github-deploy](docs/references/github-deploy.md) |
| RLS 작성 패턴                         | [docs/references/supabase-rls.md](docs/references/supabase-rls.md)                                      |
| PWA·오프라인(SW·IndexedDB)            | [docs/references/pwa.md](docs/references/pwa.md)                                                        |

## 코드 지도 (src/)

```
types → domain → data → services → ui      (오른쪽은 왼쪽만 import — I1)
```

| 경로                           | 내용                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `src/types/`                   | JSDoc typedef (Item, ExpiryStatus)                                                        |
| `src/domain/`                  | 순수 함수 — `date.js`(날짜 유일 창구), `expiry.js`(상태 판정·정렬)                        |
| `src/data/`                    | Supabase repo — `supabase-client`, `auth-repo`, `items-repo`, `offline-cache`             |
| `src/services/`                | 유스케이스 — `session`(앱 상태), `auth`, `items`(목록·저장·오프라인 폴백), `sync`(실시간) |
| `src/ui/`                      | 화면 — `main.js`(진입점), `dom.js`(`h()` 안전 DOM 생성)                                   |
| `src/styles/`                  | `tokens.css`(값의 유일한 원본) → `base.css` → `components.css`                            |
| `supabase/migrations/`         | 스키마 원본 (커밋 후 수정 금지)                                                           |
| `scripts/check-invariants.mjs` | 린터로 못 잡는 불변식 검사                                                                |

## 불변식 (기계가 강제 — 위반 시 메시지의 → 지시를 따른다)

- **I1** 계층 방향 준수, 순환 금지 — dependency-cruiser
- **I2** `@supabase/supabase-js`는 `src/data/`에서만 — ESLint
- **I3** 모든 테이블 RLS + 정책 — invariants 스크립트 + pgTAP
- **I4** 커밋된 마이그레이션 수정 금지, 새 파일로 — hook + 스크립트
- **I5** 클라이언트에 service_role/secret 키 금지 — hook + 스크립트
- **I6** `Date`는 `src/domain/date.js`에서만, 날짜는 `YYYY-MM-DD` — ESLint
- **I7** `innerHTML` 등 HTML 문자열 삽입 금지, `h()` 사용 — ESLint
- **I8** 색·간격은 토큰만, 상태는 색+텍스트 — Stylelint
- **I9** 문서 링크 유효 · **I10** CLAUDE.md ≤200줄, 소스 ≤300줄 · **I11** domain 커버리지
- 강제 장치를 끄거나 우회하지 않는다(`eslint-disable`, 규칙 삭제, hook 수정 금지). 바꿔야 하면 사용자에게 제안.

**그 외 구현 방식은 자유.** 위 규칙만 지키면 구조·이름·분리 방식은 판단에 맡긴다.

## Skills

| 스킬             | 언제                                          |
| ---------------- | --------------------------------------------- |
| `/plan-feature`  | 새 기능·다단계 작업 시작 시 계획 작성         |
| `/db-migration`  | 테이블·정책·RPC 변경 (RLS·테스트·문서까지)    |
| `/build-ui`      | 화면·컴포넌트 구현 (디자인 시스템 체크리스트) |
| `/verify-sync`   | 브라우저로 실제 동작·기기 간 동기화 확인      |
| `/doc-gardening` | 문서·코드 불일치, 기술부채, 품질 점수 정리    |
| `/add-invariant` | 반복되는 지적을 린트/검사/hook으로 승격       |

## Hooks (`.claude/settings.json`)

| hook                             | 동작                                                         |
| -------------------------------- | ------------------------------------------------------------ |
| `guard-protected` (PreToolUse)   | `.env`, lockfile, 하네스 파일, 커밋된 마이그레이션 수정 차단 |
| `secret-scan` (PreToolUse)       | 비밀키·토큰 패턴 쓰기 차단                                   |
| `post-edit-check` (PostToolUse)  | 바꾼 파일 Prettier + ESLint/Stylelint, 위반 시 피드백        |
| `stop-gate` (Stop)               | 수정이 있었으면 `npm run check` 통과해야 종료                |
| `session-context` (SessionStart) | 진행 중 계획·다음 마일스톤 주입                              |

## 사람만 하는 일

계정 생성(Supabase, GitHub), `.env` 값 입력, GitHub Secrets/Variables 설정, 매직링크 메일 로그인.
에이전트는 체크리스트로 안내만 한다 → [supabase-setup](docs/references/supabase-setup.md)

## 작업 규칙 요약

- 커밋은 사용자가 요청할 때만. 메시지는 한국어 OK, "무엇을/왜".
- 미룬 일은 [tech-debt-tracker](docs/exec-plans/tech-debt-tracker.md)에, 결정은 exec-plan "결정 기록"에.
- 스펙과 코드가 다르면 스펙을 먼저 고치고(사용자 확인) 코드를 맞춘다.
- "완료" 보고 전: `npm run check` 결과 + (UI 변경 시) `/verify-sync` 결과를 근거로 제시.
