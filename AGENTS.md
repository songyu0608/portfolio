# AGENTS.md — AI 작업자 공통 규칙

이 파일은 이 저장소에서 일하는 모든 AI 에이전트(Claude Code, ChatGPT Codex 등)가 **작업 전에 반드시 읽는 단일 원본**이다.
Claude 전용 메모는 `CLAUDE.md`에 있지만, 규칙은 여기만 고친다.

## 1. 프로젝트 한 줄 요약

백엔드 엔지니어 choi(GitHub: `songyu0608`)의 이직·채용용 포트폴리오 사이트. 백엔드 경력과 함께 AI 활용 개발 경험을 어필한다.
주 독자는 일본 채용 담당자와 현업 엔지니어다. 경력·프로젝트·기술 스택을 짧은 시간에 파악하고 바로 연락할 수 있게 하는 것이 목표다.

- 사이트 콘텐츠: **일본어 기본**, 영어 전환 (`/ja`, `/en`)
- 저장소 문서·커밋 메시지·PR 설명: **한국어 기본**, 기술 용어는 영어 그대로
- 블로그는 범위에서 제외

## 2. 작업 시작 전 반드시 읽을 파일 (순서대로)

1. `AGENTS.md` (이 파일): 규칙
2. `docs/PLAN.md`: 전체 단계, **현재 진행 상태**, 확정·미결 사항
3. 맡은 작업 지시서 `docs/tasks/Txx-*.md`
4. 작업에 따라: `docs/ARCHITECTURE.md`(구조·기술 결정), `docs/DESIGN.md`(디자인·인터랙션), `docs/CONTENT.md`(콘텐츠), `docs/REVIEW.md`(PR 구현·리뷰 절차)

계획·결정·진행 상태의 원본은 `docs/PLAN.md`다. 대화 기록이나 다른 도구의 메모보다 저장소 문서가 우선한다.
문서와 코드가 다르면 임의로 판단하지 말고 PR 설명에 차이를 적고 사용자에게 묻는다.

## 3. 작업 흐름

1. `git checkout main && git pull` 로 최신화한다.
2. `docs/PLAN.md`의 작업 지시서 표에서 상태가 `todo`이고 선행 작업이 끝난 지시서를 고른다. 사용자가 지정했으면 그것을 따른다.
3. 지시서의 `담당`과 `상태`를 갱신(`in-progress`)하고, 브랜치를 만든다.
   - 브랜치 이름: `<agent>/Txx-<slug>` (예: `claude/T02-design-tokens`, `codex/T05-home-page`)
   - 실행 환경이 브랜치 이름을 강제하면 그 이름을 쓰고 PR 제목에 `Txx`를 넣는다.
4. 지시서의 **수정 가능한 파일** 범위 안에서만 작업한다. 범위 밖 수정이 필요하면 PR 설명에 이유를 적는다.
5. 로컬에서 lint, 타입 체크, 빌드, 테스트를 통과시킨다 (단계 1 이후, 명령은 §6).
6. PR을 연다. 제목: `Txx: <요약>`. 본문은 `.github/pull_request_template.md`를 따른다.
7. merge 후 `docs/PLAN.md`의 진행 상태와 지시서 상태를 `done`으로 바꾼다 (같은 PR에서 미리 바꿔도 된다).

## 4. 협업 규칙 (Claude / ChatGPT)

1. **작업 지시서 1개 = 브랜치 1개 = PR 1개.**
2. 어느 AI가 만든 코드든 CI(lint, 타입 체크, 빌드, 테스트)를 통과해야 merge한다.
3. **교차 리뷰**: 한쪽이 구현하면 다른 쪽이 PR을 리뷰한다. 최종 merge는 사용자(choi)가 결정한다. 절차·확인 항목·결과 작성 기준은 `docs/REVIEW.md`를 따른다.
4. 같은 파일을 두 AI가 동시에 수정하지 않는다. `in-progress` 지시서의 수정 가능한 파일은 다른 작업에서 건드리지 않는다.
5. 작업 지시서는 담당 AI와 무관하게, 어느 쪽에도 맡길 수 있게 쓴다 (템플릿: `docs/tasks/_TEMPLATE.md`).
6. 기본 분담 예: Claude = 설계 문서·디자인 시스템·리뷰, ChatGPT(Codex) = 지시서 기반 페이지 구현. 고정이 아니다.
7. 결정이 바뀌면 **코드보다 문서(`docs/PLAN.md`, `docs/ARCHITECTURE.md` 등)를 먼저 갱신**한다.
8. 이 저장소는 **Public**이다. API 키, 토큰, 개인 연락처 원본, 회사별 비공개 페이지 토큰 등 비밀 값은 절대 커밋하지 않는다. 비밀 값은 Cloudflare 환경 변수/Secrets 또는 `.dev.vars`(gitignore됨)에 둔다.

