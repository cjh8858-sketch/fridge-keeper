---
name: add-invariant
description: 반복되는 리뷰 지적이나 사용자의 "앞으로 항상 ~해라" 규칙을 기계가 검사하는 불변식(린트 규칙, 스크립트 검사, hook)으로 승격한다.
---

# Add Invariant

"취향을 코드로." 문서에만 있는 규칙은 지켜지지 않는다.

## 1. 정말 불변식인가?

- 위반 시 **버그·보안·데이터 손상·일관성 붕괴**가 생기는가? → 불변식 후보
- 단순 스타일 선호인가? → Prettier 설정이나 문서 권장으로 충분, 강제하지 않는다("구현은 자유").
- 사용자 확인: 불변식 추가는 팀 규칙 변경이므로 제안 후 동의를 받는다.

## 2. 가장 싼 강제 장치 고르기

| 대상                             | 장치                                                  | 위치                                |
| -------------------------------- | ----------------------------------------------------- | ----------------------------------- |
| JS 문법·import 패턴              | ESLint `no-restricted-syntax`/`no-restricted-imports` | `eslint.config.js`                  |
| CSS 값                           | Stylelint 규칙                                        | `.stylelintrc.json`                 |
| 모듈 의존 방향                   | dependency-cruiser                                    | `.dependency-cruiser.cjs`           |
| 파일·SQL·문서 구조               | 스크립트 검사                                         | `scripts/check-invariants.mjs`      |
| DB 권한                          | pgTAP 테스트                                          | `supabase/tests/database/`          |
| 에이전트 행동(특정 파일 수정 등) | hook                                                  | `.claude/hooks/` (사용자 승인 필수) |

## 3. 에러 메시지 = 수정 지시

형식: `[I<번호>] 무엇이 잘못됐나. → 어떻게 고치나. (근거 문서 경로)`

## 4. 등록

1. 위반 예시 파일로 규칙이 실제로 잡는지 확인 → 예시 삭제.
2. 기존 코드가 위반하면 같이 고친다(규칙을 끄지 않는다).
3. `docs/core-beliefs.md` 불변식 표에 행 추가(ID, 규칙, 장치, 고치는 법).
4. `CLAUDE.md` 불변식 요약 한 줄 추가(200줄 이내 유지).
5. `npm run check` 통과.
