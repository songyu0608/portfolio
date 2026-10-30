# T05: About/경력 페이지 (경력 타임라인·기술 스택·자격증·이력서 PDF, 임시 문구)

| 항목 | 값 |
| --- | --- |
| 단계 | 4 |
| 선행 작업 | T04 (PR #13) |
| 담당 | claude |
| 상태 | review |
| 브랜치 | `claude/project-thread-hjt6my` (실행 환경이 지정한 이름. 원칙상 이름은 `<agent>/T05-about`) |

## 목표

`/ja/about/`, `/en/about/`의 준비 중 화면을 실제 About 구성(이름·직함, 이력서 PDF, 경력 타임라인, 기술 스택, 자격증)으로 바꾼다. T04와 같이 원고가 없는 항목은 **임시 문구**로 구조와 화면을 먼저 완성하고, 원고를 받으면 콘텐츠 파일만 바꾸면 되게 한다. 사용자가 준 실제 값(기술 스택의 「AI活用開発」)은 실제 값으로 넣는다.

## 배경

- `docs/PLAN.md` §3 페이지 구성(About: 경력 타임라인, 기술 스택, 자격증, 이력서 PDF), §2 전문 분야(2026-10-30 변경: 백엔드 + AI 활용 개발)
- `docs/CONTENT.md`: "임시 문구 규칙", "자격증 표기 규칙"(시안 A), "기술 스택 표기 규칙"(시안 B, 분류 순서, 「AI活用開発」 항목)
- `docs/DESIGN.md` §3 컨셉 5(스크롤 경력 타임라인, 단계 5), §5 Home(태그·간격·전환점 규칙)
- `docs/ARCHITECTURE.md` §2 "콘텐츠 구조": `src/content/` + `src/lib/content.ts` 규칙 검사. T05가 컬렉션과 조회 함수를 같은 방식으로 추가한다.
- 기존 부품: `SkillTag.astro`(주력 표시 포함), `Phrases.astro`, `.tag`·`.tag-list`·`.button`·`.sr-only`(`src/styles/global.css`), `skills.yaml`(Home 핵심 기술과 같은 데이터)
- 현재 `src/pages/{ja,en}/about.astro`는 `ComingSoonPage`를 쓴다. Projects·Contact는 계속 `ComingSoonPage`를 쓴다.
- 화면 시안: claude.ai 디자인 캔버스 "T05 About 시안"(비공개 링크, 소유자 계정에서만 열림). ja 라이트·다크 1280px, 라이트 375px. 아래 범위 3의 배치는 이 시안을 글로 옮긴 것이다.

## 범위

포함:

1. **콘텐츠 구조** (T04의 `src/content.config.ts`, `src/lib/content.ts` 방식을 따른다)

   | 콘텐츠 | 파일(기본안) | 필드(최소) | 메모 |
   | --- | --- | --- | --- |
   | 경력 | `src/content/career/<ja\|en>/<slug>.yaml` | `placeholder`, `company`, `period`(문자열), `role`, `highlights`(1~3개), `order`(1 = 최신), `current`(기본 false) | 같은 slug가 두 언어에 모두 있어야 한다. 회사명은 공개 가능한 표기만 쓴다 |
   | 자격증 | `src/content/certifications.yaml` (언어 공통 1건) | `items[]`: `placeholder`, `name`(언어 공통 문자열 또는 `{ ja, en }`), `status`(`acquired` \| `studying`), `acquired`(문자열 `YYYY.MM`, `acquired`일 때만) | 배열 순서가 화면 순서. 기술 스택과 같이 이름만 언어별로 다를 수 있다 |
   | 이력서 PDF | `src/content/profile/<ja\|en>.yaml`에 `resumes` 추가 | `resumes[]`: `label`(링크 문구), `file`(`public/` 기준 경로, 예: `/files/resume-ja.pdf`). 0~2개, 생략 가능 | 일본어는 職務経歴書·履歴書, 영어는 Resume를 예정. **이번 PR에서 PDF 파일은 추가하지 않는다** |
   | 기술 스택 | 기존 `src/content/skills.yaml` | 필드 변경 없음 | 맨 앞에 분류 「AI活用開発」를 추가한다(아래 2) |

   - 기간·취득 연월은 날짜 타입이 아닌 문자열이다(임시 값 `20XX.XX`가 스키마를 통과해야 하기 때문, T04와 같음). 표시 순서는 경력은 `order`, 자격증은 배열 순서로 정한다.
   - 아래 규칙을 `src/lib/content.ts`에서 검사하고, 어기면 어긴 규칙을 적은 오류로 빌드를 멈춘다(T04와 같은 방식, 기존 오류 목록에 합친다).
     - 경력: 언어 짝(같은 slug), `order`·`current`가 언어마다 같음, `order`가 겹치지 않음, 1건 이상
     - 자격증: `studying`은 0~1개이고 목록 맨 끝, `acquired` 항목은 `acquired` 값이 있고 `studying` 항목은 없음
     - 이력서: `resumes[].file`은 `/`로 시작하는 사이트 내부 경로만 허용한다. 외부 URL(`https://` 등)과 `..`를 포함한 경로는 거부하고, `public/`을 기준으로 해석한 최종 경로가 `public/` 안에 있으며 그 파일이 실제로 있어야 한다(잘못된 공개 링크·죽은 링크 방지). `resumes`가 없거나 빈 배열이면 검사하지 않는다
     - 기술 스택: 분류 안에서 주력 기술(`primary`)이 주력이 아닌 기술보다 앞에 있다(`docs/CONTENT.md` "기술 스택 표기 규칙"). 기존 규칙(주력 2~4개 등)은 그대로
   - 조회 함수 `getAboutContent(locale)`를 추가한다: 프로필, 경력(`order` 순), 기술 스택 분류 전체(분류 이름·기술 이름을 그 언어 값으로), 자격증(이름을 그 언어 값으로). 페이지는 `getCollection`을 직접 쓰지 않는다.
   - 빌드 로그의 임시 항목 수(`[content] placeholder entries: N (...)`)에 경력·자격증 수를 더한다. 경력은 언어별 파일 1개를 1건, 자격증은 항목 1개를 1건으로 센다.

2. **콘텐츠 값**
   - **기술 스택 「AI活用開発」(실제 값)**: `skills.yaml`의 첫 분류로 추가한다(분류 id 기본안 `ai-development`). 분류 이름 ja 「AI活用開発」, en `AI-assisted development`(기본안). 항목은 이 순서로 ChatGPT / Claude Code / IBM Consulting Advantage / IBM Bob. 모두 `placeholder: false`, 표식 없음, `primary` 없음, `homeOrder` 없음(Home 핵심 기술은 바뀌지 않는다). 이름은 언어 공통 문자열이다.
   - **임시 문구** (`docs/CONTENT.md` "임시 문구 규칙"): 경력 3건(「A社（仮）」~「C社（仮）」 / `Company A (placeholder)`~), 자격증 3건(취득 2건 + 학습 중 1건). 표식을 넣는 최소 범위: 경력의 회사명·직무·성과, 자격증 이름. 기간·연월은 `20XX.XX`, 현재 재직 항목의 기간 끝은 ja 「現在」 / en `Present`. 실제 자격증 이름처럼 보이는 문구는 쓰지 않는다(예: 「〇〇 認定資格（仮）」).
   - 프로필 `resumes`는 비워 둔다(파일이 없으므로 화면에 이력서 영역이 나오지 않는 상태가 정상).

3. **About 화면** (`src/components/pages/AboutPage.astro`와 하위 컴포넌트)
   - 순서: 페이지 머리 → 職歴 → 技術スタック → 資格. 섹션마다 `<section aria-labelledby>`, 제목은 h1 → h2 → h3 건너뜀 없음.
   - **페이지 머리**: h1은 페이지 이름(`ui.pages.about.name`, 「経歴」/`About`, T03 규칙 유지). 그 아래 한 줄에 프로필 이름(20px, 700)과 직함(text-muted). 좁은 화면에서는 두 줄로 내려간다.
   - **이력서 PDF**: `resumes`가 있을 때만 머리 아래에 링크 목록(`<ul>`)을 출력한다. 없으면 빈 목록·빈 여백 없이 아무것도 출력하지 않는다. 첫 링크는 `.button--primary`, 나머지는 `.button`. 링크 앞에 내려받기 아이콘(인라인 SVG, `aria-hidden="true"`)을 둔다. 링크 문구에 「（PDF）」/`(PDF)`를 넣어 파일 형식을 알린다.
   - **職歴 (경력 타임라인)**: h2 + `<ol>`(최신이 위). 항목마다 기간(모노스페이스, 14px, text-muted), 회사명(h3), 직무(text-muted), 성과(`<ul>`). 왼쪽에 세로선과 점을 둔다. `current: true` 항목은 accent로 채운 점, 나머지는 테두리만 있는 점. 선·점은 CSS 장식이며 접근성 트리에 나오지 않는다. 640px 이상에서는 기간을 왼쪽 열(약 11rem)에, 미만에서는 회사명 위에 둔다. 마지막 항목 아래로는 선을 늘이지 않는다.
   - **技術スタック**: h2 + 범례 문구(「塗りつぶしたタグは主軸の技術です。」, Home과 같은 문구. UI 문구 키를 공용으로 옮겨도 된다) + 분류 블록 그리드. 640px 미만 1열, 640px 이상 2열. 분류 블록은 위쪽 가는 구분선 + h3 + 태그 목록(`<ul>`, `SkillTag` 재사용). 일본어 페이지의 h3는 일본어 분류 이름 옆에 영어 이름(모노스페이스, 12px, text-muted)을 보조로 붙이고, 영어 페이지는 영어 이름만 쓴다. 분류·기술 순서는 `skills.yaml` 배열 순서.
   - **資格**: h2 + `<dl>`(시안 A, `docs/CONTENT.md` "자격증 표기 규칙"). 행마다 연월(`<dt>`, 모노스페이스, text-muted)과 이름(`<dd>`), 행 사이 가는 구분선. 학습 중 행은 `<dt>` 「学習中」/`Studying`(accent, 700), `<dd>`는 「〇〇 取得に向けて学習中」/`Studying for 〇〇` 형태이며, 이 문형은 UI 문구 템플릿(`src/i18n/ui.ts`)에 두고 이름만 콘텐츠에서 넣는다. 자격증이 0건이면 섹션을 출력하지 않는다. 목록 최대 폭은 약 48rem.
   - **단계 5 대비**: 컨셉 5(스크롤 타임라인)가 감쌀 수 있게 타임라인 항목은 같은 요소·클래스 구조를 쓰고, 애니메이션 없이도 전체가 읽히는 지금의 화면이 최종 상태가 되게 한다.
   - `<meta name="description">`은 `ui.pages.about.description`을 쓰고, 「現在準備中です。」/`Coming soon.` 문구를 실제 설명으로 바꾼다(UI 문구).
   - `src/pages/{ja,en}/about.astro`를 `<AboutPage locale="…" />`로 바꾼다. `ComingSoonPage`의 `page` 타입에서 `about`을 뺀다.
   - 섹션 제목·라벨·템플릿 등 UI 문구는 `src/i18n/ui.ts`, 콘텐츠 값은 `src/content/`에 둔다. 컴포넌트에 문구를 하드코딩하지 않는다.

4. **문서**: `docs/DESIGN.md`에 §6 About(섹션 구성, 전환점별 배치, 타임라인·자격증 행 규칙, 대비 표)을 추가하고, `docs/ARCHITECTURE.md` §2 "콘텐츠 구조" 표·규칙 목록에 경력·자격증·`resumes`를 더한다. `docs/CONTENT.md` 수집 현황에 임시 문구로 구현한 항목을 표시한다.

제외:

- 실제 경력·자격증·이력서 원고 반영 (원고를 받은 뒤 별도 PR)
- PDF 파일 추가, PDF 공개 범위 결정 (원고 반영 때 사용자가 결정)
- 기술 로고 아이콘 (사용자가 아이콘 패키지 도입을 승인했지만, 경력·기술 스택 원고 반영 때 한꺼번에 적용하기로 함. `docs/PLAN.md` §2)
- 担当工程(要件定義・設計・開発・テスト・運用) 표시 (프로젝트 단위로 T06 Projects 지시서에서 추가)
- 컨셉 5 스크롤 강조 애니메이션 (단계 5)
- Home 변경(핵심 기술·직함·한 줄 소개). AI 포지셔닝에 맞춘 직함·한 줄 소개는 원고 반영 때 정한다
- canonical, `hreflang`, OG 이미지, sitemap (단계 6)
- 디자인 토큰 값 변경, 글꼴 CSS 증가

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `src/content/**`, `src/content.config.ts`
- `src/lib/content.ts`
- `src/components/**` (`AboutPage.astro` 등 새 컴포넌트, `ComingSoonPage.astro`의 타입 정리, `SkillTag.astro` 재사용을 위한 최소 수정)
- `src/i18n/ui.ts` (About UI 문구 추가, `pages.about.description` 정리, 범례 키 공용화)
- `src/components/pages/HomePage.astro` (범례 키를 공용으로 옮길 때만)
- `src/pages/ja/about.astro`, `src/pages/en/about.astro`
- `src/styles/global.css` 및 About용 새 CSS. `src/styles/tokens.css`의 값은 바꾸지 않는다(새 토큰 추가는 이유를 PR에 적는다).
- `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/CONTENT.md`(수집 현황 상태 표기만), `docs/PLAN.md`, `docs/tasks/T05-about.md`
- `docs/screenshots/T05-*` (캡처를 저장소에 넣을 경우만)
- 새 의존성은 추가하지 않는다.

## 완료 조건

- [x] `/ja/about/`, `/en/about/`에 페이지 머리(h1·이름·직함), 職歴 타임라인(임시 3건), 技術スタック(「AI活用開発」 포함 전체 분류), 資格(취득 2건 + 학습 중 1건)이 표시되고, 준비 중 문구는 없다. Projects·Contact의 준비 중 화면은 그대로다.
- [x] 「AI活用開発」가 기술 스택의 첫 분류이고, 항목 4개가 지정 순서·표기(ChatGPT, Claude Code, IBM Consulting Advantage, IBM Bob)로 표식 없이 나온다. Home 핵심 기술 화면은 바뀌지 않는다.
- [x] 화면의 콘텐츠 값은 모두 `src/content/`에서, UI 문구는 `src/i18n/ui.ts`에서 온다. 영어 UI 문구 키가 빠지면 `pnpm check`가 실패한다.
- [x] 콘텐츠 검사: ① 경력이 한 언어에만 있음 ② 경력 `order`가 겹치거나 `order`·`current`가 언어마다 다름 ③ 학습 중 자격증 2개 이상 ④ 학습 중 자격증이 맨 끝이 아님 ⑤ 분류 안에서 주력 기술이 뒤에 있음 ⑥ `resumes[].file`이 없는 파일·`public/` 밖 경로(`..` 포함)·외부 URL을 가리킴 — 각각 빌드가 실패한다. ①~⑥을 한 번씩 재현해 오류 메시지를 PR에 적는다. T04의 기존 검사 ①~⑥도 계속 동작한다.
- [x] `resumes`가 비어 있을 때 이력서 영역의 요소(빈 `<ul>` 포함)가 HTML에 없다. 임시 PDF로 일시 확인한 링크 화면 캡처 또는 설명이 PR에 있고, 확인 후 PDF와 설정은 원복한다.
- [x] 임시 항목은 모두 `placeholder: true`이고 범위 2의 최소 범위에 「（仮）」/`(placeholder)` 표식이 있다. 실제 회사명·실제 자격증 이름·실제처럼 보이는 숫자가 없다. 빌드 로그의 임시 항목 수에 경력·자격증이 포함된다.
- [x] ja/en × 320px·375px·1280px × 라이트·다크에서 가로 스크롤이 없다. 타임라인 기간 열과 기술 스택 열 수가 640px 전환점에서 바뀐다.
- [x] 제목 구조가 h1 1개 → h2(섹션) → h3(회사·분류)로 건너뜀이 없고, 각 섹션이 `aria-labelledby`로 이름을 갖는다. 타임라인은 `<ol>`, 태그는 `<ul>`, 자격증은 `<dl>`이다. 타임라인의 선·점은 접근성 트리에 나오지 않는다. 주력 기술의 「主軸：」/`Core: ` 텍스트가 접근성 트리에 있다.
- [x] 새 색 조합(있다면)의 대비를 측정해 `docs/DESIGN.md` §6에 적는다. 글자 4.5:1, UI 경계 3:1 이상.
- [x] 클라이언트 JS가 T04보다 늘지 않는다. React island를 쓰지 않는다. `/ja/about/`, `/en/about/`이 받는 CSS 크기를 T04 기준과 비교해 PR에 적는다.
- [x] `prefers-reduced-motion: reduce`에서 새로 추가한 장식 전환 효과가 꺼진다(추가하지 않았다면 그렇게 적는다).
- [x] PR 본문에 최신 커밋 기준 캡처가 있다: ja 라이트 375px(첫 화면), ja 다크 1280px(전체), en 라이트 1280px(전체), en 다크 320px(전체) 이상.
- [x] `docs/DESIGN.md` §6, `docs/ARCHITECTURE.md` §2, `docs/CONTENT.md` 수집 현황이 갱신되어 있다.
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`와 GitHub CI가 통과한다.
- [x] `docs/PLAN.md`의 진행 상태와 작업 지시서 표 갱신, 비밀 값 미포함.

## 확인 방법

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm check && pnpm build
pnpm preview
```

- `/ja/about/`, `/en/about/`에서 네 영역, 「AI活用開発」의 위치·항목, 「（仮）」/`(placeholder)` 표식, 학습 중 행 문구를 확인한다. `/ja/`, `/en/` Home 핵심 기술이 그대로인지도 확인한다.
- 콘텐츠 파일을 일시적으로 고쳐(영어 경력 파일 삭제, `order` 중복, 학습 중 2개, 학습 중을 맨 앞으로, 분류 안에서 주력 기술을 뒤로, `resumes`에 없는 파일·`../` 경로·외부 URL 지정) `pnpm build`가 실패하는지 확인하고 원복한다.
- 브라우저 개발자 도구로 320px·375px·1280px, 라이트·다크, `prefers-reduced-motion` 에뮬레이션을 확인한다. 접근성 트리에서 제목 구조, 「主軸：」 텍스트, 타임라인 장식이 빠져 있는지 확인한다.

## 메모

- 아래는 지시서 작성 시 정한 기본안이다. 사용자(choi)가 구현 PR에서 바꿀 수 있다. 일본어 UI 문구는 사용자가 나중에 `src/i18n/ui.ts`에서 직접 고친다(T04와 같음).
  - 섹션 제목: 「職歴」/`Experience`(페이지 제목 「経歴」과 겹치지 않게), 「技術スタック」/`Tech stack`, 「資格」/`Certifications`. 학습 중 라벨 「学習中」/`Studying`, 문형 「{name} 取得に向けて学習中」/`Studying for {name}`.
  - 기술 스택 영어 분류 이름: `AI-assisted development`, `Languages`, `Frameworks`, `Databases`, `Infrastructure & cloud`, `Messaging & monitoring`, `CI/CD & tools`(`docs/CONTENT.md`가 페이지 구현 시 확정하기로 한 항목). 구현 PR에서 사용자 확인을 받는다.
  - 이력서 링크 문구 안: 「職務経歴書（PDF）」「履歴書（PDF）」/`Resume (PDF)`. 콘텐츠 값(`resumes[].label`)이다.
- **이력서 PDF 공개 범위**: 저장소가 Public이므로 `public/`에 넣은 PDF는 누구나 내려받을 수 있다. 履歴書에는 보통 주소·생년월일·사진 같은 개인 정보가 들어가므로, 원고 반영 때 공개용 판(개인 정보 삭제)을 쓸지, 회사별 비공개 페이지(단계 8)로만 제공할지 사용자가 정한다. 이 지시서의 구조는 두 경우 모두 쓸 수 있다.
- 경력 항목에 기술 태그·担当工程을 넣지 않는 이유: 같은 회사 안에서도 프로젝트마다 다르므로 프로젝트 단위로 둔다(2026-10-30 사용자 확인, T06).
- AI 포지셔닝(2026-10-30 사용자 결정): 이번 범위에서는 「AI活用開発」를 기술 스택 맨 앞에 두는 것까지만 한다. 직함(후보 「AIエンジニア / バックエンドエンジニア」)·한 줄 소개·Home 핵심 기술에 AI 도구를 넣을지는 원고 반영 때 정한다.
- 원고 반영 순서: 경력·자격증 원고를 받으면 콘텐츠 파일 값을 바꾸고 `placeholder`를 `false`로 바꾸는 별도 PR로 처리한다. 기술 로고 아이콘도 그때 함께 적용한다(`docs/PLAN.md` §2).
