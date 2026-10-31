# T13: SEO (canonical·hreflang·OG·sitemap·robots·favicon·404)

| 항목 | 값 |
| --- | --- |
| 단계 | 6 |
| 선행 작업 | T12 (PR #37) |
| 담당 | claude |
| 상태 | review |
| 브랜치 | `claude/project-thread-t0t9l8` (실행 환경이 지정한 이름. 원칙상 이름은 `claude/T13-seo`) |

## 목표

검색 엔진과 공유 미리보기(LINE·Slack·LinkedIn·X 등)가 페이지를 바르게 읽게 한다.

- 모든 페이지의 `<head>`에 다음을 넣는다.
  - 자기 자신을 가리키는 canonical
  - 언어 짝을 알리는 hreflang
  - Open Graph와 X 카드 태그
- 사이트 전체에 다음을 둔다: `sitemap.xml`, `robots.txt`, 파비콘, 404 페이지.
- 절대 URL은 Astro `site` 설정 하나에서만 만든다. 도메인을 정하면(단계 8) 그 값 하나만 바꾸면 된다.

## 배경

- `docs/PLAN.md` §3 "모든 페이지 공통: SEO(meta·OG 이미지·sitemap)", §5 단계 6.
- 단계 6 순서는 T12 React 전환 → T13 SEO → T14 접근성이다(2026-10-31 사용자 결정). 바뀐 마크업을 한 번만 점검하려고 SEO를 React 전환 뒤에 둔다.
- 도메인은 아직 정하지 않았다. 우선 `*.workers.dev`를 쓰고, 단계 8 전에 정한다(PLAN §2·§7). 그래서 이번에는 `site`에 임시 값을 넣고, 배포 전에 바꾸게 한다.
- `docs/ARCHITECTURE.md` A4: `/ja`·`/en` 경로를 나눈 이유가 SEO(hreflang)다.
- 지금 Lighthouse Best Practices가 96점이다. 원인은 `/favicon.ico` 404가 콘솔 오류로 잡히는 것이다(T11 PR #34).

### 지금 상태 (main `6df903a`, 2026-10-31 확인)

- `BaseLayout.astro`의 `<head>`에는 `charset`, `viewport`, `description`, `<title>`, 글꼴 preload, 테마 첫 적용 인라인 스크립트만 있다. canonical, hreflang, OG, 파비콘 링크는 없다.
- `astro.config.mjs`에 `site`가 없다. `trailingSlash: 'always'`, i18n은 `prefixDefaultLocale: true`, `redirectToDefaultLocale: false`다.
- `public/`에는 `fonts/`(글꼴 라이선스)만 있다. `pnpm preview`에서 `/favicon.ico`, `/robots.txt`, `/sitemap.xml`은 404다.
- 404 페이지 파일이 없다. `pnpm preview`에서 없는 경로를 열면 Astro 기본 404 화면이 404 상태로 나온다.
- 루트 `/`(`src/pages/index.astro`, `Astro.redirect('/ja/')`)의 빌드 결과는 Astro가 만든 이동 HTML이다. 내용은 `<meta http-equiv="refresh" content="2;url=/ja/">`, `<meta name="robots" content="noindex">`, `<link rel="canonical" href="/ja/">`다.
- Lighthouse 12.6.1, `pnpm preview` 대상, 모바일 설정(기본값) 1회 측정 결과:
  - 대상 페이지: `/ja/`, `/ja/projects/`, `/ja/projects/order-api/`, `/en/about/`
  - SEO는 모두 100이다. canonical·robots-txt 감사는 "해당 없음"이다.
  - Best Practices는 모두 96이고, 감점은 `errors-in-console`이다.

### 사전 확인 (2026-10-31, 지시서 작성 시 main 사본에서 임시로 바꿔 보고 되돌림)

- `site: 'https://portfolio.example'`을 넣은 빌드에서 `Astro.site`가 `https://portfolio.example/`이다. 루트 이동 HTML의 canonical은 `https://portfolio.example/ja/`로 절대 URL이 된다.
- 404 파일의 출력 위치:
  - `src/pages/404.astro` → `dist/404.html`
  - `src/pages/ja/404.astro` → `dist/ja/404/index.html`
  - `src/pages/ja/404.html.astro` → `dist/ja/404.html/index.html`
  - 즉 언어 폴더 아래에 `404.html` 파일을 바로 만들 수는 없다.
- `pnpm preview`는 `dist/404.html`이 있으면 없는 경로(`/ja/xyz/`)에 그 내용을 404 상태로 보낸다. 다만 끝 슬래시가 없는 경로(`/foo`)에는 Astro 기본 화면("trailingSlash is set to "always"")을 보낸다. 이것은 preview 서버의 동작이다.
- Lighthouse `canonical` 감사(12.6.1 소스)가 실패로 보는 경우는 다섯 가지다.
  - URL이 잘못됨
  - 상대 URL
  - 서로 다른 canonical 여러 개
  - 다른 hreflang 페이지를 가리킴
  - 모든 페이지가 루트를 가리킴

  측정 주소(`localhost`)와 `site` 도메인이 달라도 실패가 아니다.

### 확인한 공식 문서 (2026-10-31)

- Google [현지화된 버전](https://developers.google.com/search/docs/specialty/international/localized-versions):
  - hreflang URL은 프로토콜까지 포함한 절대 URL이어야 한다.
  - 각 언어 버전은 자신을 포함한 모든 버전을 적어야 하고, 서로 가리키지 않으면 무시된다.
  - `x-default`는 맞는 언어가 없을 때의 대체 페이지다. 언어 선택 페이지나 자동 이동 홈에 권한다.
  - sitemap 방식은 `xmlns:xhtml="http://www.w3.org/1999/xhtml"`과 `<xhtml:link rel="alternate" hreflang="…">`를 쓴다.
- Google [파비콘](https://developers.google.com/search/docs/appearance/favicon-in-search):
  - 정사각형, 8×8px 이상이어야 하고, 48×48px보다 큰 것을 권한다.
  - 지원 형식은 BMP·GIF·ICO·PNG·JPEG·PPM·TIFF다. SVG는 목록에 없다.
  - `rel`은 `icon`, `apple-touch-icon` 등을 쓴다.
  - 홈 페이지의 `<head>`에 둔다. 호스트 이름당 파비콘 1개, 하위 폴더 홈은 지원하지 않는다.
- [Open Graph protocol](https://ogp.me/):
  - 필수 속성은 `og:title`, `og:type`, `og:image`, `og:url`이다.
  - `og:locale`은 `language_TERRITORY` 형식(기본 `en_US`)이다.
  - `og:image:alt`는 `og:image`가 있으면 함께 적는다.
- Cloudflare Workers 정적 자산:
  - [404 페이지](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/): `not_found_handling = "404-page"`이면 가장 가까운 `404.html`을 404 상태로 보낸다.
  - [`_redirects`](https://developers.cloudflare.com/workers/static-assets/redirects/): 301·302 등을 지원한다.
  - 둘 다 배포 설정이라 단계 8에서 쓴다.
- Astro [`astro:i18n`](https://docs.astro.build/en/reference/modules/astro-i18n/): `getAbsoluteLocaleUrl(locale, path)`은 `site`가 있으면 절대 URL을 돌려준다.
- 확인 필요: X 카드(`summary_large_image`)의 이미지 조건. 공식 문서 주소가 옮겨져(`developer.x.com` → `docs.x.com`) 해당 페이지를 찾지 못했다. 구현 시 다시 찾고, 못 찾으면 OGP 이미지 기본 크기(1200×630)로 둔다.

## 범위

포함:

1. **`site` 한 곳**
   - `astro.config.mjs`에 `site`를 넣는다. 기본안은 예약 도메인의 임시 값 `https://portfolio.example`이다.
   - canonical·hreflang·`og:url`·`og:image`·sitemap·robots의 절대 URL은 모두 이 값에서 만든다. 소스의 다른 곳에 도메인을 적지 않는다.
   - `site`가 임시 값(`.example`)이면 빌드 로그에 경고를 한 줄 낸다. 빌드는 실패시키지 않는다. 기존 `[content] placeholder entries`와 같은 방식이다.
2. **페이지 `<head>`** (`BaseLayout.astro`, 18페이지 모두)

   | 태그 | 값 |
   | --- | --- |
   | `<link rel="canonical">` | 자기 URL(절대, 끝 슬래시) |
   | `<link rel="alternate" hreflang="ja">`, `hreflang="en"` | 같은 페이지의 각 언어 URL. ja·en 두 페이지가 같은 묶음을 가진다 |
   | `<link rel="alternate" hreflang="x-default">` | 같은 페이지의 ja URL(기본안, 메모) |
   | `og:type` | `website` |
   | `og:site_name` | `ui[locale].site.name` |
   | `og:title` / `og:description` | `<title>` / `meta description`과 같은 값 |
   | `og:url` | canonical과 같은 값 |
   | `og:locale` / `og:locale:alternate` | `ja_JP` / `en_US`. 다른 언어가 alternate |
   | `og:image`, `og:image:width`, `og:image:height`, `og:image:alt` | 언어별 공유 이미지(범위 4). 절대 URL. alt 문구는 `src/i18n/ui.ts` |
   | `twitter:card` | `summary_large_image`. 나머지 값은 X가 OG 태그를 쓴다고 보고 넣지 않는다(확인 필요 항목과 함께 구현 시 확인) |
   | `<link rel="icon">` 등 | 범위 5의 파비콘 |

   - 언어 URL은 `src/i18n/paths.ts`의 경로 함수(`switchLocalePath` 등)로 만든다. 절대 URL 계산은 한 곳(예: 새 `src/lib/seo.ts`)에 두고 sitemap과 같이 쓴다.
   - `BaseLayout`에 `noindex` prop을 둔다. 켜면 `<meta name="robots" content="noindex">`를 넣고 canonical·hreflang·`og:url`은 넣지 않는다(404용).
3. **`sitemap.xml`·`robots.txt`** (새 의존성 없이 엔드포인트로, `commands.json.ts`와 같은 방식)
   - `src/pages/sitemap.xml.ts` → `dist/sitemap.xml`
     - 18페이지(ja·en × Home·About·Projects·Contact·상세 5개)의 `<loc>`를 넣는다.
     - 각 `<url>`에 범위 2와 같은 `xhtml:link` 3개(ja·en·x-default)를 넣는다.
     - 루트 이동 페이지, 404, `commands.json`은 넣지 않는다.
     - `lastmod`·`changefreq`·`priority`는 넣지 않는다(메모).
   - `src/pages/robots.txt.ts` → `dist/robots.txt`. 모든 크롤러에 전체 허용, `Sitemap: <site>/sitemap.xml` 한 줄.
   - 프로젝트 목록은 `src/lib/content.ts`의 기존 조회 함수(`getProjectPages` 등)로 얻는다. 조회 함수는 바꾸지 않는다.
4. **공유 이미지(OG)**
   - `public/og/ja.png`, `public/og/en.png`. 1200×630 PNG, 각 300KB 이하로 만든다.
   - 기본안 내용: 프로필 이름(「チェ ソンギュ」 / `choi seonggyu`), 「ポートフォリオ」 / `Portfolio`, 강조색 장식, 라이트 테마 색(`docs/DESIGN.md` §2), 글꼴 IBM Plex Sans JP.
   - 직함·한 줄 소개처럼 원고에서 바뀔 문구는 넣지 않는다. 원고 반영 때 이미지를 다시 만들지 않으려는 것이다.
   - 새 의존성 없이 만든다. 원본(HTML 또는 SVG)과 만드는 명령을 `scripts/brand/`에 남겨 다시 만들 수 있게 한다.
   - 예: 원본 HTML을 실행 환경의 Playwright Chromium으로 찍는다. Playwright는 단계 7 전까지 프로젝트 의존성이 아니다.
   - 만든 PNG는 커밋한다. 빌드 때 만들지 않는다.
5. **파비콘**
   - `public/favicon.svg`(브라우저용)와 `public/favicon.ico`(16·32·48px, `/favicon.ico` 요청과 Google용)를 둔다.
   - `public/apple-touch-icon.png`(180×180, 불투명)도 둔다.
   - `<head>` 링크는 세 개다.
     - `<link rel="icon" href="/favicon.ico" sizes="32x32">`
     - `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`
     - `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
   - 기본안 모양: 강조색 `#0F62FE` 둥근 사각형 위 흰색 소문자 `c`(사이트 이름 `choi`). 흰색/강조색 대비는 5.00:1(DESIGN §2)이다. 글자는 글꼴에 기대지 않게 path로 그린다. 라이트·다크 같은 모양이다.
   - 원본과 만드는 명령은 범위 4와 같이 `scripts/brand/`에 둔다.
6. **404 페이지**
   - `src/pages/404.astro` → `dist/404.html` 하나만 만든다(메모: 언어별 404를 두지 않는 이유).
   - 구성은 T12 방식이다. `src/layouts/NotFoundLayout.astro`가 `BaseLayout`(`locale="ja"`, `noindex`)으로 감싸고, React 화면 컴포넌트 `src/components/pages/NotFoundPage.tsx`(+ `.module.css`)가 본문을 그린다.
   - 본문은 일본어와 영어를 함께 보여준다.
     - 일본어: `h1` 「ページが見つかりません」, 설명 한 줄, Home(`/ja/`) 링크
     - 영어: `lang="en"` 구역 안에 `h2` "Page not found", 설명 한 줄, Home(`/en/`) 링크
   - 문구는 `src/i18n/ui.ts`에 둔다(기본안 문구는 구현 시 정하고 PR에 적는다).
   - `<title>`은 「ページが見つかりません | choi」 형식이다. 헤더·푸터·테마 버튼·명령 팔레트는 다른 페이지와 같이 동작한다.
   - 언어 전환 링크는 `switchLocalePath`가 언어 접두어 없는 경로를 그 언어 Home으로 보내므로 `/en/`가 된다(지금 코드 그대로).
   - 404는 sitemap·명령 팔레트 목록에 넣지 않는다.
7. **문서**
   - `docs/ARCHITECTURE.md`
     - §2: 디렉터리 구조(`public/` 파일, `sitemap.xml.ts`·`robots.txt.ts`·`404.astro`, `src/lib/seo.ts`, `scripts/brand/`)
     - §2 새 절 "SEO (T13 결정)": `site`, `<head>` 태그 표, sitemap·robots, 404, 단계 8에서 할 일
     - §3: A12(SEO 방식: `site` 한 곳, 엔드포인트 sitemap, 404 하나)
   - `docs/DESIGN.md`: 파비콘·공유 이미지 모양과 404 화면 구성(새 절)
   - `docs/PLAN.md`: 진행 상태, 작업 지시서 표, 결정 기록, §8에 단계 8 배포 전 확인 항목(아래 "단계 8로 넘기는 일")

제외:

- 접근성 점검·수정(T14). 다만 기존 18페이지의 화면과 접근성 트리는 달라지면 안 된다(완료 조건).
- 배포 설정: `wrangler` 설정 파일, `not_found_handling`, `_redirects`, `_headers`, 실제 도메인 연결(단계 8)
- 페이지별 공유 이미지(프로젝트 상세마다 다른 이미지), 빌드 때 이미지 생성(satori 등 새 의존성)
- 구조화 데이터(JSON-LD `Person` 등). 직함 등 원고가 정해진 뒤 검토한다(메모).
- Search Console 등록, 실제 공유 미리보기 확인(공개 URL이 필요해서 단계 8)
- `theme-color`, 웹 앱 매니페스트(`manifest.webmanifest`)
- 새 의존성(`@astrojs/sitemap` 포함. 메모)
- 디자인·문구·콘텐츠(원고) 변경, 기존 페이지의 화면 변경

### 단계 8로 넘기는 일 (구현 PR에서 `docs/PLAN.md` §8에 적는다)

- `site`를 실제 주소(`*.workers.dev` 또는 커스텀 도메인)로 바꾸고, 빌드 로그에 임시 값 경고가 없는지 확인한다. 기존 "임시 문구 0건 확인"과 같은 때 한다.
- Workers 설정에 `not_found_handling = "404-page"`를 넣는다.
- 루트 `/`는 지금 2초 meta refresh다. `_redirects`로 `/ja/` 이동(301 또는 302)을 줄지 정한다.
- 공유 미리보기를 실제 URL로 확인한다. sitemap을 Search Console에 제출할지 정한다.
- 회사별 비공개 페이지(PLAN §4)는 `noindex`로 두고 sitemap에 넣지 않는다. 경로를 `robots.txt`에 적지 않는다. `robots.txt`는 누구나 읽을 수 있어 토큰 경로가 드러나기 때문이다.
- 커스텀 도메인으로 옮기면 `*.workers.dev` 주소의 처리(이동 또는 비활성화)를 정한다.

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `astro.config.mjs`: `site`, 임시 값 경고
- `src/layouts/BaseLayout.astro`: `<head>` 태그, `noindex` prop
- `src/layouts/NotFoundLayout.astro`, `src/pages/404.astro`, `src/components/pages/NotFoundPage.tsx`, `src/components/pages/NotFoundPage.module.css`: 새로
- `src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts`, `src/lib/seo.ts`: 새로
- `src/i18n/ui.ts`: 404 문구, 공유 이미지 alt 문구 추가만
- `src/i18n/paths.ts`: 절대 URL이 필요하면 함수 추가만. 기존 함수의 결과는 바꾸지 않는다.
- `public/favicon.ico`, `public/favicon.svg`, `public/apple-touch-icon.png`, `public/og/ja.png`, `public/og/en.png`: 새로
- `scripts/brand/**`: 새로(파비콘·공유 이미지 원본, 만드는 방법)
- `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/PLAN.md`, `docs/tasks/T13-seo.md`, `README.md`(구조 설명이 달라질 때만)
- `docs/screenshots/T13-*.png`: PR 캡처
- 바꾸지 않는 파일:
  - 코드: `src/components/**`(`NotFoundPage` 제외), `src/scripts/**`, `src/styles/**`
  - 콘텐츠·조회: `src/content/**`, `src/lib/content.ts`
  - 라우트: `src/pages/index.astro`, `src/pages/{ja,en}/**`
  - 빌드·의존성: `scripts/font-subset.mjs`, `package.json`, `pnpm-lock.yaml`

## 완료 조건

- [x] `site`가 `astro.config.mjs` 한 곳에만 있고, 출력의 절대 URL이 모두 그 값으로 시작한다.
  - 대상: canonical, hreflang, `og:url`, `og:image`, sitemap, robots
  - 확인: `src/`·`scripts/brand/`에서 `portfolio.example`을 grep하면 `astro.config.mjs` 외에 나오지 않는다.
  - 임시 값이면 빌드 로그에 경고 한 줄이 나온다.
- [x] 18페이지 모두 `<head>`에 범위 2의 태그가 하나씩 있다(파비콘 링크 포함).
  - canonical과 `og:url`은 그 페이지 URL(`site` + 경로, 끝 슬래시)과 같다.
  - hreflang ja·en·x-default 묶음이 ja·en 짝 페이지에서 서로 같다.
  - 확인은 `dist/**/*.html`을 읽는 스크립트로 한다. 결과를 PR에 적는다.
- [x] `dist/sitemap.xml`이 올바른 XML이다(`xmllint --noout`).
  - `<url>`이 18개이고, 각각 `xhtml:link` 3개가 범위 2와 같다.
  - 모든 `<loc>`가 `pnpm preview`에서 200이다. 루트 이동·404·JSON은 없다.
- [x] `dist/robots.txt`가 전체 허용과 절대 URL `Sitemap:` 한 줄을 가진다.
- [x] 공유 이미지 2장이 1200×630 PNG, 각 300KB 이하다. `og:image`가 가리키는 파일이 `dist/og/`에 있다. ja·en 이미지를 PR에 싣는다.
- [x] 파비콘이 있다.
  - `/favicon.ico`(16·32·48px 포함), `/favicon.svg`, `/apple-touch-icon.png`(180×180)가 `pnpm preview`에서 200이다.
  - 브라우저 탭에 보인다(캡처 또는 확인 방법을 PR에).
- [x] 404 페이지
  - `dist/404.html`이 있고 `noindex`이며, canonical·hreflang·`og:url`이 없다.
  - `pnpm preview`에서 `/ja/xyz/`, `/en/projects/xyz/`가 404 상태로 이 페이지를 보여준다.
  - 일본어·영어 안내와 `/ja/`·`/en/` 링크가 보이고, JS를 꺼도 읽힌다.
  - 캡처 3장을 PR에 싣는다: ja 라이트 1280px, 다크 375px, JS 끔.
- [x] 기존 화면이 main과 같다. T12 방법으로 캡처 45장 픽셀 차이 0, 18페이지 `ariaSnapshot()` 글자 단위 동일. 바뀌는 것은 `<head>`뿐이다.
- [x] 페이지가 받는 JS가 main과 같다(외부 JS 헤더 스크립트 1개, 인라인 모듈 합계 같음). 첫 로드에 새로 받는 파일은 파비콘뿐이다.
- [x] 페이지별 HTML 크기 증가량을 PR 표에 적는다(main → T13, `<head>` 태그만큼 늘어남).
- [x] Lighthouse(`/ja/`, `/ja/projects/`, 모바일·데스크톱)
  - SEO 100, Best Practices 100(`errors-in-console` 감점 없음)
  - Performance는 3회 중앙값이 모바일 90·데스크톱 95 이상, CLS 0.1 이하, TBT 0ms(T11 기준 유지)
- [x] 글꼴 누락 검사가 빌드에서 통과한다(새 404 문구 포함). `@font-face` 개수가 늘면 이유를 적는다.
- [x] 새 의존성이 없다(`package.json` 의존성 항목, `pnpm-lock.yaml` 변경 없음).
- [x] 문서가 갱신되어 있다: `docs/ARCHITECTURE.md` §2·A12, `docs/DESIGN.md`, `docs/PLAN.md`(진행 상태·표·결정 기록·§8 단계 8 항목).
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`와 GitHub CI가 통과한다.
- [x] 비밀 값 미포함.

## 확인 방법

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm check && pnpm build
xmllint --noout dist/sitemap.xml
grep -rn 'portfolio.example' src scripts/brand astro.config.mjs   # astro.config.mjs만 나와야 한다
cat dist/robots.txt
pnpm preview
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4321/ja/xyz/        # 404
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4321/favicon.ico     # 200
```

- **`<head>` 검사**: `dist/**/*.html`(루트 이동 HTML과 404 제외)을 읽어 다음을 확인한다. 스크립트는 저장소에 넣지 않아도 된다. 단계 7 E2E로 옮길 수 있게 PR에 요지를 적는다.
  - canonical·`og:url`이 페이지 경로와 맞는지
  - hreflang 묶음이 짝 페이지와 같은지
  - OG 필수 속성이 하나씩 있는지
- **캡처·접근성 트리**: `docs/tasks/T12-react-components.md` "확인 방법"과 같다(main과 브랜치를 다른 포트로 띄워 비교).
- **Lighthouse**: `docs/tasks/T11-performance.md` "측정 방법"과 같다. SEO·Best Practices는 1회로도 되지만 결과가 흔들리면 3회 중앙값을 쓴다.

## 메모

- 아래는 지시서 작성 시 정한 기본안이다. 사용자(choi)가 구현 PR에서 바꿀 수 있다.
  - `site` 임시 값
  - `x-default` 대상
  - 공유 이미지·파비콘 모양
  - 404 페이지 하나(이중 언어)
  - sitemap을 엔드포인트로 만들기
- **`site` 임시 값**:
  - `.example`은 예약된 최상위 도메인이라 실제 주소와 겹치지 않는다. 실수로 배포해도 다른 사람의 사이트를 가리키지 않는다.
  - `*.workers.dev` 주소(`<Worker 이름>.<계정 하위 도메인>.workers.dev`)는 계정마다 달라 지금 정할 수 없다.
- **`x-default` = ja URL**: Google은 x-default를 언어 선택 페이지나 자동 이동 홈에 권한다. 이 사이트에는 언어 선택 페이지가 없다. 루트 `/`는 지금 `noindex`인 meta refresh 페이지라 x-default로 가리키기 어렵다. 그래서 기본 언어(ja) 페이지를 가리킨다. 단계 8에서 `/`를 서버 이동(`_redirects`)으로 바꾸면 Home의 x-default를 `/`로 바꿀지 다시 볼 수 있다.
- **404를 하나만 두는 이유**:
  - Cloudflare `404-page`는 가장 가까운 `404.html`을 찾으므로 `ja/404.html`·`en/404.html`을 두면 언어별 404가 된다.
  - 그러나 Astro는 언어 폴더 아래 404를 `ja/404/index.html`로 출력한다(사전 확인). 빌드 후 파일을 옮기는 코드가 필요하다.
  - 그 동작은 단계 8 배포 전에는 이 환경에서 확인할 수 없다(`pnpm preview`는 루트 `404.html`만 쓴다).
  - 그래서 이중 언어 페이지 하나로 시작한다. 언어별 404가 필요하면 단계 8에서 다시 정한다.
- **sitemap을 엔드포인트로 만드는 이유**:
  - URL이 18개뿐이고, 이미 `commands.json.ts`가 같은 방식이다.
  - 새 의존성 없이 hreflang 묶음을 `<head>`와 같은 함수로 만들 수 있다.
  - 통합 패키지 `@astrojs/sitemap`은 새 의존성이라 사용자 확인이 필요하다. 이번에는 기능을 비교하지 않았다.
  - `lastmod`는 정확한 수정일을 낼 방법이 없어 넣지 않는다.
- **hreflang을 `<head>`와 sitemap 양쪽에 두는 이유**: Google은 한 방법이면 충분하다고 안내한다. 다른 검색 엔진·도구는 `<head>`를 읽는다. 두 곳이 같은 함수에서 나오므로 어긋나지 않는다.
- **`og:image`를 언어별 하나로 두는 이유**: 원고 반영 전이라 페이지별 이미지에 넣을 확정 문구가 적다. 프로젝트 상세별 이미지는 원고 반영 뒤 필요하면 따로 정한다.
- **파비콘과 루트 이동**: Google은 "홈 페이지의 `<head>`"에서 파비콘을 찾는다. 이 사이트의 홈 `/`는 이동 페이지다. Google이 `/` → `/ja/` 이동을 따라가 `/ja/`의 링크를 쓰는지는 확인하지 못했다(확인 필요). `/favicon.ico`를 루트에 두는 것은 이 경우에도 대비하려는 것이다.
- 구조화 데이터(`Person`)는 이름·GitHub·LinkedIn은 있지만 직함(`jobTitle`)이 원고 전이라 이번에 넣지 않는다.
- 이 지시서의 공식 문서 확인은 2026-10-31 기준이다. 구현 시 바뀐 점이 있으면 PR에 적는다.
