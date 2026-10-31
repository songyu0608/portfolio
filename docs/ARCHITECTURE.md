# ARCHITECTURE — 구조와 기술 결정 기록

## 1. 전체 구조

```
[방문자]
   │
   ▼
Cloudflare Workers (정적 자산)
   ├─ /ja/*, /en/*   ← Astro 정적 빌드 결과 (HTML/CSS/최소 JS)
   └─ /api/*         ← 단계 8: Workers 함수 (연락 폼, 회사별 페이지)
                         ├─ Turnstile 검증
                         ├─ 메일 발송 (Cloudflare Email Service 또는 Resend)
                         ├─ D1 (연락 기록, 선택)
                         └─ KV (회사별 토큰·열람 기록)
```

- 기본은 완전 정적. 서버 실행이 필요한 경로만 Workers 함수로 처리한다.
- 단계 7까지는 Workers 함수가 없어도 사이트가 완성되어야 한다.

## 2. 디렉터리 구조 (T13 기준)

```text
.
├─ AGENTS.md / CLAUDE.md / README.md
├─ docs/                       ← 계획·설계 문서, 작업 지시서, 화면 캡처
├─ public/
│  ├─ fonts/                    ← 글꼴 라이선스
│  ├─ favicon.svg / favicon.ico / apple-touch-icon.png ← 파비콘(T13, scripts/brand/에서 만들어 커밋)
│  └─ og/<ja|en>.png            ← 언어별 공유 이미지 1200×630(T13, scripts/brand/에서 만들어 커밋)
├─ src/
│  ├─ content.config.ts          ← 콘텐츠 컬렉션 스키마(zod는 astro/zod)
│  ├─ content/                   ← 페이지 본문 콘텐츠(아래 "콘텐츠 구조")
│  │  ├─ profile/<ja|en>.yaml
│  │  ├─ skills.yaml
│  │  ├─ certifications.yaml
│  │  ├─ career/<ja|en>/<slug>.yaml
│  │  ├─ projects/<ja|en>/<slug>.yaml
│  │  └─ contact.yaml
│  ├─ lib/content.ts             ← 콘텐츠 조회, 여러 항목에 걸친 규칙 검사, 임시 항목 수 경고
│  ├─ i18n/
│  │  ├─ ui.ts                  ← UI 문구(일본어 기준 타입, 영어 키 누락·초과 시 타입 오류)
│  │  └─ paths.ts               ← 페이지·프로젝트 상세 경로, 언어 전환 경로 변환(astro:i18n 사용)
│  ├─ lib/cx.ts                  ← 클래스 이름 합치기(Astro class:list 대신, T12)
│  ├─ lib/seo.ts                 ← 절대 URL·hreflang 묶음·OG 값(T13, <head>와 sitemap·robots가 함께 씀, 아래 "SEO")
│  ├─ layouts/                   ← .astro: 콘텐츠 조회·<head>·페이지 스크립트(아래 "화면 컴포넌트와 스타일")
│  │  ├─ BaseLayout.astro        ← 문서 골격, 전역 CSS·글꼴 로드·글꼴 preload, 테마 첫 적용 인라인 스크립트, SEO 태그(canonical·hreflang·OG·파비콘, `noindex` prop), 헤더·푸터, 헤더 스크립트
│  │  ├─ HomeLayout.astro / AboutLayout.astro / ProjectsLayout.astro / ProjectDetailLayout.astro / ContactLayout.astro / NotFoundLayout.astro ← 페이지 진입점
│  │  └─ scripts/CardTiltScript.astro ← 카드 틸트 <script>를 Home·Projects가 함께 쓰는 한 곳(인라인 유지)
│  ├─ components/                ← React 화면 컴포넌트(.tsx) + CSS Modules(.module.css). 빌드 때 HTML로만 렌더
│  │  ├─ SiteHeader / SiteFooter / LanguageSwitch / ThemeToggle / CommandButton
│  │  ├─ SkillTag / ProjectCard  ← 여러 페이지가 쓰는 기술 태그·프로젝트 카드
│  │  ├─ PhaseList               ← 担当工程 표시(카드·프로젝트 상세)
│  │  ├─ CareerTimeline / SkillStack / CertificationList ← About 화면 부품
│  │  ├─ Phrases                 ← 일본어 문절 단위 줄바꿈 출력(docs/DESIGN.md §2)
│  │  ├─ pages/                  ← 페이지 본문(HomePage·AboutPage·ProjectsPage·ProjectDetailPage·ContactPage·NotFoundPage). 언어와 콘텐츠를 props로 받음
│  │  └─ interactive/            ← 명령 팔레트·터미널(T10, 브라우저에서 실행하는 React): commands.ts(명령 정의, 순수 TS), mount.tsx·CommandUI·Palette·Terminal·Dialog, command-ui.css(전역 CSS, 열 때 붙임)
│  ├─ scripts/theme.ts          ← 테마 읽기·쓰기(헤더 버튼, 명령 팔레트·터미널이 공유)
│  ├─ scripts/site-header.ts    ← 헤더 스크립트: 테마 버튼 처리 + 팔레트 런처 import(모든 페이지, T12에서 SiteHeader의 <script>를 옮김)
│  ├─ scripts/command-launcher.ts ← ⌘K / Ctrl+K·헤더 버튼 → 처음 열 때 팔레트 UI 동적 import(T10)
│  ├─ scripts/hero-decode.ts    ← Home 한 줄 소개 디코딩(컨셉 1, T08)
│  ├─ scripts/card-tilt.ts      ← 프로젝트 카드 틸트(컨셉 2, T08)
│  ├─ scripts/copy-button.ts    ← Contact 메일 복사(T07, T12에서 ContactPage의 <script>를 옮김)
│  ├─ styles/                   ← tokens.css(디자인 토큰), global.css(전역 스타일), view-transitions.css(카드 → 상세 전환, Home·Projects·상세만)
│  └─ pages/
│     ├─ index.astro            ← /ja/로 이동
│     ├─ 404.astro              ← 404(dist/404.html 하나, ja·en 안내를 함께, noindex. T13)
│     ├─ sitemap.xml.ts / robots.txt.ts ← 사이트맵·크롤러 안내(빌드 시 정적 파일, T13)
│     ├─ ja/index.astro, about.astro, projects.astro, contact.astro ← 페이지 진입점에 언어만 넘기는 한 줄 파일
│     ├─ ja/projects/[slug].astro ← 프로젝트 상세(getStaticPaths)
│     ├─ ja/commands.json.ts     ← 팔레트·터미널 데이터 엔드포인트(빌드 시 정적 JSON, T10)
│     └─ en/ (ja와 같은 구성)
├─ scripts/font-subset.mjs    ← 빌드 통합: Fontsource CSS를 쓰는 글자의 범위로 줄이기, 가나 범위 preload 목록(`virtual:font-preloads`), 빌드 후 글자 누락 검사(T11)
├─ scripts/brand/             ← 파비콘·공유 이미지 원본(favicon은 public/favicon.svg, 공유 이미지는 og.html)과 만드는 스크립트(T13, 손으로 실행, README.md)
├─ astro.config.mjs            ← 정적 출력, site(절대 주소, 임시 값이면 빌드 경고), React, i18n, 글꼴 통합
├─ tsconfig.json               ← Astro strict + React JSX
├─ eslint.config.mjs            ← JS, TypeScript, Astro, React, Hooks
├─ .prettierrc.json / .prettierignore / .editorconfig
├─ package.json / pnpm-lock.yaml / pnpm-workspace.yaml
├─ .nvmrc / .npmrc              ← Node 버전 및 엔진 검사
└─ .github/workflows/ci.yml      ← 포맷 → lint → 타입 → 빌드
```

