# T01: 프로젝트 초기화 (Astro, TypeScript, lint/format, CI)

| 항목 | 값 |
| --- | --- |
| 단계 | 1 |
| 선행 작업 | T00 (저장소 뼈대) |
| 담당 | codex |
| 상태 | review |
| 브랜치 | `codex/T01-init` |

## 목표

Astro + TypeScript 프로젝트를 만들고, lint·format·타입 체크·빌드를 GitHub Actions CI에서 자동 실행한다. 이후 모든 PR이 같은 CI 기준으로 검증되게 한다.

## 배경

- `docs/PLAN.md` §2 확정 사항, §5 단계 1
- `docs/ARCHITECTURE.md` §2 디렉터리 구조(기본안), §3 A1·A4·A7

## 범위

포함:

- Astro 최신 안정 버전으로 프로젝트 생성 (TypeScript `strict`)
- 패키지 매니저 확정 (기본안 pnpm). Node 버전 고정 (`.nvmrc` 또는 `package.json`의 `engines`)
- React integration 추가 (island용, 아직 컴포넌트는 만들지 않음)
- i18n 설정: `defaultLocale: 'ja'`, `locales: ['ja', 'en']`, 경로 `/ja`, `/en`. 루트 `/`는 `/ja`로 이동
- 빈 페이지: `/ja/`, `/en/`에 "Coming soon" 수준의 placeholder
- ESLint(Astro, TypeScript, React 규칙), Prettier(prettier-plugin-astro)
- `package.json` scripts: `dev`, `build`, `preview`, `check`(astro check), `lint`, `format`, `format:check`, `test`(우선 placeholder 또는 생략 후 문서에 명시)
- GitHub Actions: PR과 main push에서 install → `format:check` → `lint` → `check` → `build`
- `AGENTS.md` §6 명령어를 실제 명령으로 갱신
- `docs/ARCHITECTURE.md` §2를 실제 구조로 갱신, A7 상태 갱신

제외:

- 디자인 토큰, 레이아웃, 페이지 내용 (T02, T03 이후)
- Cloudflare 배포 설정, `wrangler` (단계 8). 단, 정적 출력(`output: 'static'`)이 Workers 정적 자산으로 배포 가능한 형태인지만 확인해 메모에 남긴다
- E2E 테스트 (단계 7)

## 수정 가능한 파일

- `package.json`, lockfile, `.nvmrc`, `.npmrc`
- `astro.config.*`, `tsconfig.json`
- `eslint.config.*`, `.prettierrc*`, `.prettierignore`, `.editorconfig`
- `src/**`, `public/**`
- `.github/workflows/**`
- `.gitignore`
- `AGENTS.md` (§6만), `docs/ARCHITECTURE.md` (§2, §3 A7만), `docs/PLAN.md` (진행 상태, 작업 지시서 표, 미결 사항), `docs/tasks/T01-init.md` (상태)
- `README.md` (개발 방법 절)

## 완료 조건

- [ ] 깨끗한 clone에서 `pnpm install && pnpm build`가 성공한다
- [ ] `pnpm lint`, `pnpm check`, `pnpm format:check`가 오류 없이 통과한다
- [ ] `pnpm dev` 실행 시 `/ja/`, `/en/`이 열리고 `/`가 `/ja/`로 이동한다
- [ ] GitHub Actions CI가 이 PR에서 실행되고 통과한다
- [ ] `AGENTS.md` §6, `docs/ARCHITECTURE.md` §2, `docs/PLAN.md` 진행 상태가 갱신되어 있다
- [ ] 비밀 값이 커밋되지 않았다

## 확인 방법

```bash
git clone https://github.com/songyu0608/portfolio.git && cd portfolio
git checkout <branch>
pnpm install
pnpm format:check && pnpm lint && pnpm check && pnpm build
pnpm dev   # http://localhost:4321/ → /ja/ 이동 확인, /en/ 확인
```

## 메모

- 버전은 작업 시점의 최신 안정 버전을 쓰고, 선택한 버전을 PR 설명에 적는다.
- 패키지 매니저를 pnpm이 아닌 것으로 정하면 이유를 PR 설명과 `docs/ARCHITECTURE.md` A7에 적는다.
