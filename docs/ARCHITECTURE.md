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

## 2. 디렉터리 구조 (T04 기준)

```text
.
├─ AGENTS.md / CLAUDE.md / README.md
├─ docs/                       ← 계획·설계 문서, 작업 지시서, 화면 캡처
├─ public/fonts/               ← 글꼴 라이선스
├─ src/
│  ├─ content.config.ts          ← 콘텐츠 컬렉션 스키마(zod는 astro/zod)
│  ├─ content/                   ← 페이지 본문 콘텐츠(아래 "콘텐츠 구조")
│  │  ├─ profile/<ja|en>.yaml
│  │  ├─ skills.yaml
│  │  └─ projects/<ja|en>/<slug>.yaml
│  ├─ lib/content.ts             ← 콘텐츠 조회, 여러 항목에 걸친 규칙 검사, 임시 항목 수 경고
│  ├─ i18n/
│  │  ├─ ui.ts                  ← UI 문구(일본어 기준 타입, 영어 키 누락·초과 시 타입 오류)
│  │  └─ paths.ts               ← 페이지 경로, 언어 전환 경로 변환(astro:i18n 사용)
│  ├─ layouts/BaseLayout.astro  ← 문서 골격, 전역 CSS·글꼴 로드, 테마 첫 적용 인라인 스크립트
│  ├─ components/
│  │  ├─ SiteHeader.astro / SiteFooter.astro / LanguageSwitch.astro / ThemeToggle.astro
│  │  ├─ SkillTag.astro / ProjectCard.astro ← 여러 페이지가 쓰는 기술 태그·프로젝트 카드
│  │  ├─ Phrases.astro          ← 일본어 문절 단위 줄바꿈 출력(docs/DESIGN.md §2)
│  │  └─ pages/                 ← 페이지 화면 컴포넌트(레이아웃 + 본문). 언어만 props로 받음
│  ├─ scripts/theme.ts          ← 테마 읽기·쓰기(헤더 버튼, 단계 5 명령 팔레트가 공유)
│  ├─ styles/                   ← tokens.css(디자인 토큰), global.css(전역 스타일)
│  └─ pages/
│     ├─ index.astro            ← /ja/로 이동
│     ├─ ja/index.astro, about.astro, projects.astro, contact.astro
│     └─ en/ (ja와 같은 구성)
├─ astro.config.mjs            ← 정적 출력, React, i18n
├─ tsconfig.json               ← Astro strict + React JSX
├─ eslint.config.mjs            ← JS, TypeScript, Astro, React, Hooks
├─ .prettierrc.json / .prettierignore / .editorconfig
├─ package.json / pnpm-lock.yaml / pnpm-workspace.yaml
├─ .nvmrc / .npmrc              ← Node 버전 및 엔진 검사
└─ .github/workflows/ci.yml      ← 포맷 → lint → 타입 → 빌드
```

`tests/`는 단계 7, Workers 함수는 단계 8에 추가한다.

### 페이지 파일 방식 (T03 결정)

언어별 페이지 파일 방식을 쓴다. `src/pages/ja/about.astro`와 `src/pages/en/about.astro`는 같은 화면 컴포넌트(`src/components/pages/`)를 언어만 바꿔 호출하는 한 줄 파일이다. 지금은 `<ComingSoonPage locale="ja" page="about" />`이고, 단계 4에서 `<AboutPage locale="ja" />` 같은 페이지별 컴포넌트로 바꾼다. 레이아웃·제목·본문은 화면 컴포넌트가 정한다.

- 이유: 파일 경로가 URL과 그대로 대응해 찾기 쉽고, T01 구조를 그대로 잇는다. 언어가 2개로 고정이라 파일이 두 벌인 비용이 작다. 동적 경로(`src/pages/[locale]/about.astro` + `getStaticPaths`)는 언어가 늘 때 유리하지만 지금은 이점이 적다.
- 프로젝트 상세처럼 항목 수만큼 페이지가 생기는 경로는 `src/pages/ja/projects/[slug].astro`처럼 언어 폴더 안에서 동적 경로를 쓴다(단계 4에서 확정).

### 문구·콘텐츠 위치 규칙 (T03 결정)

- UI 문구(내비게이션, 버튼, 접근성 문구, 페이지 이름·설명): `src/i18n/ui.ts`. 일본어 객체의 타입을 영어 객체에 적용하므로 영어에 키가 빠지거나 남으면 `pnpm check`가 실패한다. 컴포넌트에 문구를 직접 쓰지 않는다.
- 페이지 본문 콘텐츠(경력, 프로젝트, 자격증 등): `src/content/`(Astro content collections). 컬렉션 스키마는 각 페이지 지시서에서 정한다.
- 경로: 페이지 URL은 `src/i18n/paths.ts`의 `localizePath`, 언어 전환 URL은 `switchLocalePath`로 만든다. 둘 다 `astro:i18n`의 `getRelativeLocaleUrl`을 써서 끝 슬래시 규칙(`trailingSlash: 'always'`)을 지킨다.

