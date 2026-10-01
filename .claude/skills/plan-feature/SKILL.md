---
name: plan-feature
description: 새 기능이나 여러 단계에 걸친 변경을 시작하기 전에 docs/exec-plans/active/에 실행 계획을 작성한다. "기능 추가", "~ 만들어줘", "다음 마일스톤 진행" 같은 요청에서 코드보다 먼저 사용.
---

# Plan Feature

코드보다 계획이 먼저다. 계획 파일은 다음 세션의 나(에이전트)를 위한 기억이다.

## 절차

1. **기존 맥락 읽기**
   - `docs/exec-plans/active/` — 이미 진행 중인 계획에 속하는 일이면 새로 만들지 말고 그 계획의 마일스톤을 진행한다.
   - 관련 스펙 `docs/product-specs/*.md`, 필요하면 `docs/ARCHITECTURE.md`, `docs/data-model.md`.
2. **스펙 확인** — 스펙이 없거나 모호하면 `docs/product-specs/`에 스펙을 먼저 쓰거나 고친다. 사용자 결정이 필요한 부분만 질문한다.
3. **계획 작성** — `docs/exec-plans/README.md`의 템플릿으로 `active/NNNN-이름.md` 생성(번호는 active+completed 최대값+1).
   - 수용 기준은 **검증 가능한 문장**으로.
   - 마일스톤마다 "검증: …"(명령어 또는 `/verify-sync` 시나리오)를 적는다.
   - DB 변경이 있으면 `/db-migration`, UI가 있으면 `/build-ui` 단계를 마일스톤에 명시.
4. **사용자에게 요약 보고** 후 진행. 계획이 작으면(마일스톤 1–2개) 바로 착수해도 된다.

## 진행 중 규칙

- 마일스톤 완료 시: 체크 + 진행 로그 1줄 + `npm run check` 통과 확인.
- 계획과 다르게 가게 되면 "결정 기록"에 날짜와 이유를 남긴다.
- 미루는 일은 `docs/exec-plans/tech-debt-tracker.md`에 행 추가.

## 완료

모든 마일스톤 완료 → 파일을 `completed/`로 이동(상태: completed) → `docs/QUALITY_SCORE.md` 해당 영역 갱신.