## 5. 기술 스택 요약

자세한 내용과 이유는 `docs/ARCHITECTURE.md`.

- Astro + TypeScript (strict), 정적 출력 기본
- 인터랙션: 기본은 Astro `<script>`·CSS. 상태가 많은 명령 팔레트·터미널(T10)만 React를 쓰고, 열 때 동적 import한다(island 아님). Motion / GSAP은 현재 쓰지 않는다
- 호스팅: Cloudflare Workers 정적 자산 (무료 플랜). 동적 기능(연락 폼, 회사별 비공개 페이지)은 단계 8에서 Workers 함수로 추가
- i18n: Astro 내장 i18n 라우팅 (`/ja`, `/en`)
- 테스트: Playwright(E2E), Lighthouse CI

## 6. 명령어

Node.js 24.19.0 (`.nvmrc`), pnpm 11.25.0 (`package.json#packageManager`)을 사용한다.

```bash
pnpm install --frozen-lockfile
pnpm dev        # 개발 서버
pnpm lint       # ESLint
pnpm format     # Prettier
pnpm format:check # 포맷 검사
pnpm check      # astro check (타입 체크)
pnpm build      # 정적 빌드
pnpm preview    # 빌드 결과 확인
```

`test` 명령은 아직 없다. E2E 테스트는 단계 7에서 추가한다. CI는 설치 → 포맷 → lint → 타입 체크 → 빌드 순서로 실행한다.

줄바꿈은 `.gitattributes`(`* text=auto eol=lf`)로 LF에 고정되어 있다. Windows에서도 새로 clone하면 그대로 LF로 받는다. `.gitattributes`가 추가되기 전(2026-10-30)에 받아 둔 Windows 체크아웃은 CRLF 파일이 남아 `pnpm format:check`가 실패할 수 있으므로, 한 번만 아래처럼 다시 체크아웃한다(`reset --hard`는 커밋하지 않은 변경을 지우므로 먼저 커밋하거나 stash한다).

```bash
git pull
git rm -r --cached -q .
git reset --hard
```

## 7. 코드·콘텐츠 원칙

- 핵심 정보는 클릭하지 않아도 보여야 한다. 정보를 숨기는 효과(카드 플립 등)는 쓰지 않는다.
- `prefers-reduced-motion: reduce`에서는 장식 애니메이션을 끈다 (`docs/DESIGN.md` 참고).
- 기본 출력 JS를 최소화한다. 상태가 없는 효과는 Astro `<script>`·CSS로 만든다. React는 인터랙션이 필요한 컴포넌트에만 쓰고, 사용자가 열 때만 필요한 UI(T10 명령 팔레트·터미널)는 `client:*` island가 아니라 동적 import로 불러온다. island를 쓸 때는 가능한 한 `client:visible`/`client:idle`로 지연 로딩한다.
- 접근성: 시맨틱 HTML, 키보드 조작, 충분한 대비, 이미지 alt.
- 일본어/영어 문구는 컴포넌트에 하드코딩하지 않고 콘텐츠·번역 파일에서 가져온다 (구조는 T01/T03에서 확정).
- 확인되지 않은 수치·사실(무료 플랜 한도 등)은 문서에 "확인 필요"로 표시하고, 구현 시 공식 문서로 재확인한다.

## 8. 커밋·PR

- 커밋 메시지: Conventional Commits 형식, 설명은 한국어 가능. 예: `feat(home): 히어로 섹션 추가`, `docs: PLAN 진행 상태 갱신`
- PR 본문 첫 부분에 관련 지시서 번호(`Txx`)를 적는다.
- PR에는 무엇을 했는지, 어떻게 확인했는지(실행한 명령과 결과), 남은 일을 적는다.
