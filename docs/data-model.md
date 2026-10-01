# Data Model

원본은 SQL 마이그레이션: [`supabase/migrations/`](../supabase/migrations/). 이 문서는 요약이며, 스키마를 바꾸면 함께 갱신한다.
현재 구조는 `20261002020000_single_user.sql` 이후의 **1인용**이다(가족 구조는 제거됨 — [0002 계획](exec-plans/active/0002-single-user.md)).

## 테이블

```
auth.users 1 ──< items
```

| 컬럼                       | 타입         | 비고                                                      |
| -------------------------- | ------------ | --------------------------------------------------------- |
| `id`                       | uuid         | PK                                                        |
| `user_id`                  | uuid         | 기본값 `auth.uid()` — 클라이언트가 보내지 않는다          |
| `name`                     | text         | 1–60자                                                    |
| `category`                 | text?        | ≤20자                                                     |
| `location`                 | text         | `fridge` / `freezer` / `pantry`                           |
| `quantity`                 | int          | 1–999                                                     |
| `expiry_date`              | **date**     | 시간 없는 날짜                                            |
| `memo`                     | text?        | ≤200자                                                    |
| `consumed_at`              | timestamptz? | 있으면 "먹음/버림" 처리된 것 (목록에서 숨김, 기록은 남김) |
| `created_at`, `updated_at` | timestamptz  | `updated_at`은 트리거가 갱신                              |

## 권한 (RLS)

| 동작                              | 조건                                     |
| --------------------------------- | ---------------------------------------- |
| select / insert / update / delete | `user_id = auth.uid()` (authenticated만) |
| anon                              | 아무것도 없음 → 0행                      |

- Realtime: `items`가 `supabase_realtime`에 포함 → 같은 계정의 다른 기기에 반영.
- 검증 테스트: [`supabase/tests/database/rls_own_items.test.sql`](../supabase/tests/database/rls_own_items.test.sql)

## 날짜 규칙

`expiry_date`는 `DATE`. 비교 기준 "오늘"은 **기기 시간대**(`domain/date.deviceTimezone()`)로 클라이언트가 계산한다. → [expiry-rules](product-specs/expiry-rules.md)
