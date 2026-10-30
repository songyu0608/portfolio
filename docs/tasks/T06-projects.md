# T06: Projects 페이지 (목록·상세·担当工程, 임시 문구)

| 항목 | 값 |
| --- | --- |
| 단계 | 4 |
| 선행 작업 | T05 (PR #16) |
| 담당 | - |
| 상태 | todo |
| 브랜치 | `<agent>/T06-projects` (실행 환경이 이름을 강제하면 그 이름을 쓰고 PR 제목에 `T06`을 넣는다) |

## 목표

`/ja/projects/`, `/en/projects/`의 준비 중 화면을 프로젝트 목록으로 바꾸고, 프로젝트마다 상세 페이지 `/<언어>/projects/<slug>/`(課題 → 設計 → 結果 → 技術)를 만든다. 프로젝트마다 担当工程(要件定義・設計・開発・テスト・運用)을 카드와 상세에 함께 보여 준다. T04·T05처럼 원고가 없는 값은 **임시 문구**로 구조와 화면을 먼저 완성하고, 원고를 받으면 콘텐츠 파일만 바꾸면 되게 한다.

## 배경

- `docs/PLAN.md` §3 페이지 구성(Projects: 프로젝트 카드 목록 + 프로젝트별 상세 課題 → 設計 → 結果 → 技術), §2 전문 분야(백엔드 + AI 활용 개발), §8 "T05 지시서 작성 시 추가한 항목"(担当工程 필드)
- 2026-10-30 사용자 결정: 担当工程은 경력이 아니라 프로젝트 단위로 둔다. **카드와 상세 모두에 표시한다**(T06 범위 정리에서 사용자 선택). 일본 채용 담당자가 上流工程(要件定義・設計) 경험을 먼저 보기 때문이다.
- `docs/CONTENT.md`: "백엔드 프로젝트 카드 작성 가이드"(課題・設計・結果・技術・担当工程), "임시 문구 규칙"
- `docs/DESIGN.md` §3 컨셉 2(프로젝트 카드 틸트 + 클릭 시 상세로 전환, 카드 전체가 링크. 애니메이션은 단계 5), §5 Home(프로젝트 카드 구성·전환점), §4 내비게이션(하위 경로는 `aria-current="true"`, T03에서 접두어 비교로 구현됨)
- `docs/ARCHITECTURE.md` §2: 프로젝트 상세처럼 항목 수만큼 생기는 페이지는 `src/pages/ja/projects/[slug].astro`처럼 언어 폴더 안에서 동적 경로를 쓴다. 페이지는 `getCollection`을 직접 쓰지 않고 `src/lib/content.ts`의 조회 함수를 쓴다.
- 기존 부품: `ProjectCard.astro`(Home 대표 프로젝트 카드), `SkillTag.astro`, `Phrases.astro`, `.card`·`.tag-list`·`.sr-only`(`src/styles/global.css`). 프로젝트 콘텐츠 3건(`order-api`, `data-platform`, `auth-service`, 모두 `featuredOrder` 있음)이 이미 있다.
- 현재 `src/pages/{ja,en}/projects.astro`는 `ComingSoonPage`를 쓴다. Contact는 계속 `ComingSoonPage`를 쓴다.
- 화면 시안: claude.ai 디자인 캔버스 "T06 Projects 시안"(비공개 링크, 소유자 계정에서만 열림). 목록 ja 라이트 1280px·다크 375px, 상세 ja 라이트 1280px·375px. 2026-10-30 사용자 확인. 아래 범위 3·4의 배치는 이 시안을 글로 옮긴 것이다.

## 범위

포함:

1. **콘텐츠 구조** (기존 `projects` 컬렉션에 필드를 더한다. T04의 `src/content.config.ts`, `src/lib/content.ts` 방식을 따른다)

   | 필드 | 형식(기본안) | 메모 |
   | --- | --- | --- |
   | `phases` | `('requirements' \| 'design' \| 'development' \| 'testing' \| 'operation')[]`, 1~5개, 중복 없음 | 担当工程. 값은 언어 공통 id이고 화면 이름은 UI 문구. **표시 순서는 파일 순서와 무관하게 위 순서로 고정**한다 |
   | `order` | 양의 정수 | 대표가 아닌 프로젝트의 목록 순서. `featuredOrder`가 없는 항목에만 쓴다 |
   | `team` | 문자열, 선택 | 상세의 「チーム」 값(예: 「〇 名（仮）」). 없으면 그 칸을 출력하지 않는다 |
   | `challenge` | `{ body: 문자열, points?: 문자열[] (1~4) }` | 상세 課題. 규모(트래픽·데이터량·사용자 수)를 포함한다 |
   | `design` | `{ body: 문자열, points?: 문자열[] (1~4) }` | 상세 設計. 선택한 구조와 이유, 대안, 본인 역할 범위 |
   | `result` | `{ metrics?: { label, value }[] (1~4), body?: 문자열 }` | 상세 結果. `metrics`와 `body` 중 하나 이상 필요 |
   | `techDetails` | `{ label, value }[]`, 1~5개 | 상세 技術. 분류별 기술과 선정 이유(예: 「言語・FW」「データ」「選定理由」) |

   - 기존 필드(`title`, `summary`, `period`, `role`, `highlights`, `tech`, `featuredOrder`)는 그대로 둔다. 상세 페이지가 모든 카드에서 열리므로 `phases`, `challenge`, `design`, `result`, `techDetails`는 모든 프로젝트에 필수다. `order`는 예외로, 대표가 아닌 프로젝트(`featuredOrder` 없음)에만 필수이고 대표 프로젝트에는 쓰지 않는다. `team`, `challenge`·`design`의 `points`, `result`의 `metrics`·`body`는 선택이다(`result`는 둘 중 하나 이상).
   - 아래 규칙을 `src/lib/content.ts`에서 검사하고, 어기면 어긴 규칙을 적은 오류로 빌드를 멈춘다(기존 오류 목록에 합친다).
     - `featuredOrder`가 있는 항목은 `order`가 없고, 없는 항목은 `order`가 있다. 언어마다 `order`가 겹치지 않는다.
     - 같은 slug는 언어마다 `order`가 같고, `phases`의 집합이 같다(기존 `featuredOrder` 검사와 같은 방식).
     - `phases`에 같은 값이 두 번 나오지 않는다(스키마에서 막아도 된다).
     - `result`에 `metrics`와 `body`가 모두 없으면 안 된다(스키마에서 막아도 된다).
   - 조회 함수를 추가한다(이름은 기본안).
     - `getProjectsContent(locale)`: `featured`(`featuredOrder` 순), `others`(`order` 순).
     - `getProjectPages(locale)`: 상세 페이지용 목록. 항목마다 프로젝트, 이전·다음 프로젝트(slug·제목). 순서는 목록 화면의 표시 순서(대표 → 그 밖)이고 끝과 처음을 잇는다(순환). 이전과 다음이 같은 프로젝트면(전체 2건) 다음 하나만 둔다.
     - `phases`는 조회 함수가 고정 순서로 정렬해 돌려준다. 컴포넌트가 정렬하지 않는다.
   - 빌드 로그의 임시 항목 수 계산 방식은 바꾸지 않는다(프로젝트는 언어별 파일 1개를 1건).

2. **콘텐츠 값 (임시 문구)** (`docs/CONTENT.md` "임시 문구 규칙")
   - 기존 3건에 새 필드를 채운다. `phases`는 시안 값을 쓴다: `order-api` 要件定義・設計・開発・テスト, `data-platform` 設計・開発・テスト・運用, `auth-service` 要件定義・設計・運用.
   - 대표가 아닌 프로젝트 2건을 ja/en으로 추가한다(기본안: `admin-api` 「社内向け管理画面の API 整備（仮）」 開発・テスト, `alerting` 「監視・アラート設定の見直し（仮）」 設計・運用). `order` 1, 2.
   - 표식을 넣는 최소 범위: 기존 범위(제목·요약·성과·기술 이름)에 더해 `team`, `challenge`·`design`의 `body`·`points`, `result.metrics[].label`·`result.body`, `techDetails[].value`. 수치는 「〇〇」「XX ms」처럼 기호로 둔다. 실제 회사명·수치처럼 보이는 값을 쓰지 않는다.
   - AI를 넣은 시스템 개발 프로젝트는 아직 없다(2026-10-30 사용자 확인). 「AI活用開発」를 프로젝트로 지어내지 않는다.

3. **목록 화면** (`src/components/pages/ProjectsPage.astro`와 하위 컴포넌트)
   - 순서: 페이지 머리 → 代表プロジェクト → その他のプロジェクト. 섹션마다 `<section aria-labelledby>`, 제목은 h1 → h2 → h3.
   - **페이지 머리**: h1은 페이지 이름(`ui.pages.projects.name`, 「プロジェクト」/`Projects`, T03 규칙 유지). 아래에 소개 문단(text-muted, 최대 약 40em). 문구 기본안: 「課題・設計・結果を、担当した工程とあわせてまとめています。カードを選ぶと詳細を表示します。」/`Each project covers the challenge, design, and results, along with the phases I handled. Select a card for details.`
   - **代表プロジェクト**: h2 + 카드 그리드. 카드·그리드 규칙은 Home과 같다(640px 미만 1열, 640px 이상 2열, 1024px 이상 카드 3개면 3열). Home과 같은 카드 컴포넌트를 쓴다.
   - **その他のプロジェクト**: h2 + 카드 그리드(640px 미만 1열, 640px 이상 2열). 0건이면 섹션을 출력하지 않는다. 카드는 성과(成果)를 빼고 期間·役割(640px 이상 같은 줄 2칸), 担当工程, 技術를 보여 주는 짧은 형태다(카드 컴포넌트의 변형, 예: `variant="compact"`).
   - **카드 공통 변경** (`ProjectCard.astro`, Home에도 적용된다)
     - 정보 목록 순서: 期間 → 担当工程 → 役割 → 成果 → 技術(짧은 형태는 期間·役割 → 担当工程 → 技術).
     - **카드 전체가 상세 링크**다(컨셉 2의 동선. 틸트·전환 애니메이션은 단계 5). 기본안: 제목(h3) 안의 `<a>`에 `::after`를 카드 전체로 늘이는 방식. 카드 전체를 `<a>`로 감싸면 링크 이름이 카드 전문이 되어 길어지기 때문이다. 다른 방식을 고르면 이유를 PR에 적는다.
     - 카드 아래 끝에 「詳細を見る →」/`View details →`(14px, 700, accent)를 늘 보이게 둔다. 제목 링크가 같은 곳을 가리키므로 스크린 리더에는 중복되지 않게 처리한다(`aria-hidden` 등).
     - 포커스: 키보드 포커스가 카드에 있을 때 카드 테두리 전체에 포커스 링이 보인다. 마우스 오버 시 카드 경계를 accent로 바꾸는 정도의 가벼운 반응만 두고, 전환 효과는 `prefers-reduced-motion: reduce`에서 끈다.
     - Home `DESIGN.md` §5의 "카드 자체는 이번에 링크가 아니다" 문장을 이번 결정으로 고친다.
   - `<meta name="description">`은 `ui.pages.projects.description`이며 「現在準備中です。」/`Coming soon.` 문구를 실제 설명으로 바꾼다.

4. **担当工程 표시** (새 컴포넌트, 예: `src/components/PhaseList.astro`)
   - 다섯 공정을 고정 순서로 모두 보여 주는 `<ol>`. 맡은 공정은 accent로 채운 칸(on-accent 글자, 700) + 체크 아이콘(인라인 SVG, `aria-hidden="true"`), 맡지 않은 공정은 점선 테두리 칸(text-muted 글자). **색만으로 구분하지 않는다**: 채움·체크·점선의 모양 차이와 함께, 칸마다 시각적으로 숨긴 상태 텍스트(기본안 「担当」/「担当外」, `Handled`/`Not handled`)를 둔다.
   - 공정 이름 기본안: 要件定義 / 設計 / 開発 / テスト / 運用, 영어 `Requirements` / `Design` / `Development` / `Testing` / `Operations`. UI 문구(`src/i18n/ui.ts`)다.
   - 크기: 카드 안은 12px 칸이 줄바꿈으로 흘러간다. 상세는 640px 이상에서 5칸 같은 폭 그리드(14px), 640px 미만에서 줄바꿈으로 흘러간다.
   - 점선 테두리 색은 기본안으로 `--color-text-muted`(UI 경계 3:1 이상)를 쓴다. 시안의 연한 회색은 토큰에 없으므로, 새 토큰이 필요하다고 판단하면 이유와 대비를 PR에 적는다.

5. **상세 화면** (`src/components/pages/ProjectDetailPage.astro`, `src/pages/{ja,en}/projects/[slug].astro` + `getStaticPaths`)
   - 순서: 목록으로 돌아가는 링크(「← プロジェクト一覧」/`← All projects`, 44px 이상 터치 영역) → 머리 → 개요 상자 → 본문 4절 → 이전·다음 프로젝트.
   - **머리**: 대표 프로젝트면 「代表プロジェクト」 표시(accent 테두리 알약, 12px, 700) → h1 프로젝트 제목(`Phrases`) → 한 줄 요약(18px, text-muted. 640px 미만 15px). 최대 폭 약 46em.
   - **개요 상자**: surface 카드 안의 `<dl>`. 期間(모노스페이스), 役割, チーム(`team`이 있을 때만), 担当工程(전체 폭, 범위 4), 技術(전체 폭, 태그 목록). 640px 이상에서 期間·役割·チーム이 한 줄, 미만에서 期間 전체 폭 + 役割·チーム 2칸.
   - **본문 4절**: 課題 / 設計 / 結果 / 技術. 각 절은 `<section aria-labelledby>` + h2. 절 번호 「01」~「04」(모노스페이스, accent, `aria-hidden="true"`)는 장식이다. 640px 이상에서 번호를 왼쪽 열(약 72px)에, 미만에서 h2 위에 둔다. 본문 최대 폭 약 46em.
     - 課題·設計: `body` 문단 + `points`(있으면 `<ul>`).
     - 結果: `metrics`(있으면 `<ul>` 안의 surface 칸. 라벨 13px 700 text-muted, 값 모노스페이스 26px/모바일 22px 600) → `body`(있으면 문단). 칸은 640px 이상 2열, 미만 1열.
     - 技術: `techDetails`의 `<dl>`(640px 이상 라벨 열 약 9rem, 미만 라벨 위·값 아래).
   - **이전·다음 프로젝트**: `<nav aria-label>`(기본안 「ほかのプロジェクト」/`More projects`) 안의 링크 2개(「← 前のプロジェクト」/「次のプロジェクト →」 라벨 + 제목). 640px 이상 2열(다음은 오른쪽 정렬), 미만 1열.
   - `<title>`은 `프로젝트 제목 | 사이트 이름`(제목이 문절 배열이면 이어 붙인 문자열), `<meta name="description">`은 `summary`.
   - 헤더 내비게이션의 「プロジェクト」에 `aria-current="true"`가 붙는지(T03 접두어 비교), 언어 전환이 `/en/projects/<slug>/`로 이어지는지 확인한다. 코드 변경이 필요하면 최소로 고친다.
   - 목록 페이지 파일은 `src/pages/{ja,en}/projects.astro`를 그대로 써도 되고 `projects/index.astro`로 옮겨도 된다. 옮기면 이유를 적는다. 출력 URL(`/ja/projects/`)은 바뀌지 않아야 한다.

6. **UI 문구·문서**
   - 섹션 제목·라벨·공정 이름·상태 텍스트·링크 문구는 `src/i18n/ui.ts`, 콘텐츠 값은 `src/content/`에 둔다. 컴포넌트에 문구를 하드코딩하지 않는다. 기존 `home.projects.title`(「代表プロジェクト」)과 같은 문구는 공용 키로 옮겨도 된다.
   - `docs/DESIGN.md`에 §7 Projects(목록·상세 구성, 전환점별 배치, 카드 링크·担当工程 표시 규칙, 대비 표)를 추가하고 §5 프로젝트 카드 절을 고친다. `docs/ARCHITECTURE.md` §2 "콘텐츠 구조" 표·규칙 목록과 디렉터리 구조에 새 필드·규칙·상세 경로를 더한다. `docs/CONTENT.md` 수집 현황에 임시 문구로 구현한 항목을 표시한다.

제외:

- 실제 프로젝트 원고 반영 (원고를 받은 뒤 별도 PR)
- 컨셉 2 카드 틸트·상세 전환 애니메이션 (단계 5)
- 기술·공정 필터, 정렬 바꾸기, 검색
- 프로젝트 이미지·스크린샷·다이어그램
- 기술 로고 아이콘 (원고 반영 때 일괄 적용, `docs/PLAN.md` §2)
- canonical, `hreflang`, OG 이미지, sitemap (단계 6)
- 디자인 토큰 값 변경, 글꼴 CSS 증가
- Contact 페이지 (T07)

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `src/content/projects/**`, `src/content.config.ts`
- `src/lib/content.ts`
- `src/components/**` (`ProjectsPage.astro`, `ProjectDetailPage.astro`, `PhaseList.astro` 등 새 컴포넌트, `ProjectCard.astro` 변경, `ComingSoonPage.astro`의 `page` 타입 정리, `HomePage.astro`의 카드 호출·문구 키 변경)
- `src/i18n/ui.ts`, `src/i18n/paths.ts`(상세 경로 생성에 필요할 때만)
- `src/pages/ja/projects.astro`, `src/pages/en/projects.astro`, `src/pages/{ja,en}/projects/**`
- `src/styles/global.css` 및 Projects용 새 CSS. `src/styles/tokens.css`의 값은 바꾸지 않는다(새 토큰 추가는 이유를 PR에 적는다).
- `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/CONTENT.md`(수집 현황 상태 표기만), `docs/PLAN.md`, `docs/tasks/T06-projects.md`
- `docs/screenshots/T06-*` (캡처를 저장소에 넣을 경우만)
- 새 의존성은 추가하지 않는다.

## 완료 조건

- [ ] `/ja/projects/`, `/en/projects/`에 페이지 머리, 代表プロジェクト 3건, その他のプロジェクト 2건이 표시되고 준비 중 문구는 없다. Contact의 준비 중 화면은 그대로다.
- [ ] 프로젝트 5건 × 2개 언어의 상세 페이지 10개가 `dist/{ja,en}/projects/<slug>/index.html`로 생성되고, 課題·設計·結果·技術 4절과 개요 상자가 표시된다.
- [ ] Home과 Projects의 모든 카드가 상세로 이어지는 링크이고, 카드 안 어디를 눌러도 같은 상세로 간다. 키보드 Tab으로 카드마다 링크가 한 번만 잡히고 포커스 링이 카드 전체에 보인다.
- [ ] 担当工程이 카드와 상세에 다섯 공정 고정 순서로 나오고, 콘텐츠 파일의 `phases` 순서를 바꿔도 화면 순서가 같다. 맡은 공정과 맡지 않은 공정이 색 외의 모양(채움·체크·점선)과 숨긴 상태 텍스트로 구분되고, 접근성 트리에서 「要件定義 担当」처럼 상태가 읽힌다.
- [ ] 상세의 이전·다음 링크가 목록 표시 순서를 따르고 끝과 처음이 이어진다. 헤더 「プロジェクト」에 `aria-current="true"`가 붙고, 언어 전환 링크가 같은 slug의 다른 언어 상세로 간다.
- [ ] 화면의 콘텐츠 값은 모두 `src/content/`에서, UI 문구는 `src/i18n/ui.ts`에서 온다. 영어 UI 문구 키가 빠지면 `pnpm check`가 실패한다.
- [ ] 콘텐츠 검사: ① 대표가 아닌 프로젝트에 `order` 없음 ② 대표 프로젝트에 `order` 있음 ③ `order` 중복 ④ 같은 slug의 `order` 또는 `phases`가 언어마다 다름 ⑤ `phases` 중복 ⑥ `result`에 `metrics`·`body` 모두 없음 — 각각 빌드가 실패한다. ①~⑥을 한 번씩 재현해 오류 메시지를 PR에 적는다. T04·T05의 기존 검사도 계속 동작한다.
- [ ] 임시 항목은 모두 `placeholder: true`이고 범위 2의 최소 범위에 「（仮）」/`(placeholder)` 표식이 있다. 실제 회사명·실제처럼 보이는 숫자가 없다. 빌드 로그의 임시 항목 수에 새 프로젝트 2건(언어별 4건)이 반영된다.
- [ ] ja/en × 320px·375px·1280px × 라이트·다크에서 목록·상세 모두 가로 스크롤이 없다. 카드 열 수, 상세 개요 상자·절 번호·結果 칸·이전·다음 링크 배치가 640px 전환점에서 바뀐다.
- [ ] 제목 구조: 목록은 h1 → h2(섹션) → h3(카드), 상세는 h1(제목) → h2(4절)로 건너뜀이 없다. 절 번호와 체크 아이콘은 접근성 트리에 나오지 않는다.
- [ ] 새 색 조합의 대비를 측정해 `docs/DESIGN.md` §7에 적는다. 글자 4.5:1, UI 경계 3:1 이상(担当工程 칸 포함).
- [ ] 클라이언트 JS가 T05보다 늘지 않는다. React island를 쓰지 않는다. `/ja/projects/`와 상세 1개가 받는 CSS 크기를 T05의 `/ja/about/`과 비교해 PR에 적는다.
- [ ] `prefers-reduced-motion: reduce`에서 새로 추가한 전환 효과(카드 경계 색 등)가 꺼진다.
- [ ] PR 본문에 최신 커밋 기준 캡처가 있다: 목록 ja 라이트 1280px(전체)·ja 다크 375px(전체), 상세 ja 라이트 1280px(전체)·ja 라이트 375px(첫 화면), en 라이트 1280px 목록·en 다크 320px 상세(전체), Home ja 라이트 1280px(카드 변경 확인) 이상.
- [ ] `docs/DESIGN.md` §5·§7, `docs/ARCHITECTURE.md` §2, `docs/CONTENT.md` 수집 현황이 갱신되어 있다.
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`와 GitHub CI가 통과한다.
- [ ] `docs/PLAN.md`의 진행 상태와 작업 지시서 표 갱신, 비밀 값 미포함.

## 확인 방법

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm check && pnpm build
ls dist/ja/projects dist/en/projects
pnpm preview
```

- `/ja/projects/`, `/en/projects/`에서 두 섹션, 카드의 担当工程·「詳細を見る →」, 카드 클릭 이동을 확인한다. `/ja/`, `/en/` Home 카드도 링크가 되었는지 확인한다.
- 상세 페이지에서 개요 상자, 4절, 이전·다음 링크(처음·끝 항목 포함), 헤더 `aria-current`, 언어 전환 링크를 확인한다.
- 콘텐츠 파일을 일시적으로 고쳐(대표가 아닌 항목의 `order` 삭제, 대표 항목에 `order` 추가, `order` 중복, 한 언어만 `phases` 변경, `phases` 중복, `result` 비우기) `pnpm build`가 실패하는지 확인하고 원복한다. `phases` 순서를 섞어도 화면 순서가 같은지 확인한다.
- 브라우저 개발자 도구로 320px·375px·1280px, 라이트·다크, `prefers-reduced-motion` 에뮬레이션을 확인한다. 접근성 트리에서 제목 구조, 担当工程 상태 텍스트, 카드 링크 이름(제목만), 장식 요소 제외를 확인한다.

## 메모

- 아래는 지시서 작성 시 정한 기본안이다. 사용자(choi)가 구현 PR에서 바꿀 수 있다. 일본어 UI 문구는 사용자가 나중에 `src/i18n/ui.ts`에서 직접 고친다(T04·T05와 같음).
  - 섹션·라벨: 「代表プロジェクト」/`Featured projects`, 「その他のプロジェクト」/`Other projects`, 「担当工程」/`Phases`, 「チーム」/`Team`, 「詳細を見る」/`View details`, 「プロジェクト一覧」/`All projects`, 「前のプロジェクト」/`Previous project`, 「次のプロジェクト」/`Next project`, 「ほかのプロジェクト」/`More projects`.
  - 상세 절 제목: 「課題」「設計」「結果」「技術」 / `Challenge`, `Design`, `Results`, `Tech`.
  - 공정 이름·상태 텍스트: 범위 4.
- 시안 확인 때 범위 정리에 없던 요소 3개(상세의 「チーム」 칸, 「代表プロジェクト」 표시, 이전·다음 링크)도 사용자가 함께 확인했다(2026-10-30).
- 「設計」는 担当工程 이름과 상세 절 제목에 모두 쓰인다. 같은 낱말이지만 다른 UI 문구 키로 둔다(나중에 한쪽만 바꿀 수 있게).
- `highlights`(카드 成果)와 `result.metrics`(상세 結果)는 내용이 겹칠 수 있다. 카드는 한눈에 볼 요약, 상세는 측정 조건까지 쓴 결과로 구분한다. 원고 작성 가이드(`docs/CONTENT.md`)에 이 차이를 적는다.
- AI 포지셔닝(2026-10-30 사용자 결정): 지금은 AI를 넣은 시스템 개발 프로젝트가 없다. AI 도구를 써서 개발한 경험은 원고 단계에서 각 프로젝트의 `techDetails`나 `design` 본문에 쓰는 방식을 검토한다. 프로젝트 분류 필드는 이번에 만들지 않는다.
- 원고 반영 순서: 프로젝트 원고를 받으면 콘텐츠 파일 값을 바꾸고 `placeholder`를 `false`로 바꾸는 별도 PR로 처리한다.
