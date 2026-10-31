# T10: 명령 팔레트·터미널 모드 (인터랙션 컨셉 3·4)

| 항목 | 값 |
| --- | --- |
| 단계 | 5 |
| 선행 작업 | T09 (PR #28) |
| 담당 | claude |
| 상태 | review |
| 브랜치 | `claude/project-thread-f9n3kf` (실행 환경이 지정한 이름. 원칙상 이름은 `<agent>/T10-command-palette-terminal`) |

## 목표

모든 페이지에서 ⌘K / Ctrl+K 또는 헤더 버튼으로 **명령 팔레트**를 열어 페이지 이동·언어 전환·테마 전환 등을 키보드로 실행할 수 있게 한다(컨셉 4). 팔레트에서 **터미널 모드**(이스터에그)를 열면 `help`, `whoami` 같은 명령과 추천 명령 버튼으로 프로필을 볼 수 있다(컨셉 3). 둘은 명령 정의 하나를 공유하고, **사용자가 열 때만** 코드를 불러온다. 열기 전 페이지가 받는 JS는 작은 런처 하나만 늘어난다.

## 배경

- `docs/DESIGN.md` §3 인터랙션 컨셉 3·4와 공통 구현 규칙: 명령 목록 공유, 열 때 동적 import, reduced-motion에서는 기능은 유지하고 전환 효과만 끔, Esc로 닫고 포커스를 원래 위치로 되돌림. 컨셉 3은 "핵심 정보를 여기에만 두지 않음".
- `docs/ARCHITECTURE.md` A2: React는 상태가 많은 컨셉 3·4에만 쓴다. T08·T09는 React 없이 끝났으므로 **T10이 처음이자 유일한 React 사용처**다.
- `docs/DESIGN.md` §4 테마 버튼: 저장 키 `theme`과 `src/scripts/theme.ts`의 함수(`getTheme`, `setTheme`, `onThemeChange`)를 팔레트와 공유한다. "시스템 설정으로 되돌리기"는 단계 5 명령 팔레트에서 검토하기로 했다.
- `docs/PLAN.md` §5 단계 5. 2026-10-31 사용자 결정으로 T08 = 컨셉 1·2, T09 = 컨셉 5, **T10 = 컨셉 3·4**.
- 참고 시안: claude.ai "포트폴리오 인터랙션 컨셉" 캔버스(비공개 링크, 소유자 계정에서만 열림) 3번·4번 보드. 2026-10-28 사용자 확인. 시안 메모 요약:
  - 3 터미널: 명령어를 몰라도 되게 추천 명령 버튼 제공. `help / whoami / skills / projects / contact / clear`. 같은 정보는 일반 페이지에도 있음.
  - 4 팔레트: 버튼 클릭으로 열기(실제 사이트는 ⌘K / Ctrl+K도). 입력으로 필터, ↑↓ 선택, Enter 실행, Esc 닫기. 페이지 이동·언어 전환·PDF·메일 복사. 항목을 「ページ」「操作」로 묶고 오른쪽에 짧은 힌트를 표시. 하단에 「↑↓ 選択 / Enter 実行 / Esc 閉じる」.
  - 시안은 색·글꼴·데이터가 임시다(어두운 고정 배경, 다른 글꼴). 색·글꼴은 현재 디자인 토큰(`docs/DESIGN.md` §2)을 따르고, 시안에서는 **구성과 동작만** 가져온다.
- 현재 코드: 헤더 도구 영역(`SiteHeader.astro`의 `.site-header__tools`)에 언어 전환과 테마 버튼이 있다. 테마 버튼은 JS가 있을 때만 보인다(`html.js`). 언어 전환 URL은 `src/i18n/paths.ts`의 `switchLocalePath`가 서버에서 만든다. 콘텐츠 조회는 `src/lib/content.ts`의 함수만 쓴다.

## 범위

포함:

1. **구조와 로딩 (기본안)**
   - **런처**: 작은 Astro `<script>` 모듈(`src/scripts/command-launcher.ts`)을 모든 페이지에 넣는다. ⌘K(macOS) / Ctrl+K(그 밖) 키 입력과 헤더 버튼 클릭을 받아, 처음 열 때 `import()`로 UI 모듈을 불러온 뒤 연다. 런처는 React를 import하지 않는다. 런처는 테마 버튼 처리와 함께 헤더 스크립트 1개로 나가며, 헤더 스크립트는 압축 전 4KB 이하(처음 기준은 런처 1.5KB 이하였으나 Vite 동적 import 도우미 약 1.7KB를 설정으로 뺄 수 없어 2026-10-31 사용자 결정으로 변경).
   - **UI 모듈**: `src/components/interactive/` 아래 React 컴포넌트(팔레트, 터미널, 둘을 관리하는 루트)와 마운트 함수. 마운트는 `react-dom/client`의 `createRoot`로 `<body>` 끝에 만든 컨테이너에 한 번만 한다. Astro `client:*` 지시어(island)는 쓰지 않는다. 이유: `client:idle`·`client:visible`도 열지 않은 방문자에게 React를 받게 하므로, "열 때 불러온다"(DESIGN §3)를 지키려면 동적 import가 맞다.
   - **명령 정의**: `src/components/interactive/commands.ts` 하나가 팔레트 항목과 터미널 명령을 함께 정의한다(id, 묶음, 표시 이름, 검색어, 터미널 명령 이름, 실행 함수 또는 출력). React를 import하지 않는 순수 TypeScript로 둔다. 팔레트와 터미널은 이 목록만 읽고 각자 명령을 따로 정의하지 않는다.
   - **콘텐츠 데이터**: 터미널 출력과 프로젝트 항목에 필요한 값(프로필 이름·직함·한 줄 소개, 기술 스택 분류와 이름, 프로젝트 제목·상세 URL, 연락처, 이력서 링크)은 언어별 정적 JSON 엔드포인트(`src/pages/ja/commands.json.ts`, `src/pages/en/commands.json.ts` → `/ja/commands.json`, `/en/commands.json`)로 빌드 시 만들고 열 때 `fetch`한다. 페이지 4개(Home·About·Projects·Contact)의 목적지 URL도 서버의 `localizePath` 결과를 같은 JSON에 넣는다(클라이언트에서 경로 규칙을 다시 만들거나 `astro:i18n`을 import하지 않는다). 값은 `src/lib/content.ts`에 추가하는 조회 함수(예: `getCommandData(locale)`)에서 만들어 페이지와 같은 규칙 검사를 거친다. 이유: 모든 페이지 HTML에 데이터를 넣지 않고, 원고 반영 때 콘텐츠 파일만 바꾸면 되게 하기 위함이다. `trailingSlash: 'always'`에서 `.json` 엔드포인트가 그 경로로 출력되는지 구현 시 확인하고 결과를 PR에 적는다.
   - **현재 페이지 정보**: 언어 전환 대상 URL(같은 페이지의 다른 언어)은 서버에서 `switchLocalePath`로 계산해 헤더 버튼의 `data-*` 속성으로 넘긴다. 클라이언트에서 경로 규칙을 다시 구현하지 않는다.
   - **UI 문구**: 팔레트·터미널의 버튼 이름, 묶음 이름, 안내 문구, 터미널 도움말·오류 문구는 `src/i18n/ui.ts`에 둔다. UI 모듈은 언어별 문구를 위 JSON에 함께 받거나 번들에 포함한다(어느 쪽인지 PR에 적는다). 터미널 명령 이름(`help` 등)은 두 언어 공통 영어다.
   - **새 의존성 없음**: Motion·GSAP, 퍼지 검색·다이얼로그 라이브러리를 추가하지 않는다. 전환 효과는 CSS로 한다. A2의 "Motion / GSAP"은 T10에서 쓰지 않는다(필요해지면 사용자 확인 후 별도 결정).
   - 대체안: React 없이 같은 동작을 만드는 편이 크게 단순하면 바꿔도 되지만, A2 결정과 다르므로 PR에 이유와 크기 비교를 적고 사용자 확인을 받는다.

2. **명령 팔레트 (컨셉 4)**
   - **여는 방법**: ⌘K / Ctrl+K(페이지 어디서든, 입력 중이어도. IME 변환 중(`isComposing`)이면 무시), 헤더 도구 영역의 버튼(검색 아이콘 버튼, 44×44px, 언어 전환 앞). 버튼은 테마 버튼처럼 `html.js`일 때만 보인다. 접근 가능한 이름은 「コマンドパレットを開く」/「Open command palette」(기본안), `aria-keyshortcuts="Meta+K Control+K"`. 팔레트가 열린 상태에서 ⌘K / Ctrl+K는 닫는다.
   - **항목 (기본안, 묶음 순서대로)**:
     - 「ページ」: ホーム・経歴・プロジェクト・連絡先(내비게이션 문구 `pages.*.name` 재사용). 오른쪽 힌트는 경로(`/ja/about/` 등).
     - 「プロジェクト」: 프로젝트 상세 각각(목록 순서). 검색으로 바로 상세에 갈 수 있게 한다.
     - 「操作」: 다른 언어로 전환(「English に切り替え」/「日本語に切り替え」), 라이트 모드·다크 모드·시스템 설정에 맞추기(현재 적용 중인 것은 표시만 하고 제외하지 않는다), 메일 주소 복사(클립보드를 쓸 수 있을 때만), 이력서 PDF(`profile.resumes`가 있을 때만, 각각), 터미널 열기.
   - **검색**: 입력값을 공백으로 나눈 모든 단어가 항목의 표시 이름 또는 검색어(영어 이름·경로·터미널 명령 이름)에 부분 일치(대소문자 무시)하면 남긴다. 일치 항목이 없으면 「「…」に一致する項目はありません」. 묶음 제목은 남은 항목이 있는 묶음만 보인다.
   - **조작**: ↑↓로 선택(끝에서 처음으로 돌지 않음, Home/End는 입력란 커서 이동 그대로), Enter 실행(IME 변환 중이면 실행하지 않음), 마우스 클릭 실행, Esc 닫기, 배경 클릭 닫기. 입력이 바뀌면 첫 항목을 선택한다.
   - **실행 결과**: 페이지 이동·언어 전환은 해당 URL로 이동(`location.assign`). 테마는 `src/scripts/theme.ts` 함수로 바꾸고 팔레트를 닫는다. 「システム設定に合わせる」를 위해 `theme.ts`에 저장 값을 지우고 `data-theme`을 없애는 함수(예: `clearTheme`)를 추가하고, 헤더 테마 버튼의 `aria-pressed`가 따라가는지 확인한다. 메일 복사는 결과(「コピーしました」 등, T07 문구 재사용)를 화면 하단의 `role="status"` 알림으로 약 2초 보여준다. 이 알림은 팔레트 `<dialog>` 밖(UI 루트 컨테이너 안, 팔레트를 닫아도 남는 위치)에 두어야 화면 낭독기가 결과를 읽는다. 알림 영역은 처음 마운트할 때 비어 있는 상태로 만들어 두고 문구만 바꾼다. 터미널 열기는 팔레트를 닫고 터미널을 연다.
   - **접근성**: `<dialog>`를 `showModal()`로 연다(포커스 가두기·배경 비활성은 브라우저 기본 동작). 이름은 「コマンドパレット」. 입력란은 [WAI-ARIA APG 콤보박스(목록 자동완성) 패턴](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)을 따른다: 입력란 `role="combobox"` + `aria-expanded` + `aria-controls`, 목록 `role="listbox"`, 항목 `role="option"` + `aria-selected`, 선택은 `aria-activedescendant`로 알리고 포커스는 입력란에 둔다. 남은 항목 수는 시각적으로 숨긴 `role="status"`로 알린다(예: 「8 件」). 닫으면 열기 전 포커스 위치(헤더 버튼 또는 단축키를 누른 곳)로 돌려보낸다.

3. **터미널 모드 (컨셉 3)**
   - **여는 방법**: 팔레트의 「ターミナルを開く」 항목만(이스터에그). 헤더·푸터에 별도 버튼을 두지 않는다(기본안).
   - **화면**: 팔레트와 같은 `<dialog>` 방식의 창. 제목 줄(`guest@choi: ~` 같은 모노스페이스 장식 문구 + 닫기 버튼), 출력 영역, `$` 프롬프트 입력란, 그 아래 추천 명령 버튼 줄(`help`, `whoami`, `skills`, `projects`, `contact`, `clear`). 창 크기는 기본안 너비 `min(880px, 100% - 32px)`, 높이 `min(600px, 100dvh - 32px)`. 모노스페이스는 `--font-mono`. 색은 현재 테마 토큰(surface, text, text-muted, accent, error)을 쓰며 시안의 고정 어두운 색은 쓰지 않는다.
   - **명령 (기본안)**: `help`(명령 목록과 한 줄 설명), `whoami`(프로필 이름·직함·한 줄 소개), `skills`(기술 스택 분류별 이름, 주력 기술 표시), `projects`(프로젝트 제목 목록, 각각 상세 링크), `contact`(메일·GitHub·LinkedIn, 링크), `open <page>`(`home`·`about`·`projects`·`contact` 이동), `lang <ja|en>`, `theme <light|dark|system>`, `clear`, `exit`(닫기). 앞뒤 공백 무시, 대소문자 무시. 모르는 명령은 「command not found: … （「help」で一覧）」을 error 색으로 출력. 실행한 입력은 `$ 명령` 줄로 출력에 남긴다. 이 명령들은 `commands.ts`의 같은 정의에서 나온다(예: `open about`과 팔레트의 「経歴」은 같은 명령).
   - **출력의 링크**: 프로젝트 제목, 연락처, 페이지 이동 안내는 실제 `<a href>`로 출력해 클릭·Tab으로 이동할 수 있게 한다.
   - **임시 문구**: 출력 값은 페이지와 같은 콘텐츠이며 임시 항목은 페이지와 같은 「（仮）」/`(placeholder)` 표식을 그대로 보인다. 터미널에만 있는 정보를 만들지 않는다.
   - **편의 기능**: ↑↓로 이전에 실행한 명령 불러오기(그 창을 연 동안만, 저장하지 않음). 출력은 최근 200줄까지만 유지. 자동 완성(Tab)은 하지 않는다(Tab은 포커스 이동에 둔다).
   - **접근성**: 이름은 「ターミナル」. 입력란은 시각적으로 숨긴 `<label>`(「コマンド」)을 가진다. 출력 영역은 `role="log"`(새 출력이 스크린 리더에 읽힘). 추천 명령 버튼은 실제 `<button>`이며 누르면 해당 명령을 실행하고 포커스를 입력란에 둔다. 처음 열면 입력란에 포커스, 첫 출력은 환영 문구 + 「`help` と入力するか、下のボタンを押してください。」. 닫으면 팔레트를 연 원래 위치로 포커스를 돌려보낸다(팔레트 자체가 아니라).

4. **모션**
   - 팔레트·터미널 열기: 불투명도 0 → 1, `translateY(-8px)` → 0, 200ms, `--ease-standard`(기존 토큰). 닫기는 효과 없이 바로.
   - `prefers-reduced-motion: reduce`에서는 전환 효과 없이 바로 보이고 닫힌다. 기능은 같다.
   - 레이아웃 이동이 없어야 한다. 헤더 버튼은 처음부터 자리를 차지하고(`html.js`일 때), 팔레트·터미널은 모달이라 본문 배치를 바꾸지 않는다.

5. **스타일 위치**
   - 팔레트·터미널 CSS는 UI 모듈이 import하는 파일(예: `src/components/interactive/command-ui.css`)에 두어 열 때 함께 불러온다. 첫 화면 CSS에는 헤더 버튼 스타일만 더한다.
   - 대비는 기존 토큰 조합만 쓴다. 새 조합(예: 선택된 항목 배경 위 글자)이 생기면 `docs/DESIGN.md`에 대비 표를 추가한다.

6. **문서**
   - `docs/DESIGN.md`: §3 공통 구현 규칙에 T10 방식(런처 + 동적 import, `<dialog>`, React 마운트), 새 절 "명령 팔레트·터미널 (T10)"(여는 방법, 항목·명령 목록, 조작, 접근성, 크기, 대비, 모션), §4 헤더(도구 영역에 팔레트 버튼)와 테마 버튼("시스템 설정으로 되돌리기" 결과)을 갱신한다.
   - `docs/ARCHITECTURE.md` §2: 디렉터리 구조에 `src/components/interactive/`, `src/scripts/command-launcher.ts`, `commands.json` 엔드포인트를 추가하고, "페이지가 받는 JS" 문장에 런처 크기와 열 때 받는 청크 크기(JS·CSS, 압축 전·gzip)를 적는다. 이제 React 클라이언트 번들이 실제로 쓰이므로 T01부터 있던 "참조되지 않는 React 번들" 문장과 `docs/PLAN.md` §8 해당 항목을 실제 상태로 고친다.

제외:

- 컨셉 1·2·5 변경 (T08·T09에서 완료)
- 터미널의 게임·숨은 명령 추가, 명령 기록 저장, Tab 자동 완성
- 팔레트에서 본문 텍스트 전체 검색(페이지 내용 검색)
- 연락 폼 열기 등 단계 8 동적 기능
- 디자인 토큰 값 변경, 새 의존성(`package.json`, `pnpm-lock.yaml` 변경)
- 원고 반영(실제 문구), 기존 페이지 UI 문구 변경

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `src/components/interactive/*` (새 폴더: `commands.ts`, React 컴포넌트, 마운트 함수, CSS)
- `src/scripts/command-launcher.ts` (새 파일)
- `src/components/CommandButton.astro` (새 파일, 헤더 버튼)
- `src/components/SiteHeader.astro` (버튼 배치)
- `src/layouts/BaseLayout.astro` (런처를 모든 페이지에 넣을 때만)
- `src/pages/ja/commands.json.ts`, `src/pages/en/commands.json.ts` (새 파일)
- `src/lib/content.ts` (조회 함수 추가만. 기존 함수의 동작은 바꾸지 않는다)
- `src/i18n/ui.ts` (새 키 추가만. 기존 문구는 바꾸지 않는다)
- `src/scripts/theme.ts` (시스템 설정 되돌리기 함수 추가)
- `src/components/ThemeToggle.astro` (`clearTheme` 뒤 `aria-pressed`를 맞추는 데 필요할 때만)
- `eslint.config.mjs`, `tsconfig.json` (React 파일 검사에 필요할 때만. 이유를 PR에 적는다)
- `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/PLAN.md`, `docs/tasks/T10-command-palette-terminal.md`
- `src/styles/tokens.css`의 값은 바꾸지 않는다.

## 완료 조건

- [x] `/ja/`, `/en/`의 모든 페이지에서 ⌘K / Ctrl+K와 헤더 버튼으로 팔레트가 열리고, 검색·↑↓·Enter·클릭·Esc·배경 클릭이 위 규칙대로 동작한다. IME 변환 중 Enter는 실행하지 않는다. (IME 변환 중에는 ↑↓·Enter 모두 처리하지 않음. `isComposing`·keyCode 229 코드 확인만. 실제 IME 입력은 미확인, `docs/PLAN.md` §8)
- [x] 팔레트에서 모든 페이지·프로젝트 상세로 이동, 다른 언어의 같은 페이지로 전환(프로젝트 상세 포함), 라이트·다크·시스템 설정 테마 적용, 메일 복사, 터미널 열기가 된다. 테마 변경 후 헤더 테마 버튼의 아이콘·`aria-pressed`가 맞고, 새로고침해도 선택(시스템 설정은 저장 값 없음)이 유지된다. 이력서가 없는 지금은 이력서 항목이 보이지 않는다.
- [x] 터미널에서 위 명령이 모두 동작하고, 추천 명령 버튼·↑↓ 기록·`clear`·`exit`·모르는 명령 오류가 규칙대로다. 출력의 링크가 클릭·키보드로 이동된다. 출력 값이 페이지 콘텐츠와 같다(임시 표식 포함).
- [x] 팔레트와 터미널의 항목·명령이 `commands.ts` 한 곳에서 나온다(같은 명령을 두 번 정의하지 않음).
- [x] 키보드만으로 열기 → 선택 → 실행 → 닫기가 되고, 닫으면 포커스가 열기 전 위치로 돌아간다(터미널은 팔레트를 연 원래 위치). 접근성 트리에서 팔레트는 dialog + combobox + listbox/option, 터미널은 dialog + 이름 있는 입력란 + log로 보인다.
- [x] 열기 전: 페이지가 받는 JS는 main 대비 늘지 않은 파일 수(헤더 스크립트 1개, 압축 전 4KB 이하)이고, React·UI 청크·`commands.json`은 요청되지 않는다(Network 패널). 처음 열 때 받는 JS·CSS 청크와 JSON 크기(압축 전·gzip)를 PR과 `docs/ARCHITECTURE.md`에 적는다. 두 번째 열 때는 다시 받지 않는다. (실측: 헤더 스크립트 압축 전 약 3.5KB·gzip 약 1.6KB. main의 테마 인라인 모듈 약 0.8KB 대체. 기준은 2026-10-31 사용자 결정으로 1.5KB에서 변경)
- [x] JS를 끄면 헤더 버튼이 보이지 않고 나머지 화면은 main과 같다. 모든 페이지의 CLS가 main과 같다. 320px·375px·1280px에서 가로 스크롤이 생기지 않고, 320px 헤더가 T03 규칙(줄바꿈, 가로 스크롤 없음) 안에 있다.
- [x] `prefers-reduced-motion: reduce`에서 전환 효과 없이 열리고 닫히며 기능은 같다. 라이트·다크 모두 대비가 `docs/DESIGN.md` 기준을 지킨다.
- [x] 새 의존성이 없다(`package.json`, `pnpm-lock.yaml` 변경 없음). `astro:` 가상 모듈 등 서버 전용 코드를 UI 모듈이 import하지 않는다.
- [x] PR 본문에 최신 커밋 기준 캡처가 있다: 팔레트 ja 라이트 1280px(열린 직후), 팔레트 ja 다크 375px(검색어 입력, 결과 일부), 팔레트 en 라이트 1280px(일치 없음), 터미널 ja 다크 1280px(`help`·`whoami` 실행 후), 터미널 ja 라이트 375px(추천 명령 버튼 보이는 상태), 헤더 ja 라이트 320px(버튼 배치).
- [x] `docs/DESIGN.md`, `docs/ARCHITECTURE.md`가 위 "문서" 항목대로 갱신되어 있다.
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`와 GitHub CI가 통과한다.
- [x] `docs/PLAN.md`의 진행 상태와 작업 지시서 표 갱신, 비밀 값 미포함.

## 확인 방법

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm check && pnpm build
# 엔드포인트 출력과 내용
ls dist/ja/commands.json dist/en/commands.json && head -c 400 dist/ja/commands.json
# 런처만 페이지에 있고 React 청크는 동적 import로 분리되었는지
ls -l dist/_astro/*.js
pnpm preview
```

- `/ja/`, `/ja/about/`, `/ja/projects/<slug>/`, `/en/contact/`에서 단축키·버튼으로 팔레트를 열고 각 항목을 실행한다. 터미널은 팔레트에서 열어 모든 명령과 추천 버튼을 실행한다.
- 키보드만 쓰고, 개발자 도구 Accessibility 패널로 역할·이름·`aria-activedescendant`를 확인한다. 가능하면 스크린 리더(VoiceOver, NVDA)로 항목 이동과 터미널 출력 읽기를 확인하고, 못 했으면 PR에 미확인으로 적는다.
- Network 패널에서 열기 전후 요청을 비교하고, Rendering에서 `prefers-reduced-motion: reduce`를 켜서 확인한다. JavaScript를 끄고 헤더를 확인한다.
- Firefox·Safari 실기(⌘K 동작, `<dialog>`, IME)는 이 환경에서 확인하지 못하면 PR에 미확인으로 적는다.

## 메모

- 아래는 지시서 작성 시 정한 기본안이다. 사용자(choi)가 구현 PR에서 바꿀 수 있다: 헤더 버튼 위치·이름, 팔레트 항목 구성(프로젝트 상세 포함, 시스템 설정 테마 포함), 터미널 여는 곳(팔레트만), 터미널 명령 목록과 제목 줄 문구, 창 크기, 열기 효과 200ms.
- Ctrl+K는 Chrome·Firefox(Windows·Linux)에서 주소창 검색 단축키다. 페이지에서 `preventDefault`하면 사이트 동작이 우선한다. 이 동작이 브라우저마다 같은지는 구현 시 확인하고 결과를 PR에 적는다.
- `<dialog>`를 닫을 때 브라우저가 이전 포커스로 되돌리는 동작은 브라우저·버전마다 다를 수 있으므로, 열 때 포커스 요소를 기억해 직접 돌려보낸다.
- React 19 + ReactDOM 클라이언트 청크는 처음 열 때 수십 KB(gzip) 수준일 것으로 예상하지만 측정 전이다. 측정값이 크다고 판단되면 PR에 적고 사용자와 대체안(React 없이 구현)을 상의한다.
- 터미널 출력에서 HTML을 문자열로 만들지 않는다(`dangerouslySetInnerHTML` 금지). 콘텐츠 값은 React가 텍스트로 출력한다.
