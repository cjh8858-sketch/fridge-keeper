# GitHub — CI · 배포 · Codespaces

로컬은 가볍게(Node만), 무거운 검증(DB 컨테이너)은 GitHub Actions에서.

## 워크플로

| 파일                                               | 언제          | 하는 일                                                                       |
| -------------------------------------------------- | ------------- | ----------------------------------------------------------------------------- |
| [`ci.yml`](../../.github/workflows/ci.yml)         | PR, main push | `npm run check` · RLS pgTAP 테스트(일회용 Supabase 컨테이너) · Playwright E2E |
| [`deploy.yml`](../../.github/workflows/deploy.yml) | main push     | 마이그레이션 적용(`supabase db push`) → 빌드 → GitHub Pages 배포              |

## 1회 설정 (사람이 직접)

- [ ] GitHub에 저장소 생성 후 연결:
  ```bash
  git remote add origin https://github.com/<id>/<repo>.git
  git push -u origin main
  ```
- [ ] Settings → Pages → Source: **GitHub Actions**
- [ ] Settings → Secrets and variables → Actions
  - **Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_PROJECT_REF`(URL의 `<ref>.supabase.co` 부분)
  - **Secrets**: `SUPABASE_ACCESS_TOKEN`(supabase.com → Account → Access Tokens), `SUPABASE_DB_PASSWORD`
- [ ] Settings → Branches → main 보호 규칙: CI 통과 필수 (권장)

Variables가 비어 있으면 deploy는 마이그레이션 단계를 건너뛰고 앱은 "Supabase 설정이 필요합니다"를 보여준다.

## Codespaces (PC에 아무것도 설치하기 싫을 때)

저장소 → Code → Codespaces → Create. [`.devcontainer`](../../.devcontainer/devcontainer.json)가 Node + Docker를 준비하므로 그 안에서는 `npx supabase start`로 로컬 DB도 띄울 수 있다. 무료 할당량 내에서 사용.

## 로컬에서 CI와 같은 검사

```bash
npm run check
```

RLS 테스트(`npm run db:test`)는 Docker가 있는 환경(Codespaces/CI)에서만.
