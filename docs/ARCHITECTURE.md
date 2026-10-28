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

## 2. 디렉터리 구조 (예정)

T01에서 실제 구조를 만들고 이 절을 갱신한다. 아래는 기본안이다.

```
.
├─ AGENTS.md / CLAUDE.md / README.md
├─ docs/                    ← 계획·설계 문서, 작업 지시서
├─ public/                  ← 정적 파일 (favicon, OG 이미지, 이력서 PDF)
├─ src/
│  ├─ components/           ← Astro 컴포넌트
│  │  └─ interactive/       ← React island (터미널, 명령 팔레트, 카드 틸트 등)
│  ├─ content/              ← 콘텐츠 컬렉션 (프로젝트, 경력) — ja/en
│  ├─ i18n/                 ← UI 문구 번역, 언어 유틸
│  ├─ layouts/
│  ├─ pages/
│  │  ├─ ja/ …
│  │  └─ en/ …
│  └─ styles/               ← 디자인 토큰(CSS 변수), 전역 스타일
├─ worker/                  ← 단계 8: Workers 함수 (API)
├─ tests/                   ← 단계 7: Playwright
└─ .github/workflows/       ← CI
```

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
| A7 | 패키지 매니저 pnpm (기본안) | 빠른 설치, lockfile 일관성 | npm | proposed (T01에서 확정) |

## 4. 비밀 값 관리

- 저장소에 커밋 금지: API 키, Turnstile secret, 메일 API 키, 회사별 토큰, 개인 전화번호 등
- 로컬: `.dev.vars` (gitignore됨). 필요한 키 이름은 `.dev.vars.example`에 값 없이 적는다 (단계 8).
- 배포: `wrangler secret put` 또는 Cloudflare 대시보드
- CI: GitHub Actions Secrets
