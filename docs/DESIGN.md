# DESIGN — 디자인 토큰과 인터랙션 규칙

단계 2(T02)에서 정한 디자인 토큰과 채택된 인터랙션 컨셉을 정의한다. 색상·글꼴은 2026-10-30 사용자가 선택한 시안 E「Blue」·시안 3「IBM Plex」를 따른다.

## 1. 디자인 원칙

- 채용 담당자가 30초 안에 "누구이고, 무엇을 잘하고, 어떻게 연락하는지"를 알 수 있어야 한다.
- 핵심 정보는 클릭하지 않아도 보인다. 효과는 방문자가 원래 하는 행동(스크롤, 카드 클릭, 마우스 이동)에 붙인다.
- 플립처럼 정보를 뒷면에 숨기는 효과는 쓰지 않는다.
- 백엔드 엔지니어라는 정체성을 터미널·모노스페이스 요소로 은은하게 드러내되, 가독성을 해치지 않는다.
- 반응형(모바일 우선), 다크 모드 지원.

## 2. 디자인 토큰

실제 CSS 변수는 `src/styles/tokens.css`에 둔다. 색을 바꾸려면 이 파일의 라이트·다크 값을 함께 바꾼다. 회사별 강조색은 만들지 않는다.

### 색상

| 의미 | 라이트 | 다크 | 사용처 |
| --- | --- | --- | --- |
| background | `#F7F9FC` | `#0B0F17` | 페이지 바탕 |
| surface | `#FFFFFF` | `#141A24` | 카드·정보 면 |
| text | `#121619` | `#E8ECF2` | 본문·제목 |
| text-muted | `#525A63` | `#9CA6B4` | 설명·보조 라벨, 테두리 태그 |
| border | `#DDE1E6` | `#26303D` | 장식용 구분선. UI 식별 경계에 사용하지 않음 |
| accent | `#0F62FE` | `#78A9FF` | 링크·포커스·채운 주력 태그 |
| on-accent | `#FFFFFF` | `#0B0F17` | 강조색 위 글자 |
| success | `#0B6B3A` | `#6EE7A2` | 성공 상태 글자 |
| warning | `#8A4B00` | `#FFB454` | 경고 상태 글자 |
| error | `#B42318` | `#FF8F8F` | 오류 상태 글자 |

기본 테마는 `prefers-color-scheme`을 따른다. `<html data-theme="light">` 또는 `<html data-theme="dark">`가 있으면 그 값이 시스템 설정보다 우선한다. 수동 전환 UI(헤더의 테마 버튼)와 저장 규칙은 §4.

대비(WCAG 2.x 상대 휘도 공식으로 계산, 단위 `:1`, 값은 `background / surface` 순서). 색을 바꿀 때는 이 표를 다시 계산해 갱신한다. 일반 텍스트 4.5:1, UI 경계·포커스 3:1 이상을 유지한다.

| 조합 | 라이트 | 다크 |
| --- | --- | --- |
| text | 17.25 / 18.19 | 16.18 / 14.72 |
| text-muted (보조 글자·태그 경계) | 6.63 / 7.00 | 7.79 / 7.09 |
| accent (링크·포커스) | 4.74 / 5.00 | 8.14 / 7.41 |
| success / warning / error | 6.26 / 6.45 / 6.23 (background) | 12.43 / 10.88 / 8.75 (background) |
| on-accent / accent (채운 태그·주 버튼) | 5.00 | 8.14 |

라이트 `accent`의 background 대비 4.74:1은 기준 4.5:1에 가깝다. accent를 바꾸거나 background보다 어두운 면에 링크를 둘 때는 다시 측정한다.

