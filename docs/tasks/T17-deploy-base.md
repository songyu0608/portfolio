# T17: 배포 기반 (Cloudflare Workers 정적 자산, `/` 301·404·응답 헤더, GitHub Actions 배포, 공개 전 Access 잠금)

| 항목 | 값 |
| --- | --- |
| 단계 | 8 |
| 선행 작업 | T16 (구현 PR #49, 완료 반영과 Home LCP 흔들림 수정 PR #50) |
| 담당 | claude |
| 상태 | done |
| 브랜치 | `claude/project-thread-t0t9l8` (실행 환경이 지정한 이름. 원칙상 이름은 `claude/T17-deploy-base`) |

## 목표

- main에 merge하면 CI(`check`·`lighthouse`)가 통과한 뒤 Cloudflare Workers(`*.workers.dev`)에 자동으로 배포된다.
- Cloudflare에서만 정해지는 동작을 저장소 설정으로 관리하고 로컬·CI에서 시험한다.
  - `/` → `/ja/` 301
  - 없는 경로의 404 상태와 404 페이지
  - 끝 슬래시 이동
  - 응답 헤더
- 원고를 반영하기 전에는 Cloudflare Access로 choi만 볼 수 있다(2026-11-01 사용자 결정).
  - 첫 배포 **전에** 계정 단위 Access를 켜 둔다. 그래서 처음부터 잠긴 채 배포되고, 잠금 없이 열리는 때가 없다.

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
  - workers.dev에 배포하고 Access로 choi만 들어오게 한다.
  - 첫 배포 전에 잠근다(PR #51 교차 리뷰 반영, 범위 6).
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
  - [Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)(문서 갱신일 2026-10-12)
    - 먼저 계정에 Zero Trust가 켜져 있어야 한다("Zero Trust enabled on your account").
    - **Protect all Workers**(계정 단위)
      - 계정의 모든 Worker에 로그인을 요구한다. 대상에는 "Workers you deploy in the future"도 들어간다. 그래서 첫 배포 전에 켤 수 있다.
      - 범위는 "Previews only"와 "All traffic" 중에서 고른다.
      - Workers & Pages 화면의 "Protect all Workers" 카드 › Enable Access에서 켠다.
    - **Protect one Worker**: Worker의 Access 탭에서 켠다. workers.dev 주소와 미리보기를 포함해 그 Worker의 모든 도메인을 막는다. Worker가 있어야 켤 수 있다.
    - **특정 호스트 이름·경로**: Zero Trust › Access › Applications에서 self-hosted 앱으로 만든다. workers.dev 호스트 이름도 대상이 된다. Worker가 먼저 있어야 하는지는 적혀 있지 않다.
    - 로그인 정책
      - "Cloudflare account"는 그 Cloudflare 계정의 멤버만 들인다.
      - "Email domain"은 입력한 도메인의 확인된 메일 주소를 들인다.
      - 메일 주소 하나만 허용하는 등의 세부 설정은 만든 뒤 Zero Trust에서 Access 앱을 고친다.
    - 우선순위는 호스트 이름·경로 규칙 → Worker 규칙 → 계정 규칙이다. 좁은 규칙을 지우면 밑에 있던 넓은 규칙이 적용된다.
    - 정적 자산이 있는 Worker도 Access가 자산까지 막는다. 다만 내부 router가 `ctx.access`(로그인한 사용자 정보)를 사용자 Worker에 넘기지 않는다.
  - [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)(문서 갱신일 2026-09-22): "When enabled, your `workers.dev` URL is available publicly." 막으려면 Access가 필요하다.
  - [Zero Trust 요금](https://www.cloudflare.com/plans/sase-zero-trust.md): Free 플랜 $0, 사용자 50명까지. 가입 때 결제 수단이 필요한지는 문서에 없었다. → 사용자 준비 2에서 확인: Free 플랜도 결제 수단 등록과 "무료 한도를 넘는 사용분을 매달 청구" 동의가 필요했다(2026-11-01).

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
     | `preview_urls` | `false` | 미리보기 배포를 쓰지 않는다(제외 항목) |
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
     | `environment` | `production`(GitHub 환경, 사용자 준비 5) |
     | `concurrency` | 작업 단위로는 두지 않는다. 워크플로 전체의 기존 설정(`cancel-in-progress: true`)으로 main에 새 push가 오면 이전 실행이 배포 작업까지 취소된다. 그래서 이전 커밋이 새 커밋보다 늦게 배포되지 않는다(메모) |
     | `timeout-minutes` | 예: 10 |

     - 단계: checkout → pnpm → Node(`.nvmrc`, pnpm 캐시) → `pnpm install --frozen-lockfile` → `pnpm build` → `pnpm exec wrangler deploy`
     - `CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID`는 환경 비밀 값에서 그 단계의 `env`로만 준다.
     - `cloudflare/wrangler-action`은 쓰지 않는다. lockfile에 고정된 `wrangler`를 그대로 쓰고 외부 action을 늘리지 않는다(공식 예시와 다른 점, 메모).
   - 배포한 URL을 CI에서 확인하지 않는다. Access 뒤라 서비스 토큰 없이는 열 수 없다. 사람이 확인한다(사용자 준비 6).
6. **사용자 준비(choi, Cloudflare·GitHub 화면)**
   - 구현 PR merge 전에 1~5를 끝낸다.
     - 3이 없으면 첫 배포가 잠금 없이 공개된다.
     - 5가 없으면 merge 뒤 main의 `deploy` 작업이 실패한다.
   - 비밀 값은 저장소에 넣지 않는다(`AGENTS.md` §4-8).

   | 순서 | 할 일 | 비고 |
   | --- | --- | --- |
   | 1 | Cloudflare 계정(무료)을 만들고 Workers 화면에서 workers.dev 하위 도메인을 정한다 | 하위 도메인은 공개 주소의 일부가 된다. 계정은 이 사이트 전용으로 쓴다(다른 공개 Worker가 있으면 메모 "계정을 다른 Worker와 같이 쓸 때") |
   | 2 | Zero Trust를 켠다(Free 플랜) | 팀 이름을 정한다. 결제 수단 등록이 필요하다(2026-11-01 확인, 아래 "결과") |
   | 3 | **첫 배포 전에** Workers & Pages › "Protect all Workers" › Enable Access: 범위 **All traffic**, 정책 "Cloudflare account"(계정 멤버는 choi 하나) | "Previews only"를 고르면 workers.dev 주소가 공개된다. 메일 하나로 줄이려면 만든 뒤 Zero Trust에서 Access 앱을 고친다 |
   | 4 | API 토큰: "Edit Cloudflare Workers" 템플릿, 계정 하나로 제한. 계정 ID를 확인한다 | |
   | 5 | GitHub 저장소 Settings › Environments에서 `production`을 만든다 | 배포 브랜치를 `main`만으로 제한하고, 환경 비밀 값 `CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID`를 넣는다 |
   | 6 | 첫 배포 뒤 시크릿 창으로 확인한다 | 주소를 열면 Access 로그인 화면이 나오고 사이트 본문은 보이지 않는다. 로그인하면 `/`가 `/ja/`로 가고, 없는 경로가 404 페이지를 보인다 |

   - 결과(배포 성공, 비로그인 때 본문이 보이지 않음, 응답 확인)는 완료 반영 PR에 적는다.
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
       - T01 301 항목·T13 `not_found_handling` 항목: 이 지시서로 처리. 배포 URL 확인은 사용자 준비 6
       - T13 x-default 항목: 위 "루트 이동과 x-default"
     - §8에 공개 배포 때 할 일을 더한다: 계정 단위 Access 끄기(메모 "Access가 보호 경계다"), `X-Robots-Tag: noindex` 지우기, `site` 교체

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

- [x] `pnpm test:workers`가 로컬과 CI `check` 작업에서 통과한다. 범위 4 표를 모두 확인한다.
- [x] 범위 4의 결함 주입 3건이 모두 해당 확인을 실패시킨다(PR 표, 결함은 커밋하지 않음).
- [x] `pnpm exec wrangler deploy --dry-run`이 로그인 없이 통과한다. 읽은 자산 파일 수를 PR에 적는다.
- [x] 새 의존성은 `wrangler` 하나다. `allowBuilds`는 `esbuild`·`workerd`를 실행하지 않는다. `pnpm audit` 변화와 lockfile의 기존 패키지 변경을 PR에 적는다.
- [x] `dist/`가 main과 비교해 `_redirects`·`_headers` 두 파일만 다르다.
- [x] `deploy` 작업은 main push에서만 돈다. PR CI에서는 건너뛴 것으로 보인다. 비밀 값은 `production` 환경에서만 받는다.
- [x] 문서가 갱신되어 있다: `docs/ARCHITECTURE.md`(§2 배포·SEO 404, 디렉터리 구조, §3 ADR), `AGENTS.md` §5·§6, `README.md`, `docs/PLAN.md`(진행 상태·표·결정 기록·§8)
- [x] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`, `pnpm test`, `pnpm lighthouse`, `pnpm test:workers`와 GitHub CI가 통과한다.
- [x] 비밀 값 미포함. 계정 ID·API 토큰은 GitHub 환경 비밀 값에만 둔다.
- [x] 구현 PR merge 전: 사용자 준비 1~5가 끝나 있다. 특히 3(계정 단위 Access, All traffic)이 첫 배포 전에 켜져 있다.
- [x] merge 뒤(사용자 준비 6): 첫 배포 성공, 시크릿 창에서 사이트 본문이 보이지 않음, 로그인 뒤 `/` 301·404 확인. 완료 반영 PR에 적는다.

## 결과 (2026-11-01, 완료 반영)

- 구현 PR #52: PR CI에서 `check`(`pnpm test:workers` 포함)·`lighthouse` 통과, `deploy`는 건너뜀. Codex 교차 리뷰 수정 필요 없음.
- 사용자 준비 1~5(choi, 2026-11-01 19:02~19:18 JST)
  - 1: 하위 도메인 `songyu0608.workers.dev`. 사이트 주소는 `https://portfolio.songyu0608.workers.dev`
  - 2: Zero Trust Free. 팀 이름은 자동으로 정해졌다(로그인 화면 주소 `<팀 이름>.cloudflareaccess.com`에만 쓰임). 결제 수단 등록과 초과 사용분 청구 동의가 필요했다. 좌석은 Access 로그인을 통과한 사용자만 쓰고, 정책이 "Cloudflare account"라 choi 1석이다.
  - 3: "Protect all Workers"를 범위 All traffic, 정책 Cloudflare account(Allow), 세션 24시간으로 켰다. 켠 뒤 카드 문구는 "Every Worker is protected by an account-wide Access policy that covers production and preview traffic", Status Enabled.
  - 4: API 토큰은 "Edit Cloudflare Workers" 템플릿, 계정 하나, Zone은 All zones(도메인 없음), IP 제한 없음(GitHub Actions IP가 바뀜), **만료 1년(2027-11-01경)**. 만료되면 main의 `deploy`가 실패하므로 새로 만들어 GitHub 비밀 값만 바꾼다.
  - 5: GitHub 환경 `production`, 배포 브랜치 `main`만, 환경 비밀 값 `CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID`
- 첫 배포: PR #52 merge(19:18 JST) 뒤 main CI [run 41296927161](https://github.com/songyu0608/portfolio/actions/runs/41296927161)에서 `check`·`lighthouse` 통과 뒤 `deploy` 성공(19:28 JST, 작업 31초). `wrangler deploy` 로그: 자산 179개 업로드(`_redirects`·`_headers`는 설정 파일이라 자산에서 빠짐), Version ID `ee72deaa-87bd-4bc7-9453-d1a5aeef72f8`.
- 사용자 준비 6(choi, 시크릿 창, 19:48~20:19 JST)
  - 주소를 열면 Cloudflare Access 로그인 화면("Log in to All Workers", 로그인 수단 Cloudflare)이 나오고 사이트 본문은 보이지 않았다.
  - 로그인 뒤 `/ja/`로 이동해 Home이 보였다.
  - 없는 경로(`/aaa/`)는 404 페이지를 보였다. 일본어·영어 두 언어의 404 페이지(`dist/404.html`)가 그대로 나왔다(주소는 `/aaa/` 그대로).
  - 응답 상태 코드(301·404)와 헤더는 배포 URL에서 직접 보지 못했다. 클라우드 작업 환경의 네트워크 정책이 `*.workers.dev` 연결을 막고, 브라우저 화면만 확인했다. 상태 코드·헤더는 `pnpm test:workers`(로컬·CI의 `wrangler dev`)로 확인한 값이다. 배포 URL에서의 확인은 공개 배포 때 Lighthouse·E2E와 함께 한다(`docs/PLAN.md` §8).

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
- **첫 배포 전에 잠근다**(PR #51 교차 리뷰 반영)
  - 처음 쓴 안은 첫 배포 뒤 Worker 단위로 Access를 켜는 것이었다. 이 안은 그 사이 몇 분 동안 잠금 없이 열린다. `noindex`나 주소를 알리지 않는 것은 접근 제한이 아니어서, 사용자 결정(choi만 열람)과 맞지 않았다.
  - 계정 단위 "Protect all Workers"는 앞으로 배포할 Worker도 막는다. 그래서 사용자 준비 3을 첫 배포 전에 한다.
  - 사용자 준비 3을 했는데도 시크릿 창에서 본문이 보이면, 바로 Workers & Pages에서 `portfolio`를 지우거나 `workers_dev: false`로 다시 배포한다. 그 뒤 원인을 PR에 적는다.
- **계정을 다른 Worker와 같이 쓸 때**: 계정 단위 Access는 다른 공개 Worker도 잠근다. 그럴 때는 사용자 준비 3 대신 `portfolio.<하위 도메인>.workers.dev`의 호스트 이름 Access 앱을 첫 배포 전에 만든다. Worker가 없을 때 만들 수 있는지는 문서에 없다(확인 필요). 만들 수 없으면 사용자에게 다시 묻는다.
- **Access가 보호 경계다**
  - 정적 자산도 Access가 막는다. 저장소 코드에는 잠금이 없어서, Access 설정을 끄거나 규칙을 지우면 바로 공개된다. 공개 전까지 Access 설정은 choi만 바꾼다.
  - 공개 배포 때 계정 단위 Access를 끈다. 이 계정에 잠가 둘 Worker가 따로 있으면, 계정 단위를 두고 이 Worker만 공개로 바꾸는 방법도 있다. 문서의 Worker 단위 우회 "Make a Worker public"이 그것이다.
  - T18부터 Worker 함수가 생겨도 정적 자산이 있는 Worker는 `ctx.access`를 받지 못한다(문서). 함수에서 로그인 사용자를 확인해야 하면 그때 방법을 정한다.
- **`wrangler-action` 대신 `pnpm exec wrangler deploy`**
  - 공식 예시는 `cloudflare/wrangler-action@v4`다. 이 저장소는 `wrangler`를 devDependency로 고정하므로 action 없이 같은 버전을 쓴다.
  - 리뷰에서 action을 쓰자는 의견이 있으면 바꿔도 된다.
- **`wrangler` 갱신**: 거의 매일 새 판이 나온다(2026-10-20~29에 6판). 정확한 버전으로 고정하고 필요할 때 올린다.
- **CSP**: 공개 배포 전에 정한다.
  - 인라인 스크립트: 테마 첫 적용, Home·Projects·Contact 페이지 스크립트
  - 동적 import 청크
- **Cloudflare 로컬 테스트와 배포 환경의 차이**: 압축 방식(로컬 gzip), HTTP/2·3, 캐시 동작은 배포 URL에서만 확인된다(확인 필요).
