# T04: Home 페이지 (한 줄 소개·핵심 기술·대표 프로젝트, 임시 문구)

| 항목 | 값 |
| --- | --- |
| 단계 | 4 |
| 선행 작업 | T03 (PR #11) |
| 담당 | 미배정 |
| 상태 | todo |
| 브랜치 | `<agent>/T04-home` |

## 목표

`/ja/`, `/en/` Home의 T02 확인 화면을 실제 Home 구성(한 줄 소개, 핵심 기술, 대표 프로젝트 2~3개)으로 바꾼다. 콘텐츠 원고가 아직 없으므로 **임시 문구(placeholder)** 로 구조와 화면을 먼저 완성하고, 원고를 받으면 콘텐츠 파일만 바꾸면 되게 한다.

## 배경

- `docs/PLAN.md` §3 페이지 구성(Home: 한 줄 소개, 핵심 기술, 대표 프로젝트 2~3개), §5 단계 4
- 2026-10-30 사용자 결정: 원고 수집 전에 지시서를 구조·완료 조건 중심으로 쓰고, 콘텐츠는 임시 문구로 진행한다. 임시 문구 규칙은 `docs/CONTENT.md` "임시 문구 규칙".
- `docs/CONTENT.md`: 한 줄 소개(일본어/영어 각 1문장), 핵심 기술 3~6개, 대표 프로젝트 카드(課題 → 設計 → 結果 → 技術, 정량 지표 포함), "기술 스택 표기 규칙"(주력 기술 「主軸」, Home 핵심 기술은 주력 기술을 모두 포함)
- `docs/DESIGN.md` §1(30초 안에 누구·무엇·연락 방법), §2(토큰, 타이포그래피와 `auto-phrase` 대안), §3(컨셉 1 Hero 디코딩, 컨셉 2 프로젝트 카드는 단계 5)
- `docs/ARCHITECTURE.md` §2: 페이지 본문 콘텐츠는 `src/content/`(content collections), UI 문구는 `src/i18n/ui.ts`. 화면 컴포넌트는 `src/components/pages/`
- `docs/PLAN.md` §8 T03 이월 항목: Home 히어로 등 긴 일본어 제목이 Firefox·Safari(`auto-phrase` 미지원)에서 단어 중간에서 끊길 수 있다.
- 현재 `src/components/pages/HomePage.astro`가 `DesignPreview.astro`(T02 확인 화면)를 본문으로 쓴다. `.tag`, `.tag--featured`, `.card`, `.button` 스타일은 `src/styles/global.css`에 있다.

## 범위

포함:

1. **콘텐츠 구조 (content collections)**
   - Home에 필요한 콘텐츠를 `src/content/`에 두고 스키마(zod)로 검증한다.
   - Astro 7.4.4 기준(설치 패키지의 코드·타입 정의로 확인): 설정 파일은 `src/content.config.ts`, loader는 `astro/loaders`의 `glob`·`file`, 스키마의 `z`는 `astro/zod`에서 가져온다. `astro:content`의 `z`는 deprecated이며 Astro 8에서 제거 예정이므로 쓰지 않는다. 세부 사용법은 Astro 공식 문서로 확인한다.
   - 아래 세 종류를 만든다. 컬렉션 이름·파일 형식(YAML/JSON/Markdown)은 조정할 수 있고, 고른 구조와 이유를 `docs/ARCHITECTURE.md` §2에 기록한다.

   | 콘텐츠 | 필드(최소) | 메모 |
   | --- | --- | --- |
   | 프로필 | 이름 표기, 직함(예: バックエンドエンジニア), 한 줄 소개, Home `<meta name="description">` | 언어별 1건. About·Contact에서도 재사용할 수 있게 Home 전용 이름을 피한다 |
   | 기술 스택 | 분류(일본어·영어 이름), 기술 이름, 주력 여부(`primary`), Home 표시 순서(있을 때만 Home에 표시) | T05 About의 기술 스택 목록과 **같은 데이터**를 쓴다. 기술 이름은 언어 공통 |
   | 프로젝트 | slug, 제목, 한 줄 요약, 기간, 역할, 대표 성과 1~2개(수치 포함 문구), 기술 태그, 대표 여부·순서 | 카드에 필요한 필드만 정한다. 상세(課題 → 設計 → 結果 → 技術) 본문 필드는 Projects 지시서에서 추가한다 |

   - 언어별 콘텐츠(프로필, 프로젝트)는 기본안으로 같은 slug를 쓰는 언어 폴더 방식(예: `src/content/projects/ja/<slug>.yaml`, `src/content/projects/en/<slug>.yaml`)을 쓴다. 한쪽 언어에만 있는 항목이 있으면 빌드가 실패하게 한다. 기술 스택은 기술 이름이 언어 공통이므로 한 파일에 분류 이름 두 벌(ja/en)을 두는 것을 기본안으로 하며, 이 경우 짝 검사 대상이 아니다.
   - 기간은 날짜 타입이 아닌 문자열 필드(예: `2023.04 – 2025.03`)로 둔다. 임시 값(`20XX.XX`)도 스키마를 통과해야 하기 때문이다.
   - 스키마에 `placeholder: boolean` 필드를 둔다(아래 2).
   - 아래 규칙은 빌드 시점에 검사해 어기면 빌드가 실패하게 한다: 대표 프로젝트 2~3개, Home 핵심 기술 3~6개, 주력 기술은 모두 Home 핵심 기술에 포함, 주력 기술 전체 2~4개·분류당 0~2개(`docs/CONTENT.md` "기술 스택 표기 규칙"). 항목 하나의 스키마로는 여러 항목에 걸친 규칙을 검사할 수 없으므로, 콘텐츠 조회 함수(예: `src/lib/content.ts`)가 `getCollection` 결과를 검사하고 어기면 어떤 규칙인지 적은 오류를 던지는 방식을 기본안으로 한다.

2. **임시 문구** (`docs/CONTENT.md` "임시 문구 규칙"을 따른다)
   - 모든 임시 항목은 `placeholder: true`로 표시하고, 화면 문구 자체에 표식(일본어 「（仮）」, 영어 `(placeholder)`)을 넣는다. 표식을 넣는 최소 범위: 프로필의 직함·한 줄 소개, 프로젝트의 제목·한 줄 요약·대표 성과, 기술 이름(예: `Go（仮）`). 표식은 콘텐츠 값에 직접 쓰고, 컴포넌트가 `placeholder` 값을 보고 붙이지 않는다(원고로 바꿀 때 값만 고치면 되게 하기 위함).
   - 실제 인물·회사·수치로 오해될 문구를 쓰지 않는다. 회사명은 「A社」「Company A」처럼, 성과 수치와 기간은 「〇〇%」「XX ms」「20XX.XX」처럼 숫자가 아닌 기호로 둔다. 기술 이름은 실제 기술명을 써도 되지만 choi의 실제 경험으로 단정하지 않는다(표식 + `placeholder: true`).
   - 이름 표기는 현재 `src/i18n/ui.ts`의 `site.name`(`choi`)을 그대로 쓴다. 사이트 이름과 프로필 이름의 관계(같은 값을 한 곳에서 관리할지)는 구현 PR에서 정하고 이유를 적는다.
   - 빌드 로그에 임시 항목 수를 경고로 출력한다(예: `[content] placeholder entries: 7`). 배포 전 0건 확인용이다(PLAN §8 이월 항목).

3. **Home 화면** (`src/components/pages/HomePage.astro`와 하위 컴포넌트)
   - 순서: 히어로 → 핵심 기술 → 대표 프로젝트. 첫 화면(375×667px 기준)에서 이름·직함·한 줄 소개가 스크롤 없이 보인다.
   - **히어로**: h1(이름 또는 한 줄 소개, 구현 PR에서 어느 쪽을 h1로 할지 정하고 이유를 적는다), 직함, 한 줄 소개, 행동 링크 2개(「プロジェクトを見る」→ Projects, 「連絡する」→ Contact). 링크는 `localizePath`로 만든다. 단계 5 컨셉 1(디코딩)이 감쌀 수 있게 최종 문구가 처음부터 HTML에 있어야 한다.
   - **핵심 기술**: h2 + 태그 목록(`<ul>`/`<li>`). 주력 기술은 `.tag--featured`(채운 태그)와 시각적으로 숨긴 「主軸」 텍스트, 나머지는 `.tag`. 설명 문구로 "채운 태그 = 주력 기술"을 알린다. 태그는 링크·버튼이 아니다. 기존 `.tag` 스타일을 재사용하고, 필요하면 태그 컴포넌트로 뽑아 T05가 재사용하게 한다.
   - **대표 프로젝트**: h2 + 카드 2~3개(`<ul>`/`<li>` 안의 `<article>`). 카드에 제목(h3), 한 줄 요약, 기간·역할, 대표 성과, 기술 태그를 모두 펼쳐 보인다(정보를 숨기는 효과 금지). 640px 미만 1열, 640px 이상 2열, 1024px 이상 카드 3개면 3열을 기본안으로 한다.
   - **카드 링크**: 프로젝트 상세 페이지가 아직 없으므로 이번에는 카드 전체 링크를 만들지 않는다. 섹션 끝에 「すべてのプロジェクト」→ Projects 링크 하나를 둔다. 상세 페이지가 생기면 카드 전체 링크(컨셉 2)로 바꾼다(Projects 지시서).
   - 연락처 링크 자체(이메일, GitHub 등)는 원고 미수집이므로 넣지 않는다(Contact 지시서).
   - 시맨틱: 섹션마다 `<section aria-labelledby>`, 제목 단계 h1 → h2 → h3 건너뜀 없음.

4. **일본어 제목 줄바꿈 (PLAN §8 T03 이월)**
   - 히어로 h1과 한 줄 소개처럼 한 줄을 넘을 수 있는 일본어 문구는 콘텐츠 데이터에서 문절 단위로 나눠(예: 문자열 배열) `display: inline-block` 문절 span으로 출력하는 것을 기본안으로 한다. `<wbr>` + `word-break: keep-all` 방식이 낫다고 판단하면 그쪽을 써도 되며 이유를 적는다.
   - 스크린 리더가 문절마다 끊어 읽지 않는지(span 사이에 공백·구두점이 추가되지 않는지) 확인한다. 영어는 일반 문자열이다.
   - Chromium에서 `auto-phrase` 적용/`word-break: normal` 근사 두 조건으로 320px·375px·1280px 화면을 비교한다. Firefox·WebKit을 쓸 수 있으면 실제 화면도 확인하고, 못 하면 "미확인"으로 적는다. 결과를 `docs/DESIGN.md` §2 타이포그래피에 반영한다.
   - BudouX 등 새 의존성은 도입하지 않는다.

5. **정리**
   - `DesignPreview.astro`와 `src/i18n/ui.ts`의 `design.*` 문구를 삭제한다. T02 캡처(`docs/screenshots/T02-*`)는 이력으로 남긴다. 삭제하지 않고 다른 경로에 남기려면 이유를 PR에 적는다.
   - Home `<meta name="description">`의 「準備中」 문구를 프로필 콘텐츠 값으로 바꾼다. Home의 `<title>`은 사이트 이름만 쓰는 T03 규칙을 유지한다.
   - 섹션 제목·행동 링크·설명 문구 같은 UI 문구는 `src/i18n/ui.ts`, 콘텐츠 값은 `src/content/`에 둔다. 컴포넌트에 문구를 하드코딩하지 않는다.

6. **문서**: `docs/DESIGN.md`에 Home 섹션 구성·전환점별 배치·카드 구성 규칙을 추가하고, `docs/ARCHITECTURE.md` §2에 콘텐츠 디렉터리·스키마 위치·언어별 콘텐츠 방식을 기록한다.

제외:

- 실제 원고 반영 (원고를 받은 뒤 별도 PR. 콘텐츠 파일만 바꾸는 작업)
- 컨셉 1 Hero 디코딩, 컨셉 2 카드 틸트·카드 전체 링크 전환 (단계 5, 카드 링크는 Projects 지시서)
- About·Projects·Contact 페이지 본문, 프로젝트 상세 페이지·상세 필드 (T05 이후)
- 아바타·사진 (원고 미수집, 사용 여부 미정)
- canonical, `hreflang` alternate, OG 이미지, sitemap (단계 6)
- 디자인 토큰 값 변경, 글꼴 CSS 증가

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `src/content/**`, `src/content.config.ts`
- `src/components/**` (`DesignPreview.astro` 삭제 포함), `src/components/pages/HomePage.astro`
- `src/i18n/ui.ts` (Home UI 문구 추가, `design.*` 삭제, `pages.home.description` 정리)
- `src/pages/ja/index.astro`, `src/pages/en/index.astro` (필요할 때만)
- `src/styles/global.css` 및 Home용 새 CSS. `src/styles/tokens.css`의 값은 바꾸지 않는다(새 토큰 추가는 이유를 PR에 적는다).
- `src/lib/**` 또는 `src/utils/**` (콘텐츠 검사·조회 함수를 둘 경우)
- `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/CONTENT.md`(수집 현황 상태 표기만), `docs/PLAN.md`, `docs/tasks/T04-home.md`
- `docs/screenshots/T04-*` (캡처를 저장소에 넣을 경우만)
- 새 의존성은 추가하지 않는다(zod는 Astro가 제공하는 것을 쓴다). 필요하면 PR에 이유·크기를 적고 사용자 확인을 받는다.

## 완료 조건

- [ ] `/ja/`, `/en/` Home에 히어로(이름·직함·한 줄 소개·행동 링크 2개), 핵심 기술 3~6개, 대표 프로젝트 카드 2~3개가 표시되고, T02 확인 화면은 없다.
- [ ] 화면의 콘텐츠 값은 모두 `src/content/`에서, UI 문구는 `src/i18n/ui.ts`에서 온다. 영어 UI 문구 키가 빠지면 `pnpm check`가 실패한다(T03 구조 유지).
- [ ] 콘텐츠 검사: ① 필수 필드 누락 ② 한 언어에만 있는 항목 ③ 대표 프로젝트 수가 2~3개 밖 ④ Home 핵심 기술 수가 3~6개 밖 ⑤ 주력 기술이 Home 핵심 기술에서 빠짐 ⑥ 주력 기술이 전체 2~4개·분류당 0~2개 밖 — 각각 빌드가 실패한다. ①~⑥을 한 번씩 재현해 오류 메시지를 PR에 적는다.
- [ ] 모든 임시 항목이 `placeholder: true`이고 범위 2의 최소 범위에 「（仮）」/`(placeholder)` 표식이 있다. 실제 회사명과 실제처럼 보이는 숫자(성과 수치, 기간)가 없다. 빌드 로그에 임시 항목 수가 나온다.
- [ ] 주력 기술은 채운 태그 + 시각적으로 숨긴 「主軸」/`Core` 텍스트로 구분되고, 설명 문구로 범례를 알린다. 채운 태그 글자 대비 4.5:1 이상(기존 토큰: 라이트 5.00, 다크 8.14)을 유지한다.
- [ ] 375×667px 첫 화면에서 이름·직함·한 줄 소개가 스크롤 없이 보인다. ja/en × 320px·375px·1280px × 라이트·다크에서 가로 스크롤이 없다. 카드 열 수가 전환점(640px, 1024px)에 맞게 바뀐다.
- [ ] 제목 구조가 h1 1개 → h2(섹션) → h3(카드)로 건너뜀이 없고, 각 섹션이 `aria-labelledby`로 이름을 갖는다. 목록은 `<ul>`/`<li>`다. 키보드로 행동 링크·「すべてのプロジェクト」 링크에 도달하고 포커스 표시가 보인다.
- [ ] 히어로 일본어 제목 줄바꿈 확인 결과(Chromium `auto-phrase`·`normal` 근사, 320px·375px·1280px, Firefox·WebKit 확인 여부)가 PR과 `docs/DESIGN.md` §2에 있고, 문절 span 사이에 불필요한 공백·읽기 끊김이 없다.
- [ ] 클라이언트 JS가 T03(테마 스크립트)보다 늘지 않는다. React island를 쓰지 않는다. `/ja/`, `/en/`이 받는 CSS 크기를 T03 기준과 비교해 PR에 적는다.
- [ ] `prefers-reduced-motion: reduce`에서 새로 추가한 장식 전환 효과가 꺼진다(추가하지 않았다면 그렇게 적는다).
- [ ] `DesignPreview.astro`와 `design.*` 문구가 삭제되어 있고, 참조가 남지 않는다.
- [ ] PR 본문에 최신 커밋 기준 캡처가 있다: ja 라이트 375px(첫 화면), ja 다크 1280px(전체), en 라이트 1280px(전체), en 다크 320px(전체) 이상.
- [ ] `docs/DESIGN.md`(Home 구성·카드 규칙·줄바꿈 결과), `docs/ARCHITECTURE.md` §2(콘텐츠 구조), `docs/CONTENT.md`(수집 현황: 임시 문구로 구현된 항목 표시)가 갱신되어 있다.
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`와 GitHub CI가 통과한다.
- [ ] `docs/PLAN.md`의 진행 상태와 작업 지시서 표 갱신, 비밀 값 미포함.

## 확인 방법

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm check && pnpm build
pnpm preview
```

- `/ja/`, `/en/`에서 세 섹션과 카드 수, 「（仮）」/`(placeholder)` 표식, 행동 링크의 이동 경로(끝 슬래시 포함)를 확인한다.
- 콘텐츠 파일을 일시적으로 고쳐(필드 삭제, 영어 파일 삭제, 대표 프로젝트 1개·4개, 핵심 기술 2개·7개, 주력 기술의 Home 표시 해제, 주력 기술 1개·5개) `pnpm build`가 실패하는지 확인하고 원복한다.
- 브라우저 개발자 도구로 320px·375px·1280px, 라이트·다크, `prefers-reduced-motion` 에뮬레이션을 확인한다. 접근성 트리에서 제목 구조와 「主軸」 텍스트를 확인한다.
- Playwright를 쓸 수 있으면 Chromium·Firefox·WebKit에서 히어로 일본어 제목 줄바꿈을 비교한다. 쓸 수 없는 브라우저는 "미확인"으로 적는다.

## 메모

- 아래는 지시서 작성 시 정한 기본안이다. 사용자(choi)가 구현 PR에서 바꿀 수 있다.
  - 행동 링크 문구 안: 「プロジェクトを見る」「連絡する」 / `View projects`, `Get in touch`. 섹션 제목 안: 「主な技術」「代表プロジェクト」 / `Core skills`, `Featured projects`. 일본어 문구는 구현 PR에서 사용자 확인을 받는다.
  - 대표 프로젝트 카드는 이번에 링크를 만들지 않고 섹션 끝 링크 하나만 둔다.
  - 카드 배치: 1열 → 2열(640px) → 3열(1024px, 카드 3개일 때).
- 콘텐츠 스키마는 T05(About 기술 스택)·Projects 지시서가 이어서 쓴다. 필드 이름을 정할 때 영어 snake/camel 표기를 하나로 통일하고 `docs/ARCHITECTURE.md`에 적는다.
- 원고를 반영할 때 일본어 h1·한 줄 소개는 문절 단위로 나눠 넣어야 한다(범위 4). 원고 반영 PR에서 나누는 것을 AI가 돕는다.
- 임시 문구가 남은 채로 배포하지 않는다. 단계 8 배포 전에 빌드 로그의 임시 항목 수가 0인지 확인한다(PLAN §8).
- 원고를 받으면 콘텐츠 파일의 값을 바꾸고 `placeholder`를 `false`로 바꾸는 별도 PR로 처리한다. 화면 구조를 바꿀 필요가 생기면 그때 지시서를 따로 쓴다.