시안 E의 핵심 색은 사용자가 선택했다. 상태색은 이 시안에 없어서 같은 배경에서 읽히는 색으로 T02에서 보충했다. `accent` 두 값은 [IBM Carbon의 Blue 60/40](https://www.carbondesignsystem.com/building-blocks/foundations/color/tokens)과 일치한다. 전체 테마는 Carbon 테마를 복제한 것이 아니다.

### 타이포그래피

- 본문·제목: IBM Plex Sans JP 400/700. 코드·보조 라벨: IBM Plex Mono 400. [IBM Plex](https://github.com/IBM/plex)는 SIL OFL 라이선스다.
- 웹에서는 Fontsource 패키지의 문자 범위별 서브셋을 자체 호스팅하고 `font-display: swap`을 사용한다. 외부 글꼴 도메인 요청은 없다. 일본어 대체 글꼴은 Hiragino Sans, Yu Gothic UI, Meiryo 순서다. 글꼴 요청이 실패해도 본문을 읽을 수 있어야 한다.
- 본문 16px. 줄높이 일본어 1.8, 영어 1.65. 작은 글자 14px, 라벨 12px. 제목은 h1 32~52px, h2 24~32px, h3 18px이며 제목 줄높이는 1.2다. 일본어 제목은 `word-break: auto-phrase`로 문절 단위 줄바꿈을 한다(지원하지 않는 브라우저는 기본 줄바꿈). 한 줄을 넘을 수 있는 일본어 콘텐츠 문구는 아래 T04 방식으로 문절을 나눈다. 본문 최대 줄 길이는 `66ch`다.
- `word-break: auto-phrase` 지원 현황(2026-10-30 확인, [web-features](https://web-platform-dx.github.io/web-features-explorer/features/word-break-auto-phrase)·[MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/word-break)): Chrome·Edge 119 이상만 지원(Baseline "Limited availability"). Firefox·Safari(iOS 포함)는 미지원이며 `word-break: normal`과 같은 기본 줄바꿈으로 표시된다.
  - T03 확인(Chromium, 320px·375px·1280px): 사이트 이름(`choi`)과 준비 페이지 제목(経歴·プロジェクト·連絡先)은 한 줄이라 차이가 없다. Home 확인 화면 h1 「読みやすさを、設計する。」는 auto-phrase에서 「読みやすさを、/設計する。」, 기본 줄바꿈에서는 375px·1280px에서 「読みやすさを、設計/する。」로 단어 중간에서 끊긴다.
  - Firefox·WebKit 실제 화면은 확인하지 못했다(작업 환경에 해당 브라우저 없음). 위 기본 줄바꿈 결과는 Chromium에서 `word-break: normal`로 바꿔 근사한 것이다.
  - `text-wrap: balance`는 대안이 되지 않는다. 같은 h1이 「読みやすさ/を、設計する。」로 더 어색하게 끊겼다.
  - T04 결정: 한 줄을 넘을 수 있는 일본어 제목·소개 문구(Home 한 줄 소개, 프로젝트 카드 제목)는 콘텐츠 파일에 문절 단위 배열로 쓰고, `src/components/Phrases.astro`가 문절마다 인라인 span으로 감싸 출력한다. 감싸는 span에 `word-break: keep-all`(문절 안 줄바꿈 금지)과 `overflow-wrap: anywhere`(문절 하나가 줄보다 길 때 넘침 방지)를 주고, 마지막이 아닌 문절 끝에 CSS 생성 콘텐츠로 폭 없는 공백(`::after { content: '\200B' }`)을 넣어 문절 사이에서만 줄이 바뀌게 한다. `auto-phrase`에 의존하지 않으므로 Firefox·Safari에서도 같은 규칙이 적용된다. 영어는 일반 문자열이다. 의존성을 추가하는 [BudouX](https://github.com/google/budoux)는 쓰지 않는다.
  - 다른 방식을 쓰지 않은 이유(Chromium 접근성 트리로 확인): 문절마다 `display: inline-block` span으로 감싸거나 문절 사이에 `<wbr>`을 넣으면, 제목의 접근 가능한 이름이 「社内データ 連携基盤の 構築（仮）」처럼 문절 사이에 공백이 들어간다. 본문에 U+200B를 직접 넣으면 이름은 깨끗하지만 복사한 글자에 U+200B가 섞인다. CSS 생성 콘텐츠 방식은 이름에 일반 공백이 없고(U+200B만 포함), 복사·페이지 내 검색 결과는 원문과 같다. 실제 스크린 리더(VoiceOver, NVDA)의 읽기는 확인하지 못했다.
  - T04 확인(Chromium, 일본어 Home). `/`는 줄바꿈 위치다. 구현 결과는 `auto-phrase`를 켠 상태와 `word-break: normal`로 근사한 상태(Firefox·Safari 근사)에서 같았고, 아래 "문절 처리 없음"은 같은 문구를 나누지 않고 `word-break: normal`로 표시한 비교용이다.

    | 폭 | 문구 | 구현(문절 처리) | 문절 처리 없음(normal) |
    | --- | --- | --- | --- |
    | 320px | 한 줄 소개 | 止まらないバックエンドを、/設計から運用まで一貫して/担当します。（仮） | 止まらないバックエンドを、設計か/ら運用まで一貫して担当します。/（仮） |
    | 320px | 카드 제목 | 認証サービスの分離と/無停止移行（仮） | 認証サービスの分離と無停止/移行（仮） |
    | 375px | 한 줄 소개 | 止まらないバックエンドを、設計から/運用まで一貫して担当します。（仮） | 止まらないバックエンドを、設計から運用/まで一貫して担当します。（仮） |
    | 1280px | 전체 | 모두 한 줄 | 모두 한 줄 |

  - `keep-all`에서도 여는 괄호 앞은 줄바꿈 위치라서 「構築/（仮）」처럼 임시 표식이 다음 줄로 갈 수 있다. 표식은 원고 반영 시 사라지므로 따로 처리하지 않는다.
  - Firefox·WebKit 실제 화면은 T04에서도 확인하지 못했다(작업 환경에 Chromium만 있음). 단계 7 또는 해당 브라우저를 쓸 수 있는 환경에서 확인한다(PLAN §8).
- 모노스페이스는 코드·작은 라벨에만 쓴다. 일본어 긴 문장에는 사용하지 않는다.

### 간격·크기·모션

| 분류 | 값 | 이유 |
| --- | --- | --- |
| 간격 | 4, 8, 12, 16, 24, 32, 48, 64px | 4px 단위로 일관성 유지 |
| 본문 최대 폭 | 1120px (`70rem`) | 넓은 화면에서도 콘텐츠가 흩어지지 않게 함 |
| 반응형 전환점 | 640px (`40rem`), 1024px (`64rem`) | 640px부터 본문 2열·색상 3열, 1024px부터 색상 5열. CSS 미디어 쿼리에서 직접 사용 |
| 모서리 | 버튼 8px, 카드 12px, 태그 999px | 시안의 부드러운 면과 구분 |
| 그림자 | 라이트 `0 12px 32px rgb(18 22 25 / 8%)`, 다크 `0 12px 32px rgb(0 0 0 / 25%)` | 카드 깊이를 약하게 표현. 경계는 색만 의존하지 않음 |
| 모션 | 짧은 상태 변화 120ms, 보통 변화 200ms; `cubic-bezier(0.2, 0, 0, 1)` | 상태 피드백이 내용을 방해하지 않게 함 |

포커스 표시는 `2px solid accent`와 `3px` 바깥 간격을 기본으로 한다. `prefers-reduced-motion: reduce`에서는 장식 전환 효과를 제거한다. 키보드 포커스와 상태 의미는 그대로 유지한다.

## 3. 인터랙션 컨셉 (1~5 전부 채택)

참고용 시안: claude.ai 인터랙션 컨셉 캔버스(비공개 링크, 소유자 계정에서만 열림).

| # | 컨셉 | 성격 | 위치 | 규칙 |
| --- | --- | --- | --- | --- |
| 1 | Hero 문구 디코딩 + 日本語/English 전환 | 모두가 봄 | Home 상단 | 디코딩이 끝나기 전에도 최종 문구가 스크린 리더와 SEO에 노출되어야 함 |
| 2 | 프로젝트 카드 틸트 + 클릭 시 상세로 전환 | 핵심 동선 | Home, Projects | 카드 전체가 링크. 마우스 오버 시 떠오름, "詳細 →" 표시. 터치 기기에서는 틸트 없음 |
| 3 | 터미널 모드 (추천 명령 버튼 포함) | 이스터에그 | 전역 | 핵심 정보를 여기에만 두지 않음. 3·4는 명령 목록을 공유 |
| 4 | 명령 팔레트 (⌘K / Ctrl+K) | 보조 탐색 | 전역 | 페이지 이동, 언어 전환, 테마 전환. 3과 같은 명령 정의를 사용 |
| 5 | 스크롤 경력 타임라인 | 모두가 봄 | About | 스크롤 진행에 따라 항목 강조. 애니메이션 없이도 전체 타임라인이 읽힘 |

### 공통 구현 규칙

- **명령 목록 공유**: 3(터미널)과 4(명령 팔레트)는 하나의 명령 정의 모듈(예: `src/components/interactive/commands.ts`)을 함께 쓴다.
- **지연 로딩**: 3·4는 첫 화면에 필요 없으므로 사용자가 열 때(단축키, 버튼) 동적 import한다. 1·2는 React island 없이 Astro `<script>`(번들된 작은 모듈)와 CSS View Transitions로 만든다(T08). 5는 JS 없이 CSS 스크롤 기반 애니메이션(`animation-timeline: view()`)으로 만들고, 지원하지 않는 브라우저는 효과 없는 최종 상태다(T09).
- **지시서 나눔**: T08 = 1·2, T09 = 5, T10 = 3·4 (2026-10-31 사용자 결정).
- **reduced-motion**: `prefers-reduced-motion: reduce`이면 1·2·5의 애니메이션을 끄고 최종 상태를 바로 보여준다. 3·4는 기능은 유지하고 전환 효과만 끈다.
- **키보드**: 모든 인터랙션은 키보드로도 동작한다. 팔레트·터미널은 Esc로 닫고, 닫으면 포커스를 원래 위치로 되돌린다.
- **측정**: 배포 후 방문 분석으로 카드 클릭률을 확인하고 효과를 조정한다 (단계 9).

## 4. 공통 레이아웃 (T03)

모든 페이지는 `src/layouts/BaseLayout.astro`를 쓴다. 구성 순서: 본문 바로가기 → 헤더(사이트 이름, 주 내비게이션, 언어 전환, 테마 버튼) → `<main id="main">` → 푸터. 키보드 포커스도 이 순서로 이동한다.

### 헤더

| 폭 | 배치 |
| --- | --- |
| 640px 미만 | 줄바꿈 배치. 1줄: 사이트 이름 + 내비게이션, 2줄: 언어 전환 + 테마 버튼(오른쪽 정렬). 항목 사이 간격 8px, 내비게이션 좌우 여백 8px. 글꼴이 대체 글꼴로 바뀌어 폭이 늘면 3줄로 늘어날 뿐 가로 스크롤은 생기지 않는다 |
| 640px 이상 | 한 줄. 사이트 이름은 왼쪽, 내비게이션·언어 전환·테마 버튼은 오른쪽. 항목 사이 간격 16px, 내비게이션 좌우 여백 12px |

- 햄버거 메뉴는 쓰지 않는다. 모든 항목을 항상 보여준다.
- 스크롤 고정은 하지 않는다. 640px 미만에서 헤더가 2줄이라 고정하면 본문 영역이 줄어들기 때문이다. 고정하지 않으므로 `scroll-padding-top`도 필요 없다. 나중에 고정하면 헤더 높이만큼 `scroll-padding-top`을 준다.
- 링크·버튼의 터치 대상은 최소 44×44px이다.
- 헤더 아래 구분선은 장식이므로 `border` 색을 쓴다.

### 내비게이션

- 항목: 経歴 / プロジェクト / 連絡先 (영어 About / Projects / Contact, 2026-10-30 사용자 확인). Home은 사이트 이름 링크다. 문구는 `src/i18n/ui.ts`의 `pages.*.name`이며 페이지 제목(h1, `<title>`)과 같은 값을 쓴다.
- 기본 링크는 `text-muted` 색, 밑줄 없음. 마우스를 올리면 `text` 색과 1px 밑줄.
- 현재 위치는 색 외에 굵기(700)와 2px `accent` 밑줄로 구분한다. 그 페이지 자체면 `aria-current="page"`, 하위 경로(예: 단계 4의 프로젝트 상세 `/ja/projects/<slug>/`)면 `aria-current="true"`를 붙이고 겉모습은 같다. 판정은 경로 접두어 비교다.
- Home(`/ja/`, `/en/`)에서는 내비게이션 항목 대신 사이트 이름 링크에 `aria-current="page"`와 같은 2px `accent` 밑줄을 붙인다(사이트 이름은 원래 굵은 글자).

### 언어 전환

- 「日本語」「English」를 항상 그 언어 표기로 모두 보여준다. 현재 언어는 링크가 아닌 굵은 `text` 색 글자(`aria-current="true"`), 다른 언어는 `accent` 색 밑줄 링크(`lang`, `hreflang` 포함)다. 사이의 세로선은 장식이다.
- 같은 페이지의 다른 언어 경로로 가는 일반 링크라 JS가 필요 없다. 경로 변환은 `src/i18n/paths.ts`의 `switchLocalePath` 하나로 한다.
- 브라우저 언어 자동 감지·리다이렉트는 하지 않는다.

### 테마 버튼

- 라이트·다크 2단계 토글. 접근 가능한 이름은 「ダークモード」/「Dark mode」(시각적으로 숨긴 텍스트), 상태는 `aria-pressed`(다크면 `true`)로 전한다.
- 아이콘은 적용 중인 테마를 나타낸다(라이트: 해, 다크: 달). 아이콘 표시는 CSS가 `data-theme`·시스템 설정을 보고 정하므로 첫 화면에서 아이콘이 바뀌어 보이지 않는다. 경계는 1px `text-muted`, 마우스를 올리면 `surface` 배경.
- 우선순위: 저장된 선택(`localStorage`) → 없으면 시스템 설정. 저장 값이 없는 동안 시스템 설정이 바뀌면 화면과 `aria-pressed`가 따라간다. "시스템 설정으로 되돌리기"는 없다(단계 5 명령 팔레트에서 검토).
- 저장 키: `theme`, 값 `light` / `dark`. 단계 5 명령 팔레트와 공유하므로 이름을 바꾸지 않는다. 키는 `src/scripts/theme.ts`의 `THEME_STORAGE_KEY` 한 곳에 있고, `<head>` 인라인 스크립트는 `define:vars`로 같은 값을 받는다.
- 첫 렌더 전 적용: `<head>`의 인라인 스크립트가 저장 값을 `<html data-theme>`에 넣는다. `localStorage` 접근이 막히면 아무것도 하지 않아 시스템 설정을 따르고, 버튼으로 바꾼 값은 그 페이지에서만 유지된다.
- JS가 꺼져 있으면 버튼을 숨긴다(인라인 스크립트가 붙이는 `html.js` 클래스가 있을 때만 표시). 이때는 시스템 설정만 적용된다.
- 테마 읽기·쓰기 함수(`getTheme`, `setTheme`, `toggleTheme`, `onThemeChange`)는 `src/scripts/theme.ts`에 있다. 다른 곳에서 테마를 바꿀 때도 이 함수를 쓴다.

### 본문 바로가기·푸터

- 본문 바로가기는 평소 화면 위로 숨겨 두고, 포커스를 받으면 왼쪽 위에 `accent` 배경 버튼 모양으로 나타난다.
- 푸터: 연락 링크 목록(「メール」 → `contact.yaml`의 `links` 순서. 텍스트 링크 14px, text-muted, 밑줄, 높이 44px)과 저작권 표기(「© 빌드 연도 사이트 이름」). 640px 미만은 연락 링크가 위·저작권이 아래, 이상은 왼쪽 저작권·오른쪽 연락 링크다(T07). DOM 순서는 연락 링크가 먼저이고 640px 이상에서 `row-reverse`로 배치한다. 목록 이름은 「連絡先」/`Contact`. 값이 임시이면 서비스 이름 뒤에 「（仮）」 표식을 붙인다. 위 구분선은 장식이다.

### 대비 (헤더·푸터, T03에서 Chromium 계산 색으로 측정)

모두 기존 토큰 조합이다. 단위 `:1`, 바탕은 `background`.

| 요소 | 조합 | 라이트 | 다크 |
| --- | --- | --- | --- |
| 사이트 이름, 현재 내비게이션·현재 언어 글자 | text | 17.25 | 16.18 |
| 내비게이션 링크, 푸터 글자 | text-muted | 6.63 | 7.79 |
| 언어 링크 | accent | 4.74 | 8.14 |
| 현재 위치 밑줄(UI) | accent | 4.74 | 8.14 |
| 테마 버튼 아이콘 / 마우스를 올렸을 때(surface 위) | text | 17.25 / 18.19 | 16.18 / 14.72 |
| 테마 버튼 경계(UI) | text-muted | 6.63 | 7.79 |
| 포커스 표시(UI) | accent | 4.74 | 8.14 |
| 본문 바로가기 글자 / 바탕과의 경계 | on-accent·accent / accent | 5.00 / 4.74 | 8.14 / 8.14 |

### 모션

내비게이션 링크 색, 테마 버튼 배경의 120ms 전환만 있다. `prefers-reduced-motion: reduce`에서는 끈다.

## 5. Home (T04)

`src/components/pages/HomePage.astro`. 콘텐츠 값은 `src/content/`(조회는 `src/lib/content.ts`), UI 문구는 `src/i18n/ui.ts`의 `home.*`·`skill.*`·`project.*`에서 가져온다.

### 섹션 구성

순서: 히어로 → 핵심 기술 → 대표 프로젝트. 섹션마다 `<section aria-labelledby>`이고 제목은 h1(히어로) → h2(섹션) → h3(카드)다.

| 섹션 | 구성 |
| --- | --- |
| 히어로 | h1 이름 → 직함(accent, 18px, 700) → 한 줄 소개(18~22px, `clamp(1.125rem, 1rem + 0.5vw, 1.375rem)`, 줄높이 1.6, 최대 34em) → 행동 링크 2개(「プロジェクトを見る」 채운 버튼 → Projects, 「連絡する」 테두리 버튼 → Contact) |
| 핵심 기술 | h2 「主な技術」 + 범례 문구(「塗りつぶしたタグは主軸の技術です。」) + 태그 목록(`<ul>`). 주력 기술은 채운 태그(`.tag--featured`)와 시각적으로 숨긴 「主軸：」, 나머지는 테두리 태그(`.tag`). 순서는 콘텐츠의 `homeOrder` |
| 대표 프로젝트 | h2 「代表プロジェクト」(`project.featured`, Projects와 공용) + 카드 목록(`<ul>` 안의 `<article>`) + 끝에 「すべてのプロジェクト →」 링크 하나(→ Projects) |

- h1은 이름이다. 30초 안에 "누구인지"를 먼저 알리고(§1), 문서 제목(`<title>` = 사이트 이름)과 맞추기 위함이다. 한 줄 소개는 h1 바로 아래 문단이며, 컨셉 1 디코딩(T08, 아래 "한 줄 소개 디코딩")은 이 문단에만 적용한다. 최종 문구는 처음부터 HTML에 있다.
- 히어로에는 연락처를 직접 늘어놓지 않고 「連絡する」 버튼(→ Contact)만 둔다. 연락 링크는 모든 페이지의 푸터에 있다(§4, T07 사용자 결정). 아바타·사진은 없다.

### 전환점별 배치

| 폭 | 배치 |
| --- | --- |
| 640px 미만 | 히어로 위 여백 48px. 카드 1열 |
| 640px 이상 | 히어로 위 여백 64px. 카드 2열 |
| 1024px 이상 | 카드가 3개일 때만 3열(`data-count="3"`). 2개면 2열 유지 |

- 섹션 사이 64px, 섹션 제목과 본문 사이 24px, 카드 사이 24px.
- 375×667px에서 이름·직함·한 줄 소개와 행동 링크가 첫 화면에 들어온다(T04 확인: 행동 링크 아래 끝 368px).

### 프로젝트 카드 (`src/components/ProjectCard.astro`)

- 위에서부터 제목(h3, 문절 처리) → 한 줄 요약(14px, text-muted) → 구분선(border) → 정보 목록(`<dl>`): 期間(모노스페이스) / 担当工程(§7 `PhaseList`) / 役割 / 成果(목록, 700, accent 표시점) / 技術(테두리 태그 목록) → 「詳細を見る →」(14px, 700, accent, 카드 아래 끝). T06에서 担当工程과 「詳細を見る →」를 더했다.
- 라벨(`<dt>`)은 값 위에 둔다(12px, 700, text-muted). 3열 카드와 320px 화면에서 값이 좁아지지 않게 하기 위함이다. 일본어 라벨은 모노스페이스를 쓰지 않는다.
- 모든 정보를 펼쳐 보인다. 같은 줄의 카드 높이는 맞추고, 내용은 위에서부터 채운다.
- 카드 전체가 프로젝트 상세 링크다(T06). 링크는 제목(h3) 안의 `<a>` 하나이고 `::after`를 카드 크기로 늘려 카드 어디를 눌러도 상세로 간다. 카드 전체를 `<a>`로 감싸면 링크 이름이 카드 전문이 되어 길어지기 때문이다. 링크 이름은 제목뿐이고, Tab은 카드마다 한 번만 멈춘다. 「詳細を見る →」는 같은 곳을 가리키는 시각적 안내라 `aria-hidden="true"`다. 늘린 링크가 카드 위를 덮으므로 카드 안 글자를 드래그로 선택할 수 없다(채용 담당자가 복사할 정보는 상세에도 있다).
- 포커스 링(2px accent, 간격 3px)은 링크 글자가 아니라 `::after`(카드 전체)에 그린다. 마우스 오버 시 카드 경계가 accent로 바뀌고(200ms) 제목에 밑줄이 생긴다. 틸트와 상세 전환(컨셉 2, T08)은 아래 "카드 틸트"와 §7 모션 "카드 → 상세 전환".
- 짧은 카드(`variant="compact"`, Projects 「その他のプロジェクト」): 成果를 빼고 期間·役割 → 担当工程 → 技術 순서다. 640px 이상에서 期間·役割를 한 줄 2칸에 둔다. 화면 순서와 HTML 순서는 같다(CSS `order`를 쓰지 않음).
- 카드 안 기술 태그는 주력 표시를 하지 않는다(주력 표시는 핵심 기술·About 기술 스택에서만).

### 대비 (Home)

새 토큰 조합은 없다. 모두 §2 대비 표의 기존 조합이다. 단위 `:1`.

| 요소 | 조합 | 라이트 | 다크 |
| --- | --- | --- | --- |
| 직함, 「すべてのプロジェクト」 링크 | accent / background | 4.74 | 8.14 |
| 한 줄 소개 | text / background | 17.25 | 16.18 |
| 범례 문구 | text-muted / background | 6.63 | 7.79 |
| 카드 요약·라벨 | text-muted / surface | 7.00 | 7.09 |
| 카드 값·성과 | text / surface | 18.19 | 14.72 |
| 채운 태그(주력) | on-accent / accent | 5.00 | 8.14 |
| 테두리 태그 경계(UI) | text-muted / background·surface | 6.63·7.00 | 7.79·7.09 |

### 한 줄 소개 디코딩 (컨셉 1, T08)

`src/scripts/hero-decode.ts`. 한 줄 소개 문단(`data-decode`)에만 적용한다.

- Home을 열 때마다 1회, 약 1초(1000ms) 재생한다. 앞에서부터 글자가 확정되고(ease-out), 확정되지 않은 글자는 50ms마다 임의 글자로 바뀐다. 헤더 언어 전환은 다른 언어의 Home으로 이동하므로 그때 다시 재생된다. 다른 페이지에는 없다.
- 임의 글자: 글자·숫자만 바꾸며 폭을 유지한다. 전각 문자(가나·한자·한글·전각 영숫자)는 전각 가타카나, 반각 문자(영숫자·반각 가나)는 영문 대문자·숫자. 공백·구두점·괄호는 그대로이고 글자 수는 바뀌지 않는다.
- 접근성: 최종 문구 문단은 그대로 두고 글자색만 투명하게 한 뒤(`.is-decoding`), 문단 안의 내용(문절 span 포함)을 복제한 장식용 겹침 요소(`.decode-overlay`, `aria-hidden="true"`, `pointer-events: none`, `user-select: none`)에 임의 글자를 그린다. 접근성 트리·복사·HTML에는 처음부터 최종 문구만 있다. 재생이 끝나면 겹침 요소를 지운다.
- 겹침 요소는 문단 위 절대 위치(`inset: 0`, 넘침은 자름)라 문단 크기가 바뀌지 않는다. Chromium에서 Home의 CLS는 T07 main과 같다(2026-10-31 측정 0.32~0.37. 이 값은 디코딩과 무관한 기존 글꼴 교체 때문이며 단계 6에서 다룬다).
- JS가 없거나 `prefers-reduced-motion: reduce`이거나 탭이 숨겨진 채 열리면 재생하지 않는다. 재생 중 탭이 숨겨지면 바로 최종 상태로 끝낸다.

### 카드 틸트 (컨셉 2, T08)

`src/scripts/card-tilt.ts`(document에 이벤트 위임, 페이지에 한 번 등록). Home·Projects 목록의 모든 카드(`full`·`compact`)에 적용한다.

- 조건: `(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)`이고 포인터 종류가 마우스일 때. 조건이 바뀌면 따라간다. 터치·펜에서는 기울지 않는다.
- 포인터 위치(카드 중심 기준)에 따라 `perspective(800px) rotateX/rotateY` 최대 4°와 `translateY(-4px)`. 스크립트는 `--tilt-x`·`--tilt-y`와 `.is-tilting`만 넣고(`requestAnimationFrame`으로 프레임당 한 번), transform은 CSS가 정한다. 따라갈 때 120ms(linear), 포인터가 나가면 200ms(`--ease-standard`)로 돌아온다.
- 키보드 포커스(`:focus-visible`)는 기울기 없이 `translateY(-4px)`만 한다. 포커스 링·Tab 순서·카드 전체 클릭 영역은 그대로다.
- 「詳細を見る →」는 T06부터 항상 보인다(시안의 "오버 시 표시"는 정보를 숨기지 않는 원칙에 따라 적용하지 않음).

### 모션

행동 링크는 기존 `.button`(떠오름 120ms·그림자 200ms)을 그대로 쓰며 `prefers-reduced-motion: reduce`에서 꺼진다(T02). 한 줄 소개 디코딩·카드 틸트(T08)는 위 절. reduced-motion에서는 디코딩·틸트·포커스 떠오름이 모두 꺼진다. 프로젝트 카드의 경계 색 전환(T06)과 카드 → 상세 전환(T08)은 §7 모션.

## 6. About (T05)

`src/components/pages/AboutPage.astro`와 하위 컴포넌트 `CareerTimeline.astro`, `SkillStack.astro`, `CertificationList.astro`. 콘텐츠 값은 `src/content/`(조회는 `src/lib/content.ts`의 `getAboutContent`), UI 문구는 `src/i18n/ui.ts`의 `pages.about.*`·`about.*`·`skill.*`에서 가져온다.

### 섹션 구성

순서: 페이지 머리 → 職歴 → 技術スタック → 資格. 섹션마다 `<section aria-labelledby>`이고 제목은 h1(페이지 이름) → h2(섹션) → h3(회사·분류)다.

| 섹션 | 구성 |
| --- | --- |
| 페이지 머리 | h1 「経歴」/`About`(페이지 이름, T03 규칙) → 한 줄에 프로필 이름(20px, 700)과 직함(text-muted). 좁으면 두 줄로 내려간다 → 이력서 링크 목록(`<ul>`) |
| 職歴 | h2 + 타임라인(`<ol>`, 최신이 위, 콘텐츠의 `order` 순). 항목: 기간 → 회사명(h3) → 직무(text-muted) → 성과(`<ul>`) |
| 技術スタック | h2 + 범례 문구(Home과 같은 `skill.legend`) + 분류 블록 그리드. 블록: 위쪽 가는 구분선(border) + h3 + 태그 목록(`<ul>`, `SkillTag`). 분류·기술 순서는 `skills.yaml` 배열 순서 |
| 資格 | h2 + `<dl>`(시안 A, `docs/CONTENT.md` "자격증 표기 규칙"). 자격증이 0건이면 섹션을 출력하지 않는다 |

- 이력서 링크는 콘텐츠의 `resumes`가 있을 때만 출력한다. 없으면 빈 `<ul>`·빈 여백 없이 아무것도 출력하지 않는다. 첫 링크는 `.button--primary`, 나머지는 `.button`이고, 링크 앞에 내려받기 아이콘(인라인 SVG, `aria-hidden="true"`)을 둔다. 링크 문구(콘텐츠 값)에 「（PDF）」/`(PDF)`를 넣어 파일 형식을 알린다.
- 기술 스택 분류 h3: 영어가 아닌 페이지는 그 언어 분류 이름 옆에 영어 이름(모노스페이스 12px, 400, text-muted, `lang="en"`)을 보조로 붙인다. 영어 페이지는 영어 이름만 쓴다.

### 전환점별 배치

| 폭 | 배치 |
| --- | --- |
| 640px 미만 | 머리 위 여백 48px. 타임라인 기간은 회사명 위. 기술 스택 1열 |
| 640px 이상 | 머리 위 여백 64px. 타임라인 기간은 왼쪽 열(11rem, 열 간격 32px). 기술 스택 2열(열 간격 48px, 줄 간격 32px) |

- 섹션 사이 64px, 섹션 제목(또는 범례)과 본문 사이 24px, 이름·직함 줄과 이력서 링크 사이 24px.
- 1024px에서 바뀌는 배치는 없다.

### 경력 타임라인 (`src/components/CareerTimeline.astro`)

- 점: 지름 14px, 중심을 기간 첫 줄 가운데에 맞춘다(위 6px). 현재 재직(`current: true`)은 accent로 채운 점, 나머지는 text-muted 2px 테두리 점이다.
- 세로선: 폭 2px, border 색. 이 항목의 점 중심에서 다음 항목의 점 중심까지 잇고, 마지막 항목 아래로는 늘이지 않는다.
- 선·점은 `::before`/`::after` 장식이라 접근성 트리에 나오지 않는다. 현재 재직 여부는 기간 문구(「現在」/`Present`)가 전한다.
- 기간: 14px, text-muted, 글꼴 `'IBM Plex Mono', var(--font-sans)`. 「現在」 같은 일본어가 섞이므로 일반 `monospace`로 넘어가 일본어 Windows에서 MS ゴシック가 쓰이지 않게, 모노스페이스 글꼴 다음에 본문 글꼴로 넘긴다.
- 모든 항목을 펼쳐 보인다. 단계 5 컨셉 5(스크롤 타임라인)는 `.timeline__item`에 강조만 더하며, 지금 화면이 애니메이션 없는 최종 상태다.

### 자격증 행 (`src/components/CertificationList.astro`)

- 행: 그리드 `7rem | 나머지`(열 간격 24px, 위아래 12px), 목록 위와 각 행 아래에 가는 구분선(border). 목록 최대 폭 48rem. 320px에서도 두 열을 유지한다.
- 취득: `<dt>` 연월(모노스페이스 14px, text-muted), `<dd>` 이름.
- 학습 중: `<dt>` 「学習中」/`Studying`(14px, 700, accent), `<dd>`는 UI 문구 템플릿 `about.certifications.studyingName`(「{name} 取得に向けて学習中」/`Studying for {name}`)에 이름을 넣은 문장이다. 학습 중은 0~1개이고 맨 끝에 둔다(콘텐츠 검사).

### 대비 (About)

새 토큰 조합은 없다. 모두 §2 대비 표의 기존 조합이며 바탕은 background다. 단위 `:1`.

| 요소 | 조합 | 라이트 | 다크 |
| --- | --- | --- | --- |
| 이름, 회사명, 성과, 분류 이름, 자격증 이름 | text / background | 17.25 | 16.18 |
| 직함, 기간, 직무, 범례, 분류 영어 이름, 취득 연월 | text-muted / background | 6.63 | 7.79 |
| 「学習中」 라벨, 이력서 테두리 버튼 글자·경계 | accent / background | 4.74 | 8.14 |
| 이력서 주 버튼, 채운 태그(주력) | on-accent / accent | 5.00 | 8.14 |
| 타임라인 점 테두리 | text-muted / background | 6.63 | 7.79 |

- 타임라인 세로선, 분류 구분선, 자격증 구분선은 border(장식용, §2)다. 정보를 전하지 않으므로 UI 경계 기준(3:1)의 대상이 아니다.

### 모션

새 전환 효과는 없다. 이력서 링크는 기존 `.button`(떠오름 120ms·그림자 200ms)을 그대로 쓰며 `prefers-reduced-motion: reduce`에서 꺼진다(T02).

## 7. Projects (T06)

목록 `src/components/pages/ProjectsPage.astro`, 상세 `src/components/pages/ProjectDetailPage.astro`(`src/pages/{ja,en}/projects/[slug].astro`), 担当工程 `src/components/PhaseList.astro`. 콘텐츠 값은 `src/content/projects/`(조회는 `src/lib/content.ts`의 `getProjectsContent`·`getProjectPages`), UI 문구는 `src/i18n/ui.ts`의 `pages.projects.*`·`projects.*`·`project.*`에서 가져온다. 시안: claude.ai 디자인 캔버스 "T06 Projects 시안"(비공개, 2026-10-30 사용자 확인).

### 목록 구성

순서: 페이지 머리 → 代表プロジェクト → その他のプロジェクト. 섹션마다 `<section aria-labelledby>`이고 제목은 h1(페이지 이름) → h2(섹션) → h3(카드)다.

| 섹션 | 구성 |
| --- | --- |
| 페이지 머리 | h1 「プロジェクト」/`Projects`(페이지 이름, T03 규칙) → 소개 문단(text-muted, 최대 40em) |
| 代表プロジェクト | h2 + 카드 그리드(§5 카드, Home과 같은 컴포넌트). 순서는 `featuredOrder` |
| その他のプロジェクト | h2 + 짧은 카드 그리드(§5 짧은 카드). 순서는 `order`. 0건이면 섹션을 출력하지 않는다 |

| 폭 | 배치 |
| --- | --- |
| 640px 미만 | 머리 위 여백 48px. 카드 1열 |
| 640px 이상 | 머리 위 여백 64px. 카드 2열 |
| 1024px 이상 | 代表는 카드가 3개일 때만 3열(`data-count="3"`, Home과 같음). その他는 2열 유지 |

- 섹션 사이 64px, 섹션 제목과 카드 사이 24px, 카드 사이 24px. 카드 그리드 규칙(`.project-grid`)은 Home과 공유하므로 `src/styles/global.css`에 둔다.

### 상세 구성

순서: 목록으로 돌아가는 링크 → 머리 → 개요 상자 → 본문 4절 → 이전·다음 프로젝트. 제목은 h1(프로젝트 제목) → h2(4절)다.

| 영역 | 구성 |
| --- | --- |
| 돌아가기 | 「← プロジェクト一覧」/`← All projects`(14px, 700, accent, 높이 44px). 화살표는 `aria-hidden` |
| 머리 | 대표 프로젝트면 「代表プロジェクト」 표시(accent 1px 테두리 알약, 12px, 700, `<p>`) → h1 제목(문절 처리) → 한 줄 요약(text-muted, 640px 미만 15px, 이상 18px). 최대 폭 46em |
| 개요 상자 | surface 면 + border + 모서리 12px(그림자 없음) 안의 `<dl>`: 期間(모노스페이스) / 役割 / チーム(`team`이 있을 때만) / 担当工程(전체 폭, 큰 칸) / 技術(전체 폭, 태그) |
| 본문 4절 | 課題 / 設計 / 結果 / 技術. 절마다 `<section aria-labelledby>` + h2. 절 번호 「01」~「04」(모노스페이스 14px, accent)는 `aria-hidden` 장식. 최대 폭 46em, 절 사이 48px |
| 이전·다음 | `<nav aria-label="ほかのプロジェクト">` 안의 링크 2개(라벨 12px 700 text-muted + 제목 700). 위에 가는 구분선. 순서는 목록 표시 순서(代表 → その他)이고 끝과 처음이 이어진다. 전체가 2건이면 다음만 둔다 |

- 課題·設計: 본문 문단 + 요점 목록(있으면 `<ul>`). 結果: 지표 칸 목록(있으면 `<ul>`, surface 면, 라벨 13px 700 text-muted, 값 본문 글꼴 700 22px/26px, `tabular-nums`) → 보충 문단(있으면). 技術: `<dl>`(라벨 13px 700 text-muted).
- 지표 값과 절 번호는 굵은 모노스페이스를 쓰지 않는다. IBM Plex Mono는 400만 불러오므로(글꼴 CSS를 늘리지 않음) 700은 합성 글꼴이 되기 때문이다. 지표 값은 「削減」 같은 일본어가 섞이므로 본문 글꼴로 쓴다.
- `<title>`은 `프로젝트 제목 | 사이트 이름`(문절 배열은 이어 붙임), `<meta name="description">`은 한 줄 요약이다. 헤더 「プロジェクト」에 `aria-current="true"`(T03 접두어 비교), 언어 전환은 같은 slug의 다른 언어 상세로 간다.

| 폭 | 배치 |
| --- | --- |
| 640px 미만 | 위 여백 24px. 개요 상자: 期間 전체 폭, 役割·チーム 2칸, 担当工程 칸은 줄바꿈으로 흐름. 절 번호는 h2 위. 지표 칸 1열. 技術 라벨은 값 위. 이전·다음 1열 |
| 640px 이상 | 위 여백 32px. 개요 상자: 期間·役割·チーム 3칸 한 줄, 担当工程 5칸 같은 폭 그리드. 절 번호는 왼쪽 열(72px, 열 간격 16px). 지표 칸 2열. 技術 라벨 열 9rem. 이전·다음 2열(다음은 오른쪽 칸, 오른쪽 정렬) |

### 担当工程 (`src/components/PhaseList.astro`)

- 다섯 공정(要件定義・設計・開発・テスト・運用 / `Requirements`·`Design`·`Development`·`Testing`·`Operations`)을 `src/content.config.ts`의 `PHASES` 순서로 모두 보여 주는 `<ol>`이다. 콘텐츠 파일의 `phases` 순서와 무관하다(조회 함수가 정렬).
- 맡은 공정: accent로 채운 칸, on-accent 글자 700, 앞에 체크 아이콘(인라인 SVG, `aria-hidden`). 맡지 않은 공정: 1px 점선 text-muted 테두리, text-muted 글자. 모서리 8px.
- 색만으로 구분하지 않는다. 채움·체크·점선 모양에 더해 칸마다 시각적으로 숨긴 상태 텍스트(「（担当）」「（担当外）」/` (handled)`·` (not handled)`)가 있어 접근성 트리에서 「要件定義 （担当）」처럼 읽힌다.
- 크기: 카드는 12px 칸(위아래 2px, 좌우 8px, 간격 4px)이 줄바꿈으로 흐른다. 상세는 14px 칸(위아래 8px)이고 640px 이상에서 5칸 같은 폭 그리드(간격 8px)다.

### 대비 (Projects)

새 토큰 조합은 없다. 모두 §2 대비 표의 기존 조합이다. 단위 `:1`.

| 요소 | 조합 | 라이트 | 다크 |
| --- | --- | --- | --- |
| 맡은 공정 칸 글자 | on-accent / accent | 5.00 | 8.14 |
| 맡지 않은 공정 칸 글자·점선 경계(UI) | text-muted / surface | 7.00 | 7.09 |
| 「詳細を見る →」, 카드 오버 경계(UI) | accent / surface | 5.00 | 7.41 |
| 카드 포커스 링(카드 바깥) | accent / background | 4.74 | 8.14 |
| 돌아가기 링크, 「代表プロジェクト」 표시, 절 번호 | accent / background | 4.74 | 8.14 |
| 소개 문단, 상세 요약 | text-muted / background | 6.63 | 7.79 |
| 개요·지표·이전·다음의 라벨 | text-muted / surface | 7.00 | 7.09 |
| 본문, 지표 값, 이전·다음 제목 | text / background·surface | 17.25·18.19 | 16.18·14.72 |

- 개요 상자·지표 칸·이전·다음 링크의 테두리와 이전·다음 위 구분선은 border(장식용, §2)다. 면의 구분은 글자와 배치로도 드러나므로 UI 경계 기준(3:1)의 대상이 아니다.

### 모션

카드 경계 색 전환(200ms)과 이전·다음 링크 경계 색 전환(200ms)을 더했다. `prefers-reduced-motion: reduce`에서 둘 다 꺼진다(`transition: none`). 카드 틸트는 §5 "카드 틸트".

**카드 → 상세 전환 (컨셉 2, T08)**: JS 없이 CSS cross-document View Transitions(`src/styles/view-transitions.css`)로 만든다.

- `@view-transition { navigation: auto; }`는 Home·Projects 목록·프로젝트 상세에서만 불러온다. 이동 전후 문서가 모두 규칙을 가져야 전환되므로 이 세 페이지 사이(카드 → 상세, 「一覧へ戻る」, 이전·다음, 뒤로 가기)에서만 일어나고, About·Contact로 가는 이동에는 없다.
- 카드 제목(h3)과 상세 h1은 같은 `view-transition-name: project-title-<slug>`를 가져 제목이 상세 제목 자리로 옮겨 간다. 나머지는 기본 크로스페이드다. 시간 280ms, `--ease-standard`. slug는 `src/lib/content.ts`가 영문 소문자·숫자·하이픈만 허용한다(CSS 식별자로 쓰기 위함).
- `prefers-reduced-motion: reduce`에서는 `navigation: none`으로 끈다.
- 브라우저 지원([MDN browser-compat-data `css.at-rules.view-transition`](https://github.com/mdn/browser-compat-data/blob/main/css/at-rules/view-transition.json), [MDN `@view-transition`](https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition), 2026-10-31 확인): Chrome·Edge 126 이상, Safari 18.2 이상(iOS 포함). Firefox는 미지원이며 일반 페이지 이동이 된다. 폴리필은 두지 않는다.
- 느린 연결: Chromium에서 Slow 4G 수준(지연 562ms, 내려받기 180KB/s)으로 낮춰도 카드 → 상세와 뒤로 가기 모두 제목 전환이 짝지어졌다(2026-10-31, T08). 그래서 `<link rel="expect" blocking="render">`는 넣지 않았다. 상세 페이지가 무거워져 제목이 페이드로 바뀌면 다시 검토한다.

## 8. Contact (T07)

`src/components/pages/ContactPage.astro`. 연락처 값은 `src/content/contact.yaml`(조회는 `src/lib/content.ts`의 `getContactContent`), UI 문구는 `src/i18n/ui.ts`의 `pages.contact.*`·`contact.*`에서 가져온다. 시안: claude.ai 디자인 캔버스 "T07 Contact 시안"(비공개, 2026-10-30 사용자 확인).

### 구성

순서: 페이지 머리 → 연락 수단 목록. 제목은 h1(페이지 이름) → h2(시각적으로 숨긴 「連絡方法」)다. 연락 폼 자리·비활성 폼·희망 조건 칸은 두지 않는다(2026-10-30 사용자 결정, 연락 폼은 단계 8).

| 영역 | 구성 |
| --- | --- |
| 페이지 머리 | h1 「連絡先」/`Contact` → 소개 문단(`intro`, text-muted, 최대 40em) |
| 연락 수단 목록 | surface 면 + border + 모서리 12px(그림자 없음) 안의 `<ul>`, 항목 사이 border 구분선. 최대 폭 46em. 항목: 라벨(13px 700 text-muted) → 주소 링크(모노스페이스, accent) → (메일만) 복사 버튼. 순서는 メール → `links` 배열 순서 |

- 메일은 `mailto:`, GitHub·LinkedIn은 같은 탭에서 연다. 주소 문자열은 URL에서 `https://`와 끝 `/`를 뺀 값이다.
- 값이 임시(`placeholder: true`)이면 주소 링크 밖에 「（仮）」/`(placeholder)`(14px, text-muted, 본문 글꼴)를 붙인다.

| 폭 | 배치 |
| --- | --- |
| 640px 미만 | 위 여백 48px. 항목은 라벨 → 주소(16px) → 복사 버튼을 위아래로 쌓는다(안쪽 여백 16px) |
| 640px 이상 | 위 여백 64px. 항목은 「라벨(9rem) \| 주소(18px) \| 복사 버튼」 한 줄(안쪽 여백 16px·24px) |

### 복사 버튼

- 테두리 버튼(accent 1px, accent 글자 14px 700, 모서리 8px, 높이 44px) + 복사 아이콘(인라인 SVG, `aria-hidden`). 보이는 문구 「コピー」/`Copy`, 접근 가능한 이름 「メールアドレスをコピー」/`Copy email address`(보이는 문구를 포함).
- 누르면 `navigator.clipboard.writeText`로 주소를 복사하고 문구·아이콘을 「コピーしました」/`Copied` + 체크로 2초 바꾼 뒤 되돌린다. 실패하면 「コピーできませんでした」/`Couldn't copy`. 결과는 `role="status"` 영역(시각적으로 숨김)으로도 알린다.
- 점진적 향상: HTML에는 `hidden`으로 두고, 클립보드 API를 쓸 수 있을 때(`navigator.clipboard`, 보안 컨텍스트)만 스크립트가 보인다. JS가 없으면 주소와 `mailto:` 링크만으로 연락할 수 있다. 스크립트는 Contact 페이지의 Astro `<script>`이며 React island를 쓰지 않는다.

### 대비 (Contact)

새 토큰 조합은 없다. 모두 §2·§4·§7 대비 표의 기존 조합이다. 단위 `:1`.

| 요소 | 조합 | 라이트 | 다크 |
| --- | --- | --- | --- |
| 주소 링크, 복사 버튼 글자·테두리(UI) | accent / surface | 5.00 | 7.41 |
| 복사 버튼 오버 시 글자 | accent / background | 4.74 | 8.14 |
| 항목 라벨, 임시 표식 | text-muted / surface | 7.00 | 7.09 |
| 소개 문단, 푸터 연락 링크·저작권 | text-muted / background | 6.63 | 7.79 |

- 목록 상자 테두리와 항목 구분선은 border(장식용, §2)다.

### 모션

복사 버튼 배경 전환(120ms)만 있다. `prefers-reduced-motion: reduce`에서 끈다. 복사 후 문구 전환은 상태 표시라 유지한다.