### 콘텐츠 구조 (T04 결정)

페이지 본문 콘텐츠는 Astro content collections(`src/content.config.ts`, loader는 `astro/loaders`의 `glob`)로 읽고 zod 스키마로 검증한다. 형식은 YAML이다. 문장이 짧은 필드 위주라 Markdown 본문이 필요 없고, 주석으로 작성 규칙을 남길 수 있기 때문이다.

| 컬렉션 | 파일 | 단위 | 주요 필드 |
| --- | --- | --- | --- |
| `profile` | `src/content/profile/<ja\|en>.yaml` | 언어별 1건(id = 언어) | `placeholder`, `name`, `role`(직함), `tagline`(한 줄 소개), `description`(Home meta description) |
| `skills` | `src/content/skills.yaml` | 언어 공통 1건 | `categories[]`: `id`, `name.ja`/`name.en`, `items[]`: `placeholder`, `name`, `primary`(기본 false), `homeOrder`(있으면 Home 핵심 기술) |
| `projects` | `src/content/projects/<ja\|en>/<slug>.yaml` | 언어별, 같은 slug | `placeholder`, `title`, `summary`, `period`(문자열), `role`, `highlights`(1~2개), `tech`, `featuredOrder`(있으면 Home 대표 프로젝트) |

- 필드 이름은 영어 camelCase로 통일한다. 스키마는 `z.strictObject`라서 모르는 필드(오타)가 있으면 빌드가 실패한다.
- `placeholder`는 필수 boolean이다. 빠뜨렸을 때 실제 원고로 취급되는 일을 막기 위함이다.
- 한 줄을 넘을 수 있는 일본어 문구(`profile.tagline`, `projects.title`)는 문자열 또는 문절 단위 문자열 배열이다. 배열이면 `Phrases.astro`가 문절 사이에서만 줄을 바꾼다(`docs/DESIGN.md` §2). 영어는 문자열로 쓴다.
- 언어별 콘텐츠는 같은 slug를 쓰는 언어 폴더(프로필은 언어 이름 파일) 방식이다. 기술 스택은 기술 이름이 언어 공통이라 한 파일에 분류 이름만 두 벌 둔다. 분류·기술의 표시 순서는 파일 안 배열 순서다. 컬렉션 항목 사이의 순서에 기대지 않도록 분류마다 항목을 나누지 않고 한 파일 1건으로 둔다.
- 여러 항목에 걸친 규칙은 `src/lib/content.ts`가 `getCollection` 결과를 검사하고, 어기면 어긴 규칙을 모두 적은 오류를 던져 빌드를 멈춘다: 언어 짝(프로필 ja/en, 프로젝트 slug), 대표 프로젝트 언어마다 2~3개, Home 핵심 기술 3~6개, 주력 기술은 모두 Home 핵심 기술에 포함, 주력 기술 전체 2~4개·분류당 0~2개, 순서 값 중복 금지, 같은 slug의 `featuredOrder`가 언어마다 같음. 페이지는 `getCollection`을 직접 쓰지 않고 이 파일의 함수(지금은 `getHomeContent`)를 쓴다. T05·Projects 지시서는 필요한 조회 함수를 같은 파일에 추가한다.
- 임시 항목 수: 검사를 통과하면 `[content] placeholder entries: N (profile a, skills b, projects c)`를 빌드 로그에 경고로 한 번 출력한다. 기술은 항목(기술) 하나를 1건으로 센다. 배포 전 0건이어야 한다(`docs/CONTENT.md` "임시 문구 규칙").
- 사이트 이름(`src/i18n/ui.ts`의 `site.name`)과 프로필 이름(`profile.name`)은 별개 값이다. 사이트 이름은 모든 페이지의 헤더·푸터·`<title>`에 쓰는 짧은 표기이고 레이아웃이 동기적으로 읽는 UI 문구다. 프로필 이름은 히어로·About에 쓰는 본문 콘텐츠이며 원고에서 漢字/カナ 표기가 될 수 있다. 지금은 둘 다 `choi`이며, 원고를 받을 때 두 값을 함께 확인한다.
- 기술 이름은 언어 공통 값이라 임시 표식도 영어 페이지에서 「（仮）」로 보인다(프로젝트의 `tech`도 같은 규칙).

