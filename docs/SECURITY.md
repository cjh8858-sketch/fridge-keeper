# Security

## 키 관리 (I5)

| 키                                                              | 어디에                                           | 브라우저 노출     |
| --------------------------------------------------------------- | ------------------------------------------------ | ----------------- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`(anon/publishable) | `.env`, GitHub Actions **Variables**             | 허용 — RLS가 보호 |
| `service_role` / `sb_secret_*`                                  | 사용 안 함. 필요 시 Edge Function 환경변수에만   | **금지**          |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`                 | GitHub Actions **Secrets** (마이그레이션 배포용) | 금지              |

- `.env`는 git에 올리지 않는다(`.gitignore`). 에이전트는 `.env`를 수정하지 않는다(hook이 차단) — 사용자가 직접 입력.
- 개인 메모 파일(`Supabase정보.txt`, `*.secret.txt`)도 `.gitignore`에 있다.
- 실수로 비밀키가 커밋되면: 즉시 Supabase 대시보드에서 키 재발급 → 히스토리 정리.

## 권한 모델

- 보안 경계는 **RLS**다. 클라이언트 코드의 if문은 보안이 아니다.
- 모든 데이터는 `user_id = auth.uid()`로 본인 것만 접근한다. → [data-model](data-model.md)
- 새 테이블 = RLS + 정책 + pgTAP 테스트 (I3). → [db-migration 스킬](../.claude/skills/db-migration/SKILL.md)

## 오프라인 캐시

- 기기에는 마지막 음식 목록만 IndexedDB에 저장(사용자별 키). **로그아웃 시 삭제**한다(공용 기기 대비).
- Service Worker는 Supabase 응답을 캐시하지 않는다. → [pwa](references/pwa.md)

## XSS (I7)

- 사용자 입력(음식 이름, 분류, 메모)은 `textContent`로만 렌더링. `src/ui/dom.js`의 `h()` 사용.

## 인증

- 이메일 매직링크. 리다이렉트 허용 URL은 Supabase 대시보드에서 localhost와 GitHub Pages 주소만 등록.
