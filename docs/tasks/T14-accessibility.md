# T14: 접근성 점검·수정 (WCAG 2.2 AA 자동·수동 점검, 강제 색상 모드, 터미널 출력 스크롤)

| 항목 | 값 |
| --- | --- |
| 단계 | 6 |
| 선행 작업 | T13 (PR #40) |
| 담당 | claude |
| 상태 | done |
| 브랜치 | `claude/project-thread-t0t9l8` (실행 환경이 지정한 이름. 원칙상 이름은 `claude/T14-accessibility`) |

## 목표

- 18페이지, 404, 명령 팔레트·터미널을 같은 기준(WCAG 2.2 AA)으로 한 번에 점검한다.
  - 자동 검사(axe-core, Lighthouse)는 위반 0건이어야 한다.
  - 이 환경에서 할 수 있는 수동 점검(키보드, 화면 크기, 텍스트 간격, 강제 색상)도 통과해야 한다.
- 지시서 작성 때 사전 점검에서 찾은 문제 2건을 고친다.
- 점검 기준과 방법을 `docs/DESIGN.md`에 남긴다. 단계 7 E2E와 원고 반영 뒤에 같은 방법으로 다시 잴 수 있게 하기 위해서다.

## 배경

- 근거 문서
  - `docs/PLAN.md` §3: "모든 페이지 공통: 접근성"
  - `docs/PLAN.md` §5: 단계 6
  - `AGENTS.md` §7: 시맨틱 HTML, 키보드 조작, 충분한 대비, 이미지 alt
- 단계 6 순서는 T12 React 전환 → T13 SEO → T14 접근성이다(2026-10-31 사용자 결정). 마크업이 바뀐 뒤 한 번만 점검하려고 마지막에 둔다.
- 지시서마다 정한 규칙
  - 대비 표: `docs/DESIGN.md` §2, §4~§9
  - 포커스 표시: §2 "간격·크기·모션"
  - 키보드·reduced-motion: §3 "공통 구현 규칙"
- 사이트 전체를 같은 도구와 기준으로 한 번에 점검한 적은 아직 없다.
- 이 환경에서 할 수 없는 확인은 `docs/PLAN.md` §8에 이미 넘겨 두었다(T03·T10 항목).
  - 실제 스크린 리더(VoiceOver, NVDA)
  - Firefox·Safari
  - 이유: 이 환경에는 Chromium만 있다.

### 사전 점검 (main `a13b656`, T13 merge 직후, 2026-10-31)

도구는 Playwright 1.63 Chromium(153)이다. axe-core 4.14.0은 프로젝트 의존성이 아니다. 측정용으로 설치한 Lighthouse 12.6.1에 함께 들어온 것을 `page.addScriptTag`로 페이지에 넣었다. 404는 `pnpm preview`의 `/404.html`(상태 200)으로 열었다.

- **axe 자동 검사, 76회 위반 0건**
  - 대상: 19페이지(18 + 404) × 라이트·다크 × 1280·375px
  - 태그: `wcag2a`·`wcag2aa`·`wcag21a`·`wcag21aa`·`wcag22aa`·`best-practice`
  - 판정 보류(incomplete)는 `span[aria-hidden="true"]`(장식 글자)의 대비 판정 불가뿐이다.
- **Lighthouse 접근성**(모바일 1회): 다섯 페이지 모두 100이다.
  - 대상: `/ja/`, `/en/about/`, `/ja/projects/`, `/ja/projects/order-api/`, `/ja/contact/`
- **팔레트·터미널을 연 상태의 axe**(라이트·다크 × 1280·375px)
  - 팔레트는 위반 0건이다.
  - 터미널은 375px에서 `help` 출력 뒤 위반 1건이 나온다. 규칙은 `scrollable-region-focusable`(serious)이다.
    - 출력 영역(`role="log"`)이 넘쳐 스크롤되지만, 그 안에 포커스할 수 있는 요소가 없다.
    - Chromium 153에서는 입력란에서 Shift+Tab을 누르면 출력 영역으로 포커스가 간다(브라우저가 스크롤 영역을 포커스 순서에 넣음).
    - 그래도 `tabindex`가 없으므로 이 동작을 하지 않는 브라우저에서는 키보드로 스크롤할 수 없다(Deque 규칙 설명, 아래 공식 문서).
- **강제 색상 모드**(Playwright `forcedColors: 'active'` 에뮬레이션)
  - **문제**: 주력 기술 태그(`.tag--featured`)의 채움이 사라져 다른 태그와 같게 보인다.
    - Home 범례 「塗りつぶしたタグは主軸の技術です。」가 화면과 맞지 않게 된다.
    - 스크린 리더용으로 시각적으로 숨긴 「主軸」 텍스트는 있다.
  - **문제 없음**: 다른 상태 표시는 보인다.
    - 担当工程의 ✓와 실선·점선
    - 현재 페이지(굵게·밑줄)
    - 팔레트 선택 항목의 외곽선
    - 포커스 외곽선
    - 프로젝트 카드 포커스 링
  - **시험한 수정**: 스타일 주입으로 시험했다.
    - `forced-color-adjust: none` + `background-color: CanvasText; border-color: CanvasText; color: Canvas`로 라이트·다크 모두 채운 모양이 유지됐다.
    - `forced-color-adjust: none` 없이 시스템 색만 지정하면, 글자 바탕판(backplate)이 Canvas 색이라 글자가 보이지 않았다.
- **키보드**(1280px, ja 기준)
  - 대상: Home, About, Projects, 상세, Contact, 404
  - 첫 Tab은 「本文へ移動」이고, Tab 순서는 화면 순서와 같다.
  - 프로젝트 카드 링크는 카드 외곽선으로 포커스를 보인다. 라이트·다크·강제 색상 캡처로 확인했다.
  - 헤더는 고정(sticky·fixed)이 아니어서 포커스를 가리지 않는다.
- **본문 바로가기**: Chromium에서 Enter 뒤 다음 Tab이 본문의 첫 링크로 간다. `main`에 `tabindex`가 없어 `document.activeElement`는 `body`로 남는다. 다른 브라우저에서 같은지는 확인하지 못했다.
- **구조**
  - 모든 페이지에 h1이 1개이고, 제목 단계를 건너뛰지 않는다.
  - 랜드마크: header, nav(「メイン」·「言語」), main, footer. 상세 페이지에는 nav(「ほかのプロジェクト」)가 더 있다.
  - 언어 전환 링크와 About 기술 분류의 영어 이름에는 `lang`이 있다.
- **리플로·텍스트 간격**
  - 320px와 640px(1280px 화면의 200% 확대에 해당)에서 가로 넘침이 없다.
  - WCAG 1.4.12 값을 넣어도 375·640px에서 잘리거나 넘치는 요소가 없다. 넣은 값: 줄 높이 1.5, 글자 간격 0.12em, 단어 간격 0.16em, 문단 뒤 2em.
- **대상 크기**: axe `target-size`(2.5.8) 위반이 없다.

### 확인한 공식 문서 (2026-10-31)

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)(W3C 권고, 2024-12-12). 이번 점검이 직접 다루는 성공 기준:

  | 번호 | 이름 | 수준 |
  | --- | --- | --- |
  | 1.4.1 | Use of Color | A |
  | 1.4.3 | Contrast (Minimum) | AA |
  | 1.4.10 | Reflow | AA |
  | 1.4.11 | Non-text Contrast | AA |
  | 1.4.12 | Text Spacing | AA |
  | 2.1.1 | Keyboard | A |
  | 2.4.1 | Bypass Blocks | A |
  | 2.4.2 | Page Titled | A |
  | 2.4.7 | Focus Visible | AA |
  | 2.4.11 | Focus Not Obscured (Minimum) | AA |
  | 2.5.8 | Target Size (Minimum) | AA |

