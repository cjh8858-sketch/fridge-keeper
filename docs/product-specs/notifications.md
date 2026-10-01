# Notifications — 연기됨 (MVP 이후)

## MVP에서 대신 하는 것

- 앱을 열면 상단 요약("지남 2 · 오늘 1 · 임박 3")으로 확인

## 이후 단계 후보

| 단계 | 방식                                               | 필요 조건                                                                  |
| ---- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| 1    | 앱 열 때 브라우저 Notification (권한 요청)         | 서버 불필요                                                                |
| 2    | Periodic Background Sync (설치형 PWA, Chrome 계열) | Service Worker                                                             |
| 3    | Web Push — 매일 아침 "오늘/임박" 요약              | Supabase Edge Function + cron + VAPID 키, `push_subscriptions` 테이블(RLS) |

iOS Safari는 홈 화면에 추가한 PWA에서만 Web Push 가능(iOS 16.4+).

착수 시 `/plan-feature`로 계획을 먼저 작성한다.
