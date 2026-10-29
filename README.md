# portfolio

백엔드 엔지니어 choi([@songyu0608](https://github.com/songyu0608))의 포트폴리오 사이트 저장소입니다.
사이트는 일본어 기본, 영어 전환을 지원합니다.

> 현재 단계 0(저장소 뼈대)입니다. 진행 상태는 [docs/PLAN.md](docs/PLAN.md)를 보세요.

## 기술 스택

- [Astro](https://astro.build/) + TypeScript
- React island + Motion / GSAP (인터랙션이 필요한 부분만)
- Cloudflare Workers 정적 자산 (동적 기능은 Workers 함수)

## 문서

| 파일 | 내용 |
| --- | --- |
| [AGENTS.md](AGENTS.md) | AI 작업자(Claude Code, Codex) 공통 규칙. 작업 전 필독 |
| [CLAUDE.md](CLAUDE.md) | Claude Code용 진입점 (`@AGENTS.md` import) |
| [docs/PLAN.md](docs/PLAN.md) | 전체 계획, 확정·미결 사항, **현재 진행 상태** |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 구조, 기술 결정 기록 |
| [docs/DESIGN.md](docs/DESIGN.md) | 디자인 원칙, 인터랙션 규칙 |
| [docs/CONTENT.md](docs/CONTENT.md) | 사이트 콘텐츠 수집 체크리스트 |
| [docs/tasks/](docs/tasks/) | 작업 지시서 (1 지시서 = 1 브랜치 = 1 PR) |

## AI와 작업하는 방법

1. 저장소를 clone한 폴더에서 Claude Code 또는 Codex를 실행한다.
2. "AGENTS.md와 docs/PLAN.md를 읽고 다음 작업 지시서를 진행해줘"처럼 요청한다.
3. 에이전트는 지시서 단위로 브랜치를 만들고 PR을 연다. 다른 AI가 리뷰하고, 사람이 merge한다.

## 개발 방법

Node.js **24.19.0**과 pnpm **11.25.0**을 사용합니다. 위 소개의 단계 0 안내는 초기 기록이며, 최신 상태는 `docs/PLAN.md`가 기준입니다.

```bash
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

개발 서버의 `/ja/`는 일본어, `/en/`은 영어 준비 페이지입니다. `/`는 `/ja/`로 이동합니다.

```bash
pnpm format:check
pnpm lint
pnpm check
pnpm build
pnpm preview
```

- `pnpm format`은 소스와 설정 파일을 정리합니다. 기존 계획 문서와 lockfile은 포맷 대상에서 제외합니다.
- React integration은 설치되어 있지만 React 컴포넌트와 브라우저 hydration은 아직 없습니다.
- `test` 명령과 E2E는 단계 7에서 추가합니다. 현재 CI는 PR 및 main push에서 포맷·lint·타입·빌드를 검사합니다.
- `dist/`는 정적 산출물입니다. 루트 이동은 정적 HTML의 meta refresh로 처리됩니다. Cloudflare Workers에는 단계 8에서 정적 자산으로 배포하며, 현재 배포 설정은 없습니다.
