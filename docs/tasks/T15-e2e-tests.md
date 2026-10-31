# T15: E2E 테스트 (Playwright Test, 3개 브라우저, 기능·키보드·axe·접근성 트리, CI)

| 항목 | 값 |
| --- | --- |
| 단계 | 7 |
| 선행 작업 | T14 (PR #43) |
| 담당 | claude |
| 상태 | review |
| 브랜치 | `claude/project-thread-t0t9l8` (실행 환경이 지정한 이름. 원칙상 이름은 `claude/T15-e2e-tests`) |

## 목표

- 지금까지 지시서마다 손으로 확인한 동작을 저장소 테스트로 옮겨, PR마다 CI에서 자동으로 확인한다.
  - 대상: 페이지, 언어 전환, 테마, 명령 팔레트·터미널, 키보드, 접근성(axe), reduced-motion, 리플로, SEO 태그
- 브라우저는 Chromium·WebKit·Firefox 3개다. 지금까지 Chromium만 확인해 이월해 둔 항목(본문 바로가기, 터미널 출력 포커스 등)을 WebKit·Firefox 엔진에서 확인한다.
- 화면 회귀는 픽셀 캡처 대신 접근성 트리(`toMatchAriaSnapshot`)와 핵심 레이아웃 값으로 본다(2026-10-31 사용자 결정, 아래 "결정").
- 원고 반영 뒤에도 같은 테스트로 다시 확인할 수 있게 한다. 문구는 테스트에 하드코딩하지 않는다.

## 배경

- 근거 문서
  - `docs/PLAN.md` §5: 단계 7 "테스트: E2E(Playwright), Lighthouse CI"
  - `AGENTS.md` §6: "`test` 명령은 아직 없다. E2E 테스트는 단계 7에서 추가한다."
- 단계 7은 두 지시서로 나눈다.
  - T15(이 지시서): E2E
  - T16: Lighthouse CI(성능·접근성·SEO 점수 기준). T15 merge 뒤 작성한다.
- 지금 CI(`.github/workflows/ci.yml`)는 설치 → 포맷 → lint → 타입 체크 → 빌드만 한다. 동작 검증은 지시서마다 scratchpad 스크립트로 했고 저장소에 남지 않았다.

### 이 지시서로 닫거나 옮기는 `docs/PLAN.md` §8 항목

| 항목 | 이 지시서에서 하는 일 |
| --- | --- |
| T14 "axe 자동 검사를 E2E에 넣는다" | 범위 2-7. `docs/DESIGN.md` §11 조건 |
| T14 "WebKit·Firefox에서 확인한다" | 범위 2-6. 본문 바로가기, 터미널 출력 포커스·키 스크롤. 결과에 따라 `main` `tabindex`를 정한다. 강제 색상은 엔진 지원을 확인한 범위만(메모) |
| T12 "화면 회귀 검사에 CSS 순서를 지키는 대표 페이지를 넣는다" | 범위 2-9 레이아웃 값 |
| T13 "검증 방법(T13) … 단계 7 E2E로 옮길 수 있다"(`docs/ARCHITECTURE.md` §2 SEO) | 범위 2-2 |
| T03 "Firefox·WebKit … 줄바꿈과 헤더 배치" | 범위 2-9. 320px 가로 넘침과 1280px 헤더 한 줄만 확인한다. 문절 줄바꿈 위치·스크린 리더는 남긴다 |
| T10 "Firefox·Safari 실기, 실제 IME, 실제 스크린 리더" | 범위 2-4. WebKit·Firefox 엔진의 팔레트·터미널 동작만 확인한다. Safari 실기·IME·스크린 리더는 남긴다 |

### 결정 (2026-10-31 사용자 결정)

- **범위 A안**: 기능·키보드·axe는 Chromium·WebKit·Firefox 3개 브라우저에서 돌린다. 화면 회귀는 OS 영향이 없는 접근성 트리·레이아웃 값으로 본다.
- 고르지 않은 안
  - **픽셀 캡처 비교 추가**: 기준 이미지를 CI와 같은 Linux에서만 만들 수 있어 Windows에서는 Docker가 필요하다.
  - **Chromium만**: CI는 빠르지만 WebKit·Firefox 이월 항목이 남는다.
- 새 의존성 2개(아래 범위 1)는 이 결정과 지시서 merge로 승인한 것으로 본다. 다른 의존성을 더하려면 다시 사용자에게 묻는다.

### 확인한 공식 문서·배포 정보 (2026-10-31)

- [Playwright: Visual comparisons](https://playwright.dev/docs/test-snapshots)
  - "Browser rendering can vary based on the host OS, version, settings, hardware…"
  - 기준 캡처 파일 이름에 브라우저와 플랫폼이 붙는다(예: `chromium-darwin`).
  - 일관된 캡처를 얻으려면 기준을 만든 환경과 같은 환경에서 돌리라고 권한다.
  - → 픽셀 비교를 하지 않는 이유(결정).
- [Playwright: Continuous Integration](https://playwright.dev/docs/ci)
  - GitHub Actions 예: `npx playwright install --with-deps` 뒤 테스트를 돌리고, `!cancelled()`일 때 `playwright-report/`를 artifact로 올린다.
  - 브라우저 바이너리 캐시는 권하지 않는다. 복원 시간이 내려받기와 비슷하고, Linux의 OS 의존성은 캐시할 수 없다.
  - CI에서는 `workers: 1`을 권한다(안정성·재현성).
  - Docker 이미지는 `mcr.microsoft.com/playwright:v<버전>-noble` 형식이다.
- [Playwright: Web server](https://playwright.dev/docs/test-webserver)
  - `webServer.command`·`url`으로 테스트 전에 서버를 띄운다.
  - `reuseExistingServer: !process.env.CI`를 권한다.
  - 기본 대기 시간은 60초다.
- [Playwright: TestConfig](https://playwright.dev/docs/api/class-testconfig)
  - `snapshotPathTemplate`은 `toMatchAriaSnapshot` 저장 위치에도 쓰인다.
  - 토큰 `{platform}`은 `process.platform` 값이다.
  - `expect.toMatchAriaSnapshot.pathTemplate`으로 aria 스냅샷 위치만 따로 정할 수 있다.
- [Playwright: TestOptions](https://playwright.dev/docs/api/class-testoptions)
  - `colorScheme`·`reducedMotion`·`forcedColors`·`contrast` 에뮬레이션이 있다.
  - 브라우저별 지원 범위는 이 페이지에 적혀 있지 않다(확인 필요).
- [`@axe-core/playwright`](https://www.npmjs.com/@axe-core/playwright)
  - `new AxeBuilder({ page })`에 `.withTags()`·`.include()`·`.exclude()`·`.disableRules()`를 붙이고 `.analyze()`로 실행한다.
- [GitHub Actions: Billing and usage](https://docs.github.com/en/actions/concepts/billing-and-usage)
  - "GitHub Actions usage is free for standard GitHub-hosted runners in public repositories"
  - 이 저장소는 Public이라 CI 시간이 늘어도 비용은 없다.
- npm 배포 정보(`npm view`, 2026-10-31)

  | 패키지 | 최신 안정판 | 배포일 | 비고 |
  | --- | --- | --- | --- |
  | `@playwright/test` | 1.64.1 | 2026-10-14 | `engines.node >=20` |
  | `@axe-core/playwright` | 4.14.0 | 2026-10-15 | `axe-core ~4.14.0` 포함(T14와 같은 axe 버전), `engines.node >=22.12.0`, peer `playwright-core >=1.0.0` |

- **이 지시서를 쓴 클라우드 실행 환경**
  - Playwright 브라우저 CDN 접근이 막혀 있다(`cdn.playwright.dev` 403, 2026-10-31 확인).
  - 미리 설치된 Chromium(Playwright 1.63용)만 쓸 수 있다.
  - 그래서 이 환경에서는 Chromium만 로컬로 돌리고, WebKit·Firefox는 CI 결과로 확인한다(범위 1 "실행 파일 경로").

## 범위

포함:

1. **기반**
   - `devDependencies`에 `@playwright/test` 1.64.1과 `@axe-core/playwright` 4.14.0을 추가한다. 기존 의존성처럼 정확한 버전으로 고정한다.
   - `package.json` `scripts`에 `"test": "playwright test"`를 추가한다. 빌드는 하지 않으므로 `pnpm build` 뒤에 실행한다.
   - 루트 `playwright.config.ts`
     - `testDir: 'tests/e2e'`
     - 브라우저: `projects` 3개(`chromium`·`webkit`·`firefox`, `devices`의 데스크톱 프리셋). 폭은 테스트에서 정한다(1280·640·375·320px).
     - 서버: `webServer`로 `pnpm preview`(Astro 미리보기, 빌드 결과 `dist/`)를 띄운다. 포트는 고정하고 `reuseExistingServer: !process.env.CI`로 둔다.
     - CI 설정
       - `workers`: CI에서 1(공식 권장)
       - `forbidOnly`: CI에서 켬
       - `retries`: 0. 흔들리는 테스트는 재시도로 가리지 않고 고친다.
     - 실패 기록: `trace: 'retain-on-failure'`, reporter는 `list` + `html`(자동으로 열지 않음)
     - **aria 스냅샷 위치**: `expect.toMatchAriaSnapshot.pathTemplate`(또는 `snapshotPathTemplate`)에서 `{platform}`과 프로젝트 이름을 뺀다. 접근성 트리는 Chromium에서만 비교하므로, 이렇게 해야 Linux CI와 Windows 노트북이 같은 파일을 쓴다. 저장 위치는 `tests/e2e/__snapshots__/`다.
     - **실행 파일 경로**(선택): 브라우저를 내려받을 수 없는 환경을 위해 환경 변수로 Chromium 실행 파일 경로를 줄 수 있게 한다(예: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` → `launchOptions.executablePath`). 값이 없으면 Playwright가 설치한 브라우저를 쓴다. 이름과 쓰는 법은 `docs/ARCHITECTURE.md`에 적는다.
   - **페이지 목록은 하드코딩하지 않는다.**
     - 미리보기 서버의 `/sitemap.xml` `<loc>`(18개)에서 경로를 얻는다. `site` 부분은 떼어 낸다.
     - sitemap 자체가 맞는지는 sitemap과 독립된 목록으로 확인한다(2-2). sitemap에서 페이지가 빠지면 테스트 대상에서도 함께 빠지기 때문이다.
     - 404는 `/404.html`을 더한다.
     - 프로젝트를 더하거나 원고를 바꿔도 테스트를 고치지 않게 하려는 것이다.
   - **문구는 하드코딩하지 않는다.**
     - 역할·이름이 필요하면 `src/i18n/ui.ts`를 import해 쓰거나 role·구조(`getByRole` 등)로 찾는다.
     - 콘텐츠(프로필·프로젝트) 값이 필요하면 빌드 결과에서 읽는다.
   - `tsconfig.json`의 `include`가 `**/*`이므로 테스트도 `pnpm check` 대상이다. ESLint는 필요할 때만 테스트·설정 파일용 전역(Node)을 더한다.
   - `scripts/brand/build.mjs`가 프로젝트 의존성의 Playwright(`@playwright/test`의 `chromium`)를 쓰게 import만 바꾸고 `scripts/brand/README.md` 준비 방법을 고친다. 파비콘·공유 이미지를 다시 만들지는 않는다.
2. **테스트** (`tests/e2e/*.spec.ts`)
   - 파일 나눔은 구현자가 정한다. PR에 "파일 · 테스트 · 브라우저 · 폭" 표를 싣는다.
   - 브라우저 열의 "3"은 Chromium·WebKit·Firefox, "C"는 Chromium만이다.

   | # | 영역 | 확인할 것 | 브라우저 |
   | --- | --- | --- | --- |
   | 2-1 | 페이지 스모크 | 19페이지 각각에 대해 확인한다. 상태 200, `html[lang]`이 경로 언어와 같음, h1 1개, `<title>`이 비어 있지 않고 같은 언어 안에서 겹치지 않음, 페이지 오류(`pageerror`)·콘솔 오류 0. 루트 `/`가 `/ja/`로 이동함(지금은 2초 meta refresh, 단계 8에서 301로 바뀔 수 있으니 도착만 본다). 없는 경로(`/ja/xyz/`)가 404 상태로 404 페이지를 보임 | 3 |
   | 2-2 | SEO 태그 | `docs/ARCHITECTURE.md` §2 "검증 방법(T13)"을 옮긴다. canonical·`og:url` = `site` + 경로, hreflang 3개(자기 포함, x-default = ja)가 짝 페이지와 같음, OG 속성이 하나씩, 파비콘 링크 3개, **sitemap 완전성**: 빌드된 `dist/{ja,en}/**/index.html`(루트 이동·404 제외)을 파일 시스템에서 따로 열거한 경로 집합이 sitemap `<loc>` 경로 집합과 같음(sitemap에서 만든 목록과 비교하지 않는다), `xhtml:link` = `<head>` 묶음, 404의 `noindex`와 canonical·hreflang·`og:url` 없음, robots의 `Sitemap:` 줄 | C (HTML만 보므로) |
   | 2-3 | 언어·테마·내비게이션 | 헤더 내비게이션의 `aria-current`(T03 규칙). 언어 전환 링크가 짝 페이지(상세는 같은 slug)로 간다. 테마 버튼으로 바꾼 값이 `html[data-theme]`·`localStorage`에 남고 다른 페이지로 이동·새로고침해도 유지된다. 시스템 설정(`colorScheme`)을 따르는 기본 상태 | 3 |
   | 2-4 | 명령 팔레트·터미널 (T10) | ⌘K/Ctrl+K(`ControlOrMeta+k`)·헤더 버튼으로 열기, 검색 거르기, ↑↓·Enter 이동, 테마·언어 명령, Esc로 닫고 연 자리로 포커스 복귀. 터미널: 팔레트에서 열기, 입력란 첫 포커스, `help`·`whoami`·`projects`(링크)·모르는 명령(오류)·`clear`·`exit`, ↑↓ 이력, 출력 영역 Tab 도달·포커스 표시·키 스크롤(T14), Esc 닫기·포커스 복귀 | 3 |
   | 2-5 | Contact 복사 버튼 (T07) | Chromium: 클립보드 권한을 주고 복사 값이 메일 주소와 같고 상태 문구가 나온다. WebKit·Firefox: 버튼이 보이고 누르면 성공 또는 실패 문구가 상태 영역에 나온다(엔진마다 권한 처리가 달라 값은 보지 않는다) | 3 |
   | 2-6 | 키보드 (`docs/DESIGN.md` §11 키보드 기준) | 6개 페이지 종류(Home·About·Projects·상세·Contact·404) 1280px에서 확인한다. 첫 Tab이 본문 바로가기, Tab 순서가 화면 순서, Shift+Tab이 정확히 역순, 모든 정지 위치에 포커스 표시(자기 `outline` 또는 카드 `::after`), 고정 헤더 가림 없음. **본문 바로가기**: Enter 뒤 다음 Tab이 `main` 안 첫 요소로 간다 | 3 |
   | 2-7 | axe (`docs/DESIGN.md` §11 자동 검사) | 태그는 `wcag2a`·`wcag2aa`·`wcag21a`·`wcag21aa`·`wcag22aa`·`best-practice`, 위반 0이 기준이다. Chromium: 19페이지 × 라이트·다크 × 1280·375px. WebKit·Firefox: 19페이지 × 라이트·다크 × 1280px. 팔레트·터미널을 연 상태(터미널은 출력이 넘친 상태): Chromium은 라이트·다크 × 1280·375px, WebKit·Firefox는 라이트 1280px. 실행된 axe 버전·규칙 ID를 테스트 결과(attachment 또는 로그)에 남긴다 | 3 (조건 다름) |
   | 2-8 | 강제 색상·reduced-motion | 강제 색상(`forcedColors: 'active'`, 라이트·다크): 주력 태그 배경이 채워져 일반 태그와 다르다(T14). reduced-motion: 디코딩·틸트·카드 → 상세 전환 규칙·타임라인 애니메이션·팔레트 열림이 꺼진다. 같은 테스트를 `no-preference`로도 돌려, 이 효과들이 그 조건에서는 실제로 동작함을 확인한다(빈 검사 방지). 강제 색상을 WebKit·Firefox에서도 돌릴지는 Playwright 지원을 확인해 정한다(메모) | C (+ 지원되면 확장) |
   | 2-9 | 레이아웃 | 320px·640px: 19페이지 가로 넘침 0. 375·640px: 텍스트 간격(1.4.12) 주입 시 잘림 0. 헤더: 1280px에서 한 줄(T03 배치). **CSS 순서 회귀(T12 이월)**: About 기술 스택 첫 태그 목록(`.tag-list`)과 Projects 카드 목록(`.project-grid`)의 위 여백이 main 빌드에서 잰 값과 같다 | 넘침·헤더: 3, 텍스트 간격·CSS 순서: C |
   | 2-10 | 접근성 트리 | 18페이지와 404의 `ariaSnapshot()`(헤더·main·푸터)을 `toMatchAriaSnapshot`으로 비교한다. 기준 파일은 `tests/e2e/__snapshots__/`에 커밋한다 | C |

   - 각 테스트는 해당 조건의 컨텍스트로 연다.
     - 기본 `reducedMotion: 'reduce'`. 2-8의 `no-preference` 검사는 예외다.
     - `waitUntil: 'networkidle'` 또는 필요한 요소 대기. axe·트리 비교 전에는 `document.fonts.ready`도 기다린다.
   - `waitForTimeout`은 키 스크롤 같은 부드러운 스크롤 확인처럼 이유가 있을 때만 쓴다. 이유는 주석으로 남긴다. 가능하면 `expect.poll`·`toHaveJSProperty` 등 조건 대기를 쓴다.
3. **실패를 잡는지 확인**
   - 아래 결함을 하나씩 일부러 넣어 해당 테스트가 실패하는지 확인한다. 결과는 PR 표로 남기고, 결함은 커밋하지 않는다.
     - 터미널 출력 `tabIndex` 제거 → 2-4·2-7
     - 페이지 레이아웃 하나에서 `BaseLayout` import를 화면 컴포넌트 뒤로 옮김 → 2-9
     - hreflang 하나 제거 → 2-2
     - `.tag--featured` 강제 색상 규칙 제거 → 2-8
     - `src/pages/sitemap.xml.ts`에서 한 페이지를 뺌 → 2-2(sitemap 완전성)
     - 헤더 링크 하나의 `aria-current` 제거 → 2-3 또는 2-10
4. **WebKit·Firefox 결과에 따른 수정** (이월 항목)
   - 2-6 본문 바로가기가 WebKit 또는 Firefox에서 실패하면 다음과 같이 고친다.
     - `<main id="main">`에 `tabindex="-1"`을 둔다.
     - `main`이 받은 포커스는 표시하지 않는다(`main:focus { outline: none }`). `main`은 조작 대상이 아니고, 다음 Tab부터 정상 포커스 표시가 보이기 때문이다.
     - 바꾸면 `docs/DESIGN.md` §4 "본문 바로가기"와 §11을 갱신한다.
   - 세 브라우저에서 모두 통과하면 지금처럼 둔다(T14 결정 유지).
   - 그 밖의 엔진별 실패
     - 사이트 결함이면 고친다. 화면이 달라지는 수정은 사용자 확인 뒤에 한다.
     - 엔진 기본 동작이면 테스트를 그 동작에 맞게 쓰고 이유를 주석·PR에 적는다. 예: WebKit이 링크를 Tab 순서에 넣지 않는 설정.
     - 어느 경우든 테스트를 건너뛰어(`skip`·`fixme`) 통과시키지 않는다.
5. **CI** (`.github/workflows/ci.yml`)
   - 빌드 뒤에 다음을 더한다.
     1. `pnpm exec playwright install --with-deps chromium webkit firefox`
     2. `pnpm test`
     3. `!cancelled()`일 때 `playwright-report/`를 artifact로 올린다(보관 기간은 짧게, 예: 7일).
   - 브라우저 캐시는 쓰지 않는다(공식 권장).
   - `timeout-minutes`를 늘린다(예: 30). 실제 걸린 시간은 PR에 적는다.
     - 목표: E2E 단계 10분 이하(ubuntu-latest)
     - 넘으면 범위(2-7 조건)나 `workers`를 조정하고 이유를 적는다.
   - 기존 단계(포맷 → lint → 타입 체크 → 빌드)의 순서와 명령은 바꾸지 않는다.
6. **문서**
   - `docs/ARCHITECTURE.md` §2 새 절 "테스트 (T15 결정)"
     - 구조(`playwright.config.ts`, `tests/e2e/`, 스냅샷 위치)
     - 실행 방법, 브라우저 설치, 실행 파일 경로 환경 변수
     - 페이지 목록·문구를 하드코딩하지 않는 규칙
     - 접근성 트리 스냅샷 갱신 절차: 원고 반영·화면 변경 때 `pnpm test --project=chromium --update-snapshots` → diff를 PR에서 리뷰
     - 하지 않는 것(픽셀 비교)과 이유
   - `AGENTS.md` §6
     - 명령에 `pnpm test`를 더한다.
     - "`test` 명령은 아직 없다" 문장을 바꾼다.
     - CI 순서에 E2E를 더한다.
     - 처음 한 번 하는 브라우저 설치를 적는다.
   - `README.md` "개발 방법": `pnpm test`와 브라우저 설치 한 줄
   - `docs/DESIGN.md` §11 "점검 도구와 조건": 자동화된 항목이 어느 테스트인지 한 줄
   - `docs/PLAN.md`
     - 진행 상태
     - 작업 지시서 표
     - 결정 기록
     - §8 이월 항목 체크(위 "닫거나 옮기는 항목" 표대로, 남는 부분은 남긴다)

제외:

- 픽셀 캡처 비교(`toHaveScreenshot`): 2026-10-31 사용자 결정(A안)
- Lighthouse CI: T16
- Safari·iOS 실기, 실제 스크린 리더(VoiceOver, NVDA, TalkBack), 실제 IME 입력, Windows 고대비 테마의 실제 색. Playwright WebKit·Firefox는 엔진 확인이지 실제 브라우저·OS 확인이 아니다. PLAN §8에 남긴다.
- 터치 기기 에뮬레이션(`hasTouch`, `hover: none`). 틸트·팔레트 키 안내 숨김의 터치 조건은 이번에 넣지 않는다.
- 배포 URL·Cloudflare Workers 함수 테스트: 단계 8
- 콘텐츠·문구 변경, 디자인 변경. 범위 4의 조건부 수정은 예외다.
- 문절 줄바꿈 위치 비교(T03 이월). 엔진마다 줄바꿈이 다를 수 있어 값 비교가 맞지 않는다. 사람이 캡처로 본다.

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `package.json`: `devDependencies` 2개, `scripts.test`
- `pnpm-lock.yaml`: 위 의존성 추가로 생기는 변경만
- `playwright.config.ts` (새 파일)
- `tests/e2e/**` (새 파일, `__snapshots__` 포함)
- `.github/workflows/ci.yml`
- `tsconfig.json`, `eslint.config.mjs`, `.prettierignore`: 테스트·스냅샷을 다루는 데 필요할 때만
- `scripts/brand/build.mjs`, `scripts/brand/README.md`: Playwright import와 준비 방법만
- 조건부(범위 4): `src/layouts/BaseLayout.astro`(`main` `tabindex`), `src/styles/global.css`(`main:focus`)
- 테스트가 찾은 사이트 결함을 고치는 데 필요한 컴포넌트·CSS(PR에 이유, 화면 변경은 사용자 확인)
- 문서: `docs/ARCHITECTURE.md`, `AGENTS.md`(§6만), `README.md`("개발 방법"만), `docs/DESIGN.md`(§11, 범위 4면 §4), `docs/PLAN.md`, `docs/tasks/T15-e2e-tests.md`
- 바꾸지 않는 파일
  - 문구·콘텐츠: `src/i18n/ui.ts`, `src/content/**`
  - 라우트: `src/pages/**`
  - `public/**`: 파비콘·공유 이미지는 다시 만들지 않는다

## 완료 조건

- [x] `pnpm test`가 CI(ubuntu-latest)에서 Chromium·WebKit·Firefox 모두 통과한다.
  - 로컬은 실행 가능한 브라우저로 확인한다. 결과와 환경을 PR에 적는다.
- [x] 범위 2의 2-1~2-10이 모두 있다. PR에 "파일 · 테스트 · 브라우저 · 폭" 표를 싣는다.
- [x] axe 위반 0(범위 2-7 조건). 실행된 axe 버전과 규칙 ID가 테스트 결과에 남는다.
- [x] 범위 3의 결함 주입 6건이 모두 해당 테스트를 실패시킨다(PR 표, 결함은 커밋하지 않음).
  - 구현 결과: `BaseLayout` import 순서(2번째)는 현재 Astro 빌드에서 `dist/`가 바뀌지 않아 결함 자체가 생기지 않았다. 같은 증상(전역 `margin: 0`이 모듈 여백을 이김)을 넣어 2-9가 실패하는 것으로 대신 확인했다.
- [x] 이월 항목 결과를 PR 표로 남긴다. 본문 바로가기와 터미널 출력 포커스가 브라우저별로 어땠는지, 범위 4 수정 여부를 적는다.
- [x] 테스트에 페이지 경로 목록과 화면 문구가 하드코딩되어 있지 않다. 예외(예: 없는 경로 `/ja/xyz/`)는 이유를 주석으로 남긴다.
- [x] `skip`·`fixme`·`only`가 없고 `retries`는 0이다.
- [x] 사이트 빌드 결과(`dist/`)가 main과 같다(범위 4 수정이 없을 때). 테스트 코드는 빌드에 들어가지 않는다.
  - 구현 결과: 범위 4 수정(`main` `tabindex`, `main:focus`)과 테스트가 찾은 결함 수정(상세 担当工程 5칸 그리드 1024px부터, 사용자 결정)만 다르다.
- [x] 새 의존성은 `@playwright/test`·`@axe-core/playwright` 2개뿐이다. `pnpm-lock.yaml` 변경이 이 둘과 하위 의존성뿐이다.
  - 구현 결과: 타입 체크용 `@types/node` 24.19.2를 따로 승인받아 더했다(2026-10-31 사용자 결정). lockfile에는 이 셋과 하위 의존성, 그리고 `vite`(선택적 peer `@types/node`)와 이를 쓰는 `astro`·`@astrojs/react`·`@vitejs/plugin-react`의 해석 키에 `@types/node`가 붙은 변경만 있다.
- [x] CI E2E 단계에 걸린 시간을 PR에 적는다(목표 10분 이하).
- [x] 문서가 갱신되어 있다: `docs/ARCHITECTURE.md` "테스트", `AGENTS.md` §6, `README.md`, `docs/DESIGN.md` §11, `docs/PLAN.md`(진행 상태·표·결정 기록·§8)
- [x] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`, `pnpm test`와 GitHub CI가 통과한다.
- [x] 비밀 값 미포함. 테스트 결과물(`playwright-report/`, `test-results/`)은 커밋하지 않는다(`.gitignore`에 이미 있음).

## 확인 방법

```bash
pnpm install --frozen-lockfile
# 처음 한 번. --with-deps(OS 의존성)는 Linux에서만 필요하다.
pnpm exec playwright install --with-deps chromium webkit firefox
pnpm format:check && pnpm lint && pnpm check && pnpm build
pnpm test                         # 3개 브라우저
pnpm test --project=chromium      # 한 브라우저만
pnpm exec playwright show-report  # 실패 기록 보기
```

- **브라우저를 내려받을 수 없는 환경**: 범위 1의 환경 변수로 Chromium 실행 파일을 지정하고 `--project=chromium`만 돌린다. WebKit·Firefox는 CI 결과로 확인한다.
- **접근성 트리 기준 갱신**: 원고·화면을 바꾼 PR에서 `pnpm test --project=chromium --update-snapshots`를 실행하고, `tests/e2e/__snapshots__/` diff를 리뷰어가 본다.
- **결함 주입**(범위 3): 각 결함을 넣고 해당 테스트만 실행한다(`pnpm test -g <이름>`). 실패를 확인한 뒤 되돌린다.
- **CI**: PR의 `check` 작업 로그에서 E2E 단계 시간과 테스트 수를 본다. 실패하면 artifact의 HTML 보고서를 연다.

## 메모

- 아래는 지시서 작성 시 정한 기본안이다. 사용자(choi)가 구현 PR에서 바꿀 수 있다.
  - 2-7 WebKit·Firefox 조건을 줄인 것
  - `retries: 0`
  - `workers` CI 1
  - 스크립트 이름 `test`
  - 스냅샷 위치
  - 실행 파일 경로 환경 변수 이름
- **WebKit·Firefox axe 조건을 줄인 이유**: 같은 HTML·CSS라 엔진별 차이는 주로 대비 계산·포커스 쪽이다. 폭 375px까지 3배로 돌리면 CI 시간이 크게 는다. 시간이 남으면 넓혀도 된다.
- **문구를 하드코딩하지 않는 이유**: 원고 반영(개발 맨 마지막, 2026-10-31 사용자 결정) 때 테스트를 고치지 않고 같은 테스트로 다시 확인하기 위해서다. 접근성 트리 스냅샷은 문구를 담으므로 그때 갱신한다(의도된 diff).
- **강제 색상**: Playwright 문서에 브라우저별 지원 범위가 없다.
  - 구현 때 WebKit·Firefox에서 `matchMedia('(forced-colors: active)')`가 켜지는지 먼저 확인한다.
  - 켜지면 2-8을 그 브라우저로 넓히고, 아니면 Chromium만 두고 PR에 적는다.
  - Windows 고대비 테마의 실제 색은 어느 쪽이든 PLAN §8에 남긴다.
- **WebKit 키보드**: macOS Safari는 기본 설정에서 Tab이 링크를 건너뛰는 것으로 알려져 있다(공식 문서 미확인). Playwright WebKit(Linux)의 기본 동작도 확인하지 못했다(확인 필요). 2-6을 먼저 WebKit에서 돌려 보고 범위 4 규칙대로 처리한다.
- **IME**: 팔레트·터미널은 `isComposing`·`keyCode 229`일 때 키를 무시한다. Playwright로는 실제 IME 조합을 재현할 수 없어 넣지 않는다(T10 이월 그대로).
- **T16 메모**(다음 지시서): `@lhci/cli` 최신 0.15.1(2025-06-25 배포)은 Lighthouse 12.6.1을 쓴다. Lighthouse 최신은 13.6.0(2026-10-27)이다. T16 작성 때 공식 문서로 다시 확인한다.
- 이 지시서의 공식 문서·배포 정보 확인은 2026-10-31 기준이다. 구현 시 바뀐 점이 있으면 PR에 적는다.
