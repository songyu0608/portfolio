# T07: Contact 페이지 (정적 부분, 임시 문구)

| 항목 | 값 |
| --- | --- |
| 단계 | 4 |
| 선행 작업 | T06 (PR #19) |
| 담당 | claude |
| 상태 | review |
| 브랜치 | `claude/project-thread-0wqbsm` (실행 환경이 지정한 이름. 원칙상 이름은 `<agent>/T07-contact`) |

## 목표

`/ja/contact/`, `/en/contact/`의 준비 중 화면을 연락 수단 목록(メール・GitHub・LinkedIn)으로 바꾸고, 모든 페이지의 푸터에 같은 연락 링크를 둔다. 채용 담당자가 어느 페이지에서든 클릭 한두 번으로 연락 방법을 찾게 한다. T04~T06처럼 원고가 없는 값은 **임시 문구**로 구조와 화면을 먼저 완성하고, 원고를 받으면 콘텐츠 파일만 바꾸면 되게 한다.

## 배경

- `docs/PLAN.md` §3 페이지 구성(Contact: 연락 폼, 이메일, GitHub, LinkedIn), §4 동적 기능(연락 폼은 단계 8: Turnstile + Workers 함수 + 메일 발송), §5 단계 4 "Contact(정적 부분)"
- `docs/DESIGN.md` §1(30초 안에 "어떻게 연락하는지"를 알 수 있어야 한다), §4 푸터("연락처 링크는 Contact 지시서에서 푸터 오른쪽에 추가한다"), §5 Home("연락처 링크는 Contact 지시서에서 넣는다")
- `docs/CONTENT.md` 수집 현황 "연락처: 공개용 이메일, GitHub, LinkedIn — 미수집", "임시 문구 규칙"
- `docs/ARCHITECTURE.md` §2 콘텐츠 구조(YAML content collections + `src/lib/content.ts` 규칙 검사), 페이지 파일 방식(언어별 한 줄 페이지 파일 + `src/components/pages/` 화면 컴포넌트)
- 현재 `src/pages/{ja,en}/contact.astro`는 `ComingSoonPage`를 쓰며, 이 페이지가 `ComingSoonPage`의 마지막 사용처다. `SiteFooter.astro`는 저작권 표기만 있다.
- 화면 시안: claude.ai 디자인 캔버스 "T07 Contact 시안"(비공개 링크, 소유자 계정에서만 열림). ja 라이트 1280px, ja 다크 375px(복사 후 상태). 2026-10-30 사용자 확인. 아래 범위 3·4의 배치는 이 시안을 글로 옮긴 것이다.
- 2026-10-30 사용자 확인(T07 범위 정리): ① 메일 주소 복사 버튼을 둔다 ② 희망 조건(희망 직종·근무지·입사 가능 시기) 칸은 두지 않는다 ③ 연락 폼은 단계 8이며, 이번에 폼 자리나 비활성 폼을 만들지 않는다 ④ Home 히어로는 기존 「連絡する」 버튼만 두고 연락처를 직접 늘어놓지 않는다.

## 범위

포함:

1. **콘텐츠 구조** (새 컬렉션. T04의 `src/content.config.ts`, `src/lib/content.ts` 방식을 따른다)

   언어 공통 1건 `src/content/contact.yaml`(기본안):

   | 필드 | 형식(기본안) | 메모 |
   | --- | --- | --- |
   | `placeholder` | boolean | `intro`가 임시 문구인지 표시한다(다른 컬렉션과 같은 뜻) |
   | `intro` | `{ ja: 문자열, en: 문자열 }` | Contact 소개 문단. 연락을 받는 내용, 답장 기준 등 |
   | `email` | `{ placeholder: boolean, address: 문자열 }` | 공개용 메일 주소 |
   | `links` | `{ id: 'github' \| 'linkedin', placeholder: boolean, url: 문자열 }[]`, 0~2개 | 배열 순서가 화면 순서. 없는 서비스는 항목을 쓰지 않는다(그 줄을 출력하지 않음) |

   - 서비스 이름(「メール」/`Email`, `GitHub`, `LinkedIn`)은 UI 문구(`src/i18n/ui.ts`)다. 콘텐츠에는 id만 쓴다.
   - 화면에 보이는 주소 문자열은 `url`에서 `https://`와 끝 `/`를 뺀 값(예: `github.com/songyu0608`)이고, 조회 함수가 만든다. 컴포넌트가 가공하지 않는다.
   - 아래 규칙을 `src/lib/content.ts`에서 검사하고, 어기면 어긴 규칙을 적은 오류로 빌드를 멈춘다(기존 오류 목록에 합친다. 스키마에서 막아도 된다).
     - `email.address`는 `@`를 정확히 하나 포함하고, `@` 앞(로컬 부분)과 뒤(도메인 부분)가 모두 비어 있지 않으며, 도메인 부분에 `.`이 하나 이상 있고, 공백이 없다(예: `@`, `name@`, `@example.com`, `name@example`은 실패). RFC 전체를 검사하지는 않는다.
     - `links[].url`은 `https://`로 시작하고, `github`는 호스트가 `github.com`, `linkedin`은 `linkedin.com` 또는 `www.linkedin.com`이다.
     - `links`에 같은 `id`가 두 번 나오지 않는다.
   - 조회 함수 `getContactContent(locale)`(이름은 기본안): `intro`(그 언어 값), `email`, `links`(표시 문자열 포함). Contact 페이지와 푸터가 같은 함수를 쓴다.
   - 빌드 로그의 임시 항목 수에 `contact` 항목을 더한다. 최상위 `placeholder`(intro), `email.placeholder`, `links[].placeholder`가 `true`인 것을 각 1건으로 센다(기존 `[content] placeholder entries` 로그 형식을 따른다).

2. **콘텐츠 값 (임시 문구)** (`docs/CONTENT.md` "임시 문구 규칙")
   - `placeholder: true`. `intro` 기본안: 「転職やお仕事のご相談は、メールでご連絡ください。〇 営業日以内に返信します。（仮）」/`For job opportunities or project inquiries, please contact me by email. I usually reply within X business days. (placeholder)`
   - `email`: `songyu0608@gmail.com`, `placeholder: false`. 2026-10-30 사용자가 공개용 주소로 제공한 실제 값이다.
   - `links`: `github` = `https://github.com/songyu0608`(`placeholder: false`. 이 저장소의 소유자 계정으로 이미 공개된 값), `linkedin` = `https://www.linkedin.com/in/songyu0608`(`placeholder: false`. 2026-10-30 사용자가 제공한 실제 값).
   - 임시 값의 표식(T07 시점 대상은 `intro`뿐이지만 `email`·`links`에도 같은 규칙을 구현한다): 화면에서 주소 문자열 뒤에 「（仮）」/`(placeholder)`를 링크 밖 텍스트로 붙인다(`mailto:`·URL 안에는 넣지 않는다). 시안은 메일 목록 아래 안내 문장으로 표시했으나, 항목마다 표식을 붙이는 쪽이 원고 반영 순서와 무관하게 임시 값마다 같은 규칙으로 적용되므로 이 방식을 기본안으로 한다.

3. **Contact 화면** (`src/components/pages/ContactPage.astro`와 하위 컴포넌트)
   - 순서: 페이지 머리 → 연락 수단 목록. 연락 폼 자리, 비활성 폼, 「準備中」 안내는 두지 않는다.
   - **페이지 머리**: h1은 페이지 이름(`ui.pages.contact.name`, 「連絡先」/`Contact`, T03 규칙 유지). 아래에 소개 문단(`intro`, text-muted, 최대 약 40em).
   - **연락 수단 목록**: `<section aria-labelledby>` + 시각적으로 숨긴 h2(기본안 「連絡方法」/`Contact methods`, `.sr-only`) + `<ul>`. 목록 전체가 하나의 surface 상자(border 1px, 모서리 12px, 그림자 없음)이고 항목 사이에 border 구분선. 최대 폭 약 46em.
     - 항목 하나: 라벨(13px, 700, text-muted) → 주소 링크(모노스페이스, 640px 이상 18px·미만 16px, accent, 긴 주소는 `overflow-wrap: anywhere`) → (메일만) 복사 버튼.
     - 메일 링크는 `mailto:`. 외부 링크(GitHub·LinkedIn)는 같은 탭에서 연다(`target="_blank"`를 쓰지 않는다).
     - 순서: メール → `links` 배열 순서.
   - **복사 버튼** (메일 항목만)
     - 테두리 버튼(accent 1px 테두리, accent 글자 14px 700, 모서리 8px, 높이 44px 이상) + 복사 아이콘(인라인 SVG, `aria-hidden="true"`). 문구 기본안 「コピー」/`Copy`. 접근 가능한 이름은 「メールアドレスをコピー」/`Copy email address`처럼 무엇을 복사하는지 알 수 있게 한다.
     - 누르면 `navigator.clipboard.writeText`로 주소를 복사하고, 버튼 문구와 아이콘을 「コピーしました」/`Copied` + 체크 아이콘으로 약 2초 바꾼 뒤 되돌린다. 결과는 `aria-live="polite"` 영역으로도 알린다. 실패하면 「コピーできませんでした」/`Couldn't copy`를 같은 방식으로 알린다.
     - **점진적 향상**: 버튼은 HTML에 `hidden`으로 두고, 스크립트가 `navigator.clipboard`를 쓸 수 있을 때만 보인다. JS가 없거나 쓸 수 없으면 버튼이 보이지 않고, 주소 문자열과 `mailto:` 링크만으로 연락할 수 있다.
     - 스크립트는 Astro `<script>`(번들된 모듈)로 Contact 페이지에만 넣는다. React island를 쓰지 않는다. 문구는 `ui.ts`에서 `data-*` 속성으로 넘긴다.
   - `<meta name="description">`은 `ui.pages.contact.description`이며 「現在準備中です。」/`Coming soon.` 문구를 실제 설명으로 바꾼다. 기본안: 「メール、GitHub などの連絡方法を掲載しています。」/`Ways to get in touch, including email and GitHub.`
   - 이 작업으로 `ComingSoonPage.astro`와 `ui.pages.comingSoon`을 쓰는 페이지가 없어지면 둘 다 지운다(`docs/ARCHITECTURE.md` §2 "페이지 파일 방식"의 준비 중 화면 문장도 고친다).

4. **푸터 연락 링크** (`src/components/SiteFooter.astro`, 모든 페이지)
   - 저작권 표기와 함께 연락 링크 목록(「メール」 → `links` 순서의 서비스 이름. 텍스트 링크, 14px, text-muted, 밑줄)을 둔다. 목록은 `<ul>`이고 접근 가능한 이름(기본안 「連絡先」/`Contact`)을 붙인다.
   - 640px 이상: 왼쪽 저작권, 오른쪽 연락 링크(한 줄). 640px 미만: 연락 링크가 위, 저작권이 아래.
   - 링크 대상은 Contact 페이지와 같다(메일은 `mailto:`). 값이 임시(`placeholder: true`)인 항목은 서비스 이름 뒤에 「（仮）」/`(placeholder)` 표식을 붙인다(예: 「メール（仮）」). Contact를 거치지 않고 푸터에서 눌러도 임시 값임을 알 수 있게 하기 위함이다. T07 시점에는 세 값이 모두 실제 값이라 표식이 나오지 않지만, 규칙은 구현한다.
   - 링크 터치 영역은 높이 44px 이상(줄 높이·패딩으로 확보)이며, 링크 사이 간격 24px(640px 미만 20px).
   - 파일 머리의 「연락처 링크는 Contact 지시서에서 이 푸터에 추가한다」 주석을 지운다.

5. **UI 문구·문서**
   - 라벨·버튼 문구·상태 문구·숨긴 제목·푸터 목록 이름은 `src/i18n/ui.ts`, 연락처 값과 소개 문단은 `src/content/contact.yaml`에 둔다. 컴포넌트에 문구를 하드코딩하지 않는다.
   - `docs/DESIGN.md`에 §8 Contact(구성, 전환점별 배치, 복사 버튼 동작, 대비 표, 모션)를 추가하고, §4 푸터 문장과 §5 Home의 "연락처 링크는 Contact 지시서에서 넣는다" 문장을 이번 결정으로 고친다.
   - `docs/ARCHITECTURE.md` §2 디렉터리 구조·콘텐츠 구조 표·규칙 목록에 `contact.yaml`과 검사 규칙을 더하고, §2 출력 설명의 "페이지가 받는 JS" 문장을 갱신한다.
   - `docs/CONTENT.md` 수집 현황 "연락처"를 「수집 완료(2026-10-30): 메일 `songyu0608@gmail.com`, GitHub `songyu0608`, LinkedIn `linkedin.com/in/songyu0608`(실제 값으로 반영, T07)」. Contact 소개 문단은 임시 문구다처럼 고친다.

제외:

- 연락 폼, Turnstile, 메일 발송, Workers 함수 (단계 8)
- 메일 주소 난독화·수집 봇 대책 (아래 메모)
- 희망 조건(희망 직종·근무지·입사 가능 시기) 칸 (2026-10-30 사용자 결정)
- Home 히어로에 연락처 직접 노출 (기존 「連絡する」 버튼 유지)
- 서비스 로고 아이콘 (원고 반영 때 기술 로고와 함께 일괄 적용, `docs/PLAN.md` §2)
- canonical, `hreflang`, OG 이미지, sitemap (단계 6)
- 디자인 토큰 값 변경, 글꼴 CSS 증가

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `src/content/contact.yaml`, `src/content.config.ts`
- `src/lib/content.ts`
- `src/components/**` (`ContactPage.astro` 등 새 컴포넌트, `SiteFooter.astro` 변경, `ComingSoonPage.astro` 삭제)
- `src/layouts/BaseLayout.astro` (푸터에 연락처 값을 넘기는 데 필요할 때만)
- `src/i18n/ui.ts`
- `src/pages/ja/contact.astro`, `src/pages/en/contact.astro`
- `src/scripts/` 아래 복사 버튼용 새 파일 (컴포넌트 안 `<script>`로 충분하면 만들지 않는다)
- `src/styles/global.css` 및 Contact용 새 CSS. `src/styles/tokens.css`의 값은 바꾸지 않는다(새 토큰 추가는 이유를 PR에 적는다).
- `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/CONTENT.md`(수집 현황 상태 표기만), `docs/PLAN.md`, `docs/tasks/T07-contact.md`
- `docs/screenshots/T07-*` (캡처를 저장소에 넣을 경우만)
- 새 의존성은 추가하지 않는다.

## 완료 조건

- [x] `/ja/contact/`, `/en/contact/`에 페이지 머리와 연락 수단 목록(メール・GitHub・LinkedIn)이 표시되고, 준비 중 문구·폼 자리가 없다. 주소 문자열이 클릭하지 않아도 보인다.
- [x] 메일 링크는 `mailto:songyu0608@gmail.com`, GitHub 링크는 `https://github.com/songyu0608`, LinkedIn 링크는 `https://www.linkedin.com/in/songyu0608`로 간다. `contact.yaml`에서 `linkedin` 항목을 지우면 Contact와 푸터에서 그 줄·링크가 사라진다.
- [x] 모든 페이지(Home·About·Projects 목록·상세·Contact, ja/en)의 푸터에 연락 링크가 있다.
- [x] 복사 버튼: JS가 켜진 Chromium에서 주소가 복사되고 「コピーしました」 표시와 `aria-live` 알림이 나온 뒤 약 2초 후 되돌아간다. JS를 끄면 버튼이 보이지 않고 나머지 화면은 같다.
- [x] 콘텐츠 검사: ① `email.address`가 형식 규칙을 어김(`@` 없음, `name@`, `@example.com`을 각각 재현) ② `links[].url`이 `https://`로 시작하지 않음 ③ `github` 항목의 호스트가 `github.com`이 아님 ④ `links`의 `id` 중복 — 각각 빌드가 실패한다. ①~④를 한 번씩 재현해 오류 메시지를 PR에 적는다. T04~T06의 기존 검사도 계속 동작한다.
- [x] `intro`는 `placeholder: true`이고 문구에 「（仮）」/`(placeholder)` 표식이 있다. 메일·GitHub·LinkedIn은 `placeholder: false`이며 표식이 없다. `email.placeholder`를 일시적으로 `true`로 바꾸면 Contact 주소 뒤와 푸터 「メール」 뒤에 표식이 나온다. 빌드 로그의 임시 항목 수가 갱신된다.
- [x] 화면의 콘텐츠 값은 모두 `src/content/`에서, UI 문구는 `src/i18n/ui.ts`에서 온다. 영어 UI 문구 키가 빠지면 `pnpm check`가 실패한다.
- [x] ja/en × 320px·375px·1280px × 라이트·다크에서 Contact와 푸터에 가로 스크롤이 없다. 연락 수단 항목의 배치(한 줄 ↔ 위아래)와 푸터 배치가 640px 전환점에서 바뀐다.
- [x] 제목 구조: h1(페이지 이름) → h2(시각적으로 숨긴 「連絡方法」). 아이콘은 접근성 트리에 나오지 않고, 복사 버튼의 접근 가능한 이름에 「メールアドレス」가 들어간다. 키보드 Tab으로 메일 링크 → 복사 버튼 → GitHub → LinkedIn 순서로 이동한다.
- [x] 새 색 조합의 대비를 측정해 `docs/DESIGN.md` §8에 적는다. 글자 4.5:1, UI 경계 3:1 이상(복사 버튼 테두리 포함).
- [x] 클라이언트 JS: Contact 페이지만 복사 스크립트가 늘고, 다른 페이지가 받는 JS는 T06과 같다. React island를 쓰지 않는다. `/ja/contact/`가 받는 JS·CSS 크기를 T06의 `/ja/projects/`와 비교해 PR에 적는다.
- [x] `prefers-reduced-motion: reduce`에서 새로 추가한 전환 효과가 꺼진다(복사 상태 문구 전환 자체는 유지).
- [x] PR 본문에 최신 커밋 기준 캡처가 있다: Contact ja 라이트 1280px(전체)·ja 다크 375px(전체, 복사 후 상태)·en 라이트 1280px·en 다크 320px, Home ja 라이트 1280px 푸터 부분 이상.
- [x] `docs/DESIGN.md` §4·§5·§8, `docs/ARCHITECTURE.md` §2, `docs/CONTENT.md` 수집 현황이 갱신되어 있다.
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`와 GitHub CI가 통과한다. (로컬 4개 통과, GitHub CI는 PR에서 확인)
- [x] `docs/PLAN.md`의 진행 상태와 작업 지시서 표 갱신, 비밀 값 미포함.

## 확인 방법

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm check && pnpm build
ls dist/ja/contact dist/en/contact
pnpm preview
```

- `/ja/contact/`, `/en/contact/`에서 목록, 링크 대상, 임시 표식, 복사 버튼 동작(복사 후 붙여 넣어 확인)을 확인한다. 개발자 도구에서 JavaScript를 끄고 다시 열어 버튼이 숨는지 확인한다.
- `/ja/`, `/ja/about/`, `/ja/projects/`, 프로젝트 상세 하나에서 푸터 연락 링크를 확인한다.
- `contact.yaml`을 일시적으로 고쳐(`@` 삭제, `name@`·`@example.com`으로 변경, `http://`로 변경, `github` URL 호스트 변경, `id` 중복, `linkedin` 항목 삭제) `pnpm build` 결과를 확인하고 원복한다.
- 브라우저 개발자 도구로 320px·375px·1280px, 라이트·다크, `prefers-reduced-motion` 에뮬레이션을 확인한다. 접근성 트리에서 제목 구조, 복사 버튼 이름, `aria-live` 알림, 아이콘 제외를 확인한다.

## 메모

- 아래는 지시서 작성 시 정한 기본안이다. 사용자(choi)가 구현 PR에서 바꿀 수 있다. 일본어 UI 문구는 사용자가 나중에 `src/i18n/ui.ts`에서 직접 고친다(T04~T06과 같음).
  - 라벨: 「メール」/`Email`, `GitHub`, `LinkedIn`. 숨긴 제목 「連絡方法」/`Contact methods`. 푸터 목록 이름 「連絡先」/`Contact`.
  - 복사 버튼: 「コピー」/`Copy`, 접근 가능한 이름 「メールアドレスをコピー」/`Copy email address`, 결과 「コピーしました」/`Copied`, 실패 「コピーできませんでした」/`Couldn't copy`.
- 메일 주소 노출: 사이트와 저장소가 Public이라 `mailto:` 주소는 수집 봇에 노출될 수 있다. 사용자가 이를 알고 `songyu0608@gmail.com`을 공개용 주소로 정했다(2026-10-30). 스팸이 늘면 난독화나 전용 주소를 검토하고, 단계 8 연락 폼이 생기면 메일 주소를 계속 보일지 다시 정한다.
- 단계 8 연락 폼은 이 페이지의 연락 수단 목록 아래(또는 위)에 섹션으로 더하는 것을 전제로 한다. 이번 구조는 폼이 없어도 완결되어야 한다.
- 원고 반영 순서: 연락처 원고를 받으면 `contact.yaml`의 값과 `placeholder`를 바꾸는 별도 PR로 처리한다.