- [Deque axe 규칙 `scrollable-region-focusable`](https://dequeuniversity.com/rules/axe/4.11/scrollable-region-focusable)(4.11 문서)
  - 스크롤 영역은 키보드로 닿아야 한다.
  - 모든 브라우저가 스크롤 영역을 Tab 순서에 넣지는 않는다(예: Safari).
  - 해결: 영역 또는 그 안의 정적 요소에 `tabindex="0"`을 두는 것을 권한다.
  - 대응 기준: WCAG 2.1.1·2.1.3
- [MDN `forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)
  - 강제 색상 모드에서 `color`·`background-color`·`border-color`·`outline-color` 등은 브라우저가 고른 색으로 바뀌고, `box-shadow`는 `none`이 된다.
  - 시스템 색(`CanvasText` 등)을 지정하면 그 값을 쓴다.
  - `forced-color-adjust: none`은 강제 색과 글자 바탕판을 끈다.
  - 강제 색상 모드용 별도 디자인을 만들지 말고 작은 조정에만 쓰라고 권한다.

## 범위

포함:

1. **수정**(사전 점검에서 찾은 2건)
   1. **터미널 출력 영역**
      - `Terminal.tsx`의 출력(`role="log"`, 이름은 기존 `aria-label`)에 `tabIndex={0}`을 준다.
      - `command-ui.css`에 출력 영역의 `:focus-visible` 표시를 넣는다. 모양은 기존 터미널 입력 줄과 같은 `2px solid accent`, `outline-offset: -2px`다.
      - 처음 열 때 입력란 포커스, Esc 닫기, 포커스 되돌림(T10)은 바꾸지 않는다.
   2. **강제 색상 모드의 주력 기술 태그**
      - `global.css`에 다음을 넣는다.
        `@media (forced-colors: active) { .tag--featured { forced-color-adjust: none; background-color: CanvasText; border-color: CanvasText; color: Canvas; } }`
      - 일반 모드 화면은 바뀌지 않는다.
      - 다른 요소(주 버튼 채움 등)는 정보가 아니라서 브라우저에 맡긴다(메모).
2. **점검**(결과는 PR 표로 남긴다)
   - **axe-core 자동 검사**
     - 태그: 사전 점검과 같다.
     - 페이지: 19페이지 × 라이트·다크 × 1280·375px
     - 팔레트·터미널 열린 상태: 라이트·다크 × 1280·375px. 터미널은 출력이 넘친 상태에서 잰다.
     - 판정 보류 항목은 목록과 판단을 PR에 적는다.
   - **Lighthouse 접근성**: 사전 점검의 다섯 페이지
   - **키보드**: 페이지 종류 6개(Home·About·Projects·상세·Contact·404)와 팔레트·터미널에서 다음을 확인한다.
     - Tab·Shift+Tab 순서가 화면 순서와 같다.
     - 모든 링크·버튼에 포커스 표시가 있다(라이트·다크·강제 색상).
     - 포커스가 다른 요소에 가려지지 않는다.
     - 키보드 함정이 없다(팔레트·터미널은 Esc로 나오고 포커스가 돌아온다).
     - 본문 바로가기가 동작한다.
   - **화면 크기·글자**: 320px·640px에서 가로 넘침이 없고, 텍스트 간격(1.4.12)을 넣어도 잘리지 않는다.
   - **강제 색상**: 라이트·다크 강제 색상으로 대표 4페이지(Home·About·상세·Contact)와 팔레트·터미널을 캡처한다. 정보가 색·채움에만 기대지 않는지 본다.
   - **reduced-motion**: 장식 애니메이션이 꺼지는지 다시 확인한다(T08~T10 규칙).
     - 디코딩
     - 틸트
     - 카드 → 상세 전환
     - 타임라인
     - 팔레트 열림
   - **구조**: 다음을 18페이지와 404에서 확인한다.
     - h1이 1개다.
     - 제목 단계를 건너뛰지 않는다.
     - 같은 종류의 랜드마크가 여러 개면 이름이 있다.
     - `lang`이 바르다.
     - 페이지 제목이 언어 안에서 겹치지 않는다.
   - 점검에서 새 위반을 찾으면 고친다.
     - 화면이 달라지는 수정은 사용자 확인 뒤에 한다.
     - 고친 파일과 이유는 PR에 적는다.
3. **문서**
   - `docs/DESIGN.md`에 새 절 "§11 접근성 기준 (T14)"을 쓴다. 담을 내용:
     - 목표 기준(WCAG 2.2 AA)
     - 점검 도구와 조건(위 범위 2)
     - 포커스 규칙(§2 참조)
     - 강제 색상 규칙: 정보인 표시는 시스템 색으로 유지하고, 장식은 브라우저에 맡긴다.
     - 스크롤 영역 규칙: 키보드로 닿게 한다.
     - 이 환경에서 할 수 없는 확인
   - `docs/PLAN.md`
     - 진행 상태
     - 작업 지시서 표
     - 결정 기록
     - §8 "T14 구현 시 추가한 항목"(아래 "단계 7로 넘기는 일")

제외:

- 실제 스크린 리더(VoiceOver, NVDA, TalkBack)와 Firefox·Safari 확인
  - 이유: 이 환경에서는 할 수 없다. PLAN §8 기존 항목(T03·T10)으로 남긴다.
  - 단계 7에서 Playwright WebKit·Firefox를 쓸 수 있으면 그때 확인한다.
  - 사용자가 Windows에서 NVDA로 확인할 수 있으면 확인 순서를 PR에 둔다(선택).
- 자동 검사를 저장소 테스트로 넣는 일(예: `@axe-core/playwright` 등 새 의존성). 단계 7 E2E에서 정한다.
- 본문 바로가기 대상 `main`에 `tabindex="-1"`을 두는 변경
  - Chromium에서는 지금도 동작한다. 바꾸면 `main`에 포커스 표시를 따로 다뤄야 한다.
  - 다른 브라우저에서 확인한 뒤(단계 7) 정한다.
- 문구·콘텐츠 변경(Home `<title>` 등, 메모), 디자인·대비 값 변경(위반 없음)
- AAA 기준(예: 2.4.13 Focus Appearance)

### 단계 7로 넘기는 일 (구현 PR에서 `docs/PLAN.md` §8에 적는다)

- axe 자동 검사를 E2E에 넣는다(의존성 추가는 사용자 확인). 범위는 위 범위 2의 조건이다.
- WebKit·Firefox에서 확인한다.
  - 본문 바로가기 뒤 다음 Tab 위치
  - 터미널 출력 영역 포커스
  - 강제 색상(Windows 고대비) 실제 색
- 원고 반영 뒤 axe·키보드 점검을 다시 한다. 문구 길이가 바뀌면 리플로·텍스트 간격 결과가 달라질 수 있다.

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `src/components/interactive/Terminal.tsx`: 출력 영역 `tabIndex`만
- `src/components/interactive/command-ui.css`: 출력 영역 포커스 표시만
- `src/styles/global.css`: 강제 색상 규칙 추가만
- 점검에서 새 위반을 찾았을 때 그 위반을 고치는 데 필요한 컴포넌트·CSS(PR에 이유)
- `docs/DESIGN.md`, `docs/PLAN.md`, `docs/tasks/T14-accessibility.md`, `docs/ARCHITECTURE.md`(구조 설명이 달라질 때만)
- `docs/screenshots/T14-*.png`: PR 캡처
- 바꾸지 않는 파일
  - 문구·콘텐츠: `src/i18n/ui.ts`, `src/content/**`
  - 라우트: `src/pages/**`
  - 빌드·의존성: `package.json`, `pnpm-lock.yaml`, `scripts/**`

## 완료 조건

- [x] axe 위반 0건
  - 19페이지 × 라이트·다크 × 1280·375px(76회)
  - 팔레트·터미널 열린 상태(라이트·다크 × 1280·375px, 터미널은 출력이 넘친 상태)
  - 판정 보류 항목의 목록과 판단을 PR에 적는다.
- [x] Lighthouse 접근성 100(사전 점검의 다섯 페이지, 모바일)
- [x] 터미널 출력 영역
  - Tab·Shift+Tab으로 포커스되고 포커스 표시가 보인다.
  - 포커스한 뒤 ↑↓·PageUp·PageDown으로 스크롤된다.
  - 처음 열 때 입력란 포커스, Esc 닫기, 포커스 되돌림은 T10과 같다.
- [x] 강제 색상 모드(라이트·다크)에서 주력 태그가 채운 모양으로 다른 태그와 구분된다. 캡처를 PR에 싣는다.
- [x] 키보드 점검 표(페이지 종류별 Tab 순서·포커스 표시·가림·함정)를 PR에 싣는다.
- [x] 320px·640px 가로 넘침 0, 텍스트 간격 주입 시 잘림 0
- [x] 기존 화면이 main과 같다.
  - T12 방법으로 캡처 45장 픽셀 차이 0, 18페이지 `ariaSnapshot()` 글자 단위 동일
  - 이번 수정은 터미널(열 때만 보임)과 강제 색상 모드에만 영향이 있다.
- [x] 페이지가 처음 받는 JS(헤더 스크립트·인라인 모듈)가 main과 같다. 팔레트를 열 때 받는 파일의 크기 변화를 PR에 적는다.
- [x] 새 의존성이 없다(`package.json` 의존성 항목, `pnpm-lock.yaml` 변경 없음).
- [x] 문서가 갱신되어 있다: `docs/DESIGN.md` §11, `docs/PLAN.md`(진행 상태·표·결정 기록·§8)
- [x] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`와 GitHub CI가 통과한다.
- [x] 비밀 값 미포함

## 확인 방법

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm check && pnpm build
pnpm preview
```

- **axe-core**
  - 프로젝트 의존성이 아니다. 실행 환경의 `axe.min.js`를 쓴다. 예: Lighthouse 설치에 함께 들어온 것, 또는 프로젝트 밖에 임시로 설치한 것.
  - Playwright `page.addScriptTag({ path })`로 넣고 `axe.run(document, { runOnly: { type: 'tag', values: [...] } })`를 실행한다.
  - 페이지마다 `waitUntil: 'networkidle'`과 `document.fonts.ready`를 기다린 뒤 잰다. 컨텍스트에는 `reducedMotion: 'reduce'`를 준다.
  - axe-core 버전과 실행된 규칙 ID를 PR에 적는다. 규칙 목록은 `axe.getRules(태그)`로, 실제로 요소에 적용된 규칙은 결과의 `passes`·`violations`·`incomplete` ID로 모은다(`target-size` 포함 여부 확인, T14 지시서 교차 리뷰 개선 제안).
  - 404는 `/404.html`로 연다(상태 200이라 페이지가 그대로 읽힌다).
- **강제 색상**
  - Playwright `browser.newContext({ forcedColors: 'active', colorScheme: 'light' | 'dark' })`로 연다.
  - Chromium 에뮬레이션이라 Windows 고대비 테마의 실제 색과 다를 수 있다.
- **텍스트 간격**: `page.addStyleTag`로 1.4.12 값을 넣는다. 그 뒤 `overflow: hidden`인 요소 가운데 `scrollHeight`·`scrollWidth`가 보이는 크기보다 큰 요소를 찾는다.
- **키보드**: Playwright `keyboard.press('Tab')`을 반복하며 `document.activeElement`와 포커스 표시를 기록한다.
  - 포커스 표시는 `outline`이 있는지로 보고, 없으면 캡처로 확인한다.
  - 카드 링크처럼 부모가 포커스를 보이는 경우는 캡처로 확인한다.
- **Lighthouse**: `docs/tasks/T11-performance.md` "측정 방법"과 같다. `--only-categories=accessibility`로 잰다.
- **캡처·접근성 트리**: `docs/tasks/T12-react-components.md` "확인 방법"과 같다.

## 메모

- 아래는 지시서 작성 시 정한 기본안이다. 사용자(choi)가 구현 PR에서 바꿀 수 있다.
  - 기준 WCAG 2.2 AA
  - 터미널 출력 `tabIndex`
  - 강제 색상 규칙
  - 본문 바로가기 유지
- **WCAG 2.2 AA로 하는 이유**: 2024-12-12 W3C 권고가 현행판이다. 지금까지 지시서의 대비·키보드 규칙도 AA 기준이었다.
- **강제 색상에서 주력 태그만 고치는 이유**
  - 범례가 채움으로 의미를 설명하므로 정보다(1.4.1).
  - 주 버튼과 보조 버튼의 채움 차이는 정보가 아니다. 문구로 구분된다.
  - MDN도 강제 색상 모드용 별도 디자인을 만들지 말라고 권한다.
- **터미널 출력에 `tabIndex={0}`을 주는 이유**
  - 출력에 링크가 있을 때(`projects`, `contact`)는 링크로 들어갈 수 있다. 그러나 텍스트만 있을 때(`help`)는 포커스할 곳이 없다.
  - 대안은 입력란에서 PageUp·PageDown으로 출력을 스크롤하는 것이다. 키 처리 코드가 늘고 IME 조합 중 처리도 다시 봐야 해서 기본안으로 두지 않았다.
- **Home `<title>`**: ja·en 모두 「choi」(사이트 이름)다.
  - 2.4.2 Page Titled는 제목이 페이지의 주제나 목적을 설명할 것을 요구한다. 개인 사이트의 Home이 사이트 이름을 제목으로 쓰는 것은 위반으로 보지 않았다(판단).
  - 바꾸면 SEO 제목(`og:title`)도 바뀐다. 원고 반영 때 문구와 함께 검토한다.
- 이 지시서의 공식 문서 확인은 2026-10-31 기준이다. 구현 시 바뀐 점이 있으면 PR에 적는다.
