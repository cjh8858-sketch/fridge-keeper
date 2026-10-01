# Tokens

원본: [`src/styles/tokens.css`](../../src/styles/tokens.css). **다른 CSS 파일에는 원시 값(hex, rgb, px 간격)을 쓰지 않는다** (I8, Stylelint가 차단).

## 색

| 토큰                                                                | 용도                              |
| ------------------------------------------------------------------- | --------------------------------- |
| `--color-bg` / `--color-surface` / `--color-surface-muted`          | 배경 / 카드 / 보조 영역           |
| `--color-border`                                                    | 테두리                            |
| `--color-text` / `--color-text-muted`                               | 본문 / 보조 텍스트                |
| `--color-primary` / `--color-primary-strong` / `--color-on-primary` | 주요 버튼                         |
| `--color-focus`                                                     | 포커스 링                         |
| `--color-danger` / `--color-success`                                | 오류·성공 메시지 (상태 색 재사용) |

## 유통기한 상태

| 상태      | 조건 (남은 일수) | 전경 / 배경 토큰                           | 라벨 예    |
| --------- | ---------------- | ------------------------------------------ | ---------- |
| `fresh`   | 4일 이상         | `--status-fresh` / `--status-fresh-bg`     | `D-7`      |
| `soon`    | 1–3일            | `--status-soon` / `--status-soon-bg`       | `D-2`      |
| `today`   | 0일              | `--status-today` / `--status-today-bg`     | `오늘까지` |
| `expired` | 음수             | `--status-expired` / `--status-expired-bg` | `3일 지남` |

판정 로직: [expiry-rules](../product-specs/expiry-rules.md)

## 간격 (4px 단위)

`--space-0`(0) · `-1`(4) · `-2`(8) · `-3`(12) · `-4`(16) · `-5`(24) · `-6`(32) · `-7`(48)

## 타이포·모양

- 글꼴 `--font-sans`, 크기 `--text-xs … --text-xl`, 굵기 `--weight-regular/bold`, 행간 `--leading`
- 모서리 `--radius-sm/md/pill`, 그림자 `--shadow-card`
- 레이아웃 `--tap-min`(44px), `--content-max`, `--gutter`, `--tabbar-height`, `--panel-width`, 시트 그림자 `--shadow-sheet`
- 겹침 순서 `--z-sheet` < `--z-tabbar` < `--z-toast`

## 토큰 추가 규칙

1. 기존 토큰으로 안 되는지 먼저 확인
2. 라이트·다크 둘 다 정의
3. 이 문서 표에 추가
