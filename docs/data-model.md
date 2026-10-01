# Data Model

원본은 SQL 마이그레이션: [`supabase/migrations/`](../supabase/migrations/). 이 문서는 요약이며, 스키마를 바꾸면 함께 갱신한다.

## 테이블

```
households 1 ──< household_members >── 1 auth.users
     1
     ├──< invites
     └──< items
```

| 테이블              | 주요 컬럼                                                                                                 | 비고                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `households`        | id, name, timezone(기본 `Asia/Seoul`)                                                                     | "오늘" 판정 기준 시간대                      |
| `household_members` | household_id, user_id, role(`owner`/`member`)                                                             | PK(household_id, user_id)                    |
| `invites`           | code(8자 대문자), household_id, expires_at(기본 7일)                                                      | 참여는 `join_household` RPC                  |
| `items`             | name, category, location(`fridge`/`freezer`/`pantry`), quantity, **expiry_date(DATE)**, memo, consumed_at | `consumed_at`이 있으면 "먹음/버림" 처리된 것 |

## 권한 (RLS 요약)

| 테이블            | select | insert                   | update | delete            |
| ----------------- | ------ | ------------------------ | ------ | ----------------- |
| households        | 구성원 | RPC `create_household`만 | owner  | owner             |
| household_members | 구성원 | RPC만                    | —      | 본인 탈퇴 / owner |
| invites           | 구성원 | 구성원                   | —      | 구성원            |
| items             | 구성원 | 구성원                   | 구성원 | 구성원            |

- 판정 함수: `is_household_member(id)`, `is_household_owner(id)` — `security definer`로 RLS 재귀 방지.
- 비로그인(anon)은 아무것도 못 본다.
- 검증 테스트: [`supabase/tests/database/`](../supabase/tests/database/)

## RPC

| 함수                                    | 설명                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `create_household(p_name)`              | 가족 생성 + 호출자를 owner로 등록, id 반환                                         |
| `household_member_list(p_household_id)` | 같은 가족 구성원의 user_id·**email**·role·joined_at (owner 먼저). 비구성원은 42501 |
| `join_household(p_code)`                | 유효한 초대코드면 member로 등록(대소문자 무시), household id 반환                  |

## 날짜 규칙

`expiry_date`는 시간 없는 `DATE`. 비교 기준 "오늘"은 `households.timezone` 기준으로 클라이언트 `domain/date.today()`가 계산한다. → [expiry-rules](product-specs/expiry-rules.md)
