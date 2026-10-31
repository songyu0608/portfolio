# PLAN — 전체 계획과 진행 상태

이 파일은 계획·결정·진행 상태의 **원본**이다. 결정이 바뀌면 이 파일을 먼저 고친다.

마지막 갱신: 2026-11-01 (T16 지시서 작성)

## 현재 진행 상태

| 항목 | 값 |
| --- | --- |
| 현재 단계 | 단계 7 테스트 — T16 Lighthouse CI 지시서 리뷰 |
| 진행 중인 작업 | T16 지시서 리뷰(`docs/tasks/T16-lighthouse-ci.md`). merge 뒤 구현 담당을 정한다 |
| 다음 작업 | T16 구현 → 단계 8. 원고 반영은 맨 마지막(2026-10-31 사용자 결정) |
| 블로커 | 없음. 콘텐츠 원고(`docs/CONTENT.md`)는 미수집이며, 단계 4는 임시 문구로 진행한다. 배포(단계 8) 전에 실제 원고로 교체해야 한다 |

## 1. 개요

IT 엔지니어(백엔드)인 choi의 이직·채용용 포트폴리오 사이트를 정적 사이트 기반으로 만든다. 백엔드 경력과 함께 AI 활용 개발 경험을 어필한다(2026-10-30 사용자 결정, §2).

- 주 독자: 채용 담당자, 현업 엔지니어
- 목적: 경력, 프로젝트, 기술 스택을 짧은 시간에 파악하고 바로 연락할 수 있게 한다.
- 범위 제외: 기술 블로그
- 개발 방식: 단계별로 나눠 개발한다. 기간과 코드량보다 완성도를 우선한다.
- 작업자: Claude와 ChatGPT(Codex)가 같은 GitHub 저장소에서 나눠 작업한다. 여러 노트북에서 작업할 수 있다.

## 2. 확정 사항

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| 목적 | 이직·채용용 포트폴리오 | 사용자 결정 |
| 전문 분야 | 백엔드 + AI 활용 개발. AI 엔지니어로도 어필한다 | 사용자 결정(2026-10-30 변경, 이전: 백엔드). 일본 채용 시장에서 AI 개발 경험을 높이 평가하기 때문. 프로젝트 카드는 설계·규모·성능·안정성 지표를 강조. 기술 스택 첫 분류를 「AI活用開発」로 둔다. 직함(후보 「AIエンジニア / バックエンドエンジニア」)·한 줄 소개는 원고 반영 때 확정 |
| 블로그 | 제외 | 사용자 결정 |
| 언어 | 일본어 기본, 영어 전환 (`/ja`, `/en`) | 사용자 결정 |
| 프레임워크 | 화면은 React + TypeScript, 페이지 구성·정적 빌드는 Astro(Vite 기반). 화면 컴포넌트는 빌드 때 HTML로만 렌더(T12에서 전환) | 일본 채용 공고의 React 수요. 기본 출력 JS가 거의 없는 정적 출력과 i18n 라우팅은 Astro로 유지. 2026-10-31 사용자 결정(이전: Astro + TypeScript, §7, `docs/ARCHITECTURE.md` A11) |
| 인터랙션 | 기본은 `<script>`(TS 모듈)·CSS(T08·T09). 브라우저에서 실행하는 React는 상태가 많은 컨셉 3·4(T10)에만, 열 때 동적 import(island 아님). Motion / GSAP은 쓰지 않음 | 효과는 자유롭게, 페이지는 가볍게. 2026-10-31 T10 지시서에서 갱신(이전: React island + Motion / GSAP) |
| 인터랙션 컨셉 | 1~5 전부 채택 (`docs/DESIGN.md`) | 사용자 결정 |
| 렌더링 | 정적 기본 + 필요한 경로만 서버 실행 | 비용 0, 보안·유지보수 부담 최소 |
| 호스팅 | Cloudflare Workers 정적 자산, 무료 플랜 | 정적 파일 요청 무료. Cloudflare가 신규 프로젝트에 Workers를 권장 |
| 저장소 | GitHub `songyu0608/portfolio`, **Public** | 사용자 결정. 비밀 값은 저장소에 넣지 않음 |
| 도메인 | 미정. 우선 `*.workers.dev` 사용 | 단계 8 전에 결정 |
| 협업 | `AGENTS.md` 기반 작업 지시서 + CI. 교차 리뷰 절차는 `docs/REVIEW.md` | Claude와 ChatGPT가 같은 규칙을 읽음 |
| 접근성·성능 | reduced-motion 존중, Lighthouse 기준 유지 | 모바일 열람 대비 |
| 자격증 표기 | 취득 자격증(이름·연월) + 「〇〇 取得に向けて学習中」 최대 1개. 시안 A「シンプルリスト」 | 사용자 결정. 세부는 `docs/CONTENT.md` "자격증 표기 규칙" |
| 기술 스택 표기 | 분류별 태그 목록, 주력 기술만 채운 태그로 구분. 시안 B「分類別タグ」 | 사용자 결정. 세부는 `docs/CONTENT.md` "기술 스택 표기 규칙" |
| 기술 로고 | 아이콘 패키지(새 의존성) 도입 승인. 단색 로고 + 기술 이름 텍스트, 로고는 장식. 경력·기술 스택 원고 반영 때 한꺼번에 적용 | 사용자 결정(2026-10-30). 패키지 선택·크기·로고 없는 기술 처리는 적용 작업에서 정한다. 시안 B의 태그에 로고를 더하는 변경 |
| 디자인 색상·글꼴 | 색상 시안 E「Blue」(accent `#0F62FE` / 다크 `#78A9FF`), 글꼴 IBM Plex Sans JP + IBM Plex Mono. 색은 토큰 값 교체로 사이트 전체 변경, 회사별 강조색 구조는 만들지 않음 | 사용자 결정. 값은 `docs/tasks/T02-design-system.md` "사용자 선택 결과", 확정 기록은 T02 구현에서 `docs/DESIGN.md` §2 |

## 3. 페이지 구성

다섯 페이지를 일본어와 영어 두 벌로 생성한다.

| 페이지 | 내용 |
| --- | --- |
| Home | 한 줄 소개, 핵심 기술, 대표 프로젝트 2~3개 |
| About / 경력 | 경력 타임라인, 기술 스택, 자격증, 이력서 PDF |
| Projects | 프로젝트 카드 목록 + 프로젝트별 상세(課題 → 設計 → 結果 → 技術) |
| Contact | 연락 폼, 이메일, GitHub, LinkedIn |
| 회사별 비공개 페이지 (후반) | 지원 회사마다 강조점을 바꾼 페이지, 토큰 URL로 접근 |

모든 페이지 공통: 반응형, 다크 모드, SEO(meta·OG 이미지·sitemap), 접근성.

## 4. 동적 기능 (단계 8)

정적 부분을 완성한 뒤 추가한다. 별도 비용은 커스텀 도메인 구입비뿐인 것으로 조사했으나, 구현 시 재확인한다.

| 기능 | 상태 | 구성 |
| --- | --- | --- |
| 연락 폼 | 채택 | Turnstile + Workers 함수 + 메일 발송(Cloudflare Email Service 또는 Resend) + D1(선택) |
| 회사별 비공개 페이지 | 채택(선택) | 추측 불가능한 회사별 토큰 URL + Workers + KV 열람 기록. 로그인 없음 |
| AI 챗봇 | 보류 | API 키를 숨길 서버 필요, 사용료 발생 |
| 좋아요·방명록 등 | 제외 | 채용 목적과 관련 낮음 |

## 5. 개발 단계

각 단계가 끝날 때마다 미리보기로 확인한 뒤 다음으로 넘어간다.

