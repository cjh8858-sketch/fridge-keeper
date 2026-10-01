# Expiry Rules — 유통기한 판정

구현: [`src/domain/expiry.js`](../../src/domain/expiry.js), [`src/domain/date.js`](../../src/domain/date.js). 테스트: `tests/unit/`.

## 날짜 표현

- 모든 날짜는 **`YYYY-MM-DD` 문자열**(시간·시간대 없음). DB는 `DATE` 타입.
- "오늘"은 **가족의 시간대**(`households.timezone`) 기준: `today(household.timezone)`.
  - 이유: 해외 출장 중인 가족 구성원의 기기 시간 때문에 판정이 달라지면 안 된다.
- `Date` 객체는 `date.js`에서만 다룬다 (I6). 시간대·DST·월말 버그를 한 곳에 가둔다.

## 상태

`daysLeft = expiry_date - today` (일 단위)

| 상태      | 조건                                    | 라벨       |
| --------- | --------------------------------------- | ---------- |
| `expired` | daysLeft < 0                            | `N일 지남` |
| `today`   | daysLeft = 0                            | `오늘까지` |
| `soon`    | 1 ≤ daysLeft ≤ `SOON_THRESHOLD_DAYS`(3) | `D-N`      |
| `fresh`   | daysLeft > 3                            | `D-N`      |

## 변경 시

임계값·라벨을 바꾸면: 이 문서 → `expiry.js` → 테스트 → [tokens.md](../design-system/tokens.md) 표 순서로 함께 수정.
