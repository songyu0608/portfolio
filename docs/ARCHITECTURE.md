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

## 2. 디렉터리 구조 (T03 기준)

```text
.
├─ AGENTS.md / CLAUDE.md / README.md
├─ docs/                       ← 계획·설계 문서, 작업 지시서, 화면 캡처
├─ public/fonts/               ← 글꼴 라이선스
├─ src/
│  ├─ i18n/
│  │  ├─ ui.ts                  ← UI 문구(일본어 기준 타입, 영어 키 누락·초과 시 타입 오류)
│  │  └─ paths.ts               ← 페이지 경로, 언어 전환 경로 변환(astro:i18n 사용)
│  ├─ layouts/BaseLayout.astro  ← 문서 골격, 전역 CSS·글꼴 로드, 테마 첫 적용 인라인 스크립트
│  ├─ components/
│  │  ├─ SiteHeader.astro / SiteFooter.astro / LanguageSwitch.astro / ThemeToggle.astro
│  │  ├─ DesignPreview.astro    ← T02 확인 화면(본문). T04에서 교체
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

직접 의존성은 정확한 버전으로 통일하고, 간접 의존성은 lockfile로 고정한다. CI는 `pnpm install --frozen-lockfile`을 사용한다. pnpm 버전은 `packageManager`로 고정한다.

## 4. 비밀 값 관리

- 저장소에 커밋 금지: API 키, Turnstile secret, 메일 API 키, 회사별 토큰, 개인 전화번호 등
- 로컬: `.dev.vars` (gitignore됨). 필요한 키 이름은 `.dev.vars.example`에 값 없이 적는다 (단계 8).
- 배포: `wrangler secret put` 또는 Cloudflare 대시보드
- CI: GitHub Actions Secrets
