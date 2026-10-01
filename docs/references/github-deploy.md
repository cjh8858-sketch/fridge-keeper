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

## 배포 주소

- 앱: https://cjh8858-sketch.github.io/fridge-keeper/
- 저장소: https://github.com/cjh8858-sketch/fridge-keeper

## 문제 해결 (실제로 겪은 것)

| 증상                                                                                                         | 원인                                             | 해결                                                                                            |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| push 거부: `refusing to allow a Personal Access Token to create or update workflow … without workflow scope` | 저장된 토큰에 workflow 권한 없음                 | 토큰에 Workflows(Read and write) 추가, 또는 저장된 github.com 자격 증명 삭제 후 브라우저 로그인 |
| `git remote add` → `remote origin already exists` (`<id>/<repo>`)                                            | 문서 예시 명령을 자리표시자 그대로 실행          | `git remote set-url origin <실제 주소>`                                                         |
| Deploy 성공인데 "Deploy to GitHub Pages" job이 skipped                                                       | migrate job이 skipped면 기본 `success()`가 false | deploy job에 `if: ${{ !failure() && !cancelled() }}` (반영됨)                                   |
| `Failed to create deployment (status: 404) … Ensure GitHub Pages has been enabled`                           | Pages Source 미설정                              | Settings → Pages → Source: **GitHub Actions** (Jekyll/Static HTML "Configure"는 누르지 않는다)  |
| 배포 앱이 "Supabase 설정이 필요합니다"                                                                       | Variables 미등록                                 | Settings → Secrets and variables → Actions → **Variables** 탭                                   |

## DB 자동 마이그레이션 켜기 (나중에)

초기 마이그레이션은 SQL Editor로 수동 적용했으므로, 켜기 전에 한 번 "이미 적용됨"으로 표시해야 한다.

```bash
npx supabase login
npx supabase link --project-ref xkhurzxcapwnarvcmtiq
npx supabase migration repair --status applied 20261002000000
```

그다음 Secrets(`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`)와 Variable `SUPABASE_PROJECT_REF`를 등록하면 main push 때 남은 마이그레이션(`20261002010000` 등)이 자동 적용된다.
