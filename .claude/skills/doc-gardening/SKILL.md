---
name: doc-gardening
description: 문서와 코드의 불일치를 찾아 고치고, 기술부채·품질 점수·실행 계획을 정리한다. 마일스톤 완료 후, 큰 변경 후, 또는 "문서 정리", "doc gardening" 요청 시 사용.
---

# Doc Gardening

repo가 유일한 진실이므로, 낡은 문서는 버그다.

## 점검 항목

1. **링크** — `npm run invariants` (I9 깨진 링크, I10 CLAUDE.md 길이).
2. **스키마 ↔ 문서** — `supabase/migrations/*.sql`의 테이블·정책·RPC가 `docs/data-model.md` 표와 일치하는가.
3. **코드 ↔ 스펙** — `src/domain/expiry.js` 임계값·라벨이 `docs/product-specs/expiry-rules.md`, `docs/design-system/tokens.md`와 일치하는가.
4. **토큰 ↔ 문서** — `src/styles/tokens.css`의 토큰이 `docs/design-system/tokens.md`에 모두 있는가.
5. **컴포넌트 표** — `docs/design-system/components.md`의 ✅/⬜가 실제 구현과 맞는가.
6. **실행 계획** — `docs/exec-plans/active/` 중 다 끝난 것은 `completed/`로. 체크박스가 실제 상태와 맞는가.
7. **기술부채** — `tech-debt-tracker.md`에서 해결된 행 삭제, 코드의 `TODO`/`FIXME`가 트래커에 있는지(`grep -rn "TODO\|FIXME" src`).
8. **품질 점수** — `docs/QUALITY_SCORE.md` 등급·근거·날짜 갱신.
9. **CLAUDE.md** — 지도가 실제 구조와 맞는가. 200줄 이내 유지, 상세는 docs로.

## 결과

- 고칠 수 있는 것은 바로 수정, 판단이 필요한 것은 목록으로 사용자에게 보고.
- 같은 불일치가 반복되면 `/add-invariant`로 자동 검사 추가를 제안.
