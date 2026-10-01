| 동기화 상태 | `.sync-indicator[data-status]` | ✅ | 점(색)+텍스트: 연결 중/실시간 동기화 중/다시 연결 중/오프라인 || 토스트 | `showToast()`, `.toast` | ✅ | `role="status"`, 선택적 "되돌리기" 버튼, 3초 || 탭바 | `.tab-bar`, `.tab[aria-current]` | ✅ | 모바일 하단 고정 / PC 상단: 냉장고 · + 음식 추가 · 가족 || 빈 상태 | `.empty-state` | ✅ | 점선 박스 + 안내 문장 || 추가/수정 폼 | `ItemForm`, `.item-form`, `.segmented`, `.more` | ✅ | 빠른 선택 +3/+7/+14일, 필드별 오류 텍스트 |
| 필터 칩 | `.chip-row`, `.chip[aria-pressed]` | ✅ | 전체/냉장/냉동/실온 |
| 하단 시트(모바일)/사이드 패널(PC) | `.fridge-panel[data-open]` | ✅ | ≥768px에서 오른쪽 열 고정 || 음식 카드 | `.item-card[data-status]`, `.item-card-main` | ✅ | 왼쪽 상태색 테두리 + 배지 텍스트, 본문 탭=수정, "먹음" 버튼 |# Components

스타일: [`src/styles/components.css`](../../src/styles/components.css). DOM 생성: `src/ui/dom.js`의 `h()`.

| 컴포넌트      | 클래스                                                           | 상태 | 비고                                                      |
| ------------- | ---------------------------------------------------------------- | ---- | --------------------------------------------------------- |
| 앱 셸         | `.app-shell`, `.app-header`                                      | ✅   |                                                           |
| 카드          | `.card`                                                          | ✅   | 목록 항목·안내 박스 공통                                  |
| 버튼          | `.btn`, `.btn-primary`, `.btn-quiet`, `.btn-block`, `.btn-small` | ✅   | 최소 높이 `--tap-min`, `:disabled` 스타일 포함            |
| 폼 필드       | `.field`, `.field-label`, `.input`                               | ✅   | label 필수, 오류 시 `aria-invalid="true"`                 |
| 폼 메시지     | `.form-message[data-tone]`                                       | ✅   | `info`/`error`/`success`, `role="status"`                 |
| 세로 쌓기     | `.stack`                                                         | ✅   | 간격 `--space-4`                                          |
| 계정 표시     | `.account`, `.account-email`                                     | ✅   | 헤더 우측 이메일 + 로그아웃                               |
| 상태 배지     | `.status-badge[data-status]`                                     | ✅   | 텍스트 = `formatExpiryLabel()` 결과 필수                  |
| 음식 카드     | `.item-card`                                                     | ⬜   | 이름·보관위치·배지·"먹음" 버튼                            |
| 추가 폼       | `.item-form`                                                     | ⬜   | 이름, 보관위치, 유통기한(date input), 수량                |
| 빈 상태       | `.empty-state`                                                   | ⬜   | 첫 사용 안내 + 추가 버튼                                  |
| 하단 탭바     | `.tab-bar`                                                       | ⬜   | 목록 / 추가 / 가족                                        |
| 초대코드      | `.invite-code`, `.input-code`                                    | ✅   | 고정폭·넓은 자간, 복사/공유 버튼                          |
| 멤버 아바타   | `.avatar`, `.member-list`, `.member`, `.role-badge`              | ✅   | 이메일 첫 글자, `aria-hidden` (이메일 텍스트가 옆에 있음) |
| 구분선        | `.divider`                                                       | ✅   | "또는" 같은 텍스트 구분                                   |
| 버튼 줄       | `.button-row`                                                    | ✅   | 가로 버튼 묶음, 줄바꿈 허용                               |
| 한 줄 입력 폼 | `SingleFieldForm` (`src/ui/components/single-field-form.js`)     | ✅   | label·input·제출·메시지 묶음                              |
| 동기화 상태   | `.sync-indicator`                                                | ⬜   | 온라인/오프라인/동기화 중 — 텍스트 포함                   |
| 토스트        | `.toast`                                                         | ⬜   | `role="status"`                                           |

## 규칙

- 새 컴포넌트는 이 표에 먼저 추가하고 `/build-ui` 절차를 따른다.
- 클래스명은 kebab-case, 변형은 `data-*` 속성(`data-status`, `data-variant`).
- 인터랙티브 요소는 `<button>`/`<a>`/`<input>` 등 시맨틱 요소만.