`tests/`는 단계 7, Workers 함수는 단계 8에 추가한다.

### 글꼴 로딩 (T11 결정)

- `BaseLayout.astro`는 Fontsource CSS 3개(`@fontsource/ibm-plex-sans-jp/400.css`·`700.css`, `@fontsource/ibm-plex-mono/400.css`)를 그대로 import하고, `scripts/font-subset.mjs`(Astro 통합, `astro.config.mjs`에 등록)의 Vite 플러그인이 이 CSS를 변환할 때 `src/` 아래 텍스트 파일(`.astro`·`.ts`·`.tsx`·`.mjs`·YAML·Markdown·JSON·CSS)에 나오는 글자와 `unicode-range`가 겹치는 `@font-face`만 남긴다. 결과 CSS는 Vite가 처리하므로 파일 이름의 해시가 내용에 따라 바뀐다. `pnpm dev`에서도 같은 변환이 일어난다(콘텐츠를 바꾼 뒤에는 개발 서버를 다시 시작해야 반영된다).
- 같은 통합의 `astro:build:done` 훅이 `dist/`의 HTML·JSON·JS에 쓰인 글자를 다시 모아, 원래 Fontsource 범위로는 덮이지만 남긴 범위가 덮지 않는 글자가 있으면 빌드를 실패시킨다. 원래 범위로도 덮이지 않는 글자(글꼴에 없는 글자)는 HTML 주석·인라인 스크립트·스타일을 뺀 HTML·JSON에 나오는 것만 빌드 로그에 정보로 출력한다. 주석은 모으는 쪽과 검사하는 쪽 모두 지우지 않는다. 화면 문구의 ` // `를 주석으로 지우면 그 뒤 글자가 범위 선정과 검사에서 함께 빠지기 때문이다(Codex 리뷰 PR #34). 주석까지 세어 늘어나는 범위는 주석에만 나오는 ⌘(U+2318)를 덮는 2개(400·700, CSS 약 1.6KB)다. 빌드 결과에 없는 글자라 그 글꼴 파일은 받지 않는다. 2026-10-31 빌드는 `@font-face 71/251개 유지, 빌드 결과의 글자 530종 검사`이고 글꼴에 없는 글자는 0종이다.
- preload 목록은 가상 모듈 `virtual:font-preloads`(타입은 통합이 `injectTypes`로 생성)가 언어별 URL 배열로 준다. `astro.config.mjs`의 `preloadChars`(`{ ja: 'あ' }`)에 적은 글자를 덮는 범위의 woff2를 `?url`로 import하므로, CSS가 참조하는 것과 같은 해시 파일 이름이 된다. 범위가 겹치면 브라우저와 같이 나중에 정의된 규칙을 고른다. 파일 이름·번호를 손으로 적지 않는다.
- Astro 내장 Fonts API를 쓰지 않은 이유(2026-10-31, Astro 7.4.4·unifont 1.0.3 코드 확인): Fontsource provider가 빌드 때 `api.fontsource.org`를 호출하고, `subsets`·`unicodeRange`는 손으로 적는 값이라 쓰는 글자에 맞춰 범위를 고르지 못하며, `<Font />`가 `@font-face`를 각 HTML에 인라인으로 넣는다.

### 화면 컴포넌트와 스타일 (T12 결정)

- 화면은 React 함수 컴포넌트(`src/components/**/*.tsx`)다. `client:*` 지시어 없이 `.astro`에서 렌더하므로 `@astrojs/react`가 빌드 때 HTML로만 만들고 브라우저 JS는 없다(A11). 브라우저에서 실행하는 React는 `src/components/interactive/`(T10)뿐이다.
- 역할 분담: `.astro`(`src/pages/`, `src/layouts/`)는 라우팅, 콘텐츠 조회(`src/lib/content.ts`의 `get*Content`, async), `<head>`, 페이지 스크립트를 맡는다. React 컴포넌트는 props만 받아 그리는 동기 함수이고, `src/lib/content.ts`에서는 타입만 가져온다. 문구는 `src/i18n/ui.ts`, 경로는 `src/i18n/paths.ts`(내부에서 `astro:i18n`), 担当工程 순서는 `src/content.config.ts`의 `PHASES` 상수를 그대로 쓴다. 지금 페이지 경로는 `BaseLayout`이 `Astro.url.pathname`을 `pathname` prop으로 넘긴다.
- React 안에는 React만 넣는다. Astro 마크업을 children으로 넘기면 `@astrojs/react`가 `<astro-static-slot>` 요소로 감싸 DOM이 바뀐다. React 컴포넌트는 `<title>`·`<meta>`·`<link>`를 렌더하지 않는다(React 19가 `<head>`로 옮기고, Astro 렌더러가 React 출력의 `<link rel="preload|stylesheet…">`를 지움).
- 스타일은 컴포넌트와 같은 이름의 CSS Modules(`*.module.css`)다. 클래스 이름은 짧은 camelCase이고 Vite가 파일마다 `_name_hash_n` 형태로 바꾼다. 전역 클래스(`global.css`의 `container`·`card`·`button`·`tag`·`tag-list`·`project-grid`·`sr-only` 등)는 문자열 그대로 쓰고, 여러 클래스는 `src/lib/cx.ts`로 합친다. 스크립트가 붙이는 상태 클래스(`is-tilting`, `is-decoding`)와 만드는 요소(`decode-overlay`), 문서 상태(`html.js`, `:root[data-theme]`)는 `:global(...)`로 쓴다. `@keyframes` 이름도 바뀌므로 쓰는 파일 안에 둔다.
- 스크립트는 클래스가 아니라 `data-*` 속성으로 요소를 찾는다: `[data-tilt]`(카드 틸트), `[data-decode]`(디코딩), `[data-theme-toggle]`(테마 버튼), `[data-command-palette]`(팔레트 버튼), `[data-copy]`·`[data-copy-text]`·`[data-copy-status]`(메일 복사).
- CSS 순서: CSS Modules 클래스는 선택자 하나라서 Astro scoped style(`.x[data-astro-cid-…]`, 클래스 + 속성)보다 명시도가 낮다. 같은 요소에 전역 클래스와 함께 쓰는 곳(예: `project-grid` + 페이지의 `.body`의 `margin-top`)은 CSS 순서로 결과가 정해지므로, 페이지 진입점은 `BaseLayout`을 화면 컴포넌트보다 먼저 import해 전역 CSS가 앞에 오게 한다(T12 구현 중 Projects·About에서 순서가 바뀌어 `margin-top`이 사라진 것을 캡처 비교로 찾음).
- 페이지 스크립트: 디코딩은 `HomeLayout`, 카드 틸트는 `scripts/CardTiltScript.astro`(Home·Projects가 함께 씀), 메일 복사는 `ContactLayout`이 `<script>`로 넣는다. 같은 모듈을 두 레이아웃의 `<script>`에서 각각 import하면 Vite가 공유 청크(외부 파일)로 떼어 내 페이지가 받는 JS 파일이 늘어나므로, 여러 페이지가 쓰는 스크립트는 `<script>` 하나를 가진 작은 `.astro`에 둔다.
- 검증 방법(T12): main과 같은 Playwright 조건으로 전체 페이지 캡처 45장과 18페이지 `ariaSnapshot()`을 비교해 모두 같았다(`docs/tasks/T12-react-components.md` "확인 방법").

### SEO (T13 결정)

- **`site` 한 곳**: 사이트의 절대 주소는 `astro.config.mjs`의 `site` 상수 하나다. canonical·hreflang·`og:url`·`og:image`·sitemap·robots의 절대 URL은 모두 `src/lib/seo.ts`(`absoluteUrl`·`languageAlternates`·`ogImageUrl`)가 `Astro.site`(엔드포인트는 `site` 인자)로 만들고, 소스의 다른 곳에는 도메인을 적지 않는다. `site`가 없으면 `requireSite`가 빌드를 멈춘다(상대 URL로 내보내지 않기 위해).
- **임시 값**: 도메인을 정하기 전(단계 8)까지 `site`는 예약 도메인 `https://portfolio.example`이다. 같은 파일의 작은 통합(`portfolio:site-placeholder`)이 `astro:build:done`에서 호스트가 `.example`로 끝나면 경고 한 줄을 낸다. 빌드는 실패시키지 않는다. 배포 전에 바꾸는 일은 `docs/PLAN.md` §8 "T13 구현 시 추가한 항목".
- **`<head>`** (`BaseLayout.astro`): `charset` → `viewport` → `<title>` → `description` → 글꼴 preload → 테마 첫 적용 인라인 스크립트 → SEO 태그 순서다. 첫 렌더에 필요한 것을 앞에 둔다.

  | 태그 | 값 |
  | --- | --- |
  | `link rel="canonical"` | 자기 URL(`site` + 경로, 끝 슬래시) |
  | `link rel="alternate" hreflang="ja"`·`"en"`·`"x-default"` | 같은 페이지의 ja·en URL(`switchLocalePath`), x-default는 ja URL. 짝 페이지가 같은 묶음을 가진다 |
  | `link rel="icon"` ×2, `rel="apple-touch-icon"` | `/favicon.ico`(`sizes="32x32"`), `/favicon.svg`(`type="image/svg+xml"`), `/apple-touch-icon.png` |
  | `og:type` / `og:site_name` | `website` / `ui[locale].site.name` |
  | `og:title` / `og:description` / `og:url` | `<title>` / `description` / canonical과 같은 값 |
  | `og:locale` / `og:locale:alternate` | `ja_JP`·`en_US` 중 페이지 언어 / 다른 언어 |
  | `og:image`(+ `width`·`height`·`alt`) | `/og/<locale>.png`(1200×630). alt는 이미지에 쓴 글자와 같은 프로필 이름 + `ui[locale].site.ogImageLabel` |
  | `twitter:card` | `summary_large_image`. 제목·설명·이미지는 X가 OG 태그를 쓴다고 보고 넣지 않는다(X 공식 문서는 확인하지 못함, `docs/tasks/T13-seo.md`) |

- **`noindex` prop**: 켜면 `<meta name="robots" content="noindex">`를 넣고 canonical·hreflang·`og:url`은 넣지 않는다. 지금은 404만 쓴다. 단계 8의 회사별 비공개 페이지도 이 prop을 쓴다.
- **sitemap·robots**: `src/pages/sitemap.xml.ts`·`robots.txt.ts` 엔드포인트가 빌드 때 정적 파일이 된다(`commands.json.ts`와 같은 방식, 새 의존성 없음). sitemap은 18페이지(`pagePaths` × 언어 + `getProjectPages`)의 `<loc>`와 `<head>`와 같은 함수로 만든 `xhtml:link` 3개를 가진다. 루트 이동 페이지·404·`commands.json`과 `lastmod`(정확한 수정일을 낼 방법이 없음)는 넣지 않는다. robots는 전체 허용과 `Sitemap:` 한 줄이며, 누구나 읽으므로 비공개 경로를 적지 않는다.
- **404**: `src/pages/404.astro` → `dist/404.html` 하나다. `NotFoundLayout`(`BaseLayout` `locale="ja"` + `noindex`)과 `NotFoundPage`가 일본어 안내(h1) 뒤에 영어 안내(`lang="en"`, h2)를 함께 그린다. 없는 경로마다 같은 파일이 나가므로 링크는 절대 경로만 쓴다. 언어별 404를 두지 않는 이유: Astro는 언어 폴더 아래 404를 `ja/404/index.html`로 출력해 Cloudflare가 찾는 `ja/404.html`을 바로 만들 수 없고, 그 동작은 배포 전에는 확인할 수 없다(`docs/tasks/T13-seo.md` 메모). `pnpm preview`는 끝 슬래시가 있는 없는 경로에 이 파일을 404 상태로 보낸다. Cloudflare에서는 `not_found_handling = "404-page"`가 필요하다(단계 8).
- **파비콘·공유 이미지**: `public/`에 커밋한 파일이다. 원본과 만드는 스크립트는 `scripts/brand/`(README.md)이며, 실행 환경의 Playwright Chromium으로 그린다. 빌드에서는 만들지 않는다(빌드에 브라우저가 필요해지고 새 의존성이 생기므로). 모양은 `docs/DESIGN.md` §10.
- **검증 방법(T13)**: `dist/**/*.html`(루트 이동·404 제외)을 읽어 canonical·`og:url` = `site` + 경로, hreflang 3개(자기 포함, x-default = ja)가 짝 페이지와 같음, OG 속성이 하나씩, 파비콘 링크 3개, sitemap `<loc>` = 페이지 목록·`xhtml:link` = `<head>` 묶음, 404의 `noindex`와 canonical·hreflang·`og:url` 없음을 확인했다. 단계 7 E2E로 옮길 수 있다.

### 페이지 파일 방식 (T03 결정, T12 갱신)

언어별 페이지 파일 방식을 쓴다. `src/pages/ja/about.astro`와 `src/pages/en/about.astro`는 같은 페이지 진입점(`src/layouts/<Page>Layout.astro`)을 언어만 바꿔 호출하는 한 줄 파일이다. 예: `<AboutLayout locale="ja" />`. 진입점이 콘텐츠를 조회하고 제목·설명을 `BaseLayout`에 넘기며, 본문은 React 화면 컴포넌트(`src/components/pages/AboutPage.tsx`)가 그린다. T07에서 Contact까지 페이지별 컴포넌트로 바꿔 준비 중 화면(`ComingSoonPage`)은 지웠다. T12 전에는 화면 컴포넌트(`src/components/pages/*.astro`)가 조회·레이아웃·본문을 모두 맡았다.

- 이유: 파일 경로가 URL과 그대로 대응해 찾기 쉽고, T01 구조를 그대로 잇는다. 언어가 2개로 고정이라 파일이 두 벌인 비용이 작다. 동적 경로(`src/pages/[locale]/about.astro` + `getStaticPaths`)는 언어가 늘 때 유리하지만 지금은 이점이 적다.
- 프로젝트 상세처럼 항목 수만큼 페이지가 생기는 경로는 `src/pages/ja/projects/[slug].astro`처럼 언어 폴더 안에서 동적 경로를 쓴다(T06 확정). `getStaticPaths`가 `getProjectPages(locale)`로 상세 목록(프로젝트, 이전·다음)을 받아 `props`로 넘기고, 화면은 `ProjectDetailPage`가 그린다. 목록 페이지 `src/pages/ja/projects.astro`는 그대로 두며 출력 경로는 `/ja/projects/`, 상세는 `/ja/projects/<slug>/`다. 상세 URL은 `src/i18n/paths.ts`의 `localizeProjectPath`로 만든다.

### 문구·콘텐츠 위치 규칙 (T03 결정)

- UI 문구(내비게이션, 버튼, 접근성 문구, 페이지 이름·설명): `src/i18n/ui.ts`. 일본어 객체의 타입을 영어 객체에 적용하므로 영어에 키가 빠지거나 남으면 `pnpm check`가 실패한다. 컴포넌트에 문구를 직접 쓰지 않는다.
- 페이지 본문 콘텐츠(경력, 프로젝트, 자격증 등): `src/content/`(Astro content collections). 컬렉션 스키마는 각 페이지 지시서에서 정한다.
- 경로: 페이지 URL은 `src/i18n/paths.ts`의 `localizePath`, 언어 전환 URL은 `switchLocalePath`로 만든다. 둘 다 `astro:i18n`의 `getRelativeLocaleUrl`을 써서 끝 슬래시 규칙(`trailingSlash: 'always'`)을 지킨다.

### 콘텐츠 구조 (T04 결정, T05·T06·T07 추가)

페이지 본문 콘텐츠는 Astro content collections(`src/content.config.ts`, loader는 `astro/loaders`의 `glob`)로 읽고 zod 스키마로 검증한다. 형식은 YAML이다. 문장이 짧은 필드 위주라 Markdown 본문이 필요 없고, 주석으로 작성 규칙을 남길 수 있기 때문이다.

| 컬렉션 | 파일 | 단위 | 주요 필드 |
| --- | --- | --- | --- |
| `profile` | `src/content/profile/<ja\|en>.yaml` | 언어별 1건(id = 언어) | `placeholder`, `name`, `role`(직함), `tagline`(한 줄 소개), `description`(Home meta description), `resumes`(선택, 0~2개: `label` 링크 문구, `file` `public/` 기준 경로) |
| `skills` | `src/content/skills.yaml` | 언어 공통 1건 | `categories[]`: `id`, `name.ja`/`name.en`, `items[]`: `placeholder`, `name`(언어 공통 문자열 또는 `{ ja, en }`), `primary`(기본 false), `homeOrder`(있으면 Home 핵심 기술) |
| `projects` | `src/content/projects/<ja\|en>/<slug>.yaml` | 언어별, 같은 slug | `placeholder`, `title`, `summary`, `period`(문자열), `role`, `highlights`(1~2개), `tech`, `featuredOrder`(있으면 대표 프로젝트: Home·Projects 목록 앞), `order`(대표가 아닌 프로젝트의 목록 순서), `phases`(担当工程 id 1~5개: `requirements`·`design`·`development`·`testing`·`operation`), `team`(선택), `challenge`·`design`(`body` + 선택 `points` 1~4개), `result`(`metrics` 1~4개 `{ label, value }`와 `body` 중 하나 이상), `techDetails`(`{ label, value }` 1~5개) |
| `career` | `src/content/career/<ja\|en>/<slug>.yaml` | 언어별, 같은 slug | `placeholder`, `company`, `period`(문자열), `role`, `highlights`(1~3개), `order`(1 = 최신), `current`(기본 false) |
| `certifications` | `src/content/certifications.yaml` | 언어 공통 1건 | `items[]`: `status`(`acquired` \| `studying`), `placeholder`, `name`(언어 공통 문자열 또는 `{ ja, en }`), `acquired`(문자열 `YYYY.MM`, `acquired`일 때만) |
| `contact` | `src/content/contact.yaml` | 언어 공통 1건 | `placeholder`(`intro`의 임시 여부), `intro`(`{ ja, en }`), `email`(`placeholder`, `address`), `links[]`(0~2개: `id` `github` \| `linkedin`, `placeholder`, `url`). 배열 순서가 화면 순서 |

- 필드 이름은 영어 camelCase로 통일한다. 스키마는 `z.strictObject`라서 모르는 필드(오타)가 있으면 빌드가 실패한다.
- `placeholder`는 필수 boolean이다. 빠뜨렸을 때 실제 원고로 취급되는 일을 막기 위함이다.
- 한 줄을 넘을 수 있는 일본어 문구(`profile.tagline`, `projects.title`)는 문자열 또는 문절 단위 문자열 배열이다. 배열이면 `Phrases.tsx`가 문절 사이에서만 줄을 바꾼다(`docs/DESIGN.md` §2). 영어는 문자열로 쓴다.
- 언어별 콘텐츠는 같은 slug를 쓰는 언어 폴더(프로필은 언어 이름 파일) 방식이다. 기술 스택은 기술 이름이 언어 공통이라 한 파일에 분류 이름만 두 벌 둔다. 분류·기술의 표시 순서는 파일 안 배열 순서다. 컬렉션 항목 사이의 순서에 기대지 않도록 분류마다 항목을 나누지 않고 한 파일 1건으로 둔다.
- 여러 항목에 걸친 규칙은 `src/lib/content.ts`가 `getCollection` 결과를 검사하고, 어기면 어긴 규칙을 모두 적은 오류를 던져 빌드를 멈춘다: 언어 짝(프로필 ja/en, 프로젝트·경력 slug), 대표 프로젝트 언어마다 2~3개, Home 핵심 기술 3~6개, 주력 기술은 모두 Home 핵심 기술에 포함, 주력 기술 전체 2~4개·분류당 0~2개, 분류 안에서 주력 기술이 주력이 아닌 기술보다 앞, 순서 값 중복 금지, 같은 slug의 `featuredOrder`가 언어마다 같음, 경력은 언어마다 1건 이상이고 같은 slug의 `order`·`current`가 언어마다 같음, 학습 중 자격증은 0~1개이고 맨 끝, 이력서 경로(아래), 프로젝트 목록 순서(대표 프로젝트는 `order` 없음, 대표가 아닌 프로젝트는 `order` 필수, 언어마다 `order` 중복 금지, 같은 slug의 `order`·`phases`가 언어마다 같음). `phases` 중복과 `result`가 비어 있는 경우는 스키마(`refine`)에서 막는다. 연락처(T07): `contact.yaml`이 1건, `email.address`는 `@` 하나·앞뒤가 비어 있지 않음·도메인에 `.`·공백 없음, `links[].url`은 `https://`로 시작하고 호스트가 서비스별 허용 값(`github.com` / `linkedin.com`·`www.linkedin.com`), `links`의 `id` 중복 금지. 페이지는 `getCollection`을 직접 쓰지 않고 이 파일의 함수(`getHomeContent`, `getAboutContent`, `getProjectsContent`, `getProjectPages`, `getContactContent`)를 쓴다. 푸터도 `getContactContent`를 쓴다.
- 担当工程(`phases`)의 id 목록과 표시 순서는 `src/content.config.ts`의 `PHASES` 하나가 원본이다. 조회 함수가 이 순서로 정렬해 돌려주므로 콘텐츠 파일의 순서와 화면 순서는 무관하다. 화면 이름은 `src/i18n/ui.ts`의 `project.phase.*`다.
- 프로젝트 목록 순서: 대표(`featuredOrder` 순) → 그 밖(`order` 순). 상세의 이전·다음 링크도 이 순서를 따르고 끝과 처음이 이어진다(`getProjectPages`).
- 이력서 경로(`profile.resumes[].file`): `/`로 시작하는 사이트 내부 경로만 허용한다. 외부 URL(`https://`, `//`), 역슬래시, `..` 구간을 거부하고, `public/` 기준으로 해석한 경로가 `public/` 안이며 파일이 실제로 있어야 한다. `public/` 위치는 `astro:config/server`의 `publicDir`에서 읽는다. 파일 확인에 쓰는 `node:fs`는 `@types/node`가 없고(새 의존성 추가 금지) 정적 import하면 타입 검사가 실패하므로, 쓰는 메서드만 타입을 적고 빌드 시점에 동적 import한다(`/* @vite-ignore */`). `resumes`가 없거나 빈 배열이면 검사하지 않는다.
- 임시 항목 수: 검사를 통과하면 `[content] placeholder entries: N (profile a, skills b, projects c, career d, certifications e, contact f)`를 빌드 로그에 경고로 한 번 출력한다(0건이어도 출력). 기술·자격증은 항목 하나, 프로필·프로젝트·경력은 언어별 파일 하나, 연락처는 `intro`·`email`·`links[]` 각각을 1건으로 센다. 배포 전 0건이어야 한다(`docs/CONTENT.md` "임시 문구 규칙").
- 사이트 이름(`src/i18n/ui.ts`의 `site.name`)과 프로필 이름(`profile.name`)은 별개 값이다. 사이트 이름은 모든 페이지의 헤더·푸터·`<title>`에 쓰는 짧은 표기이고 레이아웃이 동기적으로 읽는 UI 문구다. 프로필 이름은 히어로·About에 쓰는 본문 콘텐츠이며 원고에서 漢字/カナ 표기가 될 수 있다. 지금은 사이트 이름 `choi`, 프로필 이름은 일본어 「チェ ソンギュ」, 영어 `choi seonggyu`다(2026-10-30 사용자 지정).
- 기술 이름은 보통 언어 공통 문자열로 쓰고, 언어마다 다르게 보여야 할 때만 `{ ja, en }`으로 쓴다. 조회 함수(`localize`)가 페이지 언어의 값을 고른다. 지금은 임시 표식(「（仮）」/`(placeholder)`)이 언어마다 달라서 모두 `{ ja, en }`이다. 프로젝트의 `tech`는 언어별 파일이라 각 언어 표식을 그대로 쓴다.

T01 환경: Node 24.19.0, pnpm 11.25.0, Astro 7.4.4, React 19.3.1. TypeScript는 검사 도구의 지원 범위에 맞춰 6.0.3을 사용한다. 직접 의존성과 lockfile로 설치 버전을 기록한다. pnpm이 생성한 `pnpm-workspace.yaml`에는 이번 Astro 설치에 필요한 특정 버전의 release-age 예외만 기록한다.

`output: 'static'` 빌드는 `dist/{ja,en}/index.html`, `dist/{ja,en}/{about,projects,contact}/index.html`(T03), 프로젝트 상세 `dist/{ja,en}/projects/<slug>/index.html`(T06), 루트 redirect HTML을 생성한다. React hydration은 없으며 서버 어댑터도 필요하지 않다. 모든 페이지는 공통 CSS `_astro/BaseLayout.*.css`를 `<head>`에서 받는다. T11부터 글꼴 `@font-face`를 쓰는 글자의 범위로 줄여 압축 전 52,819B(gzip 10,369B)이고(T10까지 357,926B, 이 절의 "글꼴 로딩"), T12에서 Astro scoped style의 `[data-astro-cid-*]` 선택자가 CSS Modules 클래스로 바뀌어 51,350B다. 페이지 전용 CSS는 T12부터 모든 페이지에서 4KB 이하라 HTML 인라인 `<style>`로 들어간다(T11까지 About·프로젝트 상세는 외부 CSS 파일을 따로 받음). 일본어 페이지는 가나 범위 글꼴 2개를 preload한다. 페이지가 받는 JS는 테마 첫 적용 인라인 스크립트와 헤더 스크립트 1개(T10부터 외부 모듈, 아래)이고, Contact 페이지만 메일 복사 스크립트 1개(인라인 모듈, 약 0.6KB)를 더 받는다(T07). T08부터 Home은 디코딩(약 1.4KB)과 카드 틸트(약 1.1KB), Projects 목록은 카드 틸트 스크립트를 더 받는다(모두 인라인 모듈, 압축 전 크기). 카드 → 상세 전환과 About 경력 타임라인의 스크롤 강조(T09)는 CSS만 쓰며 About이 받는 JS는 T08과 같다. 다만 T09로 About 페이지 CSS가 Astro 인라인 기준(4KB)을 넘어 `_astro/AboutPage.*.css` 파일(압축 전 약 4.7KB)로 분리된다. T10부터 모든 페이지는 헤더 스크립트(T12부터 `_astro/BaseLayout.astro_astro_type_script_index_0_lang.*.js`, T11까지 `_astro/SiteHeader.*.js`. 테마 버튼 처리 + 명령 팔레트 런처, 압축 전 약 3.5KB·gzip 약 1.6KB)를 외부 모듈로 받는다. main(T09)의 테마 버튼 인라인 모듈(약 0.8KB)을 대신하므로 늘어난 양은 압축 전 약 2.7KB다. 이 중 약 1.7KB는 동적 import의 의존 파일을 미리 불러오는 Vite 도우미 코드다. `vite.build.modulePreload: false`로 없애려 했으나 Astro 빌드 설정이 우선해 적용되지 않았다(2026-10-31 확인). T11에서 `astro:build:setup` 훅으로 client 환경 설정에 `modulePreload: false`를 넣어 보았으나 의존 파일 목록(약 150B)만 빠지고 도우미 함수는 남았고, 팔레트를 처음 열 때 React 청크를 미리 받지 않아 `mount.*.js` 다음에 직렬로 받게 되므로 적용하지 않았다. 헤더 스크립트는 압축 전 3,531B·gzip 1,625B이고 Lighthouse의 "사용하지 않는 JavaScript" 진단에 나오지 않으며 TBT는 모든 페이지에서 0ms다(2026-10-31 확인). 팔레트를 처음 열 때만 `mount.*.js`(약 11KB, gzip 약 4KB), React·ReactDOM 청크 `client.*.js`(약 219KB, gzip 약 66KB), `command-ui.*.css`(약 5.6KB, gzip 약 1.4KB), `commands.json`(ja 약 4.2KB, gzip 약 1.8KB)을 받고, 다시 열 때는 받지 않는다(크기는 압축 전 기준. 모두 2026-10-31 빌드 측정). T01부터 "어느 페이지도 참조하지 않는 React 클라이언트 번들"로 남아 있던 React는 이제 팔레트 청크로 쓰인다. 참조되지 않는 파일은 Astro React 렌더러 진입 파일(`client.*.js` 중 약 1.8KB 쪽)뿐이며, `@astrojs/react` 통합(JSX 설정)은 유지한다(2026-10-30 사용자 결정, PLAN §8). T12부터 이 통합은 화면 컴포넌트를 빌드 때 HTML로 렌더하는 데도 쓰인다. `dist/`를 Workers 정적 자산 디렉터리로 지정할 수 있음을 [공식 문서](https://developers.cloudflare.com/workers/static-assets/binding/)와 출력 구조로 확인한다. 실제 배포·HTTP redirect 정책은 단계 8에서 검증한다.

## 3. 기술 결정 기록 (ADR 요약)

새 결정은 표 아래에 추가한다. 번복할 때는 기존 줄을 지우지 말고 상태를 `superseded`로 바꾼다.

| # | 결정 | 이유 | 대안 | 상태 |
| --- | --- | --- | --- | --- |
| A1 | Astro + TypeScript | 콘텐츠 중심 사이트, 기본 출력 JS 최소, i18n 라우팅 내장 | Next.js(무겁고 서버 전제), Hugo(인터랙션 확장 불편) | superseded (A11, 2026-10-31) |
| A2 | 인터랙션은 Astro `<script>`·CSS 기본, React는 컨셉 3·4만 열 때 동적 import (처음 결정: React island + Motion / GSAP. 여기서 React는 브라우저에서 실행하는 React다. 화면 컴포넌트를 React로 쓰고 빌드 때 HTML로만 렌더하는 것은 A11) | 필요한 코드만 필요할 때 받아 페이지는 가볍게 유지. 단, 상태가 필요 없는 효과(컨셉 1 디코딩·컨셉 2 틸트)는 Astro `<script>`, 페이지 전환은 CSS View Transitions로 만들고 컨셉 5 스크롤 타임라인은 JS 없이 CSS 스크롤 기반 애니메이션(T09 지시서)으로 만들며, React는 상태가 많은 컨셉 3·4(T10)에만 쓰되 island가 아니라 열 때 동적 import로 마운트하고, T10은 Motion / GSAP을 쓰지 않는다(2026-10-31, T08·T09·T10 지시서) | 전체 SPA | accepted |
| A3 | Cloudflare Workers 정적 자산, 무료 플랜 | 정적 요청 무료, 동적 기능을 같은 플랫폼에서 추가 가능 | Cloudflare Pages, Vercel, Netlify | accepted |
| A4 | i18n: `/ja`(기본), `/en` 경로 분리 | SEO(hreflang), 공유 링크가 언어를 유지 | 쿼리/쿠키 기반 전환 | accepted |
| A5 | 회사별 비공개 페이지는 토큰 URL + KV | 채용 담당자에게 로그인 단계가 없음 | Cloudflare Access(이메일 OTP) | accepted (단계 8에 재검토) |
| A6 | 저장소 Public, 비밀 값은 Cloudflare Secrets / `.dev.vars` | 포트폴리오로서 코드 공개 가치 | Private 저장소 | accepted |
| A7 | 패키지 매니저 pnpm 11.25.0 | T01 작업 환경에 설치된 버전으로 로컬·clean clone·CI 검증 완료. pnpm 12와 비교 평가해 선택한 것은 아니며, 업그레이드는 별도 검증 후 진행 | npm, pnpm 12 (미평가) | accepted (T01) |
| A8 | 언어별 페이지 파일 + 공유 화면 컴포넌트, UI 문구는 `src/i18n/ui.ts`(일본어 기준 타입) | URL과 파일 경로가 대응하고 T01 구조를 이음. 영어 문구 누락을 타입 검사로 막음 | 동적 경로 `[locale]` + `getStaticPaths` | accepted (T03) |
| A9 | 콘텐츠는 YAML content collections + 조회 함수에서 여러 항목 규칙 검사 | 스키마로 필드 누락·오타를, 조회 함수로 개수·언어 짝 규칙을 빌드 시점에 막음. 원고 반영 시 콘텐츠 파일만 바꿈 | 커스텀 loader에서 검사, TypeScript 상수 파일 | accepted (T04) |
| A10 | 글꼴은 Fontsource 자체 호스팅 + 빌드 통합으로 쓰는 글자의 범위만 남기고, 일본어 페이지는 가나 범위만 preload | 첫 렌더 전 CSS를 약 1/7로 줄이고(렌더 차단 예상 절감 930ms → 180ms) 글꼴 교체에 따른 Home CLS를 0.1 이하로. 새 의존성·외부 요청 없음, 원고가 바뀌면 자동으로 다시 계산 | Astro Fonts API(빌드 때 외부 API, HTML 인라인, 범위 수동), 글꼴 파일 재서브셋(새 도구 필요), `font-display: optional`(첫 방문 글꼴이 달라짐, 사용자 결정 필요) | accepted (T11) |
| A11 | 화면은 React + TypeScript, 페이지 구성·정적 빌드는 Astro(Vite 기반). 화면 컴포넌트(`src/components/**/*.tsx`)는 `client:*` 없이 빌드 때 HTML로만 렌더하고, 콘텐츠 조회·`<head>`·페이지 스크립트는 `.astro`(레이아웃·라우트)가 맡는다. 브라우저에서 실행하는 React는 A2대로 컨셉 3·4뿐 | 일본 채용 공고에서 React 수요가 크다(`docs/PLAN.md` §7). 정적 출력과 페이지 JS(헤더 스크립트 + 페이지 스크립트), T11 글꼴 통합(A10), content collections(A9), 문서 간 View Transitions, Cloudflare 정적 배포(A3)를 그대로 유지 | Astro 컴포넌트 유지(A1), Next.js 정적 출력(첫 로드 JS 약 136KB gzip, `next/link` 이동에서 문서 간 View Transitions 미동작, 글꼴 통합·콘텐츠 로더 재작성), React Router v7·Nuxt·SvelteKit(hydration으로 프레임워크 본체 JS를 보냄) | accepted (2026-10-31 사용자 결정, T12에서 전환. 스타일은 CSS Modules, §2 "화면 컴포넌트와 스타일") |
| A12 | SEO: 절대 URL은 `astro.config.mjs`의 `site` 한 곳에서 `src/lib/seo.ts`로 만든다(도메인 결정 전에는 임시 값 + 빌드 경고). sitemap·robots는 엔드포인트, 404는 ja·en 안내를 함께 보여주는 `dist/404.html` 하나, 파비콘·공유 이미지는 `scripts/brand/`에서 만들어 커밋 | 도메인을 정할 때(단계 8) 값 하나만 바꾸면 된다. hreflang 묶음을 `<head>`와 sitemap이 같은 함수로 만들어 어긋나지 않는다. 새 의존성·빌드 시간 증가 없음. Astro는 언어 폴더 아래 404를 `ja/404/index.html`로 출력해 언어별 `404.html`을 바로 만들 수 없다 | `@astrojs/sitemap`(새 의존성, 기능 비교 안 함), 언어별 404(빌드 후 파일 이동 필요, 단계 8에 재검토), 빌드 때 공유 이미지 생성(satori 등 새 의존성), 페이지별 공유 이미지(원고 반영 뒤 검토) | accepted (T13, §2 "SEO") |

직접 의존성은 정확한 버전으로 통일하고, 간접 의존성은 lockfile로 고정한다. CI는 `pnpm install --frozen-lockfile`을 사용한다. pnpm 버전은 `packageManager`로 고정한다.

## 4. 비밀 값 관리

- 저장소에 커밋 금지: API 키, Turnstile secret, 메일 API 키, 회사별 토큰, 개인 전화번호 등
- 로컬: `.dev.vars` (gitignore됨). 필요한 키 이름은 `.dev.vars.example`에 값 없이 적는다 (단계 8).
- 배포: `wrangler secret put` 또는 Cloudflare 대시보드
- CI: GitHub Actions Secrets
