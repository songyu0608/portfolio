# T12: React 중심 전환 (화면 컴포넌트를 React + TypeScript로)

| 항목 | 값 |
| --- | --- |
| 단계 | 6 |
| 선행 작업 | T11 (PR #34) |
| 담당 | claude |
| 상태 | review |
| 브랜치 | `claude/project-thread-t0t9l8` (실행 환경이 지정한 이름. 원칙상 이름은 `claude/T12-react-components`) |

## 목표

화면 컴포넌트 17개를 Astro 컴포넌트(`.astro`)에서 React 함수 컴포넌트(`.tsx`)와 CSS Modules로 바꾼다. React는 빌드할 때 HTML을 만드는 데만 쓴다(`client:*` 없음). 브라우저가 받는 JS, 화면, 접근성 트리는 지금과 같게 유지한다. 저장소 소개(README, 기술 스택 표기)는 「React + TypeScript」 중심으로 고친다.

## 배경

- `docs/PLAN.md` §7 "React 중심 전환(A안)"(2026-10-31 사용자 결정): Astro는 라우팅·빌드 틀로 두고 화면 컴포넌트를 React로 바꾼다. 소개는 「React + TypeScript」를 중심에 두고, Astro(Vite 기반)는 정적 빌드 도구로 함께 적는다. 고른 이유(일본 채용 공고의 React 수요)와 고르지 않은 안(Next.js 정적 출력 등)의 근거도 §7에 있다. 결정 기록은 `docs/ARCHITECTURE.md` A11이다(이 지시서 PR에서 추가, A1은 `superseded`).
- 디코딩(T08)과 카드 틸트(T08) 같은 작은 효과는 지금처럼 TS 스크립트로 둔다(§7 권고안). React로 바꾸면 그 페이지가 React 본체(gzip 약 66KB)를 받는다.
- 단계 6 순서는 T12 React 전환 → T13 SEO → T14 접근성이다(2026-10-31 사용자 결정). SEO·접근성은 바뀐 마크업을 한 번만 점검하려고 뒤로 미뤘다.

### 지금 구조 (main `b767b8d`)

- 라우트 파일 `src/pages/{ja,en}/**/*.astro`는 화면 컴포넌트에 언어만 넘기는 한 줄 파일이다(ARCHITECTURE A8). 상세는 `getStaticPaths`로 받은 props를 함께 넘긴다.
- 페이지 화면 컴포넌트 `src/components/pages/*.astro`가 콘텐츠를 조회하고(`await get*Content(locale)`), `BaseLayout`으로 감싸고, 페이지 전용 `<script>`를 둔다.
- `src/components/interactive/`(명령 팔레트·터미널, T10)는 이미 React이고, 처음 열 때 동적 import로 브라우저에서 실행된다.

바꿀 파일(17개, 총 2,271줄)과 바꿀 때 주의할 점:

| 파일 | 줄 | 주의할 점 |
| --- | --- | --- |
| `SiteHeader.astro` | 171 | `Astro.url.pathname`, `<script>`(테마 버튼 + 팔레트 런처, 모든 페이지의 헤더 스크립트), 스크립트 선택자 `.theme-toggle` |
| `SiteFooter.astro` | 99 | `await getContactContent(locale)` |
| `LanguageSwitch.astro` | 71 | `Astro.url.pathname`, `hreflang` |
| `ThemeToggle.astro` | 96 | `:global(html.js)`, `:global(:root[data-theme='dark'])` 등, SVG |
| `CommandButton.astro` | 77 | `Astro.url.pathname`, `:global(html.js)`, SVG, `data-command-palette`(런처가 찾는 속성) |
| `SkillTag.astro` | 18 | `class:list`, 스타일 없음(전역 `.tag`) |
| `ProjectCard.astro` | 219 | `<script>`(카드 틸트), `class:list`, `style` 문자열(`view-transition-name`), `.project-card.is-tilting`, `<>` |
| `PhaseList.astro` | 108 | `class:list` 2곳, SVG |
| `Phrases.astro` | 34 | 문자열이면 감싸지 않고 텍스트만 출력 |
| `CareerTimeline.astro` | 167 | `class:list`, `@keyframes`, `animation-timeline`(animation 단축 속성 금지 주석, T09) |
| `SkillStack.astro` | 80 | |
| `CertificationList.astro` | 63 | |
| `pages/HomePage.astro` | 152 | `BaseLayout`, `await getHomeContent`, `<script>`(디코딩), `view-transitions.css`, `.hero__tagline.is-decoding`, `:global(.decode-overlay)` |
| `pages/AboutPage.astro` | 144 | `BaseLayout`, `await getAboutContent`, `class:list`, SVG |
| `pages/ProjectsPage.astro` | 84 | `BaseLayout`, `await getProjectsContent`, `view-transitions.css` |
| `pages/ProjectDetailPage.astro` | 432 | `BaseLayout`, `getStaticPaths` props, `style`(`view-transition-name`), `class:list`, `view-transitions.css` |
| `pages/ContactPage.astro` | 256 | `BaseLayout`, `await getContactContent`, `<script>`(메일 복사), 선택자 `.copy-button[data-copy]`·`.copy-button__text`, HTML 주석(한국어, 지금은 출력 HTML에 그대로 나감), SVG |

스크립트가 클래스로 찾거나 붙이는 이름: `.project-card`·`is-tilting`(`src/scripts/card-tilt.ts`), `is-decoding`·`decode-overlay`(`src/scripts/hero-decode.ts`), `.theme-toggle`(헤더 스크립트), `.copy-button[data-copy]`·`.copy-button__text`(메일 복사). 속성으로 찾는 것은 `[data-decode]`, `[data-command-palette]`, `[data-copy-status]`다.

### 현재 출력 (main `b767b8d`, 2026-10-31 빌드)

빌드 로그: `@font-face 71/251개 유지, 빌드 결과의 글자 530종 검사`. 페이지 18개(ja·en × Home·About·Projects·Contact·상세 5개)와 루트 이동 HTML.

| 페이지 | HTML | 외부 JS | 인라인 모듈 | 인라인 일반 스크립트 | 외부 CSS | 인라인 `<style>` | `data-astro-cid-*` 속성 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/ja/` | 25,784B | 1개 3,531B | 2개 2,644B | 1개 340B | 1개 52,819B | 1개 5,662B | 280 |
| `/en/` | 24,376B | 1개 3,531B | 2개 2,644B | 1개 340B | 1개 52,819B | 1개 5,662B | 261 |
| `/ja/about/` | 11,713B | 1개 3,531B | 0 | 1개 340B | 2개 57,713B | 0 | 146 |
| `/ja/projects/` | 27,379B | 1개 3,531B | 1개 1,133B | 1개 340B | 1개 52,819B | 1개 4,820B | 334 |
| `/ja/projects/order-api/` | 14,216B | 1개 3,531B | 0 | 1개 340B | 2개 58,233B | 1개 1,639B | 167 |
| `/ja/contact/` | 9,926B | 1개 3,531B | 1개 579B | 1개 340B | 1개 52,819B | 1개 2,450B | 94 |

- 크기는 압축 전이다. 외부 JS는 헤더 스크립트 `_astro/SiteHeader.astro_astro_type_script_index_0_lang.*.js`, 인라인 일반 스크립트는 `BaseLayout`의 테마 첫 적용 스크립트다. 인라인 모듈은 Home이 디코딩·틸트, Projects가 틸트, Contact가 메일 복사다.
- 팔레트를 처음 열 때만 받는 JS: `mount.*.js` 11,329B, React·ReactDOM `client.*.js` 218,980B. 참조되지 않는 Astro React 렌더러 진입 파일 `client.*.js` 1,844B가 있다(T03 이월, 첫 로드에 받지 않음).

### 사전 확인 (2026-10-31, 지시서 작성 시 main에서 임시로 바꿔 보고 되돌림)

- `Phrases`·`SkillTag`를 `.tsx`(`Phrases.module.css` 포함)로 바꾼 빌드: 성공. 출력 파일 목록과 페이지별 스크립트 수가 같고, 5페이지 × 2폭(1280px·375px) 캡처 차이가 없었다.
- `.tsx`에서 `src/i18n/paths.ts`(내부에서 `astro:i18n` 사용)를 그대로 쓸 수 있다. CSS Modules의 `:global(...)`가 동작한다(`.probe:global(.is-x)` → `._probe_1xdh2_1.is-x`). `pnpm check`(`astro check`)가 `.tsx`의 타입 오류를 잡는다. `*.module.css` import는 `astro/client.d.ts`의 선언으로 타입 검사를 통과한다.
- `@astrojs/react` 7.1.2 서버 렌더러(`node_modules/@astrojs/react/dist/server.js`·`static-html.js`): `renderToReadableStream`으로 렌더한다. React 출력의 `<link rel="preload|modulepreload|stylesheet|preconnect|dns-prefetch">`는 지운다. Astro가 React 컴포넌트에 넘긴 children은 `<astro-static-slot>` 요소로 감싼다.
- JSX의 값 없는 속성(`<p data-probe>`)은 `data-probe="true"`로 출력된다. 이웃한 텍스트 식 두 개(`{'a'}{'b'}`) 사이에는 `<!-- -->`가 들어간다. 화면에는 영향이 없다.

## 범위

포함:

1. **기준 먼저 남기기**
   - 구현 전에 main을 빌드해 아래 "확인 방법"의 캡처, 접근성 트리, 출력 크기를 저장한다. 같은 환경에서 구현 후 값과 비교한다. 위 "현재 출력"과 다르면 다시 잰 값을 기준으로 쓴다.

2. **화면 컴포넌트를 React로**
   - 위 17개를 같은 위치·같은 이름의 `.tsx`로 바꾼다. 예: `src/components/ProjectCard.astro` → `ProjectCard.tsx` + `ProjectCard.module.css`, `src/components/pages/HomePage.astro` → `pages/HomePage.tsx` + `pages/HomePage.module.css`. 스타일이 없는 컴포넌트는 CSS 파일을 만들지 않는다.
   - 컴포넌트는 props만 받아 그리는 동기 함수로 쓴다. 콘텐츠 조회(`get*Content`, async)는 하지 않고, 조회 결과를 props로 받는다. `src/lib/content.ts`에서는 타입만 가져온다(`import type`). 화면 코드를 Astro 전용 데이터 모듈(`astro:content`)과 떼어 두면, 나중에 다른 React 환경으로 옮기기 쉽다. Astro 렌더러의 async 컴포넌트 처리에 기대지 않아도 된다.
   - `src/i18n/ui.ts`(UI 문구)와 `src/i18n/paths.ts`(경로)는 React 컴포넌트에서 그대로 쓴다. 문구를 하드코딩하지 않는 규칙(AGENTS §7)은 같다.
   - React 컴포넌트 안에는 React 컴포넌트만 넣는다. Astro 컴포넌트나 마크업을 children·slot으로 넘기지 않는다. `<astro-static-slot>` 요소가 생겨 DOM 구조와 `>` 선택자 결과가 바뀌기 때문이다.
   - React 컴포넌트에서 `<title>`·`<meta>`·`<link>`를 렌더하지 않는다. `<head>`는 `BaseLayout.astro`가 맡는다. React 19는 이 요소들을 문서 `<head>`로 옮기는 동작이 있고, Astro 렌더러는 React 출력의 `<link rel="preload|stylesheet…">`를 지운다.
   - `src/components/interactive/`(T10)는 바꾸지 않는다. `command-ui.css`도 그대로 둔다. 열 때 `?url`로 붙이는 전역 CSS라서 CSS Modules로 바꾸지 않는다.

3. **`.astro`로 남기는 파일**
   - `src/layouts/BaseLayout.astro`(유지): 문서 골격, `<head>`, 전역 CSS, 글꼴 preload, 테마 첫 적용 인라인 스크립트, `<style>`(body·main·skip-link)는 그대로 둔다. 바뀌는 점은 세 가지다.
     - `Astro.url.pathname`을 `SiteHeader`에 `pathname` prop으로 넘긴다.
     - 푸터 연락처를 조회해(`getContactContent`) `SiteFooter`에 props로 넘긴다.
     - 헤더 스크립트 `<script>`를 둔다(범위 5).
   - 페이지 레이아웃 `src/layouts/{Home,About,Projects,ProjectDetail,Contact}Layout.astro`(새로, 기본안 이름):
     - 하는 일은 콘텐츠 조회, `<BaseLayout>`(locale·title·description) 안에 React 페이지 컴포넌트 렌더, 그 페이지 전용 `<script>`다.
     - 마크업·스타일은 두지 않는다. `view-transitions.css` import는 지금처럼 Home·Projects·상세에만 들어가게 둔다. 위치는 레이아웃이나 페이지 컴포넌트 중 한 곳이다.
   - 라우트 파일은 언어만 넘기는 한 줄 파일을 유지한다(A8). 예: `<HomeLayout locale="ja" />`. 상세는 `getStaticPaths` 그대로다.
   - 결과로 `.astro` 파일은 `src/pages/**`와 `src/layouts/**`에만 남고, `src/components/` 아래에는 없다.
   - 레이아웃 이름·위치는 구현자가 바꿀 수 있다. 바꾸면 이유를 PR에 적는다. 위 역할 분담(조회·`<head>`·스크립트는 `.astro`, 마크업·스타일은 React)은 지킨다.

4. **스타일: CSS Modules (기본안)**
   - 각 컴포넌트의 `<style>`을 같은 이름의 `*.module.css`로 옮긴다. 값·규칙은 바꾸지 않는다.
   - 클래스 이름은 컴포넌트 안에서만 쓰는 짧은 camelCase로 바꾼다. CSS Modules가 이름을 파일 단위로 나누므로 BEM 접두어가 필요 없다. 예: `.project-card__title` → `.title`, `.project-card--compact` → `.compact`. 여러 클래스는 작은 도우미 `cx()`(새 파일, 예: `src/lib/cx.ts`)로 합친다. `clsx` 같은 새 의존성은 쓰지 않는다.
   - 전역 클래스(`src/styles/global.css`의 `container`·`card`·`button`·`button--primary`·`tag`·`tag--featured`·`tag-list`·`project-grid`·`sr-only` 등)는 문자열 그대로 쓴다.
   - 스크립트가 요소를 찾을 때는 `data-*` 속성을 쓴다. 지금 클래스로 찾는 `.project-card`·`.theme-toggle`·`.copy-button`·`.copy-button__text`가 대상이다. 스크립트가 붙이는 상태 클래스(`is-tilting`, `is-decoding`)와 스크립트가 만드는 요소(`decode-overlay`)는 전역 이름으로 두고, CSS에서 `:global(...)`로 꾸민다. 예: `.card:global(.is-tilting)`. `:global` 없이 `.card.is-tilting`으로 쓰면 `is-tilting`도 바뀐 이름이 되어 맞지 않는다. 상태를 `data-*` 속성으로 바꾸는 방법도 된다(스크립트 동작은 같게).
   - 문서 상태 선택자(`:global(html.js)`, `:global(:root[data-theme='dark'])`)는 그대로 `:global`로 쓴다.
   - `@keyframes`는 쓰는 파일 안에 두고 같은 파일에서 참조한다. CSS Modules는 키프레임 이름도 바꾼다. `CareerTimeline`의 `animation-timeline`은 지금처럼 개별 속성으로 쓴다(단축 속성 금지 주석 유지, T09).
   - Astro scoped style과의 차이 두 가지를 확인한다.
     - **자손 요소 선택자**: Astro는 `.x a`를 같은 컴포넌트의 `a`에만 적용하지만, CSS Modules는 하위 컴포넌트의 `a`에도 적용한다. 확인할 선택자 예: `.site-nav a`, `.lang-switch li`, `.project-card__facts dd`, `.detail-section__content h2`. 하위 컴포넌트 요소에 닿으면 클래스 선택자로 바꾼다.
     - **명시도**: Astro는 `.x[data-astro-cid-…]`(클래스 + 속성)로 출력하고, CSS Modules는 클래스 하나라서 명시도가 낮아진다. 같은 요소에 전역 클래스와 컴포넌트 클래스를 함께 쓰는 곳은 CSS 순서에 따라 결과가 바뀔 수 있다. 예: `project-card card`, `tag-list home-section__body`, `project-grid home-section__body`, `site-header__inner container`. 캡처 비교로 확인하고, 다르면 선택자를 고쳐 맞춘다. `!important`는 쓰지 않는다.

5. **스크립트**
   - 동작·타이밍·reduced-motion 처리는 바꾸지 않는다. 바꾸는 것은 위치와 요소를 찾는 선택자뿐이다.
   - 헤더 스크립트(`SiteHeader.astro`의 `<script>`)는 `src/scripts/site-header.ts`(새로)로 옮기고, `BaseLayout.astro`의 `<script>`가 import한다. 출력은 지금처럼 모든 페이지에 외부 모듈 1개, 압축 전 4KB 이하여야 한다(2026-10-31 사용자 결정). 파일 이름은 바뀌어도 된다.
   - 메일 복사(`ContactPage.astro`의 `<script>`)는 `src/scripts/copy-button.ts`(새로)로 옮기고 Contact 레이아웃에서 import한다.
   - 디코딩(`hero-decode.ts`)은 Home 레이아웃, 카드 틸트(`card-tilt.ts`)는 Home·Projects 레이아웃에서 import한다.
   - 각 스크립트는 지금과 같은 페이지에만 들어가야 한다. 디코딩은 Home, 틸트는 Home·Projects, 메일 복사는 Contact, 나머지 페이지는 헤더 스크립트만 받는다. 한 레이아웃의 스크립트들이 인라인 모듈 하나로 합쳐지는 것은 괜찮다(아래 완료 조건은 개수가 아니라 합계 크기로 본다).

6. **Astro 문법 → React**

   | Astro | React |
   | --- | --- |
   | `Astro.props` | 함수 인자(`interface Props`) |
   | `Astro.url.pathname` | `pathname` prop. `BaseLayout` → `SiteHeader` → `CommandButton`·`LanguageSwitch` |
   | `class`, `class:list` | `className`, `cx()` |
   | `style={\`view-transition-name: …\`}` | `style={{ viewTransitionName: … }}`(`csstype` 3.2.3에 있음) |
   | `{list.map(...)}` | 같음. 반복 요소에 `key` |
   | HTML 주석 `<!-- … -->` | `{/* … */}`. Contact의 한국어 주석이 출력 HTML에서 빠진다(의도한 차이) |
   | `hreflang`, `for`, `tabindex`, SVG `stroke-width` 등 | `hrefLang`, `htmlFor`, `tabIndex`, `strokeWidth` 등(React DOM 속성 이름) |
   | 값 없는 속성 `data-decode` | `data-decode`(출력은 `"true"`. `[data-decode]` 선택자는 그대로 맞음) |
   | 텍스트·요소 사이 공백 | Astro(`compressHTML`)와 JSX의 공백 처리가 다르다. 줄바꿈이 든 공백은 JSX가 지운다. 비교에서 차이가 난 곳만 `{' '}`를 넣는다 |

7. **문서**
   - `README.md`: 오래된 문구(단계 0, "React 컴포넌트와 hydration은 아직 없음", `/en/` 준비 페이지)를 지금 상태로 고친다. 기술 스택은 「React + TypeScript」를 맨 앞에 둔다. 기본안:
     - React 19 + TypeScript(strict): 화면 컴포넌트. 빌드 때 HTML로 렌더하고, 명령 팔레트·터미널만 브라우저에서 React로 동작
     - Astro 7(Vite 기반): 정적 빌드, 라우팅, 다국어(ja/en), 콘텐츠 컬렉션(YAML + zod)
     - CSS Modules + CSS 변수 디자인 토큰, CSS View Transitions·스크롤 기반 애니메이션
     - Cloudflare Workers 정적 자산(단계 8 API는 Workers 함수)
     - 품질: ESLint, Prettier, `astro check`(TypeScript), GitHub Actions CI
   - `docs/ARCHITECTURE.md` §2: 디렉터리 구조, "페이지 파일 방식"(라우트 → 페이지 레이아웃 → React 페이지 컴포넌트), 출력 설명(헤더 스크립트 파일 이름, CSS·HTML 크기), 스타일 방식(CSS Modules 규칙: 전역 클래스, `:global`, `data-*` 훅). §3 A11 비고에 구현 결과를 적는다.
   - `docs/DESIGN.md`: 파일 경로(`*.astro` → `*.tsx`)와 "Astro `<script>`" 표현을 실제 위치에 맞게 고친다.
   - `AGENTS.md` §5·§7: 이 지시서 PR에서 먼저 고친다. 구현이 다르면 맞춰 고친다.
   - `docs/PLAN.md` §7 "React 중심 전환" 항목을 체크하고 결과를 적는다.

제외:

- SEO 메타·OG·sitemap·robots·favicon·404 (T13)
- 접근성 점검·수정 (T14). 다만 이번 전환으로 접근성 트리가 달라지면 안 된다(완료 조건).
- 명령 팔레트·터미널(`src/components/interactive/`) 코드 변경, T08~T10 인터랙션 동작 변경
- 작은 효과(디코딩·틸트)를 React로 바꾸는 것(§7 권고안. 바꾸려면 사용자 결정)
- 라우팅 방식 변경(언어별 페이지 파일 A8 유지, `[locale]` 동적 경로로 바꾸지 않음), Next.js 등 다른 프레임워크로 옮기기
- 디자인·문구·콘텐츠(원고) 변경, 디자인 토큰 값 변경
- 새 의존성(`clsx`, Tailwind, CSS-in-JS, 테스트 라이브러리 등)
- E2E·Lighthouse CI·테스트 러너 도입 (단계 7)
- GitHub 저장소 설명(About) 변경: 저장소 설정이라 사용자가 한다(메모)

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `src/components/*.astro`, `src/components/pages/*.astro`: 삭제
- `src/components/*.tsx`, `src/components/*.module.css`, `src/components/pages/*.tsx`, `src/components/pages/*.module.css`: 새로
- `src/layouts/BaseLayout.astro`, `src/layouts/*Layout.astro`(새 페이지 레이아웃)
- `src/pages/{ja,en}/**/*.astro`: import 경로와 호출 컴포넌트만
- `src/scripts/card-tilt.ts`, `src/scripts/hero-decode.ts`: 요소를 찾는 선택자만
- `src/scripts/site-header.ts`, `src/scripts/copy-button.ts`: 새로(기존 `<script>` 내용을 옮김)
- `src/lib/cx.ts`: 새로
- `src/lib/content.ts`: 조회 결과 타입 export 추가만. 조회·검사 로직은 바꾸지 않는다.
- `src/styles/global.css`: 명시도·순서 차이를 맞추는 데 꼭 필요할 때만(이유를 PR에)
- `scripts/font-subset.mjs`: 글자를 모으는 파일 범위가 바뀌어야 할 때만(지금도 `.tsx`·`.css`를 모은다)
- `eslint.config.mjs`: `.tsx` 화면 컴포넌트에 맞춘 설정이 꼭 필요할 때만. 규칙을 약하게 하지 않는다.
- `README.md`, `AGENTS.md`(§5·§7), `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/PLAN.md`, `docs/tasks/T12-react-components.md`
- 바꾸지 않는 파일: `src/components/interactive/**`, `src/scripts/theme.ts`, `src/scripts/command-launcher.ts`, `src/content/**`, `src/i18n/**`, `src/styles/tokens.css`, `src/styles/view-transitions.css`, `astro.config.mjs`, `package.json`, `pnpm-lock.yaml`

## 완료 조건

- [x] `src/components/` 아래에 `.astro` 파일이 없고, `.astro`는 `src/pages/**`와 `src/layouts/**`에만 있다. 라우트 파일은 언어(와 상세 props)만 넘긴다.
- [x] 어느 HTML에도 `<astro-island`·`<astro-slot`·`<astro-static-slot`이 없고, 소스에 `client:` 지시어가 없다. `data-astro-cid-` 속성은 `BaseLayout`의 요소(body·main·skip-link 등)에만 남는다.
- [x] 화면이 main과 같다. Playwright Chromium, `reducedMotion: 'reduce'`, 글꼴 로드 후 전체 페이지 캡처 45장의 픽셀 차이가 0이다.
  - 40장: Home·About·Projects·상세(`order-api`)·Contact × ja·en × 라이트·다크 × 1280px·375px
  - 5장: JS를 끈 상태(`javaScriptEnabled: false`) ja 라이트 1280px, 5페이지
  - 차이가 있으면 차이 영역 캡처와 원인을 PR에 적고, 고칠 수 없으면 사용자 확인을 받는다.
  - 결과: 45장 모두 PNG 바이트가 같다(차이 0).
- [x] 접근성 트리가 main과 같다. 18페이지 모두 `page.locator('body').ariaSnapshot()` 결과가 main과 글자 단위로 같다. 역할, 이름, 텍스트, 공백이 대상이다.
- [x] 페이지가 받는 JS가 main과 같다.
  - 외부 JS는 모든 페이지에서 헤더 스크립트 1개(압축 전 4KB 이하)다.
  - 페이지별 인라인 모듈 합계 크기는 main보다 크지 않다.
  - 스크립트는 범위 5의 페이지에만 들어간다.
  - 테마 첫 적용 인라인 스크립트는 바뀌지 않는다.
  - 결과: 헤더 스크립트 3,531B → 3,537B(+6B, `[data-theme-toggle]` 선택자). 인라인 모듈 합계는 Home 2,644B → 2,640B, Projects 1,133B → 1,129B, Contact 579B → 565B.
- [x] 첫 로드에 React 관련 파일(`mount.*.js`, React·ReactDOM 청크, React 렌더러 진입 파일)·`command-ui.*.css`·`commands.json`을 받지 않는다(모든 페이지 종류, Network로 확인). 팔레트를 처음 열 때 받는 파일 목록이 main과 같고, 크기 합계가 main보다 크지 않다. `dist/{ja,en}/commands.json`이 main과 바이트 단위로 같다.
- [x] 페이지별 HTML 크기와 CSS 합계(외부 + 인라인 `<style>`)가 main보다 크지 않다. 커지면 늘어난 양과 이유를 PR에 적는다.
  - 결과: 6페이지 모두 HTML(인라인 `<style>` 제외)과 CSS 합계가 줄었다. 페이지 CSS가 외부 파일에서 인라인 `<style>`로 바뀐 페이지(About·상세)는 인라인 `<style>`을 포함한 HTML 파일 크기만 보면 커진다.
- [x] 인터랙션이 그대로 동작한다: Home 디코딩(재생·reduced-motion에서 안 함), 카드 틸트(Home·Projects, 포인터·reduced-motion), 카드 → 상세 View Transitions(제목 이름 연결), About 경력 타임라인 스크롤 강조, 명령 팔레트·터미널(⌘K / Ctrl+K·헤더 버튼·언어 전환·테마 명령), 테마 버튼(`aria-pressed`, 저장, 시스템 설정 따르기), 메일 복사(완료·실패 표시, `role="status"`), 언어 전환 링크, 본문 바로가기, 현재 위치 표시(`aria-current`). JS를 끄면 팔레트 버튼·복사 버튼이 숨고 나머지 정보는 모두 보인다.
- [x] T11 결과를 유지한다.
  - 글꼴 누락 검사가 빌드에서 통과하고(누락 0), `@font-face`가 71개 이하다(늘면 이유).
  - T11 측정 방법의 Playwright CLS: 6페이지 × 1280px·375px 모두 0.1 이하다.
  - Lighthouse 3회 중앙값(`/ja/`, `/ja/projects/`, 모바일·데스크톱): Performance 모바일 90·데스크톱 95 이상, CLS 0.1 이하, TBT 0ms.
  - 결과: 누락 0, `@font-face` 71개. CLS 최대 0.058(375px `/en/`, main과 같음). Lighthouse 중앙값 `/ja/` 모바일 100·데스크톱 100, `/ja/projects/` 모바일 99·데스크톱 100, CLS 0.017 이하, TBT 0ms.
- [x] 빌드 로그에 React 경고(`key`, 알 수 없는 DOM 속성 등)가 없다.
- [x] `pnpm lint`에서 규칙을 끄지 않는다. 꼭 필요한 예외는 그 줄에만 이유를 적은 주석으로 둔다.
- [x] 새 의존성이 없다(`package.json` 의존성 항목, `pnpm-lock.yaml` 변경 없음).
- [x] 문서가 갱신되어 있다: `README.md`(React + TypeScript 중심, 최신 상태), `docs/ARCHITECTURE.md` §2·A11 비고, `docs/DESIGN.md` 경로·표현, `AGENTS.md` §5·§7(구현과 다르면), `docs/PLAN.md` §7.
- [x] PR 본문에 main과 구현 후의 출력 표(위 "현재 출력"과 같은 열), 캡처 비교 결과(장수·차이 0), 접근성 트리 비교 결과, 대표 캡처 3장(Home ja 라이트 1280px, Projects en 다크 375px, Contact ja 라이트 1280px)이 있다.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`와 GitHub CI가 통과한다.
- [x] `docs/PLAN.md`의 진행 상태와 작업 지시서 표 갱신, 비밀 값 미포함.

## 확인 방법

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm check && pnpm build
find src/components -name '*.astro'            # 출력 없음
grep -rlE '<astro-(island|slot|static-slot)' dist || echo none
grep -rn 'client:' src --include='*.astro' || echo none   # .tsx 주석의 설명 문구는 제외
pnpm preview
```

- **캡처 비교**: main과 브랜치를 각각 빌드해 다른 포트로 띄운다(예: main은 `git worktree`). 같은 Playwright 스크립트로 위 45장을 찍는다. 컨텍스트 옵션은 `viewport`(1280×800, 375×800), `colorScheme`(`light`/`dark`), `reducedMotion: 'reduce'`다. 각 장은 `waitUntil: 'networkidle'`, `document.fonts.ready` 뒤 `fullPage: true`로 찍는다. PNG 바이트가 같으면 차이 0이다. 다르면 픽셀 비교 도구로 차이 영역을 확인한다(새 의존성으로 추가하지 않는다).
- **접근성 트리**: 같은 조건으로 18페이지를 열어 `await page.locator('body').ariaSnapshot()`를 파일로 저장하고, main과 `diff`한다.
- **출력 크기**: 각 HTML에서 `<script src>`, `<script type="module">`, 인라인 `<script>`, `<link rel="stylesheet">`, `<style>`의 개수·크기를 센다. 위 "현재 출력" 표의 열과 같다.
- **CLS·Lighthouse**: `docs/tasks/T11-performance.md` "측정 방법"을 따른다.
- **인터랙션**: `pnpm preview`에서 완료 조건의 목록을 직접 조작해 확인한다. 팔레트 첫 열기 전후 Network 목록을 비교한다.

## 메모

- 아래는 지시서 작성 시 정한 기본안이다. 사용자(choi)가 구현 PR에서 바꿀 수 있다.
  - 스타일 방식은 CSS Modules다.
  - 클래스 이름은 컴포넌트 안에서만 쓰는 짧은 camelCase다.
  - 스크립트가 요소를 찾을 때는 `data-*` 속성을 쓴다.
  - 페이지 레이아웃 이름·위치는 `src/layouts/*Layout.astro`다.
  - README 기술 스택 문구는 범위 7의 안이다.
- CSS Modules를 고른 이유: 새 의존성 없이 Vite가 처리하고, React 프로젝트에서 널리 쓰는 방식이라 소개 목적에 맞는다. 컴포넌트마다 이름 범위가 나뉘어 Astro scoped style의 역할을 잇는다. 검토한 다른 안은 두 가지다.
  - 컴포넌트별 일반 CSS import(클래스 이름 그대로): 스크립트를 고치지 않아도 되지만, 이름 충돌과 요소 선택자 누출을 사람이 관리해야 한다.
  - Tailwind·CSS-in-JS: 새 의존성이 필요하고, 디자인 토큰 방식(CSS 변수)을 다시 짜야 한다.
- 화면 비교가 픽셀 0을 목표로 하는 이유: 이번 작업은 구현 방식만 바꾸는 리팩터링이다. 화면이나 접근성 트리가 달라지면 그 차이를 T13·T14에서 따로 찾기 어렵다.
- 명시도·자손 선택자·공백은 사전 확인한 두 컴포넌트(`Phrases`·`SkillTag`)에서는 문제가 없었다. 큰 컴포넌트(`ProjectCard`, `ProjectDetailPage`, `SiteHeader`)는 확인하지 않았다. 차이가 나기 쉬운 곳이므로 컴포넌트 몇 개씩 바꾸고 그때마다 캡처 비교를 돌리는 순서를 권한다.
- 이 사이트는 React를 "빌드 때 HTML을 만드는 도구"로 쓰고, 브라우저에서는 팔레트·터미널만 React로 동작한다. 소개 문서에서 「바닐라 React(직접 번들)」인지 「Vite 기반」인지 물으면, 빌드는 Astro가 Vite로 한다고 답할 수 있게 README에 "Astro 7(Vite 기반)"을 적는다.
- `src/i18n/paths.ts`는 `astro:i18n`을 쓰므로 React 컴포넌트가 Astro 환경에 일부 기대게 된다. 이번에는 그대로 둔다. 다른 React 환경으로 옮길 때는 이 파일만 바꾸면 되도록, 화면 컴포넌트는 경로 함수를 이 파일에서만 가져온다.
- README는 저장소 문서 규칙(AGENTS §1)대로 한국어로 둔다. 채용 담당자용 일본어·영어 README가 필요하면 별도로 결정한다.
- merge 후 GitHub 저장소 설명(About, 지금 "Personal portfolio site (Astro + Cloudflare)")을 React + TypeScript 중심으로 바꾸는 것은 사용자가 저장소 설정에서 한다. 예: "Personal portfolio site (React + TypeScript, Astro static build, Cloudflare)".
