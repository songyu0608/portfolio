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

T01(프로젝트 초기화) 완료 후 작성합니다.
