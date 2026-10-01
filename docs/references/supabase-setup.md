# Supabase 설정 (사람이 직접 하는 단계)

계정·키는 사람이 다룬다. 에이전트는 이 체크리스트를 안내만 하고 `.env`·비밀값을 입력하지 않는다.

## 1. 프로젝트 만들기

- [ ] https://supabase.com 가입 → **New project** (Region: Northeast Asia (Seoul))
- [ ] DB 비밀번호를 안전한 곳에 저장 (GitHub Secrets `SUPABASE_DB_PASSWORD`에 쓰임)

## 2. 로컬 `.env`

- [ ] Project Settings → API (또는 API Keys)에서 **Project URL**과 **anon / publishable** 키 복사
- [ ] 프로젝트 루트에서 `.env.example`을 `.env`로 복사 후 값 입력
- [ ] ⚠️ `service_role` / `secret` 키는 절대 넣지 않는다 (I5)

## 3. 인증 설정 (이메일 매직링크)

- [ ] Authentication → Sign In / Providers → **Email** 활성화 (기본값)
- [ ] Authentication → URL Configuration
  - Site URL: 배포 후 `https://<github-id>.github.io/<repo>/` (그 전엔 `http://localhost:5173`)
  - Redirect URLs: `http://localhost:5173/**`, `https://<github-id>.github.io/<repo>/**`

## 4. 스키마 적용

둘 중 하나:

- **(추천) GitHub 자동**: [github-deploy](github-deploy.md)의 Secrets 설정 후 main에 push → Actions가 `supabase db push`
- **수동 1회**: Supabase 대시보드 → SQL Editor에 `supabase/migrations/*.sql` 내용을 순서대로 실행
  - 이후 자동 배포로 전환할 때 이미 적용된 상태면: `npx supabase migration repair --status applied <버전>`

## 5. 확인

- [ ] `npm run dev` → 화면에 "로그인"이 보이면 연결 성공 ("Supabase 설정이 필요합니다"면 `.env` 확인)