T01 환경: Node 24.19.0, pnpm 11.25.0, Astro 7.4.4, React 19.3.1. TypeScript는 검사 도구의 지원 범위에 맞춰 6.0.3을 사용한다. 직접 의존성과 lockfile로 설치 버전을 기록한다. pnpm이 생성한 `pnpm-workspace.yaml`에는 이번 Astro 설치에 필요한 특정 버전의 release-age 예외만 기록한다.

`output: 'static'` 빌드는 `dist/{ja,en}/index.html`, `dist/{ja,en}/{about,projects,contact}/index.html`(T03), 루트 redirect HTML을 생성한다. React hydration은 없으며 서버 어댑터도 필요하지 않다. 페이지가 받는 JS는 테마 관련 인라인 스크립트 2개뿐이다. 다만 `@astrojs/react` 통합 때문에 어느 페이지도 참조하지 않는 React 클라이언트 번들(`dist/_astro/client.*.js`, 약 220KB)이 T01부터 빌드 결과에 생성된다. 단계 5(A2)에서 React island를 쓰므로 통합은 유지한다(2026-10-30 사용자 결정, PLAN §8). `dist/`를 Workers 정적 자산 디렉터리로 지정할 수 있음을 [공식 문서](https://developers.cloudflare.com/workers/static-assets/binding/)와 출력 구조로 확인한다. 실제 배포·HTTP redirect 정책은 단계 8에서 검증한다.

## 3. 기술 결정 기록 (ADR 요약)

새 결정은 표 아래에 추가한다. 번복할 때는 기존 줄을 지우지 말고 상태를 `superseded`로 바꾼다.

| # | 결정 | 이유 | 대안 | 상태 |
| --- | --- | --- | --- | --- |
| A1 | Astro + TypeScript | 콘텐츠 중심 사이트, 기본 출력 JS 최소, i18n 라우팅 내장 | Next.js(무겁고 서버 전제), Hugo(인터랙션 확장 불편) | accepted |
| A2 | 인터랙션은 React island + Motion / GSAP | 필요한 컴포넌트만 hydrate해 페이지는 가볍게 유지 | 전체 SPA | accepted |
| A3 | Cloudflare Workers 정적 자산, 무료 플랜 | 정적 요청 무료, 동적 기능을 같은 플랫폼에서 추가 가능 | Cloudflare Pages, Vercel, Netlify | accepted |
| A4 | i18n: `/ja`(기본), `/en` 경로 분리 | SEO(hreflang), 공유 링크가 언어를 유지 | 쿼리/쿠키 기반 전환 | accepted |
| A5 | 회사별 비공개 페이지는 토큰 URL + KV | 채용 담당자에게 로그인 단계가 없음 | Cloudflare Access(이메일 OTP) | accepted (단계 8에 재검토) |
| A6 | 저장소 Public, 비밀 값은 Cloudflare Secrets / `.dev.vars` | 포트폴리오로서 코드 공개 가치 | Private 저장소 | accepted |
| A7 | 패키지 매니저 pnpm 11.25.0 | T01 작업 환경에 설치된 버전으로 로컬·clean clone·CI 검증 완료. pnpm 12와 비교 평가해 선택한 것은 아니며, 업그레이드는 별도 검증 후 진행 | npm, pnpm 12 (미평가) | accepted (T01) |
| A8 | 언어별 페이지 파일 + 공유 화면 컴포넌트, UI 문구는 `src/i18n/ui.ts`(일본어 기준 타입) | URL과 파일 경로가 대응하고 T01 구조를 이음. 영어 문구 누락을 타입 검사로 막음 | 동적 경로 `[locale]` + `getStaticPaths` | accepted (T03) |
| A9 | 콘텐츠는 YAML content collections + 조회 함수에서 여러 항목 규칙 검사 | 스키마로 필드 누락·오타를, 조회 함수로 개수·언어 짝 규칙을 빌드 시점에 막음. 원고 반영 시 콘텐츠 파일만 바꿈 | 커스텀 loader에서 검사, TypeScript 상수 파일 | accepted (T04) |

직접 의존성은 정확한 버전으로 통일하고, 간접 의존성은 lockfile로 고정한다. CI는 `pnpm install --frozen-lockfile`을 사용한다. pnpm 버전은 `packageManager`로 고정한다.

## 4. 비밀 값 관리

- 저장소에 커밋 금지: API 키, Turnstile secret, 메일 API 키, 회사별 토큰, 개인 전화번호 등
- 로컬: `.dev.vars` (gitignore됨). 필요한 키 이름은 `.dev.vars.example`에 값 없이 적는다 (단계 8).
- 배포: `wrangler secret put` 또는 Cloudflare 대시보드
- CI: GitHub Actions Secrets
