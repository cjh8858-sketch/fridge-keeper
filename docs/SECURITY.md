# Security

## 키 관리 (I5)

| 키                                                              | 어디에                                           | 브라우저 노출     |
| --------------------------------------------------------------- | ------------------------------------------------ | ----------------- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`(anon/publishable) | `.env`, GitHub Actions **Variables**             | 허용 — RLS가 보호 |
| `service_role` / `sb_secret_*`                                  | 사용 안 함. 필요 시 Edge Function 환경변수에만   | **금지**          |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`                 | GitHub Actions **Secrets** (마이그레이션 배포용) | 금지              |

- `.env`는 git에 올리지 않는다(`.gitignore`). 에이전트는 `.env`를 수정하지 않는다(hook이 차단) — 사용자가 직접 입력.
- 실수로 비밀키가 커밋되면: 즉시 Supabase 대시보드에서 키 재발급 → 히스토리 정리.

## 권한 모델

- 보안 경계는 **RLS**다. 클라이언트 코드의 if문은 보안이 아니다.
- 특권이 필요한 동작(가족 생성/참여)은 `security definer` RPC + `set search_path = ''` + 내부에서 `auth.uid()` 검사.
- 새 테이블 = RLS + 정책 + pgTAP 테스트 (I3). → [db-migration 스킬](../.claude/skills/db-migration/SKILL.md)

## 개인정보

- 구성원 이메일은 `household_member_list` RPC로 **같은 가족에게만** 노출된다(auth.users 직접 접근 불가). 테스트: `supabase/tests/database/household_member_list.test.sql`.

## XSS (I7)

- 사용자 입력(음식 이름, 메모, 가족 이름)은 `textContent`로만 렌더링. `src/ui/dom.js`의 `h()` 사용.

## 인증

- 이메일 매직링크. 리다이렉트 허용 URL은 Supabase 대시보드에서 localhost와 GitHub Pages 주소만 등록.
- 초대코드는 7일 만료, 8자. 무차별 대입 방지 강화는 기술부채로 추적.
