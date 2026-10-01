---
name: build-ui
description: 화면이나 UI 컴포넌트를 만들거나 바꿀 때 사용. 디자인 시스템(토큰·컴포넌트·접근성) 문서를 읽고 규칙에 맞게 구현한 뒤 브라우저로 확인한다.
---

# Build UI

## 먼저 읽기

- `docs/design-system/README.md` — 원칙, 레이아웃
- `docs/design-system/components.md` — 재사용할 컴포넌트가 이미 있는지
- 관련 스펙 `docs/product-specs/*.md`의 수용 기준

## 구현 규칙

- DOM은 `src/ui/dom.js`의 `h()`로 만든다. 사용자 문자열은 children으로(=textContent). `innerHTML` 금지(I7).
- 데이터는 `src/services/` 또는 `src/data/` 함수를 통해서만. UI에서 Supabase 직접 호출 금지(I2).
- 날짜·상태는 `src/domain/`의 함수(`today`, `getExpiryStatus`, `formatExpiryLabel`, `sortByUrgency`).
- CSS 값은 `var(--*)` 토큰만(I8). 새 값이 필요하면 `src/styles/tokens.css`에 라이트·다크 모두 추가 → `docs/design-system/tokens.md` 표 갱신.
- 상태 배지는 항상 텍스트 라벨 포함. 버튼·입력 최소 높이 `var(--tap-min)`. input마다 `<label>`.
- 화면 파일은 `src/ui/views/<이름>.js`, 재사용 조각은 `src/ui/components/<이름>.js`. 파일 300줄 이하.

## 체크리스트

- [ ] 모바일 375px에서 가로 스크롤 없음, 주요 버튼이 엄지 영역
- [ ] PC 1280px에서 2열 레이아웃
- [ ] 다크 모드에서 대비 정상
- [ ] 키보드만으로 조작 가능, 포커스 링 보임
- [ ] 로딩·빈 상태·오류 상태 모두 텍스트로 표시
- [ ] `docs/design-system/components.md` 상태 표(⬜→✅) 갱신

## 확인

`npm run check` 후 `/verify-sync`(또는 최소한 dev 서버 + 브라우저 패널 스크린샷, 모바일/PC 프리셋).
