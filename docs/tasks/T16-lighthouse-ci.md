# T16: Lighthouse CI (Lighthouse 13, 성능·접근성·Best Practices·SEO 점수 기준, CI)

| 항목 | 값 |
| --- | --- |
| 단계 | 7 |
| 선행 작업 | T15 (PR #46) |
| 담당 | 미배정 |
| 상태 | todo |
| 브랜치 | `<agent>/T16-lighthouse-ci` |

## 목표

- PR마다 CI에서 Lighthouse를 돌린다. 성능·접근성·Best Practices·SEO 점수가 기준 아래로 내려가면 CI가 실패한다.
  - 지금까지 지시서마다 손으로 잰 기준을 자동으로 지킨다: T11 성능, T13 SEO·Best Practices, T14 접근성.
- 점수 요약을 PR의 CI 화면에서 바로 볼 수 있게 한다. 자세한 보고서는 artifact로 남긴다.
- 원고 반영 뒤에도 같은 검사로 다시 잰다. 페이지 목록은 하드코딩하지 않는다.

## 배경

- 근거 문서
  - `docs/PLAN.md` §5: 단계 7 "E2E(Playwright, T15) → Lighthouse CI(T16)"
  - `docs/PLAN.md` §2: 접근성·성능 "Lighthouse 기준 유지"
  - `docs/tasks/T15-e2e-tests.md`: "T16: Lighthouse CI(성능·접근성·SEO 점수 기준)"
- 지금까지의 Lighthouse 측정은 모두 손으로 했고 저장소에 남지 않았다.

  | 지시서 | 측정 | 기준·결과 |
  | --- | --- | --- |
  | T11 | Lighthouse 12.6.1 CLI, `pnpm preview`, 6페이지 × 모바일·데스크톱, 3회 중앙값 | 목표: Performance 모바일 90·데스크톱 95 이상, CLS 0.1 이하. 결과: 모바일 92~98, 데스크톱 95~100 |
  | T13 | 같은 방법, 모바일 1회 | Best Practices 96 → 100(`/favicon.ico` 404 해결), SEO 100 |
  | T14 | 같은 방법, 접근성만, 모바일 1회, 5페이지 | 접근성 100(`docs/DESIGN.md` §11) |

- `docs/PLAN.md` §8 "원고 반영 후: Home 한 줄 소개 길이가 바뀌면 Home CLS를 다시 잰다"
  - 이 지시서 뒤로는 CI가 PR마다 Home CLS를 잰다(Lighthouse 모바일·데스크톱).
  - 항목은 닫지 않고 주석만 단다. T11의 Playwright 측정(지연 150ms·1.6Mbps, 1280·375px)은 Lighthouse와 조건이 달라 원고 반영 때 따로 본다.

### 결정 (2026-11-01 사용자 결정)

- **도구: `lighthouse` 13.6.0을 직접 쓴다.** 측정·판정 코드는 저장소에 둔다(범위 1~3).
- 고르지 않은 안: `@lhci/cli` 0.15.1(Lighthouse CI 공식 CLI)
  - 설정 파일 하나로 collect·assert·upload를 할 수 있어 코드가 적다.
  - 하지만 Lighthouse 12.6.1을 정확한 버전으로 고정해 쓴다. 13으로 올릴 수 없다.
  - 0.15.1(2025-06-25)이 지금도 최신판이다.
  - 아래 "의존성 점검"처럼 `pnpm audit` 경고가 7건(high 5) 늘어난다.
- 새 의존성 `lighthouse` 13.6.0은 이 결정과 지시서 merge로 승인한 것으로 본다. 다른 의존성을 더하려면 다시 사용자에게 묻는다.

### 의존성 점검 (2026-11-01, `pnpm add -D --save-exact` 후 `pnpm audit`)

main의 `pnpm audit`은 1건이다(moderate, `minimatch`, ESLint 계열). 각 안을 더했을 때 늘어나는 경고는 아래와 같다.

| 더한 패키지 | 늘어난 경고 | 경로 |
| --- | --- | --- |
| `lighthouse` 13.6.0 | moderate 1: `glob` | `lighthouse` > `@sentry/node` > … > `glob` |
| `@lhci/cli` 0.15.1 | high 5: `tmp` 1, `extract-zip` 2, `basic-ftp` 1, `zod` 1 / moderate 1: `uuid` / low 1: `tmp` | `@lhci/cli` > `tmp`·`uuid`·`inquirer`, `lighthouse` 12.6.1 > `puppeteer-core` > … |
| (참고) `lighthouse` 12.6.1 | high 4: `extract-zip` 2, `basic-ftp` 1, `zod` 1 | `lighthouse` > `puppeteer-core` > … |

- 세 경우 모두 설치 스크립트(`preinstall`·`install`·`postinstall`)가 있는 패키지는 없었다(각 설치 결과의 `package.json`을 모두 확인).
- `lighthouse` 13.6.0을 더할 때 lockfile에서 기존 패키지가 바뀌는 곳
  - `supports-color` 7.2.0이 빠지고, ESLint 계열 등의 해석 키(선택적 peer)가 8.1.1을 가리킨다.
  - 그 밖의 기존 패키지는 버전이 그대로다. `ansi-regex`·`strip-ansi` 등은 다른 버전이 함께 더해질 뿐이다.
- 경고가 실제로 악용될 수 있는 경로인지는 확인하지 않았다. CI에서 우리 빌드 결과만 여는 개발 도구다.

### 사전 측정 (2026-11-01, 이 지시서를 쓴 실행 환경)

환경: 클라우드 컨테이너, Chrome for Testing 153(Playwright가 설치한 Chromium), Node 24.19.0, 빌드는 main(`fdcc3e2`).

1. `@lhci/cli` 0.15.1(Lighthouse 12.6.1), `staticDistDir`(gzip 서버), 10페이지 × 모바일·데스크톱 × 3회

   | 폼팩터 | Performance 중앙값 | 접근성·BP·SEO | CLS 최대 | TBT 최대 | 걸린 시간 |
   | --- | --- | --- | --- | --- | --- |
   | 모바일 | 98~100 | 30회 모두 100 | 0.028 | 11ms | 약 6분 15초 |
   | 데스크톱 | 100 | 30회 모두 100 | 0.046 | 0ms | 약 6분 10초 |

   - 회차 하나만 크게 낮았다: `/ja/` 모바일 첫 회차 73(FCP 4.4s, 나머지 두 회차 98·100). 측정 전체의 첫 회차라 Chrome·서버가 데워지지 않은 영향으로 보인다(추정).
   - 그래서 성능은 한 회차가 아니라 3회 중앙값으로 판정한다(범위 2).
2. Lighthouse 12.6.1과 13.6.0을 같은 서버(gzip)에서 번갈아 잼. 6페이지(`/ja/`, `/en/`, `/ja/about/`, `/ja/projects/`, `/ja/projects/order-api/`, `/ja/contact/`) × 모바일·데스크톱 × 3회, 버전마다 36회

   | 폼팩터 | 버전 | Performance 페이지별 중앙값 | 회차 최저 | FCP 범위 | 접근성·BP·SEO |
   | --- | --- | --- | --- | --- | --- |
   | 모바일 | 12.6.1 | 97~100 | 96 | 957~2,106ms | 18회 모두 100 |
   | 모바일 | 13.6.0 | 모두 100 | 85 | 750~810ms | 18회 모두 100 |
   | 데스크톱 | 12.6.1 | 모두 100 | 98 | 364~921ms | 18회 모두 100 |
   | 데스크톱 | 13.6.0 | 모두 100 | 100 | 200~214ms | 18회 모두 100 |

   - 13은 FCP·LCP가 12보다 낮았고, FCP는 회차 사이 차이도 작았다. 원인은 확인하지 않았다(확인 필요). 13의 점수 계산 방식은 바뀌지 않았다(아래 공식 문서).
   - 13의 최저 85는 `/ja/` 모바일 한 회차다. LCP만 4.4s였고 FCP·CLS·TBT는 다른 회차와 비슷했다. Home은 한 줄 소개 디코딩 재생이 끝나야 LCP가 정해져(`docs/DESIGN.md` §5 LCP) 회차마다 흔들릴 수 있다(추정).

- Lighthouse 13.6.0에는 "Agentic Browsing" 카테고리가 있다.
  - 보고서 설명: "This category is still under development and subject to change."
  - 사전 측정(13.6.0, 36회) 점수는 모두 100이다. 감사 대부분은 해당 없음(`notApplicable`)이다.
  - 기준에 넣지 않고 기록만 한다(범위 2).

### 확인한 공식 문서·배포 정보 (2026-11-01)

- [Lighthouse 13.0 (Chrome for Developers, 2025-10-10)](https://developer.chrome.com/blog/lighthouse-13-0)
  - 성능 감사가 insight 감사(`*-insight`)로 바뀌고, 예전 감사 일부가 없어졌다(`font-size`, `uses-rel-preload` 등).
  - "There are no changes to the performance scoring in this version." 점수는 지표(FCP·LCP·TBT·CLS·SI)로 계산한다.
  - Node 22.19 이상이 필요하다(이 저장소는 24.19.0).
  - → T11 PR의 진단 이름(예: "렌더 차단 리소스")은 13에서 다른 이름으로 나온다. 점수 기준은 그대로 쓸 수 있다.
- npm 배포 정보(`npm view`, 2026-11-01)

  | 패키지 | 최신 안정판 | 배포일 | 비고 |
  | --- | --- | --- | --- |
  | `lighthouse` | 13.6.0 | 2026-10-27 | `engines.node >=22.19`, `bin.lighthouse` = `cli/index.js`, `exports` 필드 없음. axe-core 4.14.0 포함(E2E의 `@axe-core/playwright`와 같은 axe 버전) |
  | `@lhci/cli` | 0.15.1 | 2025-06-25 | 의존성 `lighthouse` 12.6.1(정확한 버전). 0.15.1 뒤 배포 없음 |

- [Lighthouse CI 설정 문서](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)(쓰지 않지만 판정 방식을 참고)
  - 같은 URL을 여러 번 재고(`numberOfRuns`, 기본 3), 점수 판정은 `aggregationMethod`(`median`·`optimistic`·`pessimistic`·`median-run`)로 모은다.
  - 보고서를 `temporary-public-storage`에 올리면 누구나 열 수 있는 링크가 생긴다. 이 지시서는 공개 업로드를 하지 않는다.
- [GitHub Actions 과금](https://docs.github.com/billing/managing-billing-for-your-products/managing-billing-for-github-actions)
  - Public 저장소의 표준 GitHub-hosted runner 사용은 무료다. 작업을 늘려도 비용은 없다.
- Playwright 1.64.1 코드(`playwright-core/lib/coreBundle.js`)
  - headless Chromium을 띄울 때 `--blink-settings=primaryHoverType=2,…,primaryPointerType=4,…`를 더한다.
  - → Playwright로 연 브라우저에 Lighthouse를 붙이면 hover·pointer 미디어 쿼리 조건이 실제 Chrome과 달라질 수 있다. 이 사이트는 카드 틸트에 hover 조건을 쓴다(T08). 그래서 Lighthouse CLI가 Chrome을 직접 띄우게 한다(범위 1).

## 범위

포함:

1. **기반**
   - `devDependencies`에 `lighthouse` 13.6.0을 정확한 버전으로 추가한다.
   - `package.json` `scripts`에 `"lighthouse": "playwright test -c playwright.lighthouse.config.ts"`를 추가한다.
     - 빌드하지 않으므로 `pnpm build` 뒤에 실행한다(`pnpm test`와 같다).
   - **실행 틀은 Playwright Test다.** 루트에 `playwright.lighthouse.config.ts`를 새로 둔다.
     - 이유
       - E2E의 페이지 목록 함수(`tests/e2e/support/site.ts`)를 그대로 쓸 수 있다.
       - 미리보기 서버(`webServer`), HTML 보고서, CI artifact 흐름이 T15와 같다.
     - `testDir: 'tests/lighthouse'`. E2E 설정(`playwright.config.ts`)은 바꾸지 않는다. `pnpm test`에 Lighthouse가 섞이지 않는다.
     - `projects`: `mobile`, `desktop` 2개. 프로젝트 이름으로 폼팩터를 정한다.
     - `workers: 1`(로컬·CI 모두): 측정끼리 CPU를 나눠 쓰면 점수가 흔들린다.
     - `retries: 0`, CI에서 `forbidOnly`
     - 테스트 하나의 제한 시간은 3회 측정이 끝날 만큼 넉넉히 준다(예: 3분).
     - reporter: `list` + `html`(`lighthouse-report/`, 자동으로 열지 않음)
     - `webServer`: E2E와 같은 `astro preview --port <E2E와 다른 포트> --ignore-lock`, `reuseExistingServer: !process.env.CI`
       - 미리보기 서버는 gzip으로 응답한다(2026-11-01 확인). 배포 환경과의 차이는 메모.
   - **Lighthouse 실행**: 측정 1회마다 `lighthouse` 패키지의 CLI를 새 프로세스로 실행한다.
     - 플래그
       - `--chrome-flags="--headless=new --no-sandbox"`
       - `--output=json --output=html`, 결과는 테스트 출력 폴더(`testInfo.outputPath()`)에
       - 데스크톱: `--preset=desktop`. 모바일: 기본값
       - 그 밖의 설정(스로틀링 등)은 기본값이다. T11·T13·T14 측정과 같은 설정이다. 다만 13은 12보다 FCP·LCP가 낮게 나와(배경 사전 측정 2) 지표 값은 이전 측정과 그대로 비교하지 않는다.
     - CLI가 회차마다 새 Chrome 프로필로 Chrome을 띄운다. Playwright로 연 브라우저에 붙이지 않는다(위 "확인한 공식 문서" Playwright 항목).
     - `--no-sandbox`: 루트로 도는 컨테이너 등 실행 환경에 따라 Chrome 샌드박스가 시작되지 않는다. 우리 빌드 결과만 여므로 끈다.
   - **Chrome 실행 파일**: Playwright가 설치한 Chromium(`chromium.executablePath()`)을 Lighthouse CLI의 `CHROME_PATH`로 준다.
     - 환경 변수 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`가 있으면 그 값을 쓴다(E2E와 같은 이름).
     - 이유: 브라우저 버전이 lockfile의 Playwright 버전으로 고정된다. 점수가 바뀌면 코드 변경 때문인지 바로 알 수 있다. GitHub runner에 미리 설치된 Chrome은 runner 이미지가 갱신될 때 바뀐다.
   - **페이지 목록**: `sitePages()`(sitemap 18페이지 + 404)에서 언어·종류마다 sitemap 순서의 첫 페이지를 고른다.
     - 지금은 5종류(Home·About·Projects·상세·Contact) × ja·en = 10페이지다.
     - 404는 넣지 않는다. `noindex`라 SEO "크롤링 가능" 감사가 의도대로 실패한다. 페이지 구조는 E2E가 본다.
     - 페이지 경로를 하드코딩하지 않는다. 고르는 함수가 필요하면 `tests/e2e/support/site.ts`에 더해도 된다. E2E 동작은 바꾸지 않는다.
2. **판정 기준**: 페이지 × 폼팩터마다 3회 잰다. 테스트 하나 = 페이지 하나 × 폼팩터 하나다.

   | 항목 | 기준 | 모으는 방법 | 근거 |
   | --- | --- | --- | --- |
   | Performance | 모바일 90 이상, 데스크톱 95 이상 | 3회 중앙값 | T11 목표 |
   | CLS | 0.1 이하 | 3회 중앙값 | T11 목표, `docs/DESIGN.md` §2 |
   | 접근성 | 100 | 3회 모두 | T14, `docs/DESIGN.md` §11 |
   | Best Practices | 100 | 3회 모두 | T13 |
   | SEO | 100 | 3회 모두 | T13 |
   | Agentic Browsing | 기준 없음(기록만) | — | 개발 중인 카테고리(배경) |

   - 성능 점수가 중앙값인 회차를 대표 회차로 정한다. 보고서·요약 표는 대표 회차 값을 쓴다.
   - 접근성·BP·SEO를 "3회 모두"로 보는 이유: 페이지 구조로 정해지는 점수다. 회차마다 다르면 그 자체가 결함 신호다(예: 애니메이션 도중 대비).
   - 모든 기준을 본 뒤 한 번에 실패시킨다(`expect.soft` 등). 실패 메시지에 다음을 적는다.
     - 접근성·BP·SEO: 점수가 1 미만인 감사 ID와 제목
     - 성능: 회차별 점수와 FCP·LCP·TBT·CLS·SI
   - 건너뛰기(`skip`·`fixme`)와 재시도로 통과시키지 않는다.
3. **결과 남기기**
   - Playwright HTML 보고서(`lighthouse-report/`)에 테스트마다 대표 회차의 Lighthouse HTML 보고서를 attachment로 붙인다.
   - 요약 표를 남긴다. 열: 페이지 · 폼팩터 · Performance · 접근성 · BP · SEO · Agentic Browsing · LCP · CLS · TBT
     - 로컬: 콘솔 출력
     - CI: GitHub Actions 작업 요약(`$GITHUB_STEP_SUMMARY`)
     - 이유: artifact를 내려받지 않고 PR의 CI 화면에서 점수를 본다.
     - 만드는 방법(테스트에서 줄 추가, reporter 등)은 구현자가 정한다.
   - 측정 결과(JSON·HTML)는 커밋하지 않는다. `lighthouse-report/`를 `.gitignore`에 더한다. ESLint·Prettier가 보고서 폴더를 검사하지 않게 한다.
4. **실패를 잡는지 확인**
   - 아래 결함을 하나씩 일부러 넣어 해당 기준이 실패하는지 확인한다. 결과는 PR 표로 남기고, 결함은 커밋하지 않는다.
   - 빌드 결과(`dist/`)의 HTML을 직접 고쳐도 된다. 확인 뒤 다시 빌드한다.

   | 결함 | 실패해야 하는 기준 |
   | --- | --- |
   | `<html>`의 `lang` 제거 | 접근성 |
   | 페이지 하나에 `<meta name="robots" content="noindex">` 추가 | SEO |
   | 페이지 스크립트에 `console.error(...)` 추가 | Best Practices |
   | Home에서 약 0.5초 뒤 히어로 위에 높이가 큰 요소를 끼워 넣는 스크립트 | CLS |
   | 첫 화면에서 약 1초 동안 메인 스레드를 막는 동기 반복문 | 모바일 Performance |

5. **CI** (`.github/workflows/ci.yml`)
   - 새 작업 `lighthouse`를 더한다. 기존 `check` 작업과 동시에 돈다(`needs` 없음).
   - `strategy.matrix`로 `mobile`·`desktop` 두 작업으로 나눈다. `fail-fast: false`로 한쪽이 실패해도 다른 쪽 결과를 남긴다.
   - 단계
     1. checkout → pnpm → Node(`.nvmrc`, pnpm 캐시) → `pnpm install --frozen-lockfile`
     2. `pnpm build`
     3. `pnpm exec playwright install --with-deps chromium`(캐시하지 않음, T15와 같은 이유)
     4. `pnpm lighthouse --project=<matrix 값>`
     5. `!cancelled()`일 때 `lighthouse-report/`를 artifact로 올린다(폼팩터별 이름, 보관 7일).
   - 포맷·lint·타입 체크는 `check` 작업이 하므로 이 작업에서 반복하지 않는다.
   - `timeout-minutes`를 둔다(예: 20).
     - 목표: 작업마다 10분 이하(ubuntu-latest). E2E(약 8분)와 동시에 돌아 전체 CI 시간이 크게 늘지 않게 한다.
     - 실제 걸린 시간을 PR에 적는다.
   - `check` 작업은 바꾸지 않는다.
6. **문서**
   - `docs/ARCHITECTURE.md`
     - §2 "테스트": Lighthouse 하위 항목을 더한다. 도구·버전, 실행 방법, 페이지 고르는 규칙, 기준표, 회차·대표 회차, Chrome 실행 파일, CI 작업, 결과 보는 곳
     - "Lighthouse CI는 T16" 문장을 고친다.
     - §3 ADR에 Lighthouse 검사 결정을 더한다. 고르지 않은 안(`@lhci/cli`, 공개 업로드, Playwright 브라우저에 붙이기)과 이유를 적는다.
   - `AGENTS.md`
     - §5: 테스트 줄을 실제 도구에 맞게 고친다.
     - §6: 명령에 `pnpm lighthouse`, CI 순서에 Lighthouse 작업을 더한다.
   - `README.md` "개발 방법": `pnpm lighthouse` 한 줄
   - `docs/DESIGN.md`
     - §11 "점검 도구와 조건"의 Lighthouse 행과 자동화 문단: T16 자동화를 적는다.
     - §2 글꼴 CLS 문단: CI가 PR마다 잰다는 한 줄
   - `docs/PLAN.md`
     - 진행 상태, 작업 지시서 표, 결정 기록
     - 단계 7을 done으로 바꾼다.
     - §8 Home CLS 재측정 항목에 주석을 단다(배경).

제외:

- 배포 URL 측정: 단계 8. 실제 Cloudflare 응답(압축 방식, 캐시 헤더, HTTP/2·3)은 미리보기 서버와 다르다.
- 실제 기기·실제 사용자 측정(RUM, CrUX, Cloudflare Web Analytics): 단계 8 방문 분석에서 정한다.
- Lighthouse CI 서버, `temporary-public-storage` 업로드: 보고서가 외부 저장소에 올라간다.
- 파일 크기 예산(공통 CSS·헤더 스크립트 크기 등): 이번에 넣지 않는다(메모).
- 404 페이지 측정
- Agentic Browsing 카테고리 기준
- 사이트 화면·콘텐츠 변경. 기준 미달이 나오면 메모의 규칙을 따른다.

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `package.json`: `devDependencies` 1개(`lighthouse`), `scripts.lighthouse`
- `pnpm-lock.yaml`: 위 의존성 추가로 생기는 변경만
- `playwright.lighthouse.config.ts` (새 파일)
- `tests/lighthouse/**` (새 파일)
- `tests/e2e/support/site.ts`: 페이지 고르는 함수를 더할 때만(E2E 동작은 바꾸지 않음)
- `.github/workflows/ci.yml`: `lighthouse` 작업 추가만
- `.gitignore`, `.prettierignore`, `eslint.config.mjs`, `tsconfig.json`: 보고서 폴더·새 설정 파일을 다루는 데 필요할 때만
- 문서: `docs/ARCHITECTURE.md`, `AGENTS.md`(§5·§6만), `README.md`("개발 방법"만), `docs/DESIGN.md`(§2 한 줄, §11), `docs/PLAN.md`, `docs/tasks/T16-lighthouse-ci.md`
- 바꾸지 않는 파일
  - 사이트: `src/**`, `public/**`, `astro.config.mjs`, `scripts/**`
  - E2E: `playwright.config.ts`, `tests/e2e/**`(위 `site.ts` 예외 말고)

## 완료 조건

- [ ] `pnpm lighthouse`가 로컬과 CI(ubuntu-latest, `mobile`·`desktop` 두 작업)에서 통과한다.
  - 로컬 결과와 환경(Chrome 버전, 걸린 시간)을 PR에 적는다.
- [ ] 범위 2의 기준이 모두 들어 있다. 10페이지 × 2폼팩터의 대표 회차 점수 표를 PR에 싣는다.
- [ ] CI 작업 요약(`$GITHUB_STEP_SUMMARY`)에 요약 표가 나온다. artifact에 Playwright HTML 보고서와 Lighthouse HTML 보고서가 들어 있다.
- [ ] 범위 4의 결함 주입 5건이 모두 해당 기준을 실패시킨다(PR 표, 결함은 커밋하지 않음).
- [ ] 페이지 경로를 하드코딩하지 않았다. 측정 대상은 sitemap에서 고른다.
- [ ] `skip`·`fixme`·`only`가 없고 `retries`는 0이다.
- [ ] 새 의존성은 `lighthouse` 13.6.0 하나다. `pnpm-lock.yaml` 변경은 이것과 하위 의존성, 그리고 해석 키 변경(배경 "의존성 점검")뿐이다. `pnpm audit` 결과(main 대비 늘어난 경고)를 PR에 적는다.
- [ ] 사이트 빌드 결과(`dist/`)가 main과 같다.
- [ ] CI `lighthouse` 작업마다 걸린 시간을 PR에 적는다(목표 10분 이하). `check` 작업은 그대로 통과한다.
- [ ] 문서가 갱신되어 있다: `docs/ARCHITECTURE.md`(§2 "테스트", §3 ADR), `AGENTS.md` §5·§6, `README.md`, `docs/DESIGN.md`(§2, §11), `docs/PLAN.md`(진행 상태·표·단계 7·결정 기록·§8 주석)
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`, `pnpm test`, `pnpm lighthouse`와 GitHub CI가 통과한다.
- [ ] 비밀 값 미포함. 측정 결과물은 커밋하지 않는다.

## 확인 방법

```bash
pnpm install --frozen-lockfile
# 처음 한 번. E2E 때 이미 설치했으면 다시 하지 않아도 된다. --with-deps는 Linux만.
pnpm exec playwright install --with-deps chromium
pnpm build
pnpm lighthouse                       # 모바일·데스크톱 10페이지 × 3회(이 환경 약 12분)
pnpm lighthouse --project=mobile      # 한쪽만
pnpm exec playwright show-report lighthouse-report
```

- **브라우저를 내려받을 수 없는 환경**: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<Chromium 경로> pnpm lighthouse`
- **결함 주입**(범위 4): 결함을 넣고 해당 페이지 테스트만 실행한다(`pnpm lighthouse -g <경로>`). 실패를 확인한 뒤 되돌린다.
- **CI**: PR의 `lighthouse (mobile)`·`lighthouse (desktop)` 작업에서 작업 요약의 점수 표를 본다. 실패하면 artifact의 HTML 보고서를 연다.

## 메모

- 아래는 지시서 작성 시 정한 기본안이다. 사용자(choi)가 구현 PR에서 바꿀 수 있다.
  - 페이지 10개(언어·종류마다 하나)
  - 3회 측정과 모으는 방법(성능·CLS 중앙값, 나머지 3회 모두)
  - 기준값(T11·T13·T14 그대로)
  - CI를 폼팩터별 두 작업으로 나눈 것
  - Chromium을 Playwright 버전으로 고정한 것
  - 스크립트 이름 `lighthouse`, 보고서 폴더 `lighthouse-report/`
- **흔들림**
  - 사전 측정에서 한 회차가 73까지 떨어졌다(배경). GitHub runner에서의 흔들림은 아직 모른다(확인 필요).
  - CI에서 흔들림으로 보이는 실패가 나오면 재실행이나 재시도로 넘기지 않는다. 회차별 값을 PR에 남기고, 회차 수·기준 조정은 사용자 결정으로 한다.
- **기준 미달이 나오면**
  - 사이트 결함이면 고친다. 화면이 달라지는 수정은 사용자 확인 뒤에 한다. 이때 `src/**` 수정 이유를 PR에 적는다.
  - 측정 환경 때문이면(예: runner 성능) 기준을 낮추지 말고 PR에 근거를 적어 사용자에게 묻는다.
- **미리보기 서버와 배포 환경의 차이**: `astro preview`는 gzip, Cloudflare는 다른 압축 방식·캐시 헤더를 쓸 수 있다(확인 필요). 배포 URL 측정은 단계 8에서 한다.
- **필수 검사 지정**: GitHub 브랜치 보호에서 CI 작업을 필수 검사로 지정했다면 새 작업 이름(`lighthouse (mobile)` 등)을 더해야 한다. 이 저장소의 설정은 확인하지 않았다. 사용자가 GitHub 설정에서 정한다.
- **파일 크기 예산**: T10·T11에서 정한 크기(헤더 스크립트 압축 전 4KB 이하 등)는 이번에 자동화하지 않는다. 필요하면 빌드 결과 크기를 보는 작은 검사로 따로 넣는다(Lighthouse와 별개).
- **Agentic Browsing**: 결과만 요약 표에 남긴다. 카테고리가 바뀌는 중이라 기준으로 쓰지 않는다.
- 이 지시서의 공식 문서·배포 정보 확인은 2026-11-01 기준이다. 구현 시 바뀐 점이 있으면 PR에 적는다.