| 단계 | 내용 | 상태 |
| --- | --- | --- |
| 0 | 요구사항·콘텐츠 정리, 저장소 뼈대(AGENTS.md, CLAUDE.md, docs/, 작업 지시서 템플릿) | done |
| 1 | 프로젝트 초기화: Astro, TypeScript, lint/format, CI | done |
| 2 | 디자인 시스템: 색, 타이포그래피, 간격, 다크 모드, 인터랙션 세부 확정 | done |
| 3 | 공통 레이아웃: 헤더, 푸터, 내비게이션, 언어 전환 | done |
| 4 | 페이지 구현: Home → About/경력 → Projects → Contact(정적 부분) | done |
| 5 | 인터랙션 구현: 컨셉 1~5 (T08 = 1·2, T09 = 5, T10 = 3·4) | done |
| 6 | 품질: 성능(T11) → React 중심 전환(T12) → SEO(T13) → 접근성(T14) | done |
| 7 | 테스트: E2E(Playwright, T15) → Lighthouse CI(T16) | in-progress |
| 8 | 배포와 동적 기능: Cloudflare, 도메인, HTTPS, 방문 분석, 연락 폼, 회사별 비공개 페이지 | todo |
| 9 | 운영: 콘텐츠 추가 절차 문서화, 카드 클릭률 확인 후 효과 조정 | todo |

## 6. 작업 지시서 목록

상태: `todo` / `in-progress` / `review` / `done`. 담당: `claude` / `codex` / `-`(미배정).
새 지시서는 `docs/tasks/_TEMPLATE.md`를 복사해 만들고 이 표에 추가한다.

