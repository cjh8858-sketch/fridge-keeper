# Exec Plans

여러 단계에 걸친 작업은 **코드보다 계획을 먼저** 쓴다. 계획은 에이전트가 세션을 넘어 이어서 일할 수 있게 하는 기억이다.

- `active/` — 진행 중. 세션 시작 시 hook이 목록을 보여준다.
- `completed/` — 끝난 계획 (결정 기록으로 보존).
- [tech-debt-tracker.md](tech-debt-tracker.md) — 미뤄둔 일.

## 파일 이름

`NNNN-짧은-이름.md` (예: `0002-offline-cache.md`)

## 템플릿

```markdown
# NNNN 제목

- 상태: active | completed
- 관련 스펙: docs/product-specs/…

## 목표

한두 문장.

## 수용 기준

- [ ] 검증 가능한 문장

## 마일스톤

- [ ] M1 … (검증: 어떤 명령/시나리오로 확인하는지)

## 결정 기록

- YYYY-MM-DD: 무엇을, 왜

## 진행 로그

- YYYY-MM-DD: 한 일 / 막힌 것
```

## 규칙

- 마일스톤을 끝낼 때마다 체크하고 진행 로그를 한 줄 남긴다.
- 모든 마일스톤 완료 + `npm run check` 통과 → `completed/`로 이동, [QUALITY_SCORE](../QUALITY_SCORE.md) 갱신.
