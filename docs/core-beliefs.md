# Core Beliefs — 하네스 원칙과 불변식

> 출처: OpenAI "Harness engineering" — _에이전트에게 지도를 주고, 불변식은 기계로 강제하고, 구현은 맡긴다._

## 원칙

1. **repo가 유일한 진실.** 결정·계획·규칙은 모두 이 저장소의 문서로 남긴다. 대화에만 있는 지식은 없는 것과 같다.
2. **CLAUDE.md는 지도.** 200줄 이내 목차. 상세는 `docs/`와 `.claude/skills/`에 둔다(프로그레시브 디스클로저).
3. **불변식은 강제, 구현은 자유.** 아래 표의 규칙은 린터·테스트·hook이 막는다. 그 밖의 구현 방식은 자유.
4. **에러 메시지는 프롬프트.** 모든 강제 장치의 메시지는 "왜 + 어떻게 고치는지 + 문서 위치"를 담는다.
5. **반복되는 지적은 규칙으로 승격.** 같은 리뷰 코멘트가 두 번 나오면 `/add-invariant`로 기계 검사로 바꾼다.
6. **계획은 산출물.** 여러 단계 작업은 `docs/exec-plans/active/`에 계획을 먼저 쓴다.
7. **지속적인 정리(가비지 컬렉션).** `/doc-gardening`으로 문서·기술부채·품질 점수를 주기적으로 갱신한다.

## 불변식 (Invariants)

| ID                  | 규칙                                                                 | 강제 장치                                         | 고치는 법                                                                          |
| ------------------- | -------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| <a id="i1"></a>I1   | 계층 의존 방향 `types → domain → data → services → ui`, 순환 금지    | dependency-cruiser (`npm run deps`)               | 로직을 아래 계층으로 내린다. [ARCHITECTURE](ARCHITECTURE.md)                       |
| <a id="i2"></a>I2   | `@supabase/supabase-js`는 `src/data/`에서만 import                   | ESLint `no-restricted-imports`                    | `src/data/*-repo.js`에 함수 추가                                                   |
| <a id="i3"></a>I3   | 모든 테이블에 RLS 활성화 + 정책                                      | `scripts/check-invariants.mjs` + pgTAP 테스트(CI) | [db-migration 스킬](../.claude/skills/db-migration/SKILL.md)                       |
| <a id="i4"></a>I4   | main에 들어간 마이그레이션 수정·삭제 금지                            | hook `guard-protected` + invariants 스크립트      | `npm run db:new <name>`으로 새 파일                                                |
| <a id="i5"></a>I5   | 클라이언트 코드에 service_role/secret 키·JWT 금지                    | hook `secret-scan` + invariants 스크립트          | `import.meta.env.VITE_*`, 서버 권한은 RPC로. [SECURITY](SECURITY.md)               |
| <a id="i6"></a>I6   | `Date` 객체는 `src/domain/date.js`에서만, 날짜는 `YYYY-MM-DD` 문자열 | ESLint `no-restricted-syntax`                     | `date.js`의 `today/addDays/daysBetween`                                            |
| <a id="i7"></a>I7   | `innerHTML`/`insertAdjacentHTML` 등 HTML 문자열 삽입 금지            | ESLint `no-restricted-syntax`                     | `src/ui/dom.js`의 `h()`                                                            |
| <a id="i8"></a>I8   | 색·간격은 `tokens.css` 토큰만. 상태는 색+텍스트 병기                 | Stylelint                                         | [tokens](design-system/tokens.md), [accessibility](design-system/accessibility.md) |
| <a id="i9"></a>I9   | 문서 내부 링크는 실제 파일을 가리킨다                                | invariants 스크립트                               | 링크 수정 또는 `/doc-gardening`                                                    |
| <a id="i10"></a>I10 | CLAUDE.md ≤ 200줄, 소스 파일 ≤ 300줄                                 | invariants 스크립트, ESLint `max-lines`           | 상세를 docs로 / 파일 분리                                                          |
| <a id="i11"></a>I11 | `src/domain/` 커버리지 lines 90%·functions 100%                      | Vitest coverage threshold                         | 단위 테스트 추가 (`tests/unit/`)                                                   |

## 강제하지 않는 것 (자유 영역)

- 컴포넌트 내부 구조, 함수 분리 방식, 변수명 스타일(Prettier가 포맷만 맞춤)
- UI 화면 구성 — 단, [디자인 시스템](design-system/README.md)의 컴포넌트를 우선 재사용
- 테스트 작성 방식(단위/E2E 비율)

## 불변식을 바꾸고 싶다면

불변식은 사람의 합의로만 바꾼다. 에이전트는 강제 장치를 약화(규칙 끄기, `eslint-disable`, hook 수정)하지 않고, 사용자에게 제안한다. 새 불변식 추가는 `/add-invariant`.
