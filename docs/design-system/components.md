# Components

스타일: [`src/styles/components.css`](../../src/styles/components.css). DOM 생성: `src/ui/dom.js`의 `h()`.

| 컴포넌트                            | 클래스 / 함수                                                                   | 비고                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 앱 셸                               | `.app-shell`, `.app-header`                                                     | 헤더 오른쪽에 계정 표시                                                                  |
| 계정 표시                           | `.account`, `.account-email`                                                    | 이메일 + 로그아웃                                                                        |
| 카드                                | `.card`                                                                         | 목록 항목·안내 박스 공통                                                                 |
| 버튼                                | `.btn`, `.btn-primary`, `.btn-quiet`, `.btn-danger`, `.btn-block`, `.btn-small` | 최소 높이 `--tap-min`, `:disabled` 스타일 포함                                           |
| 버튼 줄                             | `.button-row`                                                                   | 가로 버튼 묶음, 줄바꿈 허용                                                              |
| 폼 필드                             | `.field`, `.field-label`, `.input`                                              | label 필수, 오류 시 `aria-invalid="true"`                                                |
| 폼 메시지                           | `.form-message[data-tone]`                                                      | `info`/`error`/`success`, `role="status"`                                                |
| 세로 쌓기                           | `.stack`, `.stack-tight`                                                        | 간격 `--space-4` / `--space-2`                                                           |
| 상태 배지                           | `.status-badge[data-status]`                                                    | 텍스트 = `formatExpiryLabel()` 결과 필수                                                 |
| 음식 카드                           | `ItemCard`, `.item-card[data-status]`, `.item-card-main`                        | 왼쪽 상태색 테두리 + 배지 텍스트, 본문 탭=수정, "먹음" 버튼, `readOnly`                  |
| 추가/수정 폼                        | `ItemForm`, `.item-form`, `.segmented`, `.more`                                 | 빠른 선택 +3/+7/+14일, 필드별 오류 텍스트                                                |
| 필터 칩                             | `.chip-row`, `.chip[aria-pressed]`                                              | 전체/냉장/냉동/실온                                                                      |
| 하단 시트(모바일) / 사이드 패널(PC) | `.fridge-panel[data-open]`                                                      | ≥768px에서 오른쪽 열 고정                                                                |
| 빈 상태                             | `.empty-state`                                                                  | 점선 박스 + 안내 문장                                                                    |
| 추가 버튼 바                        | `.tab-bar`, `.tab[data-tab='add']`                                              | 모바일 하단 고정 / PC 상단                                                               |
| 동기화 상태                         | `.sync-indicator[data-status]`                                                  | 점(색)+텍스트: 연결 중/실시간 동기화 중/다시 연결 중/연결 끊김, 오프라인이면 "읽기 전용" |
| 토스트                              | `showToast()`, `.toast`                                                         | `role="status"`, 선택적 "되돌리기" 버튼, 3초                                             |

## 규칙

- 새 컴포넌트는 이 표에 먼저 추가하고 `/build-ui` 절차를 따른다.
- 클래스명은 kebab-case, 변형은 `data-*` 속성(`data-status`, `data-variant`).
- 인터랙티브 요소는 `<button>`/`<a>`/`<input>` 등 시맨틱 요소만.
