# T18: 회사별 비공개 페이지 (토큰 URL, Worker + KV, 이력서 PDF, 열람 기록)

| 항목 | 값 |
| --- | --- |
| 단계 | 8 |
| 선행 작업 | T17 (구현 PR #52, 완료 반영 PR #53) |
| 담당 | 미배정 |
| 상태 | todo |
| 브랜치 | `<agent>/T18-company-pages` |

## 목표

- 지원하는 회사마다 추측할 수 없는 URL(`/c/<토큰>/`)로 그 회사용 페이지를 보여 준다. 로그인은 없다(A5).
  - 회사명과 그 회사에 맞춘 인사말
  - 강조할 프로젝트(기존 프로젝트 중 선택)
  - 이력서 PDF 내려받기(이 페이지에서만)
- choi가 자기 PC의 저장소 밖 파일(gitignore)에 회사 정보를 적고, 명령 하나로 Cloudflare KV에 올린다. 토큰은 명령이 만든다.
- 열람 기록(처음·마지막 열람 시각, 횟수)을 남기고 명령으로 확인한다.
- 만료일이 지나거나 끈 페이지는 404다.

## 배경

- 근거 문서
  - `docs/PLAN.md` §3(회사별 비공개 페이지, 후반), §4(채택(선택): 토큰 URL + Workers + KV 열람 기록, 로그인 없음), §8 T13 항목(`noindex`, sitemap·`robots.txt`에 넣지 않음), §8 T05 항목(이력서 PDF 공개 범위)
  - `docs/ARCHITECTURE.md` A5(토큰 URL + KV, 단계 8에 재검토), A6(비밀 값), §2 "배포"(T17), SEO `noindex` prop
  - `docs/CONTENT.md` 이력서 PDF: 履歴書는 개인 정보를 지운 공개용 판 또는 회사별 비공개 페이지로만 제공
- 2026-11-01 사용자 결정
  - 연락 폼(원래 T18)은 **보류**한다. 메일 발송에 커스텀 도메인이 필요하고(Cloudflare Email Sending은 보내는 주소가 내 도메인이어야 함), 방문자는 지금처럼 메일 주소를 복사·`mailto:`로 보낸다. 메일 주소는 계속 보인다. 도메인을 사게 되면 다시 검토한다(`docs/PLAN.md` §4·§7).
  - 다음 작업은 회사별 비공개 페이지다. 번호는 T18로 당긴다(방문 분석은 T19).
- 페이지 내용 기본안(2026-11-01 사용자에게 제시, 범위 1~6): 회사명 + 인사말 + 강조 프로젝트 2~4개, 이력서 PDF, 회사마다 언어 하나, 로컬 파일 + 명령으로 올림, 열람 기록, 90일 만료.
- 공개 배포 전에는 T17의 계정 단위 Access가 이 페이지도 막는다. 회사에 URL을 보내는 것은 공개 배포 뒤부터다. 그 전에는 choi가 로그인해서 확인한다.

### A5 재검토 (이 지시서에서 유지)

| 안 | 고르지 않은 이유 / 고른 이유 |
| --- | --- |
| **토큰 URL + KV (A5 유지)** | 채용 담당자가 링크만 누르면 된다. KV 무료 한도(하루 읽기 100,000·쓰기 1,000)로 충분하다 |
| Cloudflare Access(메일 OTP) | 담당자가 메일 인증을 한 번 더 해야 한다. 담당자 메일을 미리 알아야 하고, 좌석(무료 50)을 쓴다 |
| 회사 정보를 저장소에 커밋 | 저장소가 Public이라 회사명·인사말·토큰이 모두 드러난다(`AGENTS.md` §4-8) |
| D1(SQL)에 저장·기록 | 열람 기록 집계는 편하지만 서비스가 하나 늘어난다. 지금 규모(회사 수십 곳)는 KV로 된다. 기록이 복잡해지면 T19(방문 분석)에서 다시 본다 |

### 확인한 공식 문서 (2026-11-01)

- [Static Assets binding](https://developers.cloudflare.com/workers/static-assets/binding/)(갱신 2026-10-12)
  - `assets.binding`을 두면 Worker에서 `env.ASSETS.fetch()`로 자산을 읽는다. 경로만 맞춘다(호스트 이름은 의미 없음).
  - `run_worker_first`에 경로 패턴 배열을 줄 수 있다. `*`는 깊은 경로까지, `!`는 제외. 최대 100개.
  - Worker 스크립트는 패턴에 맞지 않으면 "맞는 자산이 없을 때만" 불린다. Worker가 `env.ASSETS.fetch(request)`를 부르면 `html_handling`·`not_found_handling`이 그대로 적용된다.
- [Headers](https://developers.cloudflare.com/workers/static-assets/headers/)(T17 확인): `_headers`는 정적 자산 응답에만 붙는다. Worker가 만든 응답의 헤더는 코드에서 정한다.
- [KV limits](https://developers.cloudflare.com/kv/platform/limits/)(갱신 2026-10-30), Free 플랜: 하루 읽기 100,000, 다른 키 쓰기 하루 1,000, 같은 키 쓰기 초당 1, 값 25MiB, 키 512B, 메타데이터 1024B, 저장 1GB. 호출 하나당 KV 작업 1,000.
- Workers Free 한도(T17 확인): 하루 요청 100,000, 요청당 CPU 10ms. Worker 스크립트가 생기면 자산이 없는 경로(404)와 `/c/*`가 이 요청 수에 들어간다. 정적 자산 요청은 여전히 무료·무제한이다.

## 범위

포함:

1. **Worker 스크립트와 설정**
   - 새 파일 `worker/index.ts`(TypeScript). `wrangler.jsonc`에 `main`, `assets.binding: "ASSETS"`, `assets.run_worker_first: ["/c/*", "/company-template/*"]`, `kv_namespaces`(binding `COMPANY`)를 더한다.
     - KV 네임스페이스 ID는 비밀 값이 아니다(접근하려면 API 토큰이 필요). `wrangler.jsonc`에 적는다. 사용자 준비 1에서 받는다.
     - 로컬 `wrangler dev`는 로컬 KV(`.wrangler/state`)를 쓴다. 원격 KV에 닿지 않는다.
   - 경로별 동작

     | 요청 | 동작 |
     | --- | --- |
     | `/c/<토큰>/` | 토큰 검사 → KV에서 회사 레코드 → 템플릿을 채워 200. 없음·만료·꺼짐은 404 페이지(404 상태) |
     | `/c/<토큰>` | `/c/<토큰>/`로 307(T17의 끝 슬래시 동작과 같은 코드) |
     | `/c/<토큰>/files/<파일 id>` | 그 회사에 연결된 파일만 200(`application/pdf`, `Content-Disposition: attachment; filename="..."`). 아니면 404 |
     | `/c/` 아래 다른 모든 경로 | 404 페이지 |
     | `/company-template/*` | 직접 열면 404 페이지(템플릿은 Worker만 읽는다) |
     | 그 밖의 경로 | `env.ASSETS.fetch(request)`를 그대로 돌려준다(T17 동작 유지: 404-page, 끝 슬래시) |

   - 토큰: 형식이 맞지 않으면(아래 범위 4) KV를 읽지 않고 404. KV 키는 토큰 원문이 아니라 SHA-256 해시(`company:<hex>`)다. 계정 화면에서 KV를 봐도 URL이 드러나지 않게 한다.
   - 응답 헤더(Worker가 만든 응답, `_headers`가 붙지 않으므로 코드에서 넣는다)
     - `/c/*`의 200·404 모두: T17 보안 헤더 3개(`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`)와 `X-Robots-Tag: noindex`(공개 배포 뒤에도 유지), `Cache-Control: private, no-store`
     - `Referrer-Policy`는 `/c/*`에서만 `no-referrer`로 둔다. 페이지 안 링크(GitHub 등)로 나갈 때 토큰 URL이 전해지지 않게 한다. T17 값(`strict-origin-when-cross-origin`)도 다른 사이트에는 origin만 보내지만, 같은 사이트 안 이동에서도 남기지 않으려는 것이다.
   - 오류: KV 읽기 실패 같은 예외는 404로 숨기지 않는다. 500 상태와 짧은 일본어·영어 문구를 낸다. 로그(`console.error`)에 토큰을 찍지 않는다.
2. **템플릿 페이지(Astro, 빌드 결과에 포함)**
   - `src/pages/company-template/ja/index.astro`, `.../en/index.astro` → `dist/company-template/{ja,en}/index.html`. 진입점 `src/layouts/CompanyLayout.astro`, 화면 `src/components/pages/CompanyPage.tsx`(+ CSS Modules).
   - `BaseLayout`의 `noindex`를 켠다. canonical·hreflang·`og:url`이 빠진다(T13 동작). sitemap·`robots.txt`에 넣지 않는다(T13 항목). 언어 전환 링크는 공개 Home으로 보낸다(회사 페이지의 짝 언어 페이지가 없으므로).
   - 화면 구성(기본안. 원고 반영 때 choi가 문구를 고친다, `docs/DESIGN.md`에 새 절)
     - 페이지 머리: h1 = 회사용 제목(예: 「{회사명} 採用ご担当者様へ」/`To the hiring team at {company}`), 인사말 문단(여러 문단 가능)
     - 「ご覧いただきたいプロジェクト」/`Projects for you`: 그 언어의 모든 프로젝트 카드(`ProjectCard`)를 공개 사이트 순서(대표 → 나머지 `order`)로 넣고, 카드마다 `data-company-project="<slug>"`를 단다. Worker가 고르지 않은 카드를 지운다. 순서는 공개 사이트 순서를 따른다(HTMLRewriter로 순서를 바꾸지 않음, 메모).
     - 「履歴書・職務経歴書」/`Resume`: 파일 링크 목록 자리. 파일이 없으면 Worker가 절을 지운다.
     - 끝: 공개 페이지(経歴·プロジェクト·連絡先) 링크와 메일 주소(`contact.yaml`)
   - 바꿀 자리는 `data-company-*` 속성으로 찾는다(클래스 이름은 CSS Modules가 바꾸므로 쓰지 않는다. `docs/ARCHITECTURE.md` §2 스크립트 규칙과 같음).
   - 페이지 스크립트는 넣지 않는다(헤더 스크립트·테마 첫 적용은 BaseLayout 그대로).
3. **채우기(Worker, HTMLRewriter)**
   - `env.ASSETS.fetch('/company-template/<lang>/')`로 템플릿을 읽고 HTMLRewriter로 바꾼다.
     - 회사명·인사말은 `setInnerContent(text, { html: false })` 또는 `append(text, { html: false })`로 **텍스트로만** 넣는다(HTML 주입 금지). 인사말 문단은 `<p>`를 Worker가 만들되 내용은 텍스트로 넣는다.
     - `<title>`·`<meta name="description">`도 회사용으로 바꾼다(검색 노출은 없지만 탭 제목·공유 미리보기 때문).
     - 고르지 않은 프로젝트 카드, 파일이 없을 때 이력서 절을 `remove()`한다.
   - CPU 10ms 한도를 넘지 않는지 로컬에서 확인한다(템플릿 크기·바꾸는 요소 수가 작다).
4. **데이터 형식과 관리 명령**
   - 로컬 폴더 `private/`(새 `.gitignore` 항목, 저장소에 올라가지 않음)
     - `private/companies/<id>.yaml`: 회사 하나. `id`는 파일 이름(영숫자·하이픈, 예: `acme`). 사람이 쓰는 이름이고 URL에는 나오지 않는다.
     - `private/files/<파일>.pdf`: 이력서 등
   - 회사 파일 스키마(zod로 검사, 어기면 명령이 멈춘다)

     | 키 | 형식 | 비고 |
     | --- | --- | --- |
     | `company` | 문자열 1~80자 | 화면에 보일 회사명 |
     | `locale` | `ja` \| `en` | |
     | `message` | 문자열 배열 1~5개, 각 1~600자 | 인사말 문단 |
     | `projects` | slug 배열 1~4개(기본 2~4개 권장) | 그 언어에 있는 slug만. 중복 금지 |
     | `files` | 0~3개: `{ file: private/files 아래 경로, name: 내려받을 파일 이름, label: 화면 문구 }` | PDF만, 각 10MiB 이하(KV 값 25MiB 안) |
     | `expiresAt` | 날짜(`YYYY-MM-DD`, JST 하루 끝까지 유효) | 없으면 만든 날 + 90일을 명령이 채운다 |
     | `disabled` | boolean(기본 false) | |
     | `token` | 명령이 처음 올릴 때 만들어 이 파일에 써 넣는다 | 사람이 쓰지 않는다. 바꾸면 이전 URL은 404 |

   - 토큰: `crypto.randomBytes(16)`(128비트)의 base64url 22자. Worker는 `^[A-Za-z0-9_-]{22}$`만 받는다.
   - KV 키
     - `company:<sha256(token) hex>` → JSON `{ v: 1, id, company, locale, message, projects, files: [{ id, name, label, size }], expiresAt, disabled }`
     - `file:<sha256(파일 내용) hex>` → PDF 바이트(같은 파일은 회사가 달라도 한 번만 올린다). 회사 레코드의 `files[].id`가 이 해시다.
     - `views:<id>` → JSON `{ first, last, count }`(ISO 시각, UTC)
   - 명령(`package.json` scripts, Node 스크립트 `scripts/company/*.mjs`)

     | 명령 | 동작 |
     | --- | --- |
     | `pnpm company:publish [id...]` | 검사 → 토큰이 없으면 만들어 파일에 기록 → 파일·레코드를 원격 KV에 올림 → URL 출력. URL의 origin은 `--origin` 인자로 바꿀 수 있고 기본값은 지금 배포 주소(`https://portfolio.songyu0608.workers.dev`)다 |
     | `pnpm company:list` | 회사별 id·회사명·언어·만료일·꺼짐 여부·열람 기록 |
     | `pnpm company:disable <id>` | `disabled: true`로 바꿔 올림(바로 404) |
     | `pnpm company:delete <id>` | 레코드·열람 기록을 지움(파일은 다른 회사가 쓰지 않을 때만) |

     - 원격 KV는 `wrangler kv key put/get/delete --remote --binding COMPANY`로 다룬다. choi가 자기 PC에서 `wrangler login`을 한 번 한다(사용자 준비 2). CI는 이 명령을 쓰지 않는다.
     - `--local` 옵션으로 로컬 KV에 올릴 수 있게 한다(로컬 확인·테스트용).
     - 토큰을 명령 출력 말고 다른 곳(로그 파일 등)에 남기지 않는다.
5. **열람 기록**
   - `/c/<토큰>/` 200 응답 때 `ctx.waitUntil`로 `views:<id>`를 갱신한다(응답을 늦추지 않음). PDF 내려받기는 세지 않는다.
   - 한계(메모에 적는다): KV는 최종 일관성이고 같은 키 쓰기는 초당 1회라 동시 열람은 덜 셀 수 있다. 메일·메신저의 링크 미리보기 봇이 열면 그것도 열람으로 센다. 그래서 "대략 열어 봤는지" 수준으로 쓴다.
6. **테스트**(`tests/workers/`, T17 설정을 넓힌다)
   - `playwright.workers.config.ts`의 globalSetup에서 로컬 KV에 시험용 회사 3개(유효·만료·꺼짐)와 PDF 하나를 넣는다(`pnpm company:publish --local`과 같은 코드를 쓰되, 시험 데이터는 `tests/workers/fixtures/`에 두고 토큰은 시험마다 새로 만든다).
   - 확인 항목

     | 대상 | 기대 |
     | --- | --- |
     | 유효 토큰 | 200, `text/html`, 회사명·인사말이 텍스트로 들어감, 고른 프로젝트 카드만 있고 순서는 공개 사이트 순서, 이력서 링크, `<meta name="robots" content="noindex">`, 헤더(범위 1) |
     | 인사말에 `<script>` 같은 문자열 | 태그가 아니라 글자로 보인다 |
     | 끝 슬래시 없음 | 307 → 슬래시 주소 |
     | 형식이 틀린 토큰, 없는 토큰, 만료, 꺼짐 | 404, 본문 = `dist/404.html`, 헤더(범위 1) |
     | 파일 | 연결된 파일 200·`application/pdf`·`Content-Disposition`. 다른 회사 파일 id·없는 id는 404 |
     | `/company-template/ja/` 직접 | 404 |
     | 열람 기록 | 유효 토큰 열람 뒤 `views:<id>`의 count가 늘어남 |
     | T17 기존 45개 | 그대로 통과(Worker를 거쳐도 `/` 301·404·끝 슬래시·헤더가 같음) |

   - E2E(`tests/e2e`)는 sitemap 기준이라 템플릿이 들어가지 않는다. 접근성(axe)은 템플릿 페이지를 채운 결과로 한 번 확인한다(Worker 테스트에서 HTML을 받아 Playwright 페이지에 넣거나, 로컬 `wrangler dev`를 연 브라우저로). 방법은 구현에서 정하고 PR에 적는다.
7. **타입·빌드**
   - Worker 타입은 `wrangler types`로 만든 `worker-configuration.d.ts`(커밋)를 쓴다. 새 devDependency(`@cloudflare/workers-types` 등)는 필요할 때만 더하고 이유를 PR에 적는다.
   - `pnpm check`(astro check)가 Worker 코드도 검사하는지 확인하고, 안 되면 `tsc -p worker` 같은 단계를 `pnpm check`에 붙인다.
   - 관리 스크립트의 YAML 읽기·zod 검사는 이미 있는 의존성(Astro가 쓰는 `yaml`/`zod`가 직접 의존성이 아니면 추가 여부를 PR에 적는다)을 쓴다.
8. **문서**
   - `docs/ARCHITECTURE.md`: 다이어그램(`/c/*` Worker, 연락 폼 보류 표시), 디렉터리 구조, §2 새 절 "회사별 비공개 페이지 (T18)", A5 상태 갱신, 비밀 값·저장소에 올리지 않는 것(`private/`)
   - `docs/DESIGN.md`: 회사 페이지 화면 절
   - `AGENTS.md` §6: 새 명령
   - `README.md` "개발 방법": 회사 페이지 명령 한 줄과 `private/` 설명
   - `docs/PLAN.md`: 진행 상태, 지시서 표, §8 T13 항목(회사 페이지 `noindex`) 처리, 결정 기록
9. **사용자 준비(choi)**

   | 순서 | 할 일 | 언제 |
   | --- | --- | --- |
   | 1 | Cloudflare 대시보드 › Storage & databases › Workers KV › Create로 네임스페이스 `portfolio-company`를 만들고 ID를 구현 담당에게 알린다(비밀 값 아님) | 구현 시작 전 |
   | 2 | 자기 PC에서 저장소를 받고 `pnpm exec wrangler login`(브라우저로 Cloudflare 로그인) | 구현 PR merge 뒤 |
   | 3 | 배포용 API 토큰("Edit Cloudflare Workers" 템플릿)에 Workers KV 권한이 있는지 확인한다. 없으면 KV 바인딩 배포가 실패할 수 있다(확인 필요) | 구현 PR merge 전 |
   | 4 | `private/companies/`에 시험 회사 하나를 만들고 `pnpm company:publish` → 로그인한 브라우저에서 URL 확인 | merge 뒤 |

제외:

- 연락 폼(보류, 2026-11-01 사용자 결정)
- 관리 화면(웹 UI): 회사 수가 적어 명령으로 충분하다.
- 열람 알림(메일 등): 메일 발송 보류와 같은 이유
- 회사별 강조색·디자인 변경(PLAN §2: 회사별 강조색 구조는 만들지 않음)
- 실제 이력서 PDF와 인사말 원고: 원고 반영 때. 이 작업은 시험용 PDF(빈 페이지 하나)만 쓴다.
- 프로젝트 순서를 회사마다 바꾸기: 메모 참고
- 방문 분석: T19

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- 새 파일: `worker/**`, `worker-configuration.d.ts`, `scripts/company/**`, `src/pages/company-template/**`, `src/layouts/CompanyLayout.astro`, `src/components/pages/CompanyPage.tsx`·`CompanyPage.module.css`, `tests/workers/**`(T17 파일 포함)
- `wrangler.jsonc`, `playwright.workers.config.ts`
- `package.json`(scripts, 필요한 의존성), `pnpm-lock.yaml`
- `src/i18n/ui.ts`: 회사 페이지 문구(`pages.company.*` 등)만 더한다.
- `src/lib/content.ts`: 회사 템플릿용 조회 함수를 더할 때만(기존 함수 동작은 바꾸지 않음)
- `src/pages/sitemap.xml.ts`·`robots.txt.ts`: 템플릿이 들어가지 않는 것을 확인만 하고, 바꿔야 하면 이유를 적는다.
- `.gitignore`(`private/`), `.prettierignore`·`eslint.config.mjs`·`tsconfig.json`: Worker·생성 파일을 다루는 데 필요할 때만
- 문서: `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `AGENTS.md`(§6만), `README.md`("개발 방법"만), `docs/PLAN.md`, `docs/tasks/T18-company-pages.md`
- 바꾸지 않는 파일: 기존 화면 컴포넌트(`ProjectCard` 등은 import만), `public/_redirects`·`_headers`, `.github/workflows/ci.yml`(바꿔야 하면 이유를 적는다)

## 완료 조건

- [ ] `pnpm test:workers`가 범위 6 표를 모두 확인하고 로컬·CI에서 통과한다. T17 기존 확인도 그대로 통과한다.
- [ ] 인사말·회사명이 HTML로 해석되지 않는다(범위 6 `<script>` 확인).
- [ ] 토큰 원문이 KV 키·로그·저장소 어디에도 없다. `private/`가 gitignore되어 있고 `git status`에 나오지 않는다.
- [ ] `/c/*` 응답에 `X-Robots-Tag: noindex`·`Cache-Control: private, no-store`·`Referrer-Policy: no-referrer`가 있다. 템플릿이 sitemap에 없다.
- [ ] `pnpm company:publish --local` → `wrangler dev`에서 페이지가 열리고 `company:list --local`에 열람 기록이 보인다(PR에 출력, 토큰은 가린다).
- [ ] 회사 페이지가 Worker 한 요청 CPU 10ms 안에서 처리된다(로컬 측정값을 PR에 적는다, 확인 방법은 구현에서 정함).
- [ ] 회사 페이지(채운 결과) axe 위반 0, 라이트·다크·키보드 확인
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`, `pnpm test`, `pnpm lighthouse`, `pnpm test:workers`와 GitHub CI가 통과한다. 기존 18페이지의 빌드 결과는 템플릿 2개가 늘어난 것 말고 같다.
- [ ] 문서 갱신(범위 8)
- [ ] 비밀 값 미포함. KV 네임스페이스 ID만 `wrangler.jsonc`에 있다.
- [ ] merge 전: 사용자 준비 1·3. merge 뒤: 사용자 준비 2·4(완료 반영 PR에 적는다)

## 확인 방법

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test:workers
# 로컬에서 직접 보기
cp -r tests/workers/fixtures/private-example private   # 예시 회사(구현에서 경로 확정)
pnpm company:publish --local
pnpm preview:workers                                    # 출력된 /c/<토큰>/ 열기
pnpm company:list --local
```

## 메모

- **프로젝트 순서를 회사마다 바꾸지 않는 이유**: HTMLRewriter는 요소를 지우고 바꿀 수는 있지만 옮기기는 어렵다. 순서까지 바꾸려면 Worker에서 화면을 다시 그려야 하는데(React를 Worker에 넣으면 CPU·크기 부담), 강조할 프로젝트를 고르는 것만으로 목적은 대부분 이룬다. 필요해지면 템플릿에 카드를 순서 칸(slot)마다 넣는 방식 등을 그때 검토한다.
- **Worker가 생기면 달라지는 것(T17 대비)**
  - 자산이 없는 경로(404)는 Worker를 거친다. Workers 요청 수(하루 100,000)에 들어간다. 봇이 없는 경로를 많이 두드리면 한도에 닿을 수 있다(확인 필요: 한도를 넘으면 오류 페이지가 나오는지). 공개 배포 뒤 관찰한다.
  - `_redirects`는 Worker보다 먼저인지 확인한다(`/` 301이 그대로인지 T17 테스트가 잡는다).
- **Access와의 관계**: 공개 배포 전에는 계정 단위 Access가 `/c/*`도 막는다. 공개 배포 때 계정 단위 Access를 끄면 회사 페이지도 토큰만으로 열린다(목표 동작). 정적 자산이 있는 Worker는 `ctx.access`를 받지 못한다(T17 메모)는 이 지시서와 관계없다(로그인 없음).
- **토큰을 해시해서 키로 쓰는 이유**: Cloudflare 계정 화면이나 KV 목록에서 원문 토큰(=URL)이 보이지 않게 한다. 원문은 choi PC의 `private/companies/<id>.yaml`에만 있다. 이 파일을 잃으면 URL을 다시 알 수 없으므로 `company:publish`로 토큰을 새로 만들고(이전 URL은 404) 회사에 새 URL을 보낸다.
- **링크 미리보기**: 메일·Slack이 URL을 미리 열면 열람으로 센다. `User-Agent`로 봇을 거르는 것은 하지 않는다(정확하지 않음). 필요하면 T19에서 본다.
- **이력서 PDF 크기**: KV 값 한도 25MiB 안에서 파일당 10MiB로 제한한다. 이력서는 보통 1MB 미만이다.
- **확인 필요**
  - 배포용 API 토큰("Edit Cloudflare Workers" 템플릿)에 KV 바인딩 배포 권한이 있는지(사용자 준비 3)
  - `run_worker_first` 패턴과 `_redirects`의 우선순위
  - Workers Free 하루 요청 한도를 넘었을 때 정적 자산·Worker 응답이 어떻게 되는지
