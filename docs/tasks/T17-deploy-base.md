# T17: 배포 기반 (Cloudflare Workers 정적 자산, `/` 301·404·응답 헤더, GitHub Actions 배포, 공개 전 Access 잠금)

| 항목 | 값 |
| --- | --- |
| 단계 | 8 |
| 선행 작업 | T16 (구현 PR #49, 완료 반영과 Home LCP 흔들림 수정 PR #50) |
| 담당 | 미배정 |
| 상태 | todo |
| 브랜치 | `<agent>/T17-deploy-base` |

## 목표

- main에 merge하면 CI(`check`·`lighthouse`)가 통과한 뒤 Cloudflare Workers(`*.workers.dev`)에 자동으로 배포된다.
- Cloudflare에서만 정해지는 동작을 저장소 설정으로 관리하고 로컬·CI에서 시험한다.
  - `/` → `/ja/` 301
  - 없는 경로의 404 상태와 404 페이지
  - 끝 슬래시 이동
  - 응답 헤더
- 원고를 반영하기 전에는 Cloudflare Access로 choi만 볼 수 있다(2026-11-01 사용자 결정).

## 배경

- 근거 문서
  - `docs/PLAN.md` §2 호스팅(Cloudflare Workers 정적 자산, 무료 플랜)·도메인(우선 `*.workers.dev`), §4 동적 기능, §5 단계 8
  - `docs/PLAN.md` §8
    - T01 이월: `/` → `/ja/`를 HTTP 301로
    - T13 항목: `not_found_handling = "404-page"`, x-default 재검토, `site` 교체, workers.dev 처리
  - `docs/ARCHITECTURE.md` A3(호스팅), A6(비밀 값), §2 SEO "404"
  - `docs/CONTENT.md` "임시 문구 규칙": 임시 항목이 남은 채 공개 배포하지 않는다.

### 단계 8 나누기 (안)

| 지시서 | 내용 | 비고 |
| --- | --- | --- |
| T17 (이 지시서) | 배포 기반 | Workers 함수 없음. 정적 자산만 |
| T18 | 연락 폼 | Turnstile + Workers 함수 + 메일 발송. 도메인과 메일 발송 방식을 이때 정한다 |
| T19 | 회사별 비공개 페이지 | 토큰 URL + KV(A5) |
| T20 | 방문 분석 | 방식은 그때 정한다 |
| 그 뒤 | 원고 반영 → 공개 배포 | 공개 배포 PR에서 잠금·`noindex`를 풀고 `site`를 실제 주소로 바꾼다 |

### 결정 (2026-11-01 사용자 결정)

- **원고 반영 전 배포는 Cloudflare Access로 choi만 볼 수 있게 한다.**
  - workers.dev에 배포하고 Access로 choi 메일만 들어오게 한다.
  - 공개 배포 때 잠금을 푼다.
- 고르지 않은 안
  - 잠금 없이 `noindex`만 건다: 주소를 아는 사람은 임시 문구를 본다.
  - 원고 반영 전에는 배포하지 않는다: 연락 폼 메일 발송 등을 공개 직전에야 실제로 시험한다.

### 확인한 공식 문서 (2026-11-01)

- Workers 정적 자산
  - [Static Site Generation and custom 404 pages](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)
    - `not_found_handling: "404-page"`: 맞는 파일이 없으면 가장 가까운 `404.html`을 404 상태로 보낸다.
    - `html_handling`의 기본값은 `auto-trailing-slash`다. `foo/index.html`은 끝 슬래시가 있는 주소로 보낸다.
  - [Redirects](https://developers.cloudflare.com/workers/static-assets/redirects/)
    - 자산 폴더의 `_redirects` 파일, 한 줄에 `[원본] [대상] [코드]`. 코드는 301·302·303·307·308이다.
    - 정적 2,000개·동적 100개, 한 줄 1,000자까지다.
    - "Redirects are always followed, regardless of whether or not an asset matches the incoming request."
    - Worker 코드가 처리하는 요청에는 적용하지 않는다.
  - [Headers](https://developers.cloudflare.com/workers/static-assets/headers/)
    - 자산 폴더의 `_headers` 파일. 규칙 100개, 한 줄 2,000자까지다.
    - 정적 자산 응답에만 붙는다. Worker 코드가 만든 응답에는 붙지 않는다(T18부터 Worker 함수 응답 헤더는 코드에서 정한다).
  - [Billing and Limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
    - 정적 자산 요청은 무료이고 제한이 없다고 적혀 있다.
    - Worker 스크립트를 부르는 요청만 Workers 요금 기준으로 센다.
  - [Limits](https://developers.cloudflare.com/workers/platform/limits/), Free 플랜
    - 하루 요청 100,000회(UTC 자정에 초기화)
    - 요청당 CPU 10ms
    - 버전당 자산 파일 20,000개, 파일 하나 25MiB
- 배포
  - [GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
    - API 토큰은 "Edit Cloudflare Workers" 권한으로, 배포할 계정 하나로 범위를 줄인다.
    - `CLOUDFLARE_ACCOUNT_ID`·`CLOUDFLARE_API_TOKEN`을 CI 비밀 값으로 둔다. 예시는 `cloudflare/wrangler-action@v4`다.
  - [Workers Builds 한도](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)(쓰지 않음): Free 플랜 월 3,000분, 동시 1개, 20분 제한
  - [GitHub 환경](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment)
    - "Environments, environment secrets, and deployment protection rules are available in public repositories"
    - 환경의 비밀 값은 보호 규칙(배포 브랜치 제한 등)을 통과한 작업만 쓴다.
- 잠금
  - [One-click Cloudflare Access for Workers](https://developers.cloudflare.com/changelog/post/2025-10-03-one-click-access-for-workers/)
    - Workers 설정 › Domains & Routes에서 workers.dev·Preview URL에 Access를 한 번에 켠다. 허용 메일은 "Manage Cloudflare Access"에서 바꾼다.
    - Worker 코드에서 Access JWT를 검증하라고 권한다. 이 지시서는 Worker 코드가 없어 검증하지 않는다(메모).
  - [Zero Trust 요금](https://www.cloudflare.com/plans/sase-zero-trust.md): Free 플랜 $0, 사용자 50명까지. 가입 때 결제 수단이 필요한지는 문서에 없다(확인 필요).

### 의존성 점검 (2026-11-01)

- npm 배포 정보(`npm view`)

  | 패키지 | 버전 | 배포일 | 비고 |
  | --- | --- | --- | --- |
  | `wrangler` | 4.156.0 | 2026-10-29 | `engines.node >=22.0.0`. 하위 의존성: `miniflare` 5.20261023.3-beta, `workerd` 1.20261023.1, `esbuild` 0.28.2 |

- `pnpm add -D --save-exact wrangler@4.156.0`(이 저장소 복사본)
  - 설치 스크립트 때문에 그대로는 실패한다: `ERR_PNPM_IGNORED_BUILDS` `esbuild@0.28.2, workerd@1.20261023.1`(pnpm 11).
  - 두 패키지의 `postinstall`은 플랫폼별 실행 파일을 고르는 스크립트다. `pnpm-workspace.yaml`에 `allowBuilds: { esbuild: false, workerd: false }`(실행하지 않음)를 두면 설치가 끝난다.
    - 실행하지 않아도 `wrangler dev`·`wrangler deploy --dry-run`이 동작했다. 실행 파일은 선택적 의존성 `@cloudflare/workerd-linux-64`에서 찾는다.
    - 설치 스크립트가 있는 새 패키지는 이 둘뿐이다.
  - `pnpm audit`: main과 같은 2건(moderate, `minimatch`·`glob`). 늘어난 경고는 없다.
  - lockfile에서 기존 패키지가 바뀌는 곳
    - `vite`·`astro`의 해석 키에 `esbuild@0.28.2`(vite의 선택적 peer)가 붙는다.
    - `supports-color` 10.2.2가 더해지고, 일부 해석 키(`lighthouse`·ESLint 계열 등)가 이 버전을 가리킨다.
    - 기존 패키지의 버전은 바뀌지 않는다.
  - 빌드 결과 `dist/`는 main과 `diff -r`로 같다(`_redirects`·`_headers`를 더하기 전).
  - 설치 크기: `@cloudflare/workerd-linux-64`가 약 138MB다. CI는 pnpm 캐시를 쓴다.
  - `miniflare`가 `-beta` 꼬리표가 붙은 버전이다. `wrangler` 4.156.0이 정확한 버전으로 요구한다.

### 사전 시험 (2026-11-01, 이 지시서를 쓴 실행 환경)

`wrangler` 4.156.0 `wrangler dev`(로컬, 로그인 없음). main 빌드에 아래 두 파일을 더해 잼.

```text
# _redirects
/ /ja/ 301

# _headers
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Robots-Tag: noindex
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

| 요청 | 결과 |
| --- | --- |
| `/` | 301 → `/ja/` |
| `/ja`, `/ja/about`, `/en` | 307 → 끝 슬래시 주소 |
| `/ja/`, `/ja/about/` | 200 |
| `/ja/xyz/`, `/en/projects/xyz/`, `/xyz` | 404, 본문은 `404.html` |
| `/404.html` | 307 → `/404` |
| `/404` | 200(404 페이지, `noindex`) |
| `/index.html`, `/ja/index.html`, `/ja/about/index.html` | 307 → `/`, `/ja/`, `/ja/about/` |
| `/_headers`, `/_redirects` | 404(설정 파일은 응답하지 않음) |
| `/sitemap.xml`, `/robots.txt` | 200 |

- HTML 응답의 기본 `Cache-Control`은 `public, max-age=0, must-revalidate`이고 `ETag`가 붙는다.
- `_headers`의 값이 모든 응답에 붙고, `/_astro/*`에는 1년 캐시가 붙는다.
- 로컬은 gzip으로 응답했다. 배포 환경의 압축 방식은 확인하지 않았다(확인 필요).
- `wrangler deploy --dry-run`은 로그인 없이 끝났다.
  - 범위 1의 `wrangler.jsonc`(아래 표의 키 모두)로 실행했다. `html_handling`·`workers_dev`·`preview_urls`·`send_metrics`는 설치한 `wrangler`의 `config-schema.json`에 있는 키다.
  - "Read 202 files from the assets directory"와 "No bindings found."를 출력했다. 202는 `dist/`의 파일 181개(`_redirects`·`_headers` 포함)와 폴더 21개를 더한 수다.
- `miniflare`는 `@cloudflare/workers-shared`(asset-worker·router-worker)를 써서 자산을 낸다(패키지 확인). 배포 환경과 같은 동작인지는 배포 URL에서 확인한다.
- 시험 환경에서는 `workers.cloudflare.com`(`Request.cf` 정보)에 접속할 수 없다는 경고가 나왔다. 동작에는 영향이 없었다.

### 루트 이동과 x-default

- `/`는 언어와 관계없이 `/ja/`로 보낸다(T01 결정). 그래서 `hreflang="x-default"`는 지금처럼 ja URL로 둔다(T13 항목).
- `dist/index.html`(2초 meta refresh)은 그대로 둔다.
  - Cloudflare에서는 `_redirects`가 먼저 적용되어 이 파일이 나가지 않는다.
  - `astro preview`(E2E·Lighthouse)에서는 지금처럼 이 파일이 이동을 맡는다.

## 범위

포함:

1. **의존성·설정**
   - `devDependencies`에 `wrangler` 4.156.0을 정확한 버전으로 더한다. 구현 때 더 새 판이 있으면 같은 점검(설치 스크립트, `pnpm audit`, `dist/` 비교)을 하고 PR에 적는다.
   - `pnpm-workspace.yaml`: `allowBuilds`에 `esbuild: false`, `workerd: false`. 이유를 주석으로 적는다.
   - 루트에 `wrangler.jsonc`를 새로 둔다.

     | 키 | 값 | 이유 |
     | --- | --- | --- |
     | `name` | `portfolio` | 주소가 `portfolio.<계정 하위 도메인>.workers.dev`가 된다 |
     | `compatibility_date` | 구현하는 날짜(설치한 `workerd`가 지원하는 날짜 이하) | |
     | `assets.directory` | `./dist` | |
     | `assets.not_found_handling` | `404-page` | T13 항목 |
     | `assets.html_handling` | `auto-trailing-slash` | 기본값이지만 `trailingSlash: 'always'`와 맞춘다는 뜻으로 적는다 |
     | `workers_dev` | `true` | |
     | `preview_urls` | `false` | Access를 workers.dev 하나에만 걸면 된다 |
     | `send_metrics` | `false` | Wrangler 사용 정보를 보내지 않는다 |

     - `main`(Worker 스크립트)은 두지 않는다. 계정 ID는 적지 않는다(환경 변수로 준다).
   - `scripts`: `"preview:workers": "wrangler dev"`, `"test:workers": "playwright test -c playwright.workers.config.ts"`. 둘 다 빌드하지 않으므로 `pnpm build` 뒤에 실행한다.
   - `.wrangler/`는 이미 `.gitignore`에 있다. ESLint·Prettier가 검사하지 않게 한다.
2. **`public/_redirects`**: `/ /ja/ 301` 한 줄과 주석. 대상 언어는 `astro.config.mjs`의 `i18n.defaultLocale`과 같아야 한다고 적는다.
3. **`public/_headers`**

   | 경로 | 헤더 | 이유 |
   | --- | --- | --- |
   | `/*` | `X-Content-Type-Options: nosniff` | MIME 추측 금지 |
   | `/*` | `Referrer-Policy: strict-origin-when-cross-origin` | 다른 사이트로 가는 링크에 전체 경로를 보내지 않는다 |
   | `/*` | `X-Frame-Options: DENY` | 다른 사이트의 frame에 넣지 않는다 |
   | `/*` | `X-Robots-Tag: noindex` | **공개 배포 PR에서 지운다.** 잠금이 풀린 사이에도 검색에 올라가지 않게 한다 |
   | `/_astro/*` | `Cache-Control: public, max-age=31536000, immutable` | 파일 이름에 해시가 있다 |

   - HTML은 기본값(`max-age=0, must-revalidate`)을 그대로 쓴다.
   - `X-Robots-Tag` 줄에 "공개 배포 때 지운다"를 주석으로 적는다.
4. **Cloudflare 동작 테스트**
   - `playwright.workers.config.ts`(새 파일)
     - `testDir: 'tests/workers'`
     - `webServer`: `pnpm exec wrangler dev --port <E2E·Lighthouse와 다른 포트> --ip 127.0.0.1`
     - 브라우저 없이 `request`만 쓴다. 리다이렉트는 따라가지 않는다(`maxRedirects: 0`).
     - `retries: 0`, CI에서 `forbidOnly`
   - 페이지 경로·문구를 하드코딩하지 않는다. `tests/e2e/support/site.ts`의 `sitePages()`·`locales`·`DIST`를 쓴다.
   - 확인할 것

     | 대상 | 기대 |
     | --- | --- |
     | `/` | 301, `Location`은 기본 언어 Home |
     | sitemap의 모든 페이지 | 200 |
     | sitemap의 각 페이지에서 끝 슬래시를 뗀 주소 | 307, `Location`은 원래 주소 |
     | 언어마다 없는 경로(예: `/<언어>/<임의 문자열>/`, `/<언어>/projects/<임의 문자열>/`)와 루트의 없는 경로 | 404, 본문이 `dist/404.html`과 같다 |
     | 페이지 HTML 응답 | 범위 3의 `/*` 헤더 4개 |
     | `dist/_astro/`의 파일 하나 | 1년 `immutable` 캐시 |
     | `/_redirects`, `/_headers` | 응답하지 않는다(404) |

   - 결함 주입: 아래를 하나씩 넣어 해당 확인이 실패하는지 보고 PR에 적는다. 커밋하지 않는다.
     - `_redirects` 줄 삭제
     - `not_found_handling` 삭제
     - `_headers`에서 한 줄 삭제
5. **CI** (`.github/workflows/ci.yml`)
   - `check` 작업: E2E 다음에 `pnpm test:workers` 단계를 더한다.
   - 새 작업 `deploy`

     | 설정 | 값 |
     | --- | --- |
     | 조건 | `github.event_name == 'push' && github.ref == 'refs/heads/main'`. PR에서는 건너뛴다 |
     | `needs` | `[check, lighthouse]` |
     | `environment` | `production`(GitHub 환경, 사용자 준비 3) |
     | `concurrency` | 작업 단위로는 두지 않는다. 워크플로 전체의 기존 설정(`cancel-in-progress: true`)으로 main에 새 push가 오면 이전 실행이 배포 작업까지 취소된다. 그래서 이전 커밋이 새 커밋보다 늦게 배포되지 않는다(메모) |
     | `timeout-minutes` | 예: 10 |

     - 단계: checkout → pnpm → Node(`.nvmrc`, pnpm 캐시) → `pnpm install --frozen-lockfile` → `pnpm build` → `pnpm exec wrangler deploy`
     - `CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID`는 환경 비밀 값에서 그 단계의 `env`로만 준다.
     - `cloudflare/wrangler-action`은 쓰지 않는다. lockfile에 고정된 `wrangler`를 그대로 쓰고 외부 action을 늘리지 않는다(공식 예시와 다른 점, 메모).
   - 배포한 URL을 CI에서 확인하지 않는다. Access 뒤라 서비스 토큰 없이는 열 수 없다. 사람이 확인한다(사용자 준비 5).
6. **사용자 준비(choi, Cloudflare·GitHub 화면)**
   - 구현 PR merge 전에 1~3을 끝낸다. 3이 없으면 merge 뒤 main의 `deploy` 작업이 실패한다.
   - 비밀 값은 저장소에 넣지 않는다(`AGENTS.md` §4-8).

   | 순서 | 할 일 | 비고 |
   | --- | --- | --- |
   | 1 | Cloudflare 계정(무료)을 만들고 Workers 화면에서 workers.dev 하위 도메인을 정한다 | 하위 도메인은 공개 주소의 일부가 된다 |
   | 2 | API 토큰: "Edit Cloudflare Workers" 템플릿, 계정 하나로 제한. 계정 ID를 확인한다 | |
   | 3 | GitHub 저장소 Settings › Environments에서 `production`을 만든다 | 배포 브랜치를 `main`만으로 제한하고, 환경 비밀 값 `CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID`를 넣는다 |
   | 4 | 첫 배포 직후 Workers & Pages › `portfolio` › Settings › Domains & Routes › workers.dev에서 "Enable Cloudflare Access"를 누르고, 허용 메일을 choi 메일 하나로 한다 | 처음이면 Zero Trust 팀 만들기 안내가 나올 수 있다 |
   | 5 | 시크릿 창으로 확인한다 | 주소를 열면 Access 로그인 화면이 나온다. 로그인하면 `/`가 `/ja/`로 가고, 없는 경로가 404 페이지를 보인다 |

   - 결과(배포 성공, 잠금 화면, 응답 확인)는 완료 반영 PR에 적는다.
7. **문서**
   - `docs/ARCHITECTURE.md`
     - §2 새 하위 절 "배포 (T17 결정)": `wrangler.jsonc`, `_redirects`·`_headers`와 그 이유, `pnpm preview:workers`·`pnpm test:workers`, CI `deploy` 작업, GitHub 환경과 비밀 값, Access 잠금과 푸는 때
     - 디렉터리 구조에 새 파일
     - §2 SEO "404" 문장: `not_found_handling`을 넣었다고 고친다.
     - §3 ADR: 배포 방식 결정. 고르지 않은 안(Workers Builds, `wrangler-action`, 손으로 배포)과 이유
   - `AGENTS.md`: §5 호스팅 줄, §6 명령·CI 순서
   - `README.md` "개발 방법": 두 명령
   - `docs/PLAN.md`
     - 진행 상태, 작업 지시서 표, 결정 기록
     - §8 항목 정리
       - T01 301 항목·T13 `not_found_handling` 항목: 이 지시서로 처리. 배포 URL 확인은 사용자 준비 5
       - T13 x-default 항목: 위 "루트 이동과 x-default"
     - §8에 공개 배포 때 할 일을 더한다: Access 끄기, `X-Robots-Tag: noindex` 지우기, `site` 교체

제외:

- 커스텀 도메인과 `site` 교체
  - 도메인은 T18 전에 정한다. 그때까지 `site`는 임시 값(`https://portfolio.example`)이다.
  - 잠금 중이라 canonical·OG가 임시 주소를 가리켜도 밖에서 보이지 않는다.
- Worker 함수(`main`, `/api/*`): T18부터
- `Content-Security-Policy`: 인라인 스크립트(테마 첫 적용, 페이지 스크립트)에 해시나 nonce가 필요해 따로 검토한다(공개 배포 전, 메모)
- `Strict-Transport-Security`: 커스텀 도메인을 정할 때 함께 정한다.
- PR별 미리보기 배포(Preview URL): PR 작업에 배포 토큰을 주지 않기 위해 하지 않는다.
- 배포 URL에 대한 Lighthouse·E2E: Access 뒤라 열 수 없다. 공개 배포 때 한다.
- 방문 분석: T20

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `package.json`: `devDependencies` 1개(`wrangler`), `scripts` 2개(`preview:workers`, `test:workers`)
- `pnpm-lock.yaml`: 위 의존성 추가로 생기는 변경만
- `pnpm-workspace.yaml`: `allowBuilds`만
- `wrangler.jsonc`, `playwright.workers.config.ts`, `tests/workers/**`, `public/_redirects`, `public/_headers` (새 파일)
- `tests/e2e/support/site.ts`: 함수를 더할 때만(E2E 동작은 바꾸지 않음)
- `.github/workflows/ci.yml`: `check` 작업에 단계 1개, `deploy` 작업 추가
- `.gitignore`, `.prettierignore`, `eslint.config.mjs`, `tsconfig.json`: 새 설정 파일·`.wrangler/`를 다루는 데 필요할 때만
- 문서: `docs/ARCHITECTURE.md`, `AGENTS.md`(§5·§6만), `README.md`("개발 방법"만), `docs/PLAN.md`, `docs/tasks/T17-deploy-base.md`
- 바꾸지 않는 파일
  - 사이트: `src/**`, `astro.config.mjs`, `scripts/**`, `public/`의 기존 파일
  - 테스트: `playwright.config.ts`, `playwright.lighthouse.config.ts`, `tests/e2e/**`(위 `site.ts` 예외 말고), `tests/lighthouse/**`

## 완료 조건

- [ ] `pnpm test:workers`가 로컬과 CI `check` 작업에서 통과한다. 범위 4 표를 모두 확인한다.
- [ ] 범위 4의 결함 주입 3건이 모두 해당 확인을 실패시킨다(PR 표, 결함은 커밋하지 않음).
- [ ] `pnpm exec wrangler deploy --dry-run`이 로그인 없이 통과한다. 읽은 자산 파일 수를 PR에 적는다.
- [ ] 새 의존성은 `wrangler` 하나다. `allowBuilds`는 `esbuild`·`workerd`를 실행하지 않는다. `pnpm audit` 변화와 lockfile의 기존 패키지 변경을 PR에 적는다.
- [ ] `dist/`가 main과 비교해 `_redirects`·`_headers` 두 파일만 다르다.
- [ ] `deploy` 작업은 main push에서만 돈다. PR CI에서는 건너뛴 것으로 보인다. 비밀 값은 `production` 환경에서만 받는다.
- [ ] 문서가 갱신되어 있다: `docs/ARCHITECTURE.md`(§2 배포·SEO 404, 디렉터리 구조, §3 ADR), `AGENTS.md` §5·§6, `README.md`, `docs/PLAN.md`(진행 상태·표·결정 기록·§8)
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`, `pnpm test`, `pnpm lighthouse`, `pnpm test:workers`와 GitHub CI가 통과한다.
- [ ] 비밀 값 미포함. 계정 ID·API 토큰은 GitHub 환경 비밀 값에만 둔다.
- [ ] merge 뒤(사용자 준비 1~5): 첫 배포 성공, Access 잠금, 배포 URL에서 `/` 301·404 확인. 완료 반영 PR에 적는다.

## 확인 방법

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test:workers                 # wrangler dev를 띄워 Cloudflare 동작 확인
pnpm preview:workers              # 직접 열어 보기(http://localhost:8787 기본)
pnpm exec wrangler deploy --dry-run
curl -sI http://localhost:8787/   # 301, Location: /ja/
```

## 메모

- **Lighthouse가 흔들리면 배포가 막힌다**
  - `deploy`는 `lighthouse` 작업이 통과해야 돈다. 점수가 흔들려 기준 미달이 나오면 그 push는 배포되지 않는다.
  - T16 완료 반영 PR #50의 첫 CI에서 Home `/ja/` 모바일이 85·100·85로 떨어진 일이 있었다. 원인(디코딩 스크립트와 첫 페인트의 순서)은 같은 PR에서 고쳤다(`docs/DESIGN.md` §5 LCP). 고친 뒤 CI는 100·98·100이다.
  - 다시 흔들리면 다시 실행해 통과시키지 않는다. 회차별 값을 PR에 적고 사용자가 정한다(T16 지시서 메모와 같음).
- **main 실행 취소와 배포**
  - 워크플로 전체의 `concurrency`가 같은 ref의 이전 실행을 취소한다. main에 연달아 merge하면 앞 실행의 `deploy`가 도중에 취소될 수 있다.
  - [Versions & deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/)(2026-11-01 확인): 기본 동작은 "Workers creates a new version and immediately deploys it to 100% of traffic in a single step"이다. 업로드 도중 끊겼을 때 어떻게 되는지는 적혀 있지 않다(확인 필요). 이상하면 같은 문서의 롤백(이전 배포 버전으로 되돌리기)을 쓴다.
  - 작업 단위 `concurrency`(`cancel-in-progress: false`)를 따로 두어도 워크플로 단위 취소는 막지 못한다. 그리고 main 실행을 취소하지 않게 바꾸면 앞 실행이 늦게 끝날 때 이전 커밋이 나중에 배포될 수 있다. 그래서 지금 설정을 그대로 쓴다.
- **GitHub Actions의 Node.js 20 경고**: CI 로그에 `actions/checkout@v4`·`actions/setup-node@v4`·`actions/upload-artifact@v4`·`pnpm/action-setup@v4`가 Node.js 20 기준이라 Node.js 24로 강제 실행한다는 경고가 나온다(PR #50 CI). `deploy` 작업도 기존 작업과 같은 판을 쓴다. 판 올리기는 이 지시서에서 하지 않는다(새 판이 있는지 확인 필요).
- **첫 배포와 잠금 사이**
  - Access는 Worker가 생긴 뒤에 켤 수 있다. 첫 배포부터 Access를 켤 때까지 몇 분은 주소를 아는 사람이 볼 수 있다(`noindex`).
  - 주소는 어디에도 싣지 않으므로 이 틈은 받아들인다. 싫으면 첫 배포를 choi가 손으로 하고 바로 Access를 켠다.
- **Access의 한계**
  - 정적 자산만 있어 Access JWT를 검증할 Worker 코드가 없다. Access를 실수로 끄면 바로 공개된다. 공개 전까지 Access 설정은 choi만 바꾼다.
  - T18부터 Worker 함수가 생기면 함수 쪽에서 JWT 검증이 필요한지 그때 정한다.
- **`wrangler-action` 대신 `pnpm exec wrangler deploy`**
  - 공식 예시는 `cloudflare/wrangler-action@v4`다. 이 저장소는 `wrangler`를 devDependency로 고정하므로 action 없이 같은 버전을 쓴다.
  - 리뷰에서 action을 쓰자는 의견이 있으면 바꿔도 된다.
- **`wrangler` 갱신**: 거의 매일 새 판이 나온다(2026-10-20~29에 6판). 정확한 버전으로 고정하고 필요할 때 올린다.
- **CSP**: 공개 배포 전에 정한다.
  - 인라인 스크립트: 테마 첫 적용, Home·Projects·Contact 페이지 스크립트
  - 동적 import 청크
- **Cloudflare 로컬 테스트와 배포 환경의 차이**: 압축 방식(로컬 gzip), HTTP/2·3, 캐시 동작은 배포 URL에서만 확인된다(확인 필요).
