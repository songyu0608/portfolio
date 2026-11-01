# T08-followup: 프로젝트 카드 hover 효과 교체 (틸트 → 떠오르기 + 테두리 그리기 + 화살표 밀기)

| 항목 | 값 |
| --- | --- |
| 단계 | 8 (디자인 후속, T18과 독립) |
| 선행 작업 | T17 (PR #52) |
| 담당 | 미배정 |
| 상태 | todo |
| 브랜치 | `<agent>/T08-followup-card-hover` |

## 목표

프로젝트 카드의 마우스 틸트(T08, 스크립트)를 CSS만으로 만드는 세 효과의 조합으로 바꾼다. 카드가 떠오르고, 테두리가 한 바퀴 그려지고, 「詳細を見る →」의 화살표가 밀리며 제목 밑줄이 그어진다. 키보드 포커스에도 같은 효과가 나고, Home·Projects에서 틸트 스크립트가 빠진다.

## 배경

- 2026-11-01 사용자 결정. 대체 효과 5가지(떠오르기, 스포트라이트, 테두리 그리기, 화살표 밀기, 제목 디코딩)와 조합 4가지를 실제 카드 스타일의 시안 페이지(claude.ai 아티팩트, 비공개)에서 비교했다. choi가 **① 떠오르기 + ③ 테두리 그리기 + ④ 화살표 밀기**를 고르고, 테두리 속도를 **0.4초**로 정했다(시안은 0.6초).
- 바꾸는 이유
  - 스크립트가 필요 없다. Home·Projects의 인라인 틸트 스크립트(빌드 결과 1,129 bytes)가 빠진다.
  - 마우스와 키보드 포커스가 같은 효과를 보인다(틸트는 포커스 때 떠오르기만 했다).
  - 카드가 기울지 않아 글자가 흔들리지 않는다.
- 지금 규칙: `docs/DESIGN.md` §3 컨셉 2, §5 "프로젝트 카드"·"카드 틸트"·"모션", §11 "강제 색상 모드". 구조: `docs/ARCHITECTURE.md` §2 트리·"페이지 스크립트".
- T18(회사별 비공개 페이지) 템플릿도 `ProjectCard`를 import하므로, 이 작업이 먼저 끝나면 회사 페이지 카드도 스크립트 없이 같은 효과를 갖는다. T18의 수정 가능한 파일과 겹치지 않는다.

### 확인한 공식 자료 (2026-11-01)

| 기능 | 쓰는 곳 | 처음 지원한 버전 | 출처 |
| --- | --- | --- | --- |
| `@property` (등록 사용자 속성, 각도 전환) | 테두리 그리기 | Chrome·Edge 85, Safari·iOS Safari 16.4, Firefox 128 | [caniuse: `@property`](https://caniuse.com/mdn-css_at-rules_property) |
| `mask-composite` (접두사 없음) | 테두리 고리 모양 | Chrome·Edge 120, Safari·iOS Safari 15.4, Firefox 53 | [caniuse: `mask-composite`](https://caniuse.com/mdn-css_properties_mask-composite) |

`@property`를 지원하지 않는 브라우저에서는 각도가 전환되지 않고 고리가 한 번에 다 그려진다(깨지지 않는다). Chrome 119 이하는 `-webkit-mask-composite: xor`를 함께 쓴다.

## 범위

포함:

1. **틸트 제거**
   - `src/scripts/card-tilt.ts`, `src/layouts/scripts/CardTiltScript.astro`를 지운다. `HomeLayout.astro`·`ProjectsLayout.astro`에서 import와 `<CardTiltScript />`를 뺀다.
   - `ProjectCard`의 `data-tilt`, CSS의 `.is-tilting`·`--tilt-x`·`--tilt-y` 규칙을 지운다.
   - 테스트가 카드를 찾는 표식이 필요하면 `data-tilt` 대신 `data-project-card`를 단다(동작과 무관한 표식).
2. **효과 조건**: 아래 세 효과는 "효과 상태"에서 켜진다.
   - 효과 상태 = `(hover: hover)`일 때의 `:hover`, 또는 언제나 `:has(.link:focus-visible)`(키보드 포커스).
   - `(hover: hover)`로 묶는 이유: 터치 기기에서 누른 뒤 hover가 남아 다른 카드로 돌아왔을 때 효과가 켜진 채 보이지 않게 한다.
3. **① 떠오르기**
   - `transform: translateY(-4px)`, 그림자를 새 토큰 `--shadow-card-raised`로 바꾼다.
   - `--shadow-card-raised`: 라이트 `0 20px 40px rgb(18 22 25 / 14%)`, 다크 `0 20px 40px rgb(0 0 0 / 45%)`(시안 값). `tokens.css`의 라이트·다크 두 블록에 함께 넣는다.
   - 전환 200ms(`--duration-base`), `--ease-standard`. 들어갈 때와 나갈 때 같다.
4. **③ 테두리 그리기**
   - 카드 `::before`에 고리를 그린다: `inset: -1px`, `padding: 2px`, `border-radius: inherit`, 배경 `conic-gradient(var(--color-accent) var(--card-sweep), transparent 0)`, `mask`(content-box를 빼는 방식, `-webkit-mask-composite: xor` 병기), `pointer-events: none`.
   - `@property --card-sweep { syntax: '<angle>'; inherits: false; initial-value: 0deg; }`. 효과 상태에서 `360deg`.
   - 위쪽 가운데에서 시작해 시계 방향으로 400ms(`--ease-standard`)에 걸쳐 그린다. 2026-11-01 사용자 결정.
   - 나갈 때는 전환 없이 바로 사라진다(`transition`을 효과 상태 규칙에만 둔다). 되감기는 모습이 어색하기 때문이다.
   - 지금의 hover 경계 색 전환(T06, `border-color` → accent 200ms)은 지운다. 고리가 경계 위를 그리므로 두 가지를 같이 두면 경계가 먼저 다 바뀌어 고리가 보이지 않는다.
   - 고리는 장식이다. 포커스 링(`.link:focus-visible::after`, 2px accent, 간격 3px)은 그대로 두며, 고리와 겹치지 않는다(간격 3px 바깥).
5. **④ 화살표 밀기 + 제목 밑줄 그리기**
   - 「詳細を見る →」의 `→`를 `<span>`으로 감싸 `display: inline-block`, 효과 상태에서 `translateX(6px)`, 200ms.
     - 「詳細を見る」 문구는 지금처럼 `src/i18n/ui.ts`에서 가져온다. 화살표 글자는 지금도 컴포넌트에 있다(번역 대상 아님).
     - 문단은 지금처럼 `aria-hidden="true"`다.
   - 제목 링크 밑줄은 `text-decoration` 대신 배경으로 그린다: `linear-gradient(currentColor, currentColor) 0 100% / 0% 1px no-repeat` → 효과 상태에서 `100% 1px`, 300ms. 제목이 여러 줄이면 줄 순서대로 그어진다.
   - 지금의 hover 밑줄(`text-decoration: underline`) 규칙은 지운다.
6. **동작 줄이기** (`prefers-reduced-motion: reduce`)
   - 움직임(떠오르기, 화살표 이동)과 모든 전환을 끈다.
   - 상태 표시는 남긴다: 효과 상태에서 고리는 처음부터 다 그려진 채(경계가 accent), 밑줄은 바로 보이고, 그림자도 바뀐다. 지금 규칙(전환만 끄고 경계 색·밑줄은 남김)과 같은 결과다.
7. **강제 색상 모드**: 따로 디자인하지 않는다(§11 원칙). 고리(배경 그라데이션)가 보이지 않을 수 있으나 장식이며, 포커스 링은 남는다. 구현 때 Chromium 강제 색상 에뮬레이션으로 고리가 글자를 가리지 않는지만 확인한다.
8. **테스트** (`tests/e2e/motion.chromium.spec.ts`)
   - "프로젝트 카드 틸트" 테스트를 "프로젝트 카드 hover"로 바꾼다.
     - 동작 켜짐: 카드에 마우스를 올리면 카드 `transform`이 `none`이 아니고, `::before`의 `--card-sweep`이 끝나면 `360deg`다.
     - 동작 꺼짐: `transform`이 `none`이고, 고리는 바로 `360deg`다.
   - 키보드 포커스: Tab으로 첫 카드 링크에 들어가면 같은 효과가 켜진다(동작 켜짐에서 `transform`이 `none`이 아님).
   - 틸트 스크립트가 없다: Home·Projects HTML에 `card-tilt`·`is-tilting`이 없다.
   - `[data-tilt] a`로 링크를 찾던 "카드 → 상세 전환" 테스트는 새 표식(`[data-project-card] a`)으로 바꾼다.
   - 접근성 트리 기준(`--update-snapshots`)은 바뀌지 않아야 한다(바뀌면 이유를 PR에 적는다).
9. **문서**
   - `docs/DESIGN.md`: §2 그림자 행에 `--shadow-card-raised`. §3 컨셉 2 행(틸트 → hover 조합). §5 "프로젝트 카드"의 hover 문장, "카드 틸트" 절을 "카드 hover 효과" 절로 바꿈, "모션" 문단. §11 "강제 색상 모드"·동작 줄이기 표.
   - `docs/ARCHITECTURE.md`: §2 트리에서 `card-tilt.ts`·`CardTiltScript.astro` 줄 삭제, "페이지 스크립트" 문장에서 카드 틸트 삭제.
   - `docs/PLAN.md`: 작업 지시서 표 상태, 결정 기록.
   - 이 지시서 상태.

제외:

- 스포트라이트·제목 디코딩 등 고르지 않은 효과
- 카드 → 상세 전환(View Transitions, T08), 카드 내용·정보 순서
- 이전·다음 링크 등 카드가 아닌 요소의 hover
- T18 회사별 비공개 페이지(그 지시서는 `ProjectCard`를 import만 한다)

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `src/components/ProjectCard.tsx`, `src/components/ProjectCard.module.css`
- `src/styles/tokens.css` (`--shadow-card-raised`만)
- `src/layouts/HomeLayout.astro`, `src/layouts/ProjectsLayout.astro` (틸트 스크립트 import 제거만)
- 삭제: `src/scripts/card-tilt.ts`, `src/layouts/scripts/CardTiltScript.astro`
- `tests/e2e/motion.chromium.spec.ts`, 필요하면 `tests/e2e/**`의 카드 선택자, 접근성 트리 기준 파일
- `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/PLAN.md`, `docs/tasks/T08-followup.md`

## 완료 조건

- [ ] Home·Projects 목록의 모든 카드(`full`·`compact`)에서 마우스 hover와 키보드 포커스로 세 효과가 함께 보인다(떠오르기 200ms, 테두리 400ms, 화살표 200ms, 밑줄 300ms).
- [ ] 마우스가 나가면 고리는 바로 사라지고, 떠오르기·화살표·밑줄은 원래대로 돌아간다.
- [ ] `prefers-reduced-motion: reduce`에서 움직임·전환이 없고, 고리·밑줄·그림자 상태 표시는 남는다.
- [ ] 터치 에뮬레이션(`hover: none`)에서 hover 효과가 남아 있지 않다.
- [ ] 빌드 결과(Home·Projects HTML)에 틸트 스크립트가 없다.
- [ ] 포커스 링·Tab 순서·카드 전체 클릭 영역·카드 → 상세 전환이 그대로다.
- [ ] 라이트·다크 둘 다 확인했다.
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`, `pnpm test`, `pnpm test:workers` 통과, CI(`check`·`lighthouse`) 통과
- [ ] `docs/PLAN.md`의 진행 상태와 작업 지시서 표 갱신

## 확인 방법

```bash
pnpm build
pnpm test --project=chromium tests/e2e/motion.chromium.spec.ts
pnpm preview   # /ja/, /ja/projects/ 에서 마우스·Tab으로 확인
```

- Chromium DevTools Rendering 탭에서 `prefers-reduced-motion: reduce`, `prefers-color-scheme: dark`, `forced-colors: active`를 차례로 켜 본다.
- 시안 페이지(claude.ai 아티팩트 「프로젝트 카드 hover 시안」의 「조합: ① + ③ + ④」)와 비교한다. 다른 점은 테두리 속도(0.6초 → 0.4초)와 나갈 때 고리가 바로 사라지는 것이다.

## 메모

- 밑줄 위치: 배경으로 그린 밑줄은 글자 상자 아래 끝에 그려져, 지금 `text-underline-offset: 0.2em`보다 조금 아래일 수 있다. 차이가 크면 `background-position`으로 맞추고 PR에 캡처를 올린다.
- CSS Modules: `@property`와 `--card-sweep` 이름이 빌드 뒤에도 바뀌지 않는지(해시가 붙지 않는지) 빌드 결과 CSS로 확인한다.
- 고리 두께: 경계(1px) 위에 2px 고리를 겹치므로 효과 상태의 경계는 약 2px로 보인다(시안과 같다).
- Safari 실기 확인은 §8의 기존 이월 항목(Safari 실기)과 함께 한다. CI WebKit E2E는 동작 테스트를 Chromium에서만 돌린다(`motion.chromium.spec.ts`).
