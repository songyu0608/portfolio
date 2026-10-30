# T03: 공통 레이아웃 (헤더·푸터·내비게이션·언어·테마 전환)

| 항목 | 값 |
| --- | --- |
| 단계 | 3 |
| 선행 작업 | T02 (PR #9) |
| 담당 | 미배정 |
| 상태 | todo |
| 브랜치 | `<agent>/T03-common-layout` |

## 목표

모든 페이지가 함께 쓰는 레이아웃(문서 골격, 헤더, 푸터, 내비게이션)과 언어·테마 전환을 만든다. 이 작업이 끝나면 단계 4의 페이지 지시서는 레이아웃을 다시 만들지 않고 본문 콘텐츠만 구현한다.

## 배경

- `docs/PLAN.md` §3 페이지 구성(공통: 반응형, 다크 모드, 접근성), §5 단계 3
- `docs/ARCHITECTURE.md` A4: `/ja`(기본), `/en` 경로 분리. `astro.config.mjs`는 `trailingSlash: 'always'`, `prefixDefaultLocale: true`
- `docs/DESIGN.md` §2: 테마 우선순위 규칙(`data-theme`이 시스템 설정보다 우선)과 토큰. §3: 명령 팔레트(단계 5)가 언어·테마 전환 명령을 재사용
- `AGENTS.md` §7: UI 문구는 컴포넌트에 하드코딩하지 않는다. 문구 구조는 T03에서 확정한다.
- 현재 `src/components/DesignPreview.astro`가 `<html>`부터 직접 출력하고, 글꼴 CSS도 이 컴포넌트에서 불러온다.
- PR #9 교차 리뷰에서 이월한 2건: 일본어 제목 `word-break: auto-phrase`의 Safari·Firefox 확인, 최신 화면 캡처 제공 ([Claude 리뷰](https://github.com/songyu0608/portfolio/pull/9#issuecomment-6520848363), [ChatGPT 리뷰](https://github.com/songyu0608/portfolio/pull/9#issuecomment-6521001565))

## 범위

포함:

1. **공통 레이아웃** `src/layouts/BaseLayout.astro`(이름은 조정 가능)
   - `<html lang>`, `<head>`(charset, viewport, 페이지별 `<title>`·description), 전역 CSS와 글꼴 CSS 로드, 본문 바로가기 링크, 헤더, `<main id="main">`, 푸터를 담는다.
   - props로 언어, 페이지 제목, 설명을 받는다. `<title>`은 「페이지 이름 | 사이트 이름」 형식, Home은 사이트 이름만 쓴다.
   - `DesignPreview.astro`는 `<html>`·`<head>`·`<body>`를 걷어내고 레이아웃의 `<main>` 안에 들어가는 본문 컴포넌트로 바꾼다. 페이지마다 `<main>` 랜드마크와 사이트 푸터가 하나씩만 있어야 한다.
     - 컴포넌트 안의 `<main class="preview container">`는 랜드마크가 아닌 요소(`<div>` 등)로 바꾼다.
     - 컴포넌트 안의 `<footer class="preview__footer">`는 사이트 푸터와 겹치지 않게 일반 안내 문단(`<p>` 등)으로 바꾸거나 제거한다. 남길 경우 문구가 현재 상태(공통 레이아웃 적용 후)와 맞게 고친다.
2. **헤더**
   - 사이트 이름(현재 언어의 Home 링크), 주 내비게이션, 언어 전환, 테마 전환 버튼.
   - 내비게이션 항목: About / Projects / Contact (Home은 사이트 이름 링크). 일본어 문구 안은 「経歴」「プロジェクト」「連絡先」이며, 구현 PR에서 사용자 확인을 받는다.
   - 현재 페이지 항목에 `aria-current="page"`를 붙이고 색 외의 표시(밑줄, 굵기 등)로도 구분한다. 프로젝트 상세(단계 4)에서는 Projects 항목이 현재 위치로 표시되도록 경로 접두어로 판정한다.
   - 햄버거 메뉴는 만들지 않는다. 항목이 적으므로 640px 미만에서는 줄을 나눠 모든 항목을 그대로 보여준다(`AGENTS.md` §7 "클릭하지 않아도 보임"). 320px 폭에서 가로 스크롤이 없어야 하고, 터치 대상은 최소 44×44px이다.
   - 스크롤 고정 여부는 구현 재량이다. 고정하면 페이지 내 앵커 이동 시 제목이 가려지지 않게 `scroll-padding-top`을 맞춘다.
3. **언어 전환**
   - 현재 페이지와 같은 페이지의 다른 언어 경로로 이동하는 일반 링크다(`/ja/about/` ↔ `/en/about/`). JS가 필요 없어야 한다.
   - 「日本語」「English」를 모두 표시하고, 현재 언어는 링크가 아닌 텍스트로 구분한다. 다른 언어 링크에는 `lang`, `hreflang` 속성을 붙인다.
   - 경로 변환은 `src/i18n/`의 함수 하나로 처리하고, 가능하면 Astro의 `astro:i18n` 도우미(`getRelativeLocaleUrl` 등)를 사용한다. 끝 슬래시 규칙(`trailingSlash: 'always'`)을 지킨다.
   - 브라우저 언어 자동 감지·리다이렉트는 하지 않는다. `/` → `/ja/` 처리는 현행 유지(HTTP 301 전환은 단계 8 이월 항목).
4. **테마 전환**
   - 라이트·다크 2단계 토글 버튼(`<button type="button">`). 누르면 `<html data-theme>`를 바꾸고 선택을 `localStorage`에 저장한다. 저장된 값이 없으면 시스템 설정을 따르며, 그동안 시스템 설정이 바뀌면 버튼 상태도 따라간다.
   - 첫 화면 깜빡임을 막기 위해 `<head>` 안의 작은 인라인 스크립트(`is:inline`)로 첫 렌더 전에 저장된 값을 적용한다. `localStorage` 접근은 `try/catch`로 감싸고, 실패하면 시스템 설정을 따른다.
   - 버튼의 접근 가능한 이름과 상태(`aria-pressed` 또는 상태를 담은 이름)를 일본어·영어로 제공한다. 아이콘만 쓰면 시각적으로 숨긴 텍스트를 함께 둔다.
   - JS가 꺼져 있으면 동작하지 않는 버튼을 보여주지 않는다(시스템 설정만 적용).
   - 테마 읽기·쓰기는 `src/scripts/theme.ts`(이름 조정 가능) 한 곳에 두어 단계 5의 명령 팔레트가 import해서 쓸 수 있게 한다. 인라인 스크립트와 공유하는 저장 키 이름은 두 곳 모두에 주석으로 연결한다.
   - React island는 쓰지 않는다. 클라이언트 JS는 테마 관련 스크립트만 둔다.
5. **푸터**: 저작권 표기(빌드 연도 + 사이트 이름)를 둔다. 연락처 링크는 원고(`docs/CONTENT.md` 연락처) 수집 후 Contact 지시서에서 추가하므로, 이번에는 자리만 고려한다.
6. **페이지 골격**: `/ja/`, `/en/` Home과 About·Projects·Contact 준비 페이지(`/ja/about/`, `/ja/projects/`, `/ja/contact/` 및 `/en/` 대응 경로)를 레이아웃으로 만든다. 준비 페이지는 제목(h1)과 준비 중 문구만 둔다. Home에는 T04에서 교체할 때까지 T02 확인 화면을 둔다.
7. **문구 구조 확정**
   - UI 문구(내비게이션, 버튼, 접근성 문구, 페이지 제목)는 `src/i18n/`에 둔다. 일본어 문구를 기준 타입으로 삼아, 영어에 키가 빠지거나 남으면 `pnpm check`가 실패하게 한다.
   - 페이지 본문 콘텐츠(경력, 프로젝트 등)는 `src/content/`(Astro content collections)에 둔다는 위치 규칙만 정한다. 컬렉션 스키마는 각 페이지 지시서에서 정한다.
   - 언어별 페이지 파일 방식(`src/pages/ja/about.astro`, `src/pages/en/about.astro`가 같은 컴포넌트 호출)과 동적 경로 방식(`src/pages/[locale]/about.astro` + `getStaticPaths`) 중 하나를 고른다. 기본안은 현재 구조를 잇는 언어별 페이지 파일 방식이다. 선택과 이유를 `docs/ARCHITECTURE.md` §2에 기록한다.
8. **이월 항목 확인**
   - 일본어 제목 줄바꿈: `word-break: auto-phrase`가 Chromium·Firefox·WebKit(Safari)에서 어떻게 표시되는지 320px·1280px에서 확인한다. 지원 여부는 [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/word-break) 등 공식 자료로 재확인한다. 미지원 브라우저에서 사이트 이름·페이지 제목이 단어 중간에서 어색하게 끊기면 대안(`<wbr>`, 문절 단위 `inline-block` 등)을 PR에 제안한다. 새 의존성(예: BudouX)이 필요한 대안은 구현하지 않고 제안만 한다. 결과는 `docs/DESIGN.md` §2 타이포그래피에 적는다.
   - 화면 캡처: PR 본문에 최신 커밋 기준 캡처를 싣는다(아래 완료 조건). T02 캡처(`docs/screenshots/T02-*`)는 이력으로 두고 교체하지 않는다.
9. **문서**: `docs/DESIGN.md`에 헤더·푸터·언어·테마 전환 규칙(배치, 전환점별 모습, 저장 키, 상태 표시)을 추가하고, `docs/ARCHITECTURE.md` §2 디렉터리 구조를 갱신한다.

제외:

- 각 페이지의 실제 콘텐츠와 content collection 스키마 (T04 이후, `docs/CONTENT.md` 원고 수집 후)
- 명령 팔레트·터미널 등 인터랙션 컨셉 1~5 (단계 5)
- canonical, `hreflang` alternate 링크, OG 이미지, sitemap, 404 페이지 (단계 6. 도메인이 정해지지 않아 `site` 설정이 없음)
- 글꼴 CSS 크기 최적화 (단계 6 이월 항목. 이번 작업에서 글꼴 CSS를 더 늘리지 않는다)
- `/` → `/ja/` HTTP 301 (단계 8 이월 항목)
- 디자인 토큰 값 변경 (T02에서 확정)

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `src/layouts/**`, `src/components/**`, `src/scripts/**`, `src/i18n/**`
- `src/pages/ja/**`, `src/pages/en/**` (동적 경로를 고르면 `src/pages/[locale]/**`). `src/pages/index.astro`는 바꾸지 않는다.
- `src/styles/global.css` 및 레이아웃용 새 CSS 파일. `src/styles/tokens.css`의 값은 바꾸지 않는다(새 토큰 추가는 이유를 PR에 적는다).
- `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/PLAN.md`, `docs/tasks/T03-common-layout.md`
- `docs/screenshots/T03-*` (캡처를 저장소에 넣을 경우만)
- `astro.config.mjs` (i18n 도우미 사용에 설정 변경이 꼭 필요할 때만, 이유를 PR에 적는다)
- 새 의존성은 추가하지 않는다. 필요하면 PR에 이유·크기를 적고 사용자 확인을 받는다.

## 완료 조건

- [ ] `/ja/`, `/en/`과 About·Projects·Contact 준비 페이지(총 8개)가 같은 레이아웃으로 빌드되고, 각 페이지의 `<html lang>`과 `<title>`이 언어에 맞다.
- [ ] 8개 페이지 모두 `<main>` 랜드마크가 하나이고 사이트 푸터(`<footer>`)가 중복되지 않는다(확인 화면이 있는 Home 포함).
- [ ] 8개 페이지 모두에서 언어 전환 링크가 같은 페이지의 다른 언어 경로(끝 슬래시 포함)로 이동한다. 내비게이션 현재 위치에 `aria-current="page"`가 붙는다.
- [ ] 테마: 저장 값 없음 → 시스템 설정, 버튼으로 바꾼 값은 새로고침·페이지 이동 후에도 유지된다. 시스템 다크 + 저장 값 light로 새로고침할 때 다크 화면이 먼저 보이지 않는다. `localStorage` 접근이 막혀도 오류 없이 시스템 설정으로 표시된다.
- [ ] JS를 끈 상태에서 내용·내비게이션·언어 전환이 동작하고, 동작하지 않는 테마 버튼이 보이지 않는다.
- [ ] 키보드만으로 본문 바로가기 → 사이트 이름 → 내비게이션 → 언어 전환 → 테마 버튼 순서로 이동·조작할 수 있고, 포커스 표시가 보인다. 본문 바로가기는 포커스를 받을 때 화면에 나타난다.
- [ ] ja/en × 320px·375px·1280px × 라이트·다크에서 가로 스크롤이 없고 헤더 항목이 모두 보인다. 터치 대상이 44×44px 이상이다.
- [ ] 헤더·푸터의 새 색 조합(현재 위치 표시, 버튼 경계 등)이 WCAG 2.2 AA 대비(글자 4.5:1, UI 경계·포커스 3:1)를 라이트·다크 모두에서 충족하고, 수치를 PR에 적는다.
- [ ] `prefers-reduced-motion: reduce`에서 레이아웃의 장식 전환 효과가 꺼진다.
- [ ] 화면 문구가 컴포넌트에 하드코딩되어 있지 않다. 영어 문구 키가 빠지면 `pnpm check`가 실패한다(실패를 한 번 재현해 PR에 적는다).
- [ ] 빌드 결과에 React 런타임이 포함되지 않고, 클라이언트 JS는 테마 관련 스크립트뿐이다. 그 전송 크기를 PR에 적는다.
- [ ] `auto-phrase` 확인 결과(브라우저별 지원 여부, 320px·1280px 표시, 확인 못한 환경)가 PR과 `docs/DESIGN.md`에 있다.
- [ ] PR 본문에 최신 커밋 기준 캡처가 있다: ja 라이트 320px, ja 다크 1280px, en 라이트 1280px, en 다크 320px 이상.
- [ ] `docs/DESIGN.md`(레이아웃·전환 규칙), `docs/ARCHITECTURE.md` §2(디렉터리, 페이지 파일 방식, 문구 위치 규칙)가 갱신되어 있다.
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`와 GitHub CI가 통과한다.
- [ ] `docs/PLAN.md`의 진행 상태와 작업 지시서 표 갱신, 비밀 값 미포함.

## 확인 방법

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm check && pnpm build
pnpm preview
```

- `dist/`에 8개 페이지(`ja`, `en` × Home·about·projects·contact)의 `index.html`이 있는지 확인한다.
- 각 페이지에서 언어 전환·내비게이션 링크의 이동 경로, `aria-current`를 확인한다.
- 시스템 라이트·다크 × 저장 값(없음, light, dark) 조합으로 새로고침해 첫 화면 테마를 확인한다. 브라우저 개발자 도구에서 JS 비활성화, `prefers-reduced-motion` 에뮬레이션도 확인한다.
- Tab 키로 포커스 순서를 확인한다.
- Playwright를 쓸 수 있으면 Chromium·Firefox·WebKit에서 320px·1280px 화면을 찍어 일본어 제목 줄바꿈을 비교한다. 쓸 수 없는 브라우저는 PR에 "미확인"으로 적는다.

## 메모

- 아래는 지시서 작성 시 정한 기본안이다. 사용자(choi)가 구현 PR에서 바꿀 수 있다.
  - 테마 버튼은 라이트·다크 2단계. "시스템 설정으로 되돌리기"는 넣지 않는다(필요하면 단계 5 명령 팔레트에서 검토).
  - 모바일에서도 햄버거 메뉴 없이 모든 항목을 표시한다.
  - 내비게이션 일본어 문구 안: 「経歴」「プロジェクト」「連絡先」.
- 사이트 이름 표기(일본어 漢字/カナ, 영어)는 원고 미수집이다(`docs/CONTENT.md`). 이번에는 `src/i18n/`의 현재 값(`choi`)을 쓰고, 원고를 받으면 문구 파일만 바꾸면 되게 한다.
- 테마 저장 키는 단계 5 명령 팔레트와 공유한다. 이름을 바꾸면 기존 방문자의 선택이 사라지므로 한 번 정하면 유지한다.
- 레이아웃이 글꼴 CSS를 불러오는 위치를 옮기더라도 `/ja/`, `/en/`에서 받는 글꼴 CSS 양이 T02보다 늘지 않게 한다(PLAN §8 T02 이월 항목의 기준값: 357,868B).