| ID | 제목 | 단계 | 선행 | 담당 | 상태 | 파일 |
| --- | --- | --- | --- | --- | --- | --- |
| T00 | 저장소 뼈대 | 0 | - | claude | done | PR #1 |
| T01 | 프로젝트 초기화 | 1 | T00 | codex | done | `docs/tasks/T01-init.md` — [PR #4](https://github.com/songyu0608/portfolio/pull/4) |
| T01-followup | 교차 리뷰 후속 정리 | 1 | T01 | codex | done | `docs/tasks/T01-followup.md` — [PR #5](https://github.com/songyu0608/portfolio/pull/5) |
| T02 | 디자인 시스템 | 2 | T01-followup | codex | done | `docs/tasks/T02-design-system.md` — [PR #9](https://github.com/songyu0608/portfolio/pull/9) |
| T03 | 공통 레이아웃·언어·테마 전환 | 3 | T02 | claude | done | `docs/tasks/T03-common-layout.md` — 지시서 [PR #10](https://github.com/songyu0608/portfolio/pull/10), 구현 [PR #11](https://github.com/songyu0608/portfolio/pull/11) |
| T04 | Home (한 줄 소개·핵심 기술·대표 프로젝트, 임시 문구) | 4 | T03 | claude | done | `docs/tasks/T04-home.md` — 지시서 [PR #12](https://github.com/songyu0608/portfolio/pull/12), 구현 [PR #13](https://github.com/songyu0608/portfolio/pull/13) |
| T05 | About/경력 (경력 타임라인·기술 스택·자격증·이력서 PDF, 임시 문구) | 4 | T04 | claude | done | `docs/tasks/T05-about.md` — 지시서 [PR #15](https://github.com/songyu0608/portfolio/pull/15), 구현 [PR #16](https://github.com/songyu0608/portfolio/pull/16) |
| T06 | Projects (목록·상세·担当工程, 임시 문구) | 4 | T05 | claude | done | `docs/tasks/T06-projects.md` — 지시서 [PR #18](https://github.com/songyu0608/portfolio/pull/18), 구현 [PR #19](https://github.com/songyu0608/portfolio/pull/19) |
| T07 | Contact (연락 수단 목록·메일 복사 버튼·푸터 연락 링크, 임시 문구) | 4 | T06 | claude | done | `docs/tasks/T07-contact.md` — 지시서 [PR #21](https://github.com/songyu0608/portfolio/pull/21), 구현 [PR #22](https://github.com/songyu0608/portfolio/pull/22) |
| T08 | Hero 디코딩·프로젝트 카드 틸트와 상세 전환 (인터랙션 컨셉 1·2) | 5 | T07 | claude | done | `docs/tasks/T08-hero-cards.md` — 지시서 [PR #24](https://github.com/songyu0608/portfolio/pull/24), 구현 [PR #25](https://github.com/songyu0608/portfolio/pull/25) |
| T09 | 스크롤 경력 타임라인 (인터랙션 컨셉 5) | 5 | T08 | claude | done | `docs/tasks/T09-career-timeline.md` — 지시서 [PR #27](https://github.com/songyu0608/portfolio/pull/27), 구현 [PR #28](https://github.com/songyu0608/portfolio/pull/28) |
| T10 | 명령 팔레트·터미널 모드 (인터랙션 컨셉 3·4) | 5 | T09 | claude | done | `docs/tasks/T10-command-palette-terminal.md` — 지시서 [PR #30](https://github.com/songyu0608/portfolio/pull/30), 구현 [PR #31](https://github.com/songyu0608/portfolio/pull/31) |
| T11 | 성능 최적화 (글꼴 로딩·CLS·스크립트 점검) | 6 | T10 | claude | done | `docs/tasks/T11-performance.md` — 지시서 [PR #33](https://github.com/songyu0608/portfolio/pull/33), 구현 [PR #34](https://github.com/songyu0608/portfolio/pull/34) |
| T12 | React 중심 전환 (화면 컴포넌트 React + TypeScript, CSS Modules, 소개 문서) | 6 | T11 | claude | done | `docs/tasks/T12-react-components.md` — 지시서 [PR #36](https://github.com/songyu0608/portfolio/pull/36), 구현 [PR #37](https://github.com/songyu0608/portfolio/pull/37) |
| T13 | SEO (canonical·hreflang·OG·sitemap·robots·favicon·404) | 6 | T12 | claude | done | `docs/tasks/T13-seo.md` — 지시서 [PR #39](https://github.com/songyu0608/portfolio/pull/39), 구현 [PR #40](https://github.com/songyu0608/portfolio/pull/40) |
| T14 | 접근성 점검·수정 (WCAG 2.2 AA 자동·수동 점검, 강제 색상 모드, 터미널 출력 스크롤) | 6 | T13 | claude | done | `docs/tasks/T14-accessibility.md` — 지시서 [PR #42](https://github.com/songyu0608/portfolio/pull/42), 구현 [PR #43](https://github.com/songyu0608/portfolio/pull/43) |
| T15 | E2E 테스트 (Playwright Test, 3개 브라우저, 기능·키보드·axe·접근성 트리, CI) | 7 | T14 | claude | done | `docs/tasks/T15-e2e-tests.md` — 지시서 [PR #45](https://github.com/songyu0608/portfolio/pull/45), 구현 [PR #46](https://github.com/songyu0608/portfolio/pull/46) |
| T16 | Lighthouse CI (Lighthouse 13, 성능·접근성·Best Practices·SEO 점수 기준, CI) | 7 | T15 | - | review | `docs/tasks/T16-lighthouse-ci.md` |

이후 지시서는 앞 작업이 끝날 때 작성한다. 예정: 단계 8. SEO·접근성은 화면 마크업을 점검하므로 React 전환 뒤에 한다(2026-10-31 사용자 결정). 원고 반영(기술 로고 포함)은 개발 작업 중 맨 마지막에 하되, 임시 항목이 남은 채 공개 배포하지 않는다(`docs/CONTENT.md` "임시 문구 규칙").

## 7. 미결 사항

- [ ] 커스텀 도메인 구입 여부와 도메인 이름 (단계 8 전, 메일 발송 설정에 필요할 가능성 높음)
- [ ] 콘텐츠 원고 (`docs/CONTENT.md` 체크리스트). 단계 4는 임시 문구로 진행하고, 단계 8 배포 전에 교체한다
- [x] 패키지 매니저 확정: pnpm 11.25.0 (T01)
- [x] React 중심 전환(A안, 2026-10-31 사용자 결정): Astro는 라우팅·빌드 틀로 두고, 화면 컴포넌트(`src/components/*.astro` 12개 + `src/components/pages/*.astro` 5개 = 17개. 처음 적은 18개는 오기)를 React(`.tsx`, 빌드 때 HTML로만 렌더하고 브라우저 JS는 늘리지 않음)로 바꾼다. 저장소·사이트의 소개(README, 기술 스택 표기)는 「React + TypeScript」를 중심에 두고 Astro는 정적 빌드 도구로 함께 적는다. 빌드는 Vite 기반이다(Astro가 Vite로 빌드하며, T11 글꼴 통합도 Vite 플러그인). 디코딩·틸트 같은 작은 효과는 지금처럼 가벼운 스크립트로 두는 것이 권고안이다(React로 바꾸면 그 페이지가 React 본체 gzip 약 66KB를 받음). 세부(스타일 방식, 남길 `.astro` 파일)는 `docs/tasks/T12-react-components.md`에서 정했고, `AGENTS.md` §5·§7과 `docs/ARCHITECTURE.md` A1·A2·A11은 T12 지시서 PR에서 갱신했다. 순서: T12 React 전환 → T13 SEO → T14 접근성(사용자 결정). → T12: 화면 컴포넌트 17개를 React(`.tsx`) + CSS Modules로 바꿨다. 콘텐츠 조회·`<head>`·페이지 스크립트는 `BaseLayout`과 페이지 진입점 `src/layouts/*Layout.astro`가 맡는다. main과 비교해 전체 페이지 캡처 45장·18페이지 접근성 트리가 같고, 페이지가 받는 JS는 같으며(헤더 스크립트 +6B), HTML·CSS는 모두 줄었다(`docs/ARCHITECTURE.md` §2 "화면 컴포넌트와 스타일").
  - 고른 이유: 일본 채용 공고에서 React 수요가 크다. 페이지 JS(약 2KB), T11 결과, View Transitions, Cloudflare 배포를 그대로 유지한다. React로 쓴 화면 코드는 나중에 Next.js로 옮길 때 대부분 그대로 쓸 수 있다.
  - 검토 후 고르지 않은 안 — Next.js 정적 출력(`output: 'export'`, 한때 이 방향을 골랐다): 화면·기능은 같게 만들 수 있고 Cloudflare에서 무료로 배포된다. 그러나 첫 로드 JS가 약 2KB → 약 136KB(gzip, Next.js 16.4.3 빈 페이지 실측, `noModule` 폴리필 제외)로 늘고, `next/link` 클라이언트 이동에서는 CSS 문서 간 View Transitions가 동작하지 않으며, T11 글꼴 통합(Vite 플러그인)과 content collections(A9) 대체 로더를 다시 만들어야 한다. 서버 기능(SSR·ISR·Server Actions·middleware 등)은 정적 출력에서 쓸 수 없어([공식 문서](https://nextjs.org/docs/app/guides/static-exports)) Next.js를 쓰는 이점이 작다.
  - 다른 메이저 프레임워크(React Router v7, Nuxt, SvelteKit)도 정적 출력은 되지만, 페이지 전체를 브라우저에서 다시 연결(hydration)하므로 프레임워크 본체 JS를 보낸다(크기는 측정하지 않음). Nuxt·SvelteKit은 React가 아니다.
  - 일본 공고 수(2026-10-31 조사): フリーランスボード 2024-02~2026-08 누적 React 29,864건·Vue.js 12,244건·Next.js 8,486건, paiza 전직(2026-10-29) React 71건·Vue.js 67건·Next.js 18건·Nuxt.js 12건. Astro 공고 수 자료는 찾지 못했다.
  - 용어: React는 공식 정의상 라이브러리("A JavaScript library for building user interfaces")지만, 공고·이력서에서는 프레임워크로 분류해도 된다(paiza도 React를 「フレームワーク」로 분류). 설계 문서에서는 역할을 나눠 "화면은 React, 페이지 구성·빌드는 Astro"로 적는다.
  - 호스팅(2026-10-31 사용자 결정): Cloudflare를 유지한다(A3). 화면은 정적 출력으로 Workers 정적 자산에 올리고, 단계 8 API(연락 폼·회사별 비공개 페이지, §4)는 Workers 함수로 둔다. Vercel(Next.js 개발사, 무료 주소 `*.vercel.app`)도 검토했으나, 무료(Hobby) 플랜이 비상업적 개인 용도로 한정되어 구직 포트폴리오가 허용되는지 공식 답이 없고([공정 이용 가이드](https://vercel.com/docs/limits/fair-use-guidelines)), §4 API가 이미 Cloudflare 기준(Turnstile·KV·D1·메일)이라 관리할 곳을 하나로 둔다.

## 8. 구현 시 공식 문서로 재확인할 항목

- Cloudflare Email Service: 공개 베타. 공식 문서는 발송을 Workers 유료 플랜 기능으로 안내한다는 조사 결과가 있다. 대안: Resend 무료 플랜(월 3,000통, 하루 100통, 확인 필요)
- 발신 주소에 커스텀 도메인이 필수인지
- Cloudflare Access 무료 한도 계산 방식 (Access를 쓸 경우만)
- 무료 플랜 수치 전반 (Workers 하루 10만 요청, KV 하루 읽기 10만·쓰기 1,000 등): 2026년 조사 시점 기준이므로 배포 전에 재확인

### T01 교차 리뷰에서 이월한 항목

- [ ] 단계 8: `/` → `/ja/`를 HTTP 301로 처리해 현재 정적 HTML의 2초 meta refresh를 대체한다. 언어 정책이 바뀌면 상태 코드도 재검토한다. 배포 URL에서 응답 상태와 Location을 확인한다.
- [ ] 다음 의존성 갱신: `pnpm-workspace.yaml`의 `minimumReleaseAgeExclude`에 있는 특정 버전 예외를 재검토한다. 대기 기간 경과 또는 의존성 교체 후 예외 없이 설치·CI가 통과하는 것을 확인하고 불필요한 항목을 삭제한다.
- 근거: [PR #4 교차 리뷰](https://github.com/songyu0608/portfolio/pull/4#issuecomment-6497967214). 나머지 설정·문서 개선은 T01-followup에서 처리한다.

### T02 교차 리뷰에서 이월한 항목

- [x] 단계 6(T11): 글꼴 CSS 크기 재검토. T02 시점 빌드에서 공통 CSS가 357,868B(gzip 172,181B), `@font-face` 251개이며 `/ja/`, `/en/` 모두 첫 렌더 전에 받는다. 후보: 빌드 시 실제 사용 글자 기준 서브셋, 일본어 글꼴 CSS를 `/ja/`에만 적용. Lighthouse로 전후를 측정한다. → T11: 빌드 통합(`scripts/font-subset.mjs`)으로 쓰는 글자의 범위만 남겨 `@font-face` 251개 → 71개, 공통 CSS 357,926B → 52,819B(gzip 172,802B → 10,369B). 언어별 분리(선택 항목)는 남은 CSS가 gzip 약 10KB라 효과가 작아 하지 않았다. Lighthouse 렌더 차단 예상 절감 930ms → 180ms(`docs/DESIGN.md` §2, `docs/ARCHITECTURE.md` §2 "글꼴 로딩").
- [x] T03: 일본어 제목 `word-break: auto-phrase`를 Safari·Firefox에서 확인하고, 필요하면 명시적 줄바꿈을 검토한다 (T03 범위 8). → 지원 현황은 공식 자료로 확인(Firefox·Safari 미지원), 실제 Firefox·WebKit 화면은 미확인. 결과·대안은 `docs/DESIGN.md` §2 타이포그래피, 후속은 아래 T03 이월 항목.
- [x] T03: PR #9 캡처는 `4aa6183` 기준이라 이후 수정이 반영되지 않았다. T03 PR에 최신 캡처를 싣는다 (T03 범위 8). → `docs/screenshots/T03-*`, T03 PR 본문.
- 근거: [PR #9](https://github.com/songyu0608/portfolio/pull/9) Claude 교차 리뷰, ChatGPT 재검증 리뷰.

### T03에서 이월한 항목

- [x] T04: Home 히어로 등 긴 일본어 제목은 Firefox·Safari(`auto-phrase` 미지원)에서 단어 중간에서 끊길 수 있다(T03 확인 화면 h1: 「読みやすさを、設計/する。」). 문절 단위 `<wbr>` 또는 `inline-block` span을 검토한다. BudouX(새 의존성)는 사용자 확인 후에만 도입한다. 근거: `docs/DESIGN.md` §2 타이포그래피. → T04: 콘텐츠에 문절 배열로 쓰고 `keep-all` + CSS 생성 U+200B로 문절 사이에서만 줄바꿈. `<wbr>`·`inline-block`은 Chromium 접근성 이름에 공백이 생겨 쓰지 않음. 결과는 `docs/DESIGN.md` §2.
- [ ] 단계 7 또는 Firefox·WebKit을 쓸 수 있는 환경: `auto-phrase` 미지원 브라우저의 실제 줄바꿈과 T03 헤더 배치(320px·1280px)를 확인한다. T04 문절 처리(`Phrases.tsx`, T12 전 `Phrases.astro`)가 같은 위치에서 줄을 바꾸는지, 실제 스크린 리더(VoiceOver, NVDA)가 문절 사이에서 끊어 읽지 않는지도 함께 확인한다. → T15: 320px 가로 넘침 0과 1280px 헤더 한 줄은 WebKit·Firefox 엔진에서도 확인했다(`tests/e2e/layout.spec.ts`). 문절 줄바꿈 위치(엔진마다 달라 사람이 캡처로 본다)와 스크린 리더는 남는다.
- [x] `@astrojs/react` 통합 때문에 어느 페이지도 참조하지 않는 React 클라이언트 번들(`dist/_astro/client.*.js`, 220,749B)이 T01부터 빌드 결과에 생성된다. 페이지가 받는 JS에는 영향이 없다. → 2026-10-30 사용자 결정: 단계 5 인터랙션(A2)에서 React를 쓰므로 통합을 그대로 둔다. 단계 6 성능 점검 때 번들이 페이지에서 참조되지 않는지만 다시 확인한다. → T10: React·ReactDOM 청크는 명령 팔레트를 처음 열 때 받는 청크로 쓰인다. 참조되지 않는 파일은 Astro React 렌더러 진입 파일(약 1.8KB)뿐이다(`docs/ARCHITECTURE.md` §2).

### T04 지시서 작성 시 추가한 항목

- [ ] 단계 8 배포 전: 임시 문구(`placeholder: true`)가 0건인지 빌드 로그로 확인한다. 규칙은 `docs/CONTENT.md` "임시 문구 규칙".

### T07 지시서 작성 시 추가한 항목

- [ ] 연락처(메일 `songyu0608@gmail.com`·GitHub·LinkedIn)는 2026-10-30 수집 완료. Public 사이트의 `mailto:` 주소는 수집 봇에 노출될 수 있음을 알고 사용자가 공개를 정했다. 스팸이 늘면 난독화·전용 주소를 검토하고, 단계 8 연락 폼 도입 후 메일 주소를 계속 보일지 다시 정한다.

### T09 구현 시 추가한 항목

- [ ] 원고 반영 후: About 경력 타임라인의 마지막 선·점이 페이지 끝에서 강조되는지 1280×800·1280×1200·375×667에서 확인한다. 기준선이 화면 가운데라 타임라인 아래 내용이 화면 높이의 절반보다 짧으면 닿지 못한다(2026-10-31 사용자 결정, `docs/DESIGN.md` §6 스크롤 강조).

### T10 구현 시 발견한 항목

- [x] 헤더 스크립트(테마 버튼 + 팔레트 런처)가 압축 전 약 3.5KB로 지시서의 처음 기준 "런처 1.5KB 이하"를 넘었다(약 1.7KB는 Vite 동적 import 도우미, `vite.build.modulePreload: false`는 Astro 설정에 밀려 미적용). 2026-10-31 사용자 결정으로 기준을 "헤더 스크립트 1개, 압축 전 4KB 이하"로 바꿨다. 단계 6 성능 점검에서 Lighthouse로 영향만 확인한다(T11 범위 4). → T11: TBT 0ms, "사용하지 않는 JavaScript" 진단 없음. `astro:build:setup`에서 `modulePreload: false`를 넣어도 도우미가 남고 팔레트 첫 열기가 직렬 로드가 되어 그대로 둔다(`docs/ARCHITECTURE.md` §2).
- [ ] Firefox·Safari 실기, 실제 IME(일본어 입력 확정 Enter), 실제 스크린 리더(VoiceOver, NVDA)로 팔레트·터미널을 확인한다(단계 7 또는 해당 환경). 이 환경에서는 Chromium만 확인했다. → T15: WebKit·Firefox 엔진(Playwright)에서 팔레트·터미널 동작을 확인했다(`tests/e2e/command-ui.spec.ts`). Safari·Firefox 실기, 실제 IME, 스크린 리더는 남는다.

### T08 구현 시 발견한 항목

- [x] 단계 6(T11): Home의 CLS가 Chromium 1280px에서 0.32~0.37이다(T07 main도 같음, 2026-10-31 측정). 원인은 IBM Plex Sans JP 글꼴 교체 때 히어로 줄바꿈이 바뀌어 아래 내용이 약 35px 올라가는 것이다. 글꼴 로딩 방식(`font-display`, preload, 대체 글꼴 크기 맞춤 등)을 단계 6에서 정한다. → T11: 일본어 페이지에서 가나 범위(400·700) 2개 preload로 Home 1280px CLS 0.298 → 0.001(Playwright 지연 150ms·1.6Mbps), Lighthouse 모든 측정 페이지 0.017 이하. 3G 수준 이하에서는 Home CLS 약 0.3이 남으며, 2026-10-31 사용자 결정으로 그대로 둔다(`docs/DESIGN.md` §2 한계).
- [ ] 원고 반영 후: Home 한 줄 소개 길이가 바뀌면 Home CLS를 다시 잰다(T11 측정 방법, `docs/tasks/T11-performance.md`). 지금 값은 임시 문구가 `max-width: 34em`에 거의 꽉 차는 길이라 생긴 것이다.

### T12 교차 리뷰에서 이월한 항목

- [x] 단계 7: 화면 회귀 검사에 CSS 순서를 지키는 대표 페이지를 넣는다. 페이지 레이아웃(`src/layouts/*Layout.astro`)이 `BaseLayout`을 화면 컴포넌트보다 먼저 import해야 CSS Modules 규칙이 같은 명시도의 전역 클래스를 이긴다. 순서가 바뀌면 About·Projects에서 `.tag-list`·`.project-grid`의 `margin: 0`이 모듈의 `margin-top`을 이겨 화면이 48px 짧아진다(`docs/ARCHITECTURE.md` §2 "화면 컴포넌트와 스타일"). → T15: `tests/e2e/layout.chromium.spec.ts` "CSS 순서 회귀"가 About 기술 스택 첫 `.tag-list`와 Projects `.project-grid`의 위 여백을 간격 토큰 값과 비교한다. 현재 Astro 빌드는 import 순서를 바꿔도 `dist/`가 같아 이 결함이 재현되지 않았고, 같은 증상(전역 `margin: 0`이 이김)을 넣어 테스트가 실패하는 것을 확인했다.
- [ ] 화면 컴포넌트의 이식성을 높일 때(다른 React 환경으로 옮기기 등): `PhaseList.tsx`가 런타임 import하는 `PHASES`를 Astro 전용 `src/content.config.ts`에서 프레임워크에 독립적인 파일로 옮긴다. `astro:i18n`을 쓰는 `src/i18n/paths.ts`도 이때 바꾼다. 지금은 빌드 때 HTML로만 렌더해 문제가 없어 그대로 둔다.
- 근거: [PR #37](https://github.com/songyu0608/portfolio/pull/37) ChatGPT(Codex) 교차 리뷰 개선 제안(머지 차단 아님).

### T13 구현 시 추가한 항목 (단계 8 배포 전)

- [ ] `astro.config.mjs`의 `site`를 실제 주소(`*.workers.dev` 또는 커스텀 도메인)로 바꾸고, 빌드 로그에 `[portfolio:site-placeholder]` 경고가 없는지 확인한다. T04 항목(임시 문구 0건 확인)과 같은 때 한다.
- [ ] Workers 설정에 `not_found_handling = "404-page"`를 넣고, 배포 URL에서 없는 경로(`/ja/xyz/`, `/en/projects/xyz/`)가 404 상태로 `404.html`을 보이는지 확인한다.
- [ ] 루트 `/` 이동은 T01 항목(HTTP 301)과 같은 일이다. 서버 이동으로 바꾸면 Home의 `x-default`를 `/`로 바꿀지 다시 정한다. Google이 검색 결과 파비콘을 `/` → `/ja/` 이동 뒤 페이지에서 찾는지는 확인하지 못했다(확인 필요, `/favicon.ico`는 루트에 있음).
- [ ] 공유 미리보기(LINE·Slack·LinkedIn·X 등)를 실제 URL로 확인한다. X 카드(`summary_large_image`)의 이미지 조건은 공식 문서를 찾지 못해 1200×630으로 두었다(확인 필요). sitemap을 Search Console에 제출할지 정한다.
- [ ] 회사별 비공개 페이지(§4)는 `BaseLayout`의 `noindex`로 두고 sitemap에 넣지 않는다. 경로를 `robots.txt`에 적지 않는다(누구나 읽을 수 있어 토큰 경로가 드러남).
- [ ] 커스텀 도메인으로 옮기면 `*.workers.dev` 주소의 처리(이동 또는 비활성화)를 정한다.
- 근거: `docs/tasks/T13-seo.md` "단계 8로 넘기는 일", `docs/ARCHITECTURE.md` §2 "SEO".

### T14 구현 시 추가한 항목 (단계 7)

- [x] axe 자동 검사를 E2E에 넣는다. 조건은 `docs/DESIGN.md` §11 "점검 도구와 조건"과 같다(19페이지 × 라이트·다크 × 1280·375px, 팔레트·터미널 열린 상태). `@axe-core/playwright` 등 의존성 추가는 사용자 확인 뒤에 한다. T14는 실행 환경의 axe-core 4.14.0을 페이지에 넣어 쟀다. → T15: `@axe-core/playwright` 4.14.0(사용자 승인)으로 `tests/e2e/a11y.spec.ts`(세 브라우저)·`a11y.chromium.spec.ts`. WebKit·Firefox는 1280px·팔레트·터미널 라이트로 줄였다(T15 지시서 메모).
- [x] WebKit·Firefox에서 확인한다: 본문 바로가기 뒤 다음 Tab 위치(`main`에 `tabindex="-1"`이 필요한지), 터미널 출력 영역 포커스·키 스크롤, 강제 색상(Windows 고대비)의 실제 색. 결과에 따라 `main` `tabindex`를 정한다. → T15(Playwright WebKit·Firefox, CI): 터미널 출력 포커스·키 스크롤은 두 엔진 통과. 본문 바로가기는 Firefox 상세 페이지에서 다음 Tab이 `main` 첫 링크를 건너뛰어 `main`에 `tabindex="-1"`(포커스 표시 없음)을 두었다(`docs/DESIGN.md` §4). 강제 색상 에뮬레이션은 두 엔진에서도 켜져 `forced-colors.spec.ts`를 세 브라우저로 돌린다. Windows 고대비 실제 색은 아래 항목으로 남긴다.
- [ ] Windows 고대비 테마의 실제 색으로 강제 색상 화면(주력 태그 채움, 포커스 표시)을 확인한다. Playwright 강제 색상 에뮬레이션은 실제 테마 색과 다를 수 있다.
- [ ] 원고 반영 뒤 axe·키보드·리플로·텍스트 간격 점검을 다시 한다. 문구 길이가 바뀌면 결과가 달라질 수 있다.
- 근거: `docs/tasks/T14-accessibility.md` "단계 7로 넘기는 일", `docs/DESIGN.md` §11.

### T05 지시서 작성 시 추가한 항목

- [x] T06 Projects 지시서: 프로젝트 스키마에 担当工程(要件定義・設計・開発・テスト・運用) 필드를 추가한다. 카드에도 표시할지 상세에만 둘지는 T06에서 정한다(2026-10-30 사용자 확인: 担当工程은 경력이 아니라 프로젝트 단위). → 2026-10-30 사용자 결정: 카드와 상세 모두에 표시. `docs/tasks/T06-projects.md` 범위 1·4.
- [ ] 원고 반영: 이력서 PDF 공개 범위(공개용 판 또는 회사별 비공개 페이지만)를 사용자가 정한다. Public 저장소의 `public/`에 넣은 PDF는 누구나 내려받을 수 있다.

## 9. 결정 변경 기록

| 날짜 | 변경 | 비고 |
| --- | --- | --- |
| 2026-10-28 | 초기 결정 확정: 백엔드, 인터랙션 1~5 채택, Public 저장소, 도메인 미정 | T00 |
| 2026-10-28 | 자격증 표기 방식 확정: 학습 중 표기는 1개까지, 시안 A 채택 | 지시서 없음 (문서만 변경) |
| 2026-10-29 | AI 교차 리뷰 절차 확정 (`docs/REVIEW.md`) | 지시서 없음 (문서만 변경) |
| 2026-10-29 | T01 PR #4 merge·교차 리뷰 완료, 후속 개선의 처리 시점 기록 | T01-followup |
| 2026-10-29 | 기술 스택 표기 방식 확정: 분류별 태그, 시안 B 채택 | 지시서 없음 (문서만 변경) |
| 2026-10-30 | T01-followup PR #5 완료 반영, T02 디자인 시스템 지시서 작성 | T02 착수 전 |
| 2026-10-30 | 디자인 색상(시안 E)·글꼴(IBM Plex) 선택, 색 변경은 토큰 교체 방식으로 결정 | T02 |
| 2026-10-30 | T02 PR #9 merge 완료 반영, T03 공통 레이아웃 지시서 작성 | T03 착수 전 |
| 2026-10-30 | 언어별 페이지 파일 + 공유 화면 컴포넌트 방식, UI 문구 위치(`src/i18n/ui.ts`, 일본어 기준 타입), 테마 저장 키 `theme` 확정 | T03 (`docs/ARCHITECTURE.md` §2, A8) |
| 2026-10-30 | `@astrojs/react` 통합 유지(단계 5에서 사용). T03 완료 조건의 "빌드 결과에 React 런타임 미포함"은 참조되지 않는 번들이 남는 상태로 사용자가 수용 | T03 |
| 2026-10-30 | 내비게이션 일본어 문구 「経歴」「プロジェクト」「連絡先」 확정. 바꿀 때는 `src/i18n/ui.ts`의 `pages.*.name`만 고친다(URL은 그대로) | T03 사용자 확인 |
| 2026-10-30 | T03 PR #11 merge 완료 반영. 단계 4는 원고 수집 전에 임시 문구(placeholder)로 진행하고, 원고는 콘텐츠 파일만 바꿔 반영 | 사용자 결정, T04 지시서 |
| 2026-10-30 | 콘텐츠 구조(YAML content collections + `src/lib/content.ts` 규칙 검사), 일본어 문절 줄바꿈 방식, Home h1 = 이름, 사이트 이름과 프로필 이름은 별개 값 | T04 구현 (`docs/ARCHITECTURE.md` §2, A9, `docs/DESIGN.md` §2·§5) |
| 2026-10-30 | Home h1 = 이름 확정, 프로필 이름 일본어 「チェ ソンギュ」·영어 `choi seonggyu`. 일본어 UI 문구(「主な技術」 등)는 지시서 기본안으로 두고 나중에 사용자가 `src/i18n/ui.ts`에서 직접 고친다. 한 줄 소개는 원고 합의 후 반영 | T04 사용자 확인 |
| 2026-10-30 | T04 PR #13 merge 완료 반영(Codex 교차 리뷰 수정 필요 1건·개선 제안 1건 반영 후 재검증 통과) | 지시서 없음 (문서만 변경) |
| 2026-10-30 | T04 done 반영 PR #14 merge. 전문 분야를 백엔드 + AI 활용 개발로 변경(AI 엔지니어로도 어필), 기술 스택 첫 분류 「AI活用開発」(실제 값 4개) 추가, 기술 로고 아이콘 패키지 승인(원고 반영 때 적용), 担当工程은 프로젝트 단위(T06) | 사용자 결정, T05 지시서 |
| 2026-10-30 | T05 지시서 PR #15 merge. T05 구현: 주력 기술 범례 UI 문구 키를 `home.skills.legend`에서 `skill.legend`로 옮겨 Home·About이 공유. About 섹션 제목·학습 중 문형·기술 스택 영어 분류 이름은 지시서 기본안으로 구현(사용자 확인 대기) | T05 구현 (`docs/DESIGN.md` §6, `docs/ARCHITECTURE.md` §2) |
| 2026-10-30 | T05 PR #16 merge 완료 반영(Codex 교차 리뷰 수정 필요·개선 제안 없음). About 섹션 제목·학습 중 문형·About 설명·기술 스택 영어 분류 이름은 지시서 기본안으로 merge했고 사용자 확인 전이다. 바꿀 때는 `src/i18n/ui.ts`, `src/content/skills.yaml`만 고친다 | 지시서 없음 (문서만 변경) |
| 2026-10-30 | T06 Projects 지시서 작성. 担当工程은 카드와 상세 모두에 표시(다섯 공정 고정 순서, 맡은 공정은 채움·체크). 목록은 代表プロジェクト + その他のプロジェクト, 카드 전체가 상세 링크(애니메이션은 단계 5). 상세에 「チーム」 칸·「代表プロジェクト」 표시·이전·다음 링크 추가 | 사용자 결정(시안 확인), T06 지시서 |
| 2026-10-30 | T06 구현: 担当工程 id·순서의 원본을 `src/content.config.ts`의 `PHASES`로, 카드 전체 링크는 제목 링크 `::after` 확장 방식, 카드 그리드(`.project-grid`)를 `global.css`로 이동, 「代表プロジェクト」 UI 문구 키를 `project.featured`로 공용화. UI 문구는 지시서 기본안(사용자 확인 전) | T06 구현 (`docs/DESIGN.md` §7, `docs/ARCHITECTURE.md` §2) |
| 2026-10-30 | T06 PR #19 merge 완료 반영(Codex 교차 리뷰 수정 필요·개선 제안 없음). Projects UI 문구(공정 영어 이름, 「（担当）」 상태 텍스트, 소개 문단 등)는 지시서 기본안으로 merge했고 사용자 확인 전이다. 바꿀 때는 `src/i18n/ui.ts`만 고친다 | 지시서 없음 (문서만 변경) |
| 2026-10-30 | `.gitattributes`로 줄바꿈을 LF에 고정. Windows 노트북에서도 작업하기 때문(사용자 확인). 기존 Windows 체크아웃의 재체크아웃 방법은 `AGENTS.md` §6 | 지시서 없음, Codex 리뷰(PR #19)에서 `core.autocrlf=true` 환경의 `pnpm format:check` 실패 보고 |
| 2026-10-30 | T07 Contact 지시서 작성. 연락 수단 목록(메일·GitHub·LinkedIn, 값이 있는 것만), 메일 복사 버튼(점진적 향상), 모든 페이지 푸터에 연락 링크. 희망 조건 칸·폼 자리는 두지 않고 Home 히어로는 「連絡する」 버튼만 유지 | 사용자 결정(범위 정리·시안 확인), T07 지시서 |
| 2026-10-30 | T07 지시서 PR #21 merge(GitHub Actions 실행 대기로 최신 커밋 CI 결과 없이 사용자가 merge. 문서만 변경, 첫 커밋 CI는 4단계 통과). 연락처 3개(메일·GitHub·LinkedIn)를 실제 값으로 수집. T07 구현 담당 claude | 사용자 결정 |
| 2026-10-31 | T07 PR #22 merge 완료 반영(CI 통과, Codex 교차 리뷰 수정 필요·개선 제안 없음). 단계 4 완료. Contact UI 문구(「連絡方法」「コピー」 등)는 지시서 기본안으로 merge했고 사용자 확인 전이다. 바꿀 때는 `src/i18n/ui.ts`만 고친다 | 지시서 없음 (문서만 변경) |
| 2026-10-31 | 작업 순서: 원고 반영(실제 경력·프로젝트 문구, 기술 로고)은 맨 마지막에 한다. 다음은 단계 5 인터랙션. 임시 항목 0건 확인 후 공개 배포하는 규칙은 유지 | 사용자 결정 |
| 2026-10-31 | 단계 5 지시서를 3개로 나눔: T08 = 컨셉 1·2, T09 = 컨셉 5, T10 = 컨셉 3·4. T08 지시서 작성: 컨셉 1·2는 React island·새 의존성 없이 Astro `<script>`와 CSS cross-document View Transitions로 구현(`docs/ARCHITECTURE.md` A2 비고, `docs/DESIGN.md` §3) | 사용자 결정(나눔), T08 지시서 |
| 2026-10-31 | T08 지시서 PR #24 merge, T08 구현 담당 claude. 구현: 디코딩·틸트는 인라인 모듈 2개(압축 전 합계 약 2.5KB), 상세 전환은 CSS View Transitions. 프로젝트 slug 형식 검사 추가. Home CLS(기존 글꼴 교체)는 단계 6 항목으로 이월 | 사용자 결정(담당), T08 구현 |
| 2026-10-31 | T08 PR #25 merge 완료 반영(CI 통과, Codex 교차 리뷰 수정 필요 1건(디코딩 문자 폭 분류)·개선 제안 2건 반영 후 재검증 통과). 디코딩 1초·틸트 4°·전환 280ms는 지시서 기본안으로 merge했고 사용자 확인 전이다 | 지시서 없음 (문서만 변경) |
| 2026-10-31 | T09 지시서 작성: 컨셉 5는 JS·React island·새 의존성 없이 CSS 스크롤 기반 애니메이션(`animation-timeline: view()`)으로 선 채움·점 강조만 한다. 글자는 흐리게 하지 않는다(시안의 불투명도 나타남 미적용). 미지원 브라우저·reduced-motion은 T05 화면 그대로(`docs/DESIGN.md` §3, `docs/ARCHITECTURE.md` A2 비고) | T09 지시서 |
| 2026-10-31 | T09 지시서 PR #27 merge(Codex 수정 필요 1건·개선 제안 1건 반영), T09 구현 담당 claude. 구현: 채움 구간을 지시서 기본안(`entry 100%` ~ `cover 50%`)에서 화면 가운데 기준(`view-timeline-inset: 50%`, `cover 0%` ~ `cover 100%`)으로 바꿔 선이 다음 점에 닿을 때 점이 강조되게 했다. 인쇄에서는 효과를 끈다(`@media screen`) | 사용자 결정(담당), T09 구현 |
| 2026-10-31 | T09 기준선은 화면 가운데로 유지(Codex 리뷰 PR #28: 지시서의 `cover 50%` 상한과 어긋남 지적). 지시서 조건을 바꾸고, 원고 반영 때 마지막 항목 도달을 다시 확인한다(§8) | 사용자 결정 |
| 2026-10-31 | T09 PR #28 merge 완료 반영(CI 통과, Codex 교차 리뷰 수정 필요 1건(기준선 위치)은 사용자 결정으로 가운데 기준 유지·지시서 조건 갱신, 개선 제안 2건 반영 후 재검증 통과). 글자 나타남 효과 미적용은 지시서 기본안으로 merge | 지시서 없음 (문서만 변경) |
| 2026-10-31 | T10 지시서 작성: 컨셉 3·4는 모든 페이지에 런처 스크립트만 넣고 열 때 React UI(동적 import, island 아님)와 언어별 정적 JSON(`/ja/commands.json` 등)을 불러온다. 명령 정의는 `src/components/interactive/commands.ts` 하나, 모달은 `<dialog>`, 새 의존성·Motion/GSAP 없음. 팔레트에 프로젝트 상세·시스템 설정 테마 포함, 터미널은 팔레트에서만 연다(기본안) | T10 지시서 (`docs/DESIGN.md` §3, `docs/ARCHITECTURE.md` A2 비고) |
| 2026-10-31 | T10 지시서 PR #30 merge(Codex 수정 필요 1건·개선 제안 2건 반영), T10 구현 담당 claude. 구현: 테마 버튼 스크립트를 런처와 같은 헤더 스크립트(`SiteHeader.astro`)로 합쳐 페이지가 받는 JS 파일을 1개로 유지, 팔레트 CSS는 `?url`로 열 때 붙임(일반 import는 모든 페이지에 `<link>`가 생김). 헤더 스크립트가 런처 목표 크기(1.5KB)를 넘는 점은 §8 항목으로 이월. Codex 리뷰 후 기준을 "헤더 스크립트 압축 전 4KB 이하"로 변경 | 사용자 결정(담당), T10 구현 |
| 2026-10-31 | T10 PR #31 merge 완료 반영, 단계 5 완료(CI 통과, Codex 교차 리뷰: 수정 필요 2건 중 헤더 스크립트 크기는 사용자 결정으로 기준을 "헤더 스크립트 1개, 압축 전 4KB 이하"로 변경, 터미널 이동 안내는 링크 출력 + `open`·`lang` 바로 이동으로 지시서 명확화, IME 변환 중 ↑↓ 무시 제안 반영 후 재검증 통과). 팔레트·터미널 UI 문구는 기본안(사용자 확인 전) | 사용자 결정(크기 기준), T10 완료 |
| 2026-10-31 | 단계 6을 지시서 3개로 나눔: T11 = 성능, T12 = SEO, T13 = 접근성(이 순서). T11 지시서 작성: 첫 렌더 전 글꼴 CSS를 실제 쓰는 글자의 `unicode-range`만 남기고(글꼴 파일 재서브셋·새 의존성 없음), CLS 0.1 이하를 목표로 preload → 대체 글꼴 메트릭 맞춤 순서로 적용. `font-display: optional`·히어로 최소 높이는 사용자 결정 후에만 | 사용자 결정(나눔), T11 지시서 |
| 2026-10-31 | T11 구현 담당 claude. 구현: 글꼴 CSS는 Astro Fonts API 대신 빌드 통합 `scripts/font-subset.mjs`(Fonts API는 빌드 때 외부 API 호출·HTML 인라인·범위 수동), 일본어 페이지 가나 범위 preload만(라틴 포함 시 CLS 악화), 대체 글꼴 메트릭 맞춤은 목표 달성으로 생략. 디코딩 정규식의 범위 글자를 코드 포인트로 바꿈(`src/scripts/hero-decode.ts`, 동작 같음) | 사용자 결정(담당), T11 구현 (`docs/ARCHITECTURE.md` A10) |
| 2026-10-31 | 3G 수준 이하에서 남는 Home CLS(약 0.3)는 그대로 둔다. `font-display: optional`·한 줄 소개 최소 높이는 쓰지 않고, 원고 반영 때 다시 잰다 | 사용자 결정(T11 범위 3-4) |
| 2026-10-31 | T11 PR #34 merge 완료 반영(CI 통과, Codex 교차 리뷰: 수정 필요 1건(화면 문구의 ` // `를 주석으로 지워 글꼴 누락을 놓침)은 주석을 지우지 않도록 고쳐 재검증 통과, 개선 제안 1건(완료 조건 표현)은 판정 기준을 지시서에 기록) | 지시서 없음 (문서만 변경) |
| 2026-10-31 | React / Next.js 전환을 검토해 한때 Next.js 쪽을 골랐다가, 정적 출력에서는 Next.js의 이점이 작고 페이지 JS가 크게 늘어 A안(Astro 유지 + 화면 컴포넌트 React)으로 결정. 소개는 「React + TypeScript」 중심(§7) | 사용자 결정 |
| 2026-10-31 | 호스팅은 Cloudflare 유지, Vercel은 검토 후 쓰지 않음. 단계 8 API는 Workers 함수(§7) | 사용자 결정 |
| 2026-10-31 | 단계 6 순서 변경: React 중심 전환을 T12로 넣고 SEO는 T13, 접근성은 T14로 미룸(마크업 점검을 전환 뒤에 한 번만 하기 위해) | 사용자 결정 |
| 2026-10-31 | T12 지시서 작성: 화면 컴포넌트 17개를 React(`.tsx`, `client:*` 없이 빌드 때 HTML로만)로 바꾼다. 스타일은 CSS Modules(기본안), 콘텐츠 조회·`<head>`·페이지 스크립트는 `.astro`(`BaseLayout`, 새 페이지 레이아웃)에 두고 라우트 파일은 한 줄 유지(A8). 화면(캡처 픽셀 차이 0)·접근성 트리·페이지 JS는 main과 같게. 소개(README)는 React + TypeScript 중심. ARCHITECTURE A1을 `superseded`로 바꾸고 A11 추가, AGENTS §5·§7 갱신 | T12 지시서 (`docs/ARCHITECTURE.md` A11) |
| 2026-10-31 | T12 구현 담당 claude. 구현: 페이지 진입점 이름은 기본안대로 `src/layouts/*Layout.astro`, 여러 페이지가 쓰는 카드 틸트 `<script>`는 `src/layouts/scripts/CardTiltScript.astro` 한 곳에 둠(레이아웃마다 import하면 공유 청크 외부 파일이 생김), 페이지 진입점은 `BaseLayout`을 화면 컴포넌트보다 먼저 import(전역 CSS를 앞에 둬 CSS Modules 규칙이 이기게) | 사용자 결정(담당), T12 구현 (`docs/ARCHITECTURE.md` §2) |
| 2026-10-31 | T13 지시서 작성: 절대 URL은 Astro `site` 한 곳에서 만들고 도메인 결정 전에는 임시 값(`https://portfolio.example`, 빌드 경고)을 둔다. 모든 페이지에 canonical·hreflang(ja·en·x-default = ja)·OG·X 카드·파비콘, sitemap·robots는 새 의존성 없이 엔드포인트로, 공유 이미지는 언어별 1장(1200×630, 원고에서 바뀔 문구 없음), 404는 이중 언어 페이지 하나. 기존 화면·접근성 트리·페이지 JS는 main과 같게 | T13 지시서 |
| 2026-10-31 | T13 지시서 PR #39 merge, T13 구현 담당 claude. 구현은 지시서 기본안대로(`site` 임시 값 + 빌드 경고, `x-default` = ja, sitemap·robots 엔드포인트, 이중 언어 404 하나). 파비콘(accent 둥근 사각형 + 선으로 그린 `c`)·공유 이미지(이름 + 「ポートフォリオ」/`Portfolio` + accent 띠)·404 문구(「ページが見つかりません」 등)는 기본안이고 사용자 확인 전이다. 바꿀 때는 `scripts/brand/`·`src/i18n/ui.ts`를 고치고 이미지를 다시 만든다 | 사용자 결정(담당), T13 구현 (`docs/ARCHITECTURE.md` A12, `docs/DESIGN.md` §10) |
| 2026-10-31 | T13 PR #40 merge 완료 반영(CI 통과, Codex 교차 리뷰 수정 필요·개선 제안 없음). 파비콘·공유 이미지·404 문구는 기본안으로 merge했고 사용자 확인 전이다. 배포 전 확인 항목(`site` 교체 등)은 §8 "T13 구현 시 추가한 항목" | 지시서 없음 (문서만 변경) |
| 2026-10-31 | T14 지시서 작성: 기준은 WCAG 2.2 AA. 19페이지(404 포함)·팔레트·터미널을 axe-core(실행 환경에 있는 것, 새 의존성 없음)·Lighthouse·키보드·320/640px·텍스트 간격·강제 색상으로 점검한다. 사전 점검(위반 0건)에서 찾은 2건을 고친다: 터미널 출력 스크롤 영역 `tabIndex`, 강제 색상 모드의 주력 기술 태그 채움(시스템 색). 본문 바로가기 `tabindex`·자동 검사의 테스트화·WebKit/Firefox 확인은 단계 7 | T14 지시서 |
| 2026-10-31 | T14 지시서 PR #42 merge, T14 구현 담당 claude. 구현은 지시서 기본안대로: 터미널 출력(`role="log"`)에 `tabIndex={0}`과 안쪽 2px accent 포커스 외곽선, 강제 색상 모드에서 `.tag--featured`를 `forced-color-adjust: none` + `CanvasText`/`Canvas`로 채움 유지. 점검에서 새 위반은 없었다(axe 4.14.0 위반 0, Lighthouse 접근성 100). 점검 기준은 `docs/DESIGN.md` §11 | 사용자 결정(담당), T14 구현 (`docs/DESIGN.md` §11) |
| 2026-10-31 | T14 PR #43 merge 완료 반영(CI 통과, Codex 교차 리뷰 수정 필요·개선 제안 없음). 단계 6 완료. 단계 7로 넘긴 접근성 항목(axe의 E2E 편입, WebKit·Firefox 확인, 원고 반영 뒤 재점검)은 §8 "T14 구현 시 추가한 항목" | 지시서 없음 (문서만 변경) |
| 2026-10-31 | 단계 7 E2E 범위 A안: 기능·키보드·axe는 Chromium·WebKit·Firefox 3개 브라우저에서 돌리고, 화면 회귀는 픽셀 캡처 대신 접근성 트리(`toMatchAriaSnapshot`)·레이아웃 값으로 본다(픽셀 기준 이미지는 OS·브라우저 빌드마다 달라 Windows에서는 Docker가 필요). 단계 7은 T15 E2E와 T16 Lighthouse CI로 나눈다 | 사용자 결정 |
| 2026-10-31 | T15 지시서 작성: 새 devDependencies `@playwright/test` 1.64.1·`@axe-core/playwright` 4.14.0(사용자 결정 A안으로 승인), `pnpm test` = `playwright test`(빌드 결과를 `pnpm preview`로 띄움), 페이지 목록은 sitemap에서·문구는 하드코딩하지 않음, CI에 3개 브라우저 E2E 추가(브라우저 캐시 없음, 목표 10분 이하). 본문 바로가기 `main` `tabindex`는 WebKit·Firefox 결과로 정한다 | T15 지시서 |
| 2026-10-31 | T15 구현 담당 claude. 테스트가 찾은 결함: 프로젝트 상세 担当工程 5칸 그리드가 640~719px에서 영어 공정 이름을 잘랐다(텍스트 간격을 넓히면 799px까지). 5칸 그리드를 기존 전환점 1024px부터로 옮기고 그 아래는 내용 폭 칸 줄바꿈(`docs/DESIGN.md` §7 担当工程) | 사용자 결정 |
| 2026-10-31 | T15: 테스트·`playwright.config.ts`의 타입 체크(`pnpm check`)에 `@types/node` 24.19.2를 devDependency로 추가(지시서의 새 의존성 2개 밖이라 따로 승인) | 사용자 결정 |
| 2026-10-31 | T15: 본문 바로가기 대상 `<main id="main">`에 `tabindex="-1"`을 두고 그 포커스는 표시하지 않는다(`main:focus { outline: none }`). Firefox(Playwright, CI)에서 상세 페이지의 다음 Tab이 `main` 첫 링크를 건너뛰었다. T14의 "`tabindex` 없음"을 지시서 범위 4 규칙대로 바꿨다(`docs/DESIGN.md` §4 본문 바로가기) | T15 지시서 |
| 2026-11-01 | T15 PR #46 merge 완료 반영(CI 3개 브라우저 397개 통과, E2E 단계 약 8분, Codex 교차 리뷰 수정 필요 없음). 이후 PR은 CI에서 E2E를 통과해야 merge한다. 남은 접근성·브라우저 확인(Safari 실기·스크린 리더·IME·Windows 고대비 실제 색, 문절 줄바꿈 위치)은 §8 | 지시서 없음 (문서만 변경) |
| 2026-11-01 | 단계 7 Lighthouse 도구: `lighthouse` 13.6.0을 직접 쓰고 측정·판정 코드를 저장소에 둔다. `@lhci/cli` 0.15.1은 Lighthouse 12.6.1에 고정되어 있고 `pnpm audit` 경고가 7건(high 5) 늘어 고르지 않았다(`lighthouse` 13.6.0은 moderate 1건) | 사용자 결정 |
| 2026-11-01 | T16 지시서 작성: 새 devDependency `lighthouse` 13.6.0(위 결정으로 승인). Playwright Test(`playwright.lighthouse.config.ts`, `tests/lighthouse/`)가 미리보기 서버를 띄우고 회차마다 Lighthouse CLI를 실행(Chromium은 Playwright 버전으로 고정). sitemap에서 언어·종류마다 1페이지(10페이지) × 모바일·데스크톱 × 3회. 기준: Performance 모바일 90·데스크톱 95 이상과 CLS 0.1 이하(3회 중앙값), 접근성·Best Practices·SEO 100(3회 모두), Agentic Browsing은 기록만. CI에 폼팩터별 `lighthouse` 작업 2개를 `check`와 동시에, 점수 요약은 작업 요약에 | T16 지시서 |
