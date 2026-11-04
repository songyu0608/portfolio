# T17-followup: 프로젝트 어사인용 사이트 버전 (같은 원고, 다른 URL, 연락처만 교체)

| 항목 | 값 |
| --- | --- |
| 단계 | 8 |
| 선행 작업 | T17 (배포 기반, 구현 PR #52) |
| 담당 | - |
| 상태 | todo |
| 브랜치 | `<agent>/T17-followup-assign-site` (실행 환경이 이름을 지정하면 그 이름) |

번호: 열려 있는 PR #54(T18 회사별 비공개 페이지)·#55(T08-followup)와 번호가 겹치지 않게, 배포 기반(T17)의 후속으로 둔다.

## 목표

이직용 사이트(지금의 사이트)는 그대로 두고, 같은 원고로 만든 **프로젝트 어사인(社内·客先 프로젝트 배정)용 버전**을 다른 URL `https://profile.songyu0608.workers.dev`에 배포한다. 어사인용 버전에는 회사 메일 주소만 나오고, GitHub·LinkedIn 링크와 이직용 문구·주소가 나오지 않는다.

## 배경

- 2026-11-04 사용자 결정(choi, 프로젝트 스레드):
  - 이직용 사이트는 유지하고, **사이트 링크(URL)만 다른 어사인용 버전**을 따로 둔다.
  - 어사인용 버전: **LinkedIn 링크 제거, GitHub 링크 제거**, 메일은 **회사 메일** `choi.s@ubicomo-hd.com`. 회사 메일을 Public 저장소에 그대로 올리는 것도 승인.
  - GitHub 링크를 빼는 이유: 어느 저장소로 링크해도 한 번 클릭으로 프로필 → Public인 이 저장소가 보이고, 저장소에는 이직용 문구(`docs/PLAN.md` §1 등)와 이직용 사이트 주소가 있다. 저장소를 Private으로 바꾸는 안은 택하지 않았다. 사이드 프로젝트는 사이트 안 설명으로만 어필한다.
  - 주소 이름: `profile` (→ `profile.songyu0608.workers.dev`, Claude 추천안).
- 열람 범위: 계정 단위 Cloudflare Access(`docs/ARCHITECTURE.md` §2 "배포" 공개 전 잠금)가 **앞으로 배포할 Worker도 막으므로**, 새 Worker도 처음에는 choi만 본다. 어사인용 버전을 회사 사람에게 여는 방법(전체 공개 또는 회사 메일 도메인만 허용하는 Access 정책)은 이 작업 범위 밖이며, 원고 반영 뒤 사용자가 정한다(`docs/PLAN.md` §7). 임시 문구가 남은 채 공개하지 않는다는 규칙(`docs/CONTENT.md` "임시 문구 규칙")은 어사인용에도 똑같이 적용한다.
- 남는 위험(사용자에게 알림): 주소의 `songyu0608`(Cloudflare 계정 하위 도메인)는 GitHub 로그인과 같다. 링크는 없어도 이름으로 검색하면 GitHub 프로필을 찾을 수 있다. 막으려면 커스텀 도메인이나 하위 도메인 변경(계정 전체, 이직용 주소도 바뀜)이 필요하며, 이 작업에서는 하지 않는다.
- 참고: `docs/ARCHITECTURE.md` §2 "배포"·"SEO", `docs/tasks/T07-contact.md`(연락처 데이터 규칙), `docs/tasks/T13-seo.md`(`site`에서 만드는 절대 URL).

## 설계

### 빌드 변형 `SITE_VARIANT`

- 빌드 때 환경 변수 `SITE_VARIANT`로 변형을 고른다. 값: `default`(이직용, 지정하지 않으면 이것) / `assign`(어사인용). 다른 값이면 빌드를 실패시킨다.
- 화면 컴포넌트·페이지 구조는 하나다. 변형마다 다른 것은 **연락처 데이터**와 **`site`(절대 URL)** 뿐이다. 컴포넌트 안에서 `SITE_VARIANT`를 직접 읽지 않고, 데이터(`src/lib/content.ts`)와 `astro.config.mjs`에서만 읽는다.
- 브라우저 JS에 변형 값이나 다른 변형의 연락처가 들어가지 않는다(명령 팔레트·터미널 데이터 포함).

### 연락처 데이터

- `src/content/contact.yaml`에 변형별 덮어쓰기 `variants.assign`을 둔다. 덮어쓰는 항목은 `intro`·`email`·`links` 세 개이고, 쓰지 않은 항목은 기본값을 쓴다. 스키마(`src/content.config.ts`)는 strict로 검사한다.
- 어사인용 값:
  - `email.address`: `choi.s@ubicomo-hd.com`, `placeholder: false`
  - `links: []` (GitHub·LinkedIn 모두 없음. 링크가 0개일 때 Contact 페이지·푸터·터미널 `contact` 명령에서 빈 목록·빈 제목이 남지 않아야 한다)
  - `intro`: 이직 표현 없이 프로젝트 상담만 말한다. 기본안 ja 「プロジェクトのご相談は、メールでご連絡ください。〇 営業日以内に返信します。（仮）」, en 「For project inquiries, please contact me by email. I usually reply within X business days. (placeholder)」. `placeholder: true` 유지(원고 반영 때 확정).
- UI 문구 `src/i18n/ui.ts`의 Contact 페이지 description 「メール、GitHub などの連絡方法を掲載しています。」/「Ways to get in touch, including email and GitHub.」는 어사인용에서 틀린 말(GitHub 없음)이 되므로, 서비스 이름을 넣지 않은 두 변형 공통 문장으로 바꾼다. 기본안: 「連絡方法を掲載しています。」/「Ways to get in touch.」

### `site`(절대 URL)

- canonical·hreflang·OG·sitemap·robots의 절대 URL이 이직용 주소를 가리키면 어사인용 페이지에서 이직용 주소가 드러난다. 그래서 `site`도 변형마다 정한다.
  - `default`: 지금 값 그대로(`https://portfolio.example`, 임시 값 경고 유지)
  - `assign`: `https://profile.songyu0608.workers.dev`

### 검색 노출

- 어사인용 버전은 **공개 뒤에도 `noindex`를 유지**한다(기본안, 사용자 확인 전). 이름으로 검색했을 때 두 사이트가 함께 나오지 않게 한다. 지금은 `public/_headers`의 `X-Robots-Tag: noindex`가 두 변형에 같이 들어가므로 이 작업에서 바꿀 것은 없고, `docs/PLAN.md` §8 "공개 배포 때" 항목에 "어사인용은 `X-Robots-Tag`를 지우지 않는다"를 적는다.

### 누출 검사

- `scripts/check-variant.mjs`(이름은 구현에서 정해도 된다): `assign` 빌드 결과(`dist/`) 전체(HTML·JS·XML·txt)에 아래 문자열이 **없는지** 검사하고, 있으면 파일 이름과 함께 실패한다. 금지 문자열은 하드코딩하지 않고 `contact.yaml`의 기본값과 `astro.config.mjs`의 `default` `site`에서 읽는다.
  - 기본 변형의 메일 주소
  - 기본 변형 `links`의 URL 호스트(`github.com`, `linkedin.com` 등)
  - 기본 변형 `site`의 호스트
- `pnpm build:assign` = `SITE_VARIANT=assign`으로 빌드 + 누출 검사. Windows에서도 돌도록 환경 변수 설정은 셸 문법에 기대지 않는다(예: Node 스크립트에서 설정, 새 의존성 없이).

### 배포

- `wrangler.jsonc`에 환경 `assign`을 추가하고 Worker 이름을 `profile`로 한다(`wrangler deploy --env assign`). 나머지 설정(정적 자산, 404, 끝 슬래시)은 같다. 환경별 설정 상속 규칙은 공식 문서로 확인한다(확인 필요).
- CI `deploy` 작업: 지금처럼 기본 빌드 → `wrangler deploy` 뒤, `pnpm build:assign` → `wrangler deploy --env assign`. 두 배포가 같은 `dist/`를 순서대로 쓴다.
- CI `check` 작업: E2E·Cloudflare 동작 테스트 뒤에 `pnpm build:assign`(누출 검사 포함)을 한 번 돈다. E2E·Lighthouse는 기본 변형만 한다(화면 구조가 같으므로).
- 첫 배포 전에 Access 잠금이 새 Worker에도 걸리는지 사용자가 확인한다(아래 사용자 준비).

## 범위

포함:

- `SITE_VARIANT` 변형 빌드, 연락처 덮어쓰기, 변형별 `site`
- 링크 0개일 때 화면 처리(Contact·푸터·터미널)
- Contact description 문구 변경(공통)
- 누출 검사 스크립트와 `pnpm build:assign`, CI `check`·`deploy` 단계 추가
- `wrangler.jsonc` 환경 `assign`
- 문서: `docs/ARCHITECTURE.md` §2 "배포"(변형 빌드·두 Worker), 결정 기록(새 A 번호), `AGENTS.md` §6 명령 목록에 `pnpm build:assign`, `docs/PLAN.md` 진행 상태

제외:

- 어사인용 버전을 회사 사람에게 여는 일(Access 정책 변경 또는 공개). 원고 반영 뒤 사용자가 정한다
- 커스텀 도메인, 계정 하위 도메인 변경
- 프로필·경력·프로젝트 원고의 변형별 차이(지금은 같은 원고. 필요해지면 따로 지시서)
- 사이드 프로젝트 데모 URL 링크(링크 칸이 아직 없다. 원고 반영 때)
- 저장소 Private 전환(택하지 않음)

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `astro.config.mjs`
- `src/content/contact.yaml`, `src/content.config.ts`, `src/lib/content.ts`
- `src/i18n/ui.ts` (Contact description만)
- `src/components/pages/ContactPage.tsx`, `src/components/SiteFooter.tsx`, `src/components/interactive/commands.ts`와 각 `*.module.css` (링크 0개 처리만)
- `scripts/check-variant.mjs` (새 파일), `package.json` (`scripts`만)
- `wrangler.jsonc`, `.github/workflows/ci.yml`
- `tests/e2e/**` (기준 스냅숏 갱신, 문구 변경 반영)
- `docs/ARCHITECTURE.md`, `docs/PLAN.md`, `AGENTS.md`(§6 명령만), 이 지시서

## 완료 조건

- [ ] `pnpm build`(기본) 결과가 지금과 같다: GitHub·LinkedIn 링크와 기존 메일이 그대로 나온다(Contact description 문구만 바뀜)
- [ ] `pnpm build:assign`이 성공하고, 결과 HTML의 Contact·푸터에 회사 메일만 있고 GitHub·LinkedIn 링크가 없다. canonical·hreflang·OG·sitemap이 `https://profile.songyu0608.workers.dev`를 쓴다
- [ ] 누출 검사가 실제로 잡는지 확인: 어사인용 덮어쓰기를 잠시 지운 빌드에서 실패하는 것을 PR에 적는다
- [ ] `SITE_VARIANT`에 모르는 값을 주면 빌드가 실패한다
- [ ] 링크 0개일 때 Contact 페이지·푸터·터미널 `contact` 출력에 빈 목록·빈 제목이 없다(어사인용 빌드 스크린샷 ja/en, 1280·375)
- [ ] `pnpm lint`, `pnpm check`, `pnpm format:check`, `pnpm test`, `pnpm test:workers` 통과
- [ ] CI 통과(`check`에 `build:assign` 단계 포함)
- [ ] `docs/ARCHITECTURE.md`·`AGENTS.md`·`docs/PLAN.md` 갱신

## 사용자 준비 (choi)

1. 구현 PR merge 전: Cloudflare Zero Trust에서 계정 단위 Access 규칙("Protect all Workers", All traffic)이 그대로 켜져 있는지 확인한다. 새 Worker `profile`도 이 규칙으로 잠긴다(`docs/ARCHITECTURE.md` §2 "공개 전 잠금").
2. merge 뒤 첫 배포: 시크릿 창에서 `https://profile.songyu0608.workers.dev/ja/`가 Access 로그인 화면으로 막히는지, 로그인 뒤 Contact에 회사 메일만 보이는지 확인한다(클라우드 작업 환경은 `*.workers.dev`에 접속하지 못한다, T17 기록).
3. 배포 API 토큰 권한이 계정의 Workers 전체 편집인지 확인한다. Worker 하나로 한정했다면 `profile` 배포가 실패한다(확인 필요).

## 메모

- 회사별 비공개 페이지(T18, PR #54 지시서)와는 다르다. T18은 지원 회사마다 토큰 URL로 내용을 바꾸는 이직용 기능이고, 이 작업은 연락처만 바꾼 사이트 전체의 두 번째 배포다. T18 Worker 스크립트가 들어오면 어사인용 환경에는 비공개 페이지 경로를 넣지 않는다(T18 구현 때 확인).
