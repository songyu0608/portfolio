# portfolio

백엔드 엔지니어 choi([@songyu0608](https://github.com/songyu0608))의 포트폴리오 사이트 저장소입니다.
React + TypeScript로 화면을 만들고, Astro(Vite 기반)로 정적 사이트를 빌드합니다. 사이트는 일본어 기본, 영어 전환을 지원합니다.

> 진행 상태는 [docs/PLAN.md](docs/PLAN.md)의 "현재 진행 상태"를 보세요. 사이트 문구는 아직 임시 문구이며, 공개 배포 전에 실제 원고로 바꿉니다.

## 기술 스택

- **React 19 + TypeScript (strict)**: 화면 컴포넌트(`src/components/**/*.tsx`). 빌드 때 HTML로 렌더하고, 명령 팔레트·터미널만 브라우저에서 React로 동작합니다(처음 열 때 동적 import).
- **Astro 7 (Vite 기반)**: 정적 빌드, 라우팅, 다국어(`/ja`, `/en`), 콘텐츠 컬렉션(YAML + zod 스키마 검증)
- **CSS Modules + CSS 변수 디자인 토큰**: 다크 모드, CSS View Transitions(카드 → 상세), 스크롤 기반 애니메이션(경력 타임라인)
- **Cloudflare Workers 정적 자산**: 호스팅(단계 8). 연락 폼 등 동적 기능은 Workers 함수로 추가합니다.
- **품질**: ESLint, Prettier, `astro check`(TypeScript), GitHub Actions CI, 빌드 때 글꼴 글자 누락 검사

페이지가 첫 로드에 받는 JS는 헤더 스크립트 1개(압축 전 약 3.5KB)와 페이지별 작은 스크립트뿐입니다. 구조와 결정 이유는 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)에 있습니다.

## 문서

| 파일 | 내용 |
| --- | --- |
| [AGENTS.md](AGENTS.md) | AI 작업자(Claude Code, Codex) 공통 규칙. 작업 전 필독 |
| [CLAUDE.md](CLAUDE.md) | Claude Code용 진입점 (`@AGENTS.md` import) |
| [docs/PLAN.md](docs/PLAN.md) | 전체 계획, 확정·미결 사항, **현재 진행 상태** |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 구조, 기술 결정 기록 |
| [docs/DESIGN.md](docs/DESIGN.md) | 디자인 원칙, 인터랙션 규칙 |
| [docs/CONTENT.md](docs/CONTENT.md) | 사이트 콘텐츠 수집 체크리스트 |
| [docs/REVIEW.md](docs/REVIEW.md) | PR 구현·교차 리뷰 절차 |
| [docs/tasks/](docs/tasks/) | 작업 지시서 (1 지시서 = 1 브랜치 = 1 PR) |

## AI와 작업하는 방법

1. 저장소를 clone한 폴더에서 Claude Code 또는 Codex를 실행한다.
2. "AGENTS.md와 docs/PLAN.md를 읽고 다음 작업 지시서를 진행해줘"처럼 요청한다.
3. 에이전트는 지시서 단위로 브랜치를 만들고 PR을 연다. 다른 AI가 리뷰하고, 사람이 merge한다.

## 개발 방법

Node.js **24.19.0**과 pnpm **11.25.0**을 사용합니다.

```bash
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

개발 서버의 `/ja/`는 일본어, `/en/`은 영어 페이지입니다. `/`는 `/ja/`로 이동합니다.

```bash
pnpm format:check
pnpm lint
pnpm check
pnpm build
pnpm preview
```

- `pnpm format`은 소스와 설정 파일을 정리합니다. 기존 계획 문서와 lockfile은 포맷 대상에서 제외합니다.
- `test` 명령과 E2E는 단계 7에서 추가합니다. 현재 CI는 PR 및 main push에서 포맷·lint·타입·빌드를 검사합니다.
- `dist/`는 정적 산출물입니다. 루트 이동은 정적 HTML의 meta refresh로 처리됩니다. Cloudflare Workers에는 단계 8에서 정적 자산으로 배포하며, 현재 배포 설정은 없습니다.
