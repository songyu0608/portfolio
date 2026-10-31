# T08: Hero 디코딩·프로젝트 카드 틸트와 상세 전환 (인터랙션 컨셉 1·2)

| 항목 | 값 |
| --- | --- |
| 단계 | 5 |
| 선행 작업 | T07 (PR #22) |
| 담당 | 미배정 |
| 상태 | todo |
| 브랜치 | `<agent>/T08-hero-cards` (실행 환경이 이름을 강제하면 그 이름을 쓰고 PR 제목에 `T08`을 넣는다) |

## 목표

Home 히어로의 한 줄 소개가 페이지를 열 때 한 번 디코딩되며 나타나고(컨셉 1), 프로젝트 카드가 마우스 위치에 따라 살짝 기울어지며 누르면 상세 페이지로 부드럽게 이어지게 한다(컨셉 2). 둘 다 **효과가 없어도 지금 화면과 정보가 그대로인 점진적 향상**으로 만들고, 페이지가 받는 JS는 몇 KB 안으로 유지한다.

## 배경

- `docs/DESIGN.md` §3 인터랙션 컨셉 1·2와 공통 구현 규칙, §5 Home("단계 5 컨셉 1(디코딩)은 이 문단을 감싼다. 최종 문구는 처음부터 HTML에 있다"), §5 프로젝트 카드("틸트·상세 전환 애니메이션은 단계 5 컨셉 2다"), §7 모션
- `docs/PLAN.md` §5 단계 5. 2026-10-31 사용자 결정으로 단계 5는 지시서 3개로 나눈다: **T08 = 컨셉 1·2**, T09 = 컨셉 5(스크롤 경력 타임라인), T10 = 컨셉 3·4(터미널 모드·명령 팔레트, 명령 정의 공유).
- `AGENTS.md` §7: 핵심 정보는 클릭하지 않아도 보여야 하고, reduced-motion에서 장식 애니메이션을 끄며, 기본 출력 JS를 최소화한다.
- 참고 시안: claude.ai "포트폴리오 인터랙션 컨셉" 캔버스(비공개 링크, 소유자 계정에서만 열림) 1·2번 보드. 2026-10-28 사용자 확인. 시안 메모 요약:
  - 1: 페이지가 열리면 문구가 디코딩되며 1회 재생. 日本語/English 전환 시 다시 재생. '동작 줄이기' 설정이면 효과 없이 바로 표시.
  - 2: 마우스 위치에 따라 살짝 기울어짐 = 누를 수 있다는 신호. 클릭하면 상세로 전환. 제목·요약·태그는 앞면에 그대로 보임.
  - 시안은 색·글꼴·데이터가 임시다. 색·글꼴·카드 구성은 현재 사이트(T02~T06)를 따르고, 시안에서는 **동작만** 가져온다. 시안의 카드 안 상세 패널 전환(같은 화면에서 펼침)은 T06에서 상세를 별도 페이지로 만들었으므로 **페이지 이동 + 전환 효과**로 옮긴다.
- 현재 코드: 히어로는 `src/components/pages/HomePage.astro`의 `.hero__tagline`(`Phrases`로 문절 출력), 카드는 `src/components/ProjectCard.astro`(제목 링크 `::after`를 카드 전체로 늘린 구조, 경계 색 전환 200ms). Home·Projects 목록이 같은 카드를 쓴다. 상세는 `src/components/pages/ProjectDetailPage.astro`.

## 범위

포함:

1. **구현 방식 (기본안)**
   - 두 컨셉 모두 **React island를 쓰지 않는다.** 컨셉 1은 Astro `<script>`(번들된 모듈) 하나, 컨셉 2의 틸트는 Astro `<script>` 하나, 상세 전환은 CSS만(브라우저 내장 cross-document View Transitions)으로 만든다. Motion·GSAP 등 새 의존성은 추가하지 않는다.
   - 이유: 두 효과 모두 DOM 몇 개의 스타일만 바꾸므로 상태 관리가 필요 없고, React 런타임(수십 KB)을 Home·Projects에 싣지 않기 위함이다(`AGENTS.md` §7). React island는 상태가 많은 T10(터미널·명령 팔레트)에서 쓴다. 이 결정을 `docs/ARCHITECTURE.md` A2 비고와 `docs/DESIGN.md` §3 공통 구현 규칙의 "1·2·5는 `client:visible` 등으로 hydrate" 문장에 반영한다(지시서 PR에서 반영 완료).
   - 스크립트 파일은 `src/scripts/hero-decode.ts`, `src/scripts/card-tilt.ts`(이름은 기본안)에 두고, 컴포넌트의 `<script>`에서 import한다. 문구를 스크립트에 하드코딩하지 않는다(이번 범위에 새 UI 문구는 없다).

2. **컨셉 1: Hero 한 줄 소개 디코딩** (`HomePage.astro`의 `.hero__tagline`)
   - 대상은 한 줄 소개 문단 하나다. h1(이름)·직함·행동 링크는 바꾸지 않는다.
   - **최종 문구는 처음부터 HTML에 있다.** JS가 없거나, 스크립트가 실패하거나, reduced-motion이면 지금과 똑같이 최종 문구만 보인다.
   - 동작(기본안): Home을 열 때마다 1회 재생한다. 왼쪽(문장 앞)부터 글자가 차례로 확정되고, 아직 확정되지 않은 글자는 임의 글자로 바뀌며 보인다. 전체 재생 시간 약 1초(800~1200ms), 프레임은 `requestAnimationFrame` 기준. 언어 전환 링크는 `/en/`·`/ja/` Home으로 페이지를 이동하므로, 이동 후 Home이 열릴 때 다시 재생되어 시안의 "전환 시 다시 재생"을 충족한다. 다른 페이지에서 언어를 바꾸면 재생하지 않는다.
   - 임의 글자 규칙: 원래 글자가 전각(일본어 등)이면 전각 가타카나, 반각이면 영문 대문자·숫자에서 고른다. 공백·구두점(「、。（）,.」 등)과 문절 사이 경계는 바꾸지 않는다. 글자 수를 바꾸지 않는다.
   - **스크린 리더·SEO**: 재생 중에도 접근성 트리에는 최종 문구만 있어야 한다. 기본안: 최종 문구 요소는 그대로 두고 글자색만 투명하게 한 뒤, 그 위에 같은 글꼴·크기·폭의 장식용 겹침 요소(`aria-hidden="true"`)를 두어 임의 글자를 그린다. 재생이 끝나면 겹침 요소를 지우고 글자색을 되돌린다. 최종 문구 요소의 텍스트 노드를 재생 중에 바꾸지 않는다(스크린 리더가 임의 글자를 읽을 수 있기 때문).
   - **레이아웃 이동 없음**: 겹침 요소는 문단 위에 절대 위치로 두고 문단 크기를 바꾸지 않는다. 임의 글자 폭이 달라 겹침 줄바꿈이 조금 달라지는 것은 허용하되, 문단 영역 밖으로 넘치는 글자는 보이지 않게 자른다. Home의 CLS(Chromium Performance 측정)가 T07과 같아야 한다.
   - 문절 처리(`Phrases`, `docs/DESIGN.md` §2)는 최종 문구 요소에 그대로 남긴다. 겹침 요소도 같은 문절 구조를 복제해 줄바꿈 위치를 최대한 맞춘다.
   - 텍스트 선택·복사: 재생 중 사용자가 문단을 드래그해도 최종 문구가 복사된다(겹침 요소는 `pointer-events: none`, `user-select: none`).
   - 재생 중 탭이 백그라운드로 가서 프레임이 멈춰도, 돌아왔을 때 남은 시간 기준으로 끝나거나 바로 최종 상태가 된다(어중간한 임의 글자로 멈춘 채 남지 않는다).

3. **컨셉 2-a: 프로젝트 카드 틸트** (`ProjectCard.astro`, Home·Projects 목록의 모든 카드, `full`·`compact` 모두)
   - 조건: `(hover: hover) and (pointer: fine)`이고 `prefers-reduced-motion: reduce`가 아닐 때만 동작한다. 터치 기기·펜·reduced-motion에서는 틸트 스크립트가 아무것도 하지 않는다. 미디어 조건이 페이지를 연 뒤 바뀌면 따라간다.
   - 동작(기본안): 포인터가 카드 위에서 움직이면 카드 중심 기준 위치에 따라 `perspective(800px) rotateX/rotateY`로 최대 **4°** 기울고, 동시에 `translateY(-4px)`로 떠오른다. 포인터가 나가면 200ms(`--duration-base`, `--ease-standard`) 동안 원래 자리로 돌아온다. 포인터 이동은 `requestAnimationFrame`으로 묶어 프레임당 한 번만 스타일을 쓴다. 시안의 10°는 정보 카드에서 글자가 읽기 어려워져 4°로 줄인다.
   - 기존 효과는 유지한다: 마우스 오버 시 카드 경계 accent(200ms), 제목 밑줄, 항상 보이는 「詳細を見る →」. 시안의 "오버 시 「詳細 →」 표시"는 T06에서 이미 항상 표시로 구현했으므로 바꾸지 않는다(정보를 숨기지 않는 원칙).
   - 키보드: 카드 링크에 `:focus-visible`이 오면 기울기 없이 `translateY(-4px)`만 적용한다(CSS). reduced-motion에서는 이 떠오름도 끈다. 포커스 링(`::after`, 2px accent)은 그대로 보여야 하고 잘리지 않아야 한다.
   - 기울어도 카드 전체 링크(`::after`) 클릭 영역과 Tab 순서는 바뀌지 않는다. 틸트 때문에 이웃 카드와 겹쳐 보이거나 그리드 밖으로 가로 스크롤이 생기지 않는다.
   - 스크립트는 카드마다가 아니라 페이지에 한 번만 실행되게 한다(카드 목록 전체에 이벤트를 위임하거나, `.project-card`를 한 번 모아 등록).

4. **컨셉 2-b: 카드 → 상세 전환** (CSS cross-document View Transitions, JS 없음)
   - Home(`/ja/`, `/en/`), Projects 목록, 프로젝트 상세 페이지에만 `@view-transition { navigation: auto; }`를 넣는다. 전환은 양쪽 문서가 모두 이 규칙을 가질 때만 일어나므로, 이 세 종류의 페이지 사이를 오갈 때만 효과가 있고 About·Contact로 가는 이동에는 효과가 없다. 규칙을 전역 CSS에 넣지 않는다.
   - 카드 제목(h3)과 상세 h1에 같은 `view-transition-name`(기본안 `project-title-<slug>`)을 주어, 카드 제목이 상세 제목 자리로 옮겨 가는 것처럼 보이게 한다. 나머지 화면은 기본 크로스페이드다. 전환 시간 약 250~300ms, `--ease-standard`.
   - 이름은 한 페이지 안에서 겹치면 전환이 취소되므로, 한 페이지에 같은 프로젝트 카드가 두 번 나오지 않는지 확인한다(현재 Home·Projects 목록 모두 한 번씩). slug에 CSS 식별자로 쓸 수 없는 글자가 들어올 수 있으면 `src/lib/content.ts`에 slug 형식 검사(`^[a-z0-9]+(?:-[a-z0-9]+)*$`, 기본안)를 더하고 어기면 빌드를 멈춘다.
   - 상세 페이지의 이전·다음 링크, 「一覧へ戻る」 링크, 브라우저 뒤로 가기도 같은 규칙으로 전환된다(같은 slug의 이름이 양쪽에 있으면 제목이 이어지고, 없으면 크로스페이드). 별도 처리는 하지 않는다.
   - `prefers-reduced-motion: reduce`이면 `@view-transition { navigation: none; }`으로 전환을 끈다.
   - 브라우저 지원: cross-document View Transitions를 지원하지 않는 브라우저에서는 일반 페이지 이동이 되며, 이것이 정상 동작이다. 지원 범위(Chromium·Safari·Firefox 버전)는 구현 시 공식 문서(MDN, caniuse 등)로 확인해 `docs/DESIGN.md`에 적는다(확인 필요).

5. **문서**
   - `docs/DESIGN.md`: §5 Home에 디코딩 동작(재생 조건, 시간, 임의 글자 규칙, 접근성 처리), §5 프로젝트 카드·§7 모션에 틸트·떠오름·전환(값, 조건, reduced-motion, 브라우저 지원)을 적는다. "단계 5 컨셉 1/2" 예고 문장을 실제 내용으로 바꾼다.
   - `docs/ARCHITECTURE.md` §2: 디렉터리 구조에 새 스크립트 파일, 출력 설명의 "페이지가 받는 JS" 문장(Home·Projects 목록이 받는 스크립트와 크기)을 갱신한다.

제외:

- 컨셉 5 스크롤 경력 타임라인 (T09)
- 컨셉 3 터미널 모드, 컨셉 4 명령 팔레트, 명령 정의 모듈 (T10)
- 시안의 카드 스크린숏 영역(`[スクリーンショット]`). 이미지 원고가 없고 T06 카드 구성에 없다. 원고 반영 때 검토한다.
- Astro `<ClientRouter />`(SPA식 페이지 이동). JS가 늘고 페이지 스크립트 재실행 처리가 필요해 쓰지 않는다.
- 히어로 h1·직함 디코딩, 다른 페이지 제목 디코딩
- 디자인 토큰 값 변경, 글꼴 CSS 증가, 새 UI 문구
- 카드 클릭률 측정 (단계 9)

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `src/components/pages/HomePage.astro`, `src/components/pages/ProjectsPage.astro`, `src/components/pages/ProjectDetailPage.astro`
- `src/components/ProjectCard.astro`, `src/components/Phrases.astro`(겹침 요소에 같은 문절 구조가 필요할 때만)
- `src/scripts/hero-decode.ts`, `src/scripts/card-tilt.ts` (새 파일, 이름은 기본안)
- `src/styles/global.css` 및 전환용 새 CSS(세 종류의 페이지만 불러온다). `src/styles/tokens.css`의 값은 바꾸지 않는다(새 토큰 추가는 이유를 PR에 적는다).
- `src/lib/content.ts` (slug 형식 검사가 필요할 때만)
- `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/PLAN.md`, `docs/tasks/T08-hero-cards.md`
- 새 의존성은 추가하지 않는다.

## 완료 조건

- [ ] `/ja/`, `/en/`을 열면 한 줄 소개가 약 1초 동안 디코딩된 뒤 최종 문구로 끝난다. 헤더의 언어 전환으로 Home을 오가면 다시 재생된다. About 등 다른 페이지에서는 재생하지 않는다.
- [ ] 디코딩 중에도 빌드된 HTML(`dist/{ja,en}/index.html`)과 접근성 트리의 한 줄 소개는 최종 문구다. 겹침 요소는 `aria-hidden="true"`이고, 재생이 끝나면 DOM에서 사라진다. 재생 중 문단을 선택해 복사하면 최종 문구가 복사된다.
- [ ] 디코딩 전후로 히어로 높이와 행동 링크 위치가 같다(Chromium에서 Home의 CLS가 T07 main과 같음을 PR에 적는다). 320px·375px·1280px에서 재생 중 가로 스크롤이 생기지 않는다.
- [ ] 마우스가 있는 Chromium에서 카드 위를 움직이면 최대 4° 기울고 4px 떠오르며, 나가면 원래 자리로 돌아온다. Home·Projects 목록의 `full`·`compact` 카드 모두 같다. 터치 에뮬레이션(Chromium 개발자 도구 기기 모드)에서는 기울지 않는다.
- [ ] 키보드 Tab으로 카드 링크에 포커스하면 기울기 없이 떠오르고, 포커스 링이 잘리지 않고 보인다. Tab 순서와 링크 이름은 T07과 같다.
- [ ] 지원 브라우저(Chromium)에서 Home·Projects 목록의 카드를 누르면 카드 제목이 상세 제목으로 이어지는 전환이 보이고, 상세의 「一覧へ戻る」·이전·다음·뒤로 가기도 전환된다. Home ↔ About·Contact 이동에는 전환이 없다. 한 페이지에 같은 `view-transition-name`이 두 번 없다(콘솔 경고 없음).
- [ ] `prefers-reduced-motion: reduce` 에뮬레이션에서 디코딩·틸트·떠오름·페이지 전환이 모두 꺼지고, 최종 상태와 기존 경계 색 표시만 보인다(경계 색 전환은 T06 규칙대로 꺼짐).
- [ ] JavaScript를 끄면 Home·Projects·상세가 T07과 같은 화면이며 모든 링크가 동작한다.
- [ ] 클라이언트 JS: Home·Projects 목록이 받는 새 스크립트 크기(압축 전, 압축 후)를 PR에 적는다. 두 효과 합계가 압축 전 4KB 이하다. About·Contact·상세가 받는 JS는 T07과 같다. React island를 쓰지 않는다.
- [ ] 새 의존성이 없다(`package.json`, `pnpm-lock.yaml` 변경 없음).
- [ ] cross-document View Transitions 브라우저 지원 범위를 공식 자료로 확인해 `docs/DESIGN.md`에 출처와 함께 적는다. 이 환경에서 확인하지 못한 브라우저(Firefox·Safari 실기 등)는 PR에 미확인으로 적는다.
- [ ] PR 본문에 최신 커밋 기준 캡처가 있다: Home ja 라이트 1280px(디코딩 재생 중 1장, 끝난 뒤 1장), Projects 목록 ja 다크 1280px(카드 틸트 중), en 라이트 375px Home(끝난 상태). 가능하면 카드 → 상세 전환을 짧은 GIF나 연속 캡처로 남긴다.
- [ ] `docs/DESIGN.md` §5·§7, `docs/ARCHITECTURE.md` §2가 갱신되어 있다.
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`와 GitHub CI가 통과한다.
- [ ] `docs/PLAN.md`의 진행 상태와 작업 지시서 표 갱신, 비밀 값 미포함.

## 확인 방법

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm check && pnpm build
grep -c "止まらない" dist/ja/index.html   # 최종 문구가 HTML에 있는지
pnpm preview
```

- `/ja/`, `/en/`을 새로고침하며 디코딩을 보고, 헤더 언어 전환으로 오가며 다시 재생되는지 확인한다. 재생 중 접근성 트리(개발자 도구 Accessibility 패널)에서 한 줄 소개가 최종 문구인지 확인한다.
- `/ja/`, `/ja/projects/`에서 카드 위로 마우스를 움직이고, Tab으로 카드를 이동한다. 기기 모드(터치)로 바꿔 틸트가 없는지 확인한다.
- 카드를 눌러 상세로 가고, 「一覧へ戻る」·이전·다음·뒤로 가기를 눌러 전환을 확인한다. Home에서 About으로 이동해 전환이 없는지 확인한다.
- 개발자 도구 Rendering에서 `prefers-reduced-motion: reduce`를 켜고 같은 순서로 확인한다. JavaScript를 끄고 다시 확인한다.
- Performance 패널로 Home의 CLS를 T07 main과 비교한다. Network 패널에서 각 페이지가 받는 JS 크기를 확인한다.

## 메모

- 아래는 지시서 작성 시 정한 기본안이다. 사용자(choi)가 구현 PR에서 바꿀 수 있다: 디코딩 재생 시간(약 1초)·매번 재생, 틸트 최대 각도 4°·떠오름 4px, 전환 시간 250~300ms, 전환 대상(카드 제목 ↔ 상세 h1).
- 디코딩을 "세션당 1회"로 줄이는 방법(`sessionStorage`)도 있지만, 시안이 "열 때마다 1회 + 언어 전환 시 재생"이라 매번 재생을 기본으로 한다. 실제로 보고 거슬리면 바꾼다.
- 한 줄 소개는 원고 반영 때 바뀐다. 디코딩은 문구 길이와 무관하게 동작해야 한다(문절 수·글자 수를 가정하지 않는다).
- 상세 전환은 지원 브라우저에서만 보이는 향상이다. 미지원 브라우저에서도 이동 자체는 똑같이 되므로 폴리필이나 JS 대체 구현은 만들지 않는다.
