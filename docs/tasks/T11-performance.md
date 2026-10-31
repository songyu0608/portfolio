# T11: 성능 최적화 (글꼴 로딩·CLS·스크립트 점검)

| 항목 | 값 |
| --- | --- |
| 단계 | 6 |
| 선행 작업 | T10 (PR #31) |
| 담당 | claude |
| 상태 | done |
| 브랜치 | `claude/project-thread-t0t9l8` (실행 환경이 지정한 이름. 원칙상 이름은 `claude/T11-performance`) |

## 목표

모든 페이지가 글꼴 때문에 늦게 그려지거나 밀리지 않게 한다. 첫 렌더 전에 받는 글꼴 CSS를 사이트가 실제로 쓰는 글자 범위로 줄이고, Home의 레이아웃 이동(CLS)을 Core Web Vitals "좋음" 기준(0.1 이하)으로 낮춘다. 단계 5까지 이월된 성능 항목(헤더 스크립트, React 청크)의 영향을 측정해 기록한다.

## 배경

- `docs/PLAN.md` §5 단계 6. 2026-10-31 사용자 결정으로 단계 6은 지시서 3개로 나눈다: **T11 = 성능**, T12 = SEO(canonical·hreflang·OG·sitemap·robots·favicon·404), T13 = 접근성 점검·수정. 글꼴 변경이 레이아웃과 측정값을 바꾸므로 성능을 먼저 한다. (T11 완료 후 2026-10-31 사용자 결정으로 React 중심 전환이 T12가 되어 SEO는 T13, 접근성은 T14로 번호가 바뀌었다. 아래의 T12·T13은 각각 SEO·접근성을 뜻한다.)
- `docs/PLAN.md` §8에서 단계 6으로 넘긴 항목:
  - T02 이월: 글꼴 CSS 크기. 공통 CSS가 첫 렌더 전에 모든 페이지에서 받아진다.
  - T08 발견: Home CLS 0.32~0.37(Chromium 1280px). IBM Plex Sans JP로 바뀔 때 히어로 줄바꿈이 바뀌어 아래 내용이 약 35px 올라간다.
  - T10 발견: 헤더 스크립트 약 3.5KB 중 약 1.7KB가 Vite 동적 import 도우미. "Lighthouse로 영향만 확인한다"(사용자 결정, 기준은 압축 전 4KB 이하로 유지).
  - T03 이월(완료 처리됨): 참조되지 않는 Astro React 렌더러 진입 파일(약 1.8KB). 첫 로드에 받지 않는지만 확인한다.
- `docs/DESIGN.md` §2 타이포그래피: 글꼴은 Fontsource 패키지(`@fontsource/ibm-plex-sans-jp` 400·700, `@fontsource/ibm-plex-mono` 400)를 자체 호스팅하고 `font-display: swap`, 일본어 대체 글꼴은 Hiragino Sans, Yu Gothic UI, Meiryo 순서. 외부 글꼴 도메인 요청은 없다.
- 현재 코드: `src/layouts/BaseLayout.astro`가 Fontsource CSS 3개(`400.css`, `700.css`, Mono `400.css`)를 import한다. 각 CSS는 문자 범위(`unicode-range`)별 `@font-face`를 모두 담고 있어, 브라우저는 필요한 글꼴 파일만 받지만 **CSS 자체는 쓰지 않는 범위까지 전부** 받는다.

### 현재 측정값 (2026-10-31, main `d637153`, 이 지시서 작성 시)

빌드 결과:

| 항목 | 값 |
| --- | --- |
| 공통 CSS `_astro/BaseLayout.*.css` | 357,926B (gzip 172,802B), 모든 페이지가 `<head>`의 `<link rel="stylesheet">`로 받음 |
| 그중 `@font-face` | 251개. 글꼴 외 CSS는 약 10KB(gzip 약 2.3KB) |
| 사이트 HTML·JSON에 실제로 쓰인 글자 | 508종(비 ASCII 416종). 이 글자와 `unicode-range`가 겹치는 `@font-face`는 251개 중 67개(약 39KB) |
| 헤더 스크립트 `_astro/SiteHeader.*.js` | 3,531B |

페이지별 (Playwright Chromium, 네트워크 지연 150ms·내려받기 1.6Mbps 제한, 페이지 로드 후 1.5초까지 `layout-shift` 합계):

| 페이지 | 1280px CLS | 375px CLS | 받은 글꼴 파일 |
| --- | --- | --- | --- |
| `/ja/` | **0.297** | 0.003 | 48개, 약 418KB |
| `/en/` | 0.003 | 0.058 | 7개, 약 101KB |
| `/ja/about/` | 0.002 | 0.002 | 38개, 약 359KB |
| `/ja/projects/` | 0.003 | 0.010 | 48개, 약 405KB |
| `/ja/contact/` | 0.006 | 0.028 | 25개, 약 274KB |

Lighthouse 12.6.1(`npx`로 실행, 의존성 아님, `pnpm preview` 대상), 페이지마다 3회 측정 중앙값:

| 페이지 | 모바일 Perf | 모바일 FCP / LCP | 모바일 CLS | 데스크톱 Perf | 데스크톱 FCP / LCP | 데스크톱 CLS | 전송량 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/ja/` | 92 | 1.8s / 2.4s | **0.133** | 99 | 0.66s / 0.66s | 0.073 | 656KiB |
| `/en/` | 95 | 2.0s / 2.6s | 0.003 | 100 | 0.57s / 0.57s | 0.007 | 281KiB |
| `/ja/about/` | 95 | 2.4s / 2.4s | 0.010 | 100 | 0.61s / 0.61s | 0.005 | 565KiB |
| `/ja/projects/` | 98 | 1.8s / 1.8s | 0.006 | 95 | 0.69s / 0.69s | **0.122** | 655KiB |
| `/ja/projects/order-api/` | 98 | 1.8s / 1.8s | 0.007 | 100 | 0.62s / 0.62s | 0.004 | 691KiB |
| `/ja/contact/` | 98 | 2.0s / 2.0s | 0.021 | 100 | 0.57s / 0.57s | 0.002 | 457KiB |

- TBT는 모든 페이지에서 0ms다.
- 진단에서 공통 CSS가 렌더 차단 리소스(예상 절감 약 930ms), 사용하지 않는 CSS 약 165KiB로 나온다.
- `/ja/` 모바일은 같은 조건에서도 흔들림이 크다(별도 1회 측정에서 Performance 61, FCP·LCP 5.4s가 나온 적이 있다). 비교는 아래 "측정 방법"대로 3회 이상 재서 중앙값을 쓴다.
- `/ja/projects/` 데스크톱(Lighthouse 기본 1350px 폭)에서도 CLS가 0.1을 넘는다. Playwright 1280px 측정(0.003)에서는 보이지 않으므로 폭에 따른 줄바꿈 차이로 보이며, 원인은 구현 때 확인한다(확인 필요).
- Accessibility·SEO는 100, Best Practices 96(`/favicon.ico` 404 콘솔 오류, T12에서 처리). Home의 LCP 요소는 히어로 한 줄 소개(디코딩 대상 문단)다.

측정 환경의 대체 글꼴은 Linux 컨테이너 글꼴이라 실제 사용자 환경(Windows Yu Gothic UI·Meiryo, macOS Hiragino Sans)과 다르다. CLS 수치는 같은 환경에서 전후를 비교하는 용도로 쓴다.

## 범위

포함:

1. **측정 기준 마련 (먼저 한다)**
   - 구현 전에 아래 "측정 방법"으로 main 기준값을 다시 재서 PR에 표로 남긴다. 구현 후 같은 방법·같은 환경으로 다시 잰다. 이 지시서의 현재 측정값과 다르면 다시 잰 값을 기준으로 쓴다.
   - Lighthouse는 `npx --yes lighthouse@<버전>`처럼 일회성으로 실행하고, `package.json`에 추가하지 않는다(Lighthouse CI 도입은 단계 7). 쓴 버전을 PR에 적는다.

2. **글꼴 CSS 줄이기**
   - 목표: 첫 렌더 전에 받는 CSS에 **사이트에서 실제로 쓰는 글자를 포함하는 `unicode-range`의 `@font-face`만** 남긴다. 글꼴 파일 자체(Fontsource가 배포한 woff2·woff)는 바꾸지 않는다. 글꼴 파일을 다시 자르는 서브셋 생성(새 도구·의존성 필요)은 하지 않는다(아래 제외, 메모).
   - 방식은 구현자가 아래 후보를 조사해 고르고, 고른 이유와 비교를 PR에 적는다. 새 의존성은 추가하지 않는다.
     - 후보 A: Astro 내장 Fonts API(`astro.config.mjs`의 `fonts` + `<Font />` 컴포넌트). Astro 6.0부터 실험 플래그 없는 최상위 설정이며(설치된 Astro 7.4.4 타입 정의에서 확인) Fontsource·npm·local provider, `subsets`·`unicodeRange`·preload·대체 글꼴 메트릭 자동 생성(`fallbacks`, `optimizedFallbacks`)을 제공한다. 확인할 점: `<Font />`는 `@font-face`를 각 HTML에 **인라인 `<style>`**로 넣으므로(`node_modules/astro/components/Font.astro`에서 확인) 범위를 줄이지 않으면 모든 HTML이 커진다. Fontsource provider가 빌드 때 네트워크로 받는지, npm/local provider로 `node_modules`의 패키지를 쓸 수 있는지, IBM Plex Sans JP의 번호 붙은 범위(`[0]`~`[119]`)를 고를 수 있는지, 고르는 범위가 원본 텍스트가 바뀌면 자동으로 다시 계산되는지(설정에 범위를 손으로 적는 방식이면 메모의 요구를 어긴다) 공식 문서와 실제 빌드로 확인한다(확인 필요).
     - 후보 B: 빌드 전에 실행하는 Node 스크립트(새 의존성 없음)가 콘텐츠·UI 문구 원본(`src/content/**`, `src/i18n/ui.ts` 등)에서 쓰인 글자를 모아, Fontsource CSS에서 그 글자와 겹치는 `@font-face`만 골라 CSS 파일을 만든다. `BaseLayout.astro`는 그 파일을 import한다. Vite가 처리하므로 파일 이름의 해시가 내용에 따라 바뀐다. `pnpm dev`·`pnpm build`·CI에서 모두 같은 결과가 나와야 한다(생성 파일을 커밋할지, 빌드 때 만들지는 구현자가 정하고 이유를 적는다).
     - 빌드가 끝난 `dist/`의 CSS를 직접 고쳐 쓰는 방식은 쓰지 않는다. 파일 이름의 해시가 내용과 맞지 않게 되어, 배포 후 오래 캐시하면 새 내용이 반영되지 않을 수 있기 때문이다.
   - **글자 누락 검사**: 빌드 결과(`dist/**/*.html`, `dist/**/*.json`)의 표시 텍스트와 **스크립트가 화면에 그리는 글자**(T08 디코딩의 임의 글자 `src/scripts/hero-decode.ts`의 `WIDE_POOL`·`NARROW_POOL`, 팔레트·터미널 번들에만 있는 문구가 있으면 그것)에 쓰인 글자 중, 남긴 `@font-face`가 덮지 않는 글자가 0개인지 확인하는 방법을 둔다(빌드 후 스크립트, 또는 PR에 실행한 명령과 결과). 원래 Fontsource 251개 범위로도 덮지 않는 글자(글꼴에 없는 글자)는 제외하고 목록을 PR에 적는다. 원고 반영 때 글자가 늘어도 같은 방법으로 다시 확인할 수 있어야 한다.
   - 명령 팔레트·터미널에 사용자가 입력한 글자는 대상이 아니다(덮지 않으면 대체 글꼴로 보이며, 이것을 정상으로 본다).
   - `/en/` 페이지가 일본어 범위의 `@font-face`를 받지 않게 언어별로 나누는 것은 선택이다. 나눌 경우 언어 전환 링크의 「日本語」처럼 `/en/`에도 일본어가 나오는 곳의 글자가 빠지지 않는지 위 누락 검사로 확인한다.

3. **CLS 낮추기 (Home 중심, 모든 페이지 확인)**
   - 목표: 아래 "측정 방법"의 모든 페이지·폭과 Lighthouse 모바일·데스크톱에서 CLS 0.1 이하. 특히 `/ja/` 1280px, `/ja/projects/` Lighthouse 데스크톱.
   - 아래 순서로 적용하고, 각 단계 뒤에 다시 재서 결과를 PR에 적는다. 앞 단계에서 목표에 닿으면 뒤 단계는 하지 않는다.
     1. 범위 2로 글꼴 CSS가 줄어 글꼴이 빨리 도착하는 효과를 잰다.
     2. 첫 화면(히어로·헤더)에 필요한 글꼴 파일 몇 개만 `<link rel="preload" as="font" crossorigin>`로 미리 받는다. 어떤 파일이 필요한지는 빌드 결과에서 정하고(파일 이름 하드코딩 금지, 해시가 바뀌므로), preload 수는 페이지당 4개 이하로 한다(너무 많으면 다른 리소스를 늦춘다). Fonts API를 쓰면 그 preload 기능을 쓴다.
     3. 대체 글꼴 메트릭 맞춤: `size-adjust`·`ascent-override`·`descent-override`·`line-gap-override`를 준 대체용 `@font-face`(`src: local(...)`)를 `--font-sans` 앞쪽 대체 글꼴로 넣어, 글꼴 교체 전후의 글자 폭·줄 높이 차이를 줄인다. Fonts API의 자동 생성을 쓸 수 있으면 그것을 쓴다. 값과 대상 `local()` 글꼴, 근거를 PR과 `docs/DESIGN.md` §2에 적는다.
     4. 위로도 0.1을 넘으면 **사용자 결정**이 필요하다. 후보: (a) `font-display: optional`(첫 방문의 느린 연결에서는 대체 글꼴로 보이고 다음 방문부터 IBM Plex), (b) 히어로 한 줄 소개 영역의 최소 높이 확보(원고 길이에 따라 다시 맞춰야 함). 구현자는 측정값과 함께 PR에서 사용자에게 묻고, 사용자가 고르기 전에는 적용하지 않는다.
   - T08 디코딩 동작(재생 시간, 겹침 요소 구조)은 바꾸지 않는다. 디코딩이 Home의 LCP를 늦추는지(디코딩 스크립트를 끈 빌드와 비교) 재서 PR에 적는다. 늦춘다면 고치지 말고 수치와 함께 사용자에게 보고한다(동작 변경은 사용자 결정).

4. **스크립트 점검 (측정·기록 중심)**
   - 헤더 스크립트: Lighthouse의 TBT, "사용하지 않는 JavaScript" 진단에서 헤더 스크립트가 차지하는 양을 PR에 적는다. 압축 전 4KB 이하 기준(2026-10-31 사용자 결정)이 유지되는지 확인한다.
   - Vite 동적 import 도우미(약 1.7KB)는 **새 의존성·Astro 내부 우회 없이 설정만으로** 없앨 수 있을 때만 없앤다(예: Astro 통합 훅 `astro:build:setup`에서 Vite 설정을 바꾸는 방법이 공식 문서로 지원되는지 확인). 없애면 팔레트 첫 열기 시간(Network 패널, 느린 4G)이 늘지 않는지 함께 잰다. 설정만으로 안 되면 이유를 적고 그대로 둔다.
   - 첫 로드에 React 관련 파일(`mount.*.js`, React·ReactDOM 청크, Astro React 렌더러 진입 파일)과 `command-ui.*.css`, `commands.json`을 받지 않는지 모든 페이지 종류에서 Network로 확인한다(T10 동작 유지).

5. **문서**
   - `docs/DESIGN.md` §2 타이포그래피: 글꼴 로딩 방식(남기는 범위를 정하는 방법, preload, 대체 글꼴 메트릭, `font-display`)을 실제 구현대로 고친다. §5 Home의 "단계 6에서 다룬다" 문장(디코딩 절의 CLS 설명)을 결과로 바꾼다.
   - `docs/ARCHITECTURE.md` §2: 디렉터리 구조(새 스크립트·생성 파일이 있으면), 출력 설명의 CSS·JS 크기, 글꼴 처리 방식. 결정이 바뀌면 §3 결정 기록에 항목을 추가한다(예: 글꼴 로딩 방식).
   - `AGENTS.md` §6: 빌드 전에 실행할 명령이 생기면(후보 B) 명령 목록을 고친다.
   - `docs/PLAN.md` §8의 T02·T08·T10 이월 항목에 결과를 적고 체크한다.

제외:

- SEO 메타·OG·sitemap·robots·favicon·404 (T12)
- 접근성 전 페이지 점검·수정 (T13)
- Lighthouse CI·E2E 자동화, CI에 성능 예산 추가 (단계 7)
- 캐시 헤더(`_headers`), 압축 방식, CDN 설정 (단계 8 배포)
- 글꼴 파일 자체를 다시 자르는 서브셋(새 도구·의존성 필요). 범위 2로 부족하면 사용자 확인 후 별도 작업으로 한다.
- 글꼴 종류·굵기 변경, 디자인 토큰 값 변경(대체 글꼴 스택에 메트릭 맞춤용 이름을 더하는 것은 포함)
- T08~T10 인터랙션 동작 변경, 원고 반영

## 수정 가능한 파일

이 목록 밖의 파일을 수정해야 하면 PR 설명에 이유를 적는다.

- `astro.config.mjs` (Fonts API, Vite 설정)
- `src/layouts/BaseLayout.astro` (글꼴 CSS import, preload)
- `src/styles/global.css`, 글꼴용 새 CSS 파일(`src/styles/` 아래)
- `src/styles/tokens.css`: `--font-sans`·`--font-mono` 스택에 메트릭 맞춤 대체 글꼴 이름을 더할 때만. 다른 토큰 값은 바꾸지 않는다.
- 글꼴 범위 선택·글자 누락 검사용 새 스크립트(`scripts/` 아래, 새 디렉터리 가능)
- `package.json`의 `scripts` 항목(위 스크립트 실행용). 의존성 항목과 `pnpm-lock.yaml`은 바꾸지 않는다.
- `.github/workflows/*`: 위 스크립트를 CI에서 실행해야 할 때만
- `.gitignore`: 생성 파일을 커밋하지 않을 때만
- `src/components/SiteHeader.astro`, `src/scripts/command-launcher.ts`: 범위 4의 동적 import 도우미 처리에 꼭 필요할 때만
- `src/components/pages/HomePage.astro`: 범위 3-4(b)를 사용자가 고른 경우만
- `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/PLAN.md`, `AGENTS.md`(§6 명령만), `docs/tasks/T11-performance.md`
- 새 의존성은 추가하지 않는다.

## 완료 조건

- [x] PR 본문에 main 기준값과 구현 후 값을 같은 표로 비교한다: 공통 CSS 크기(압축 전·gzip), `@font-face` 개수, 페이지별 받는 글꼴 파일 수·크기, 페이지별 CLS(1280px·375px), Lighthouse 모바일·데스크톱 Performance·FCP·LCP·CLS·TBT(각 3회 중앙값). 측정 환경·명령·Lighthouse 버전을 적는다.
- [x] 첫 렌더 전에 받는 CSS에 실제로 쓰는 글자를 포함하지 않는 `@font-face`가 없다. 공통 CSS(글꼴 CSS가 HTML 인라인이면 HTML 증가분 포함)가 압축 전 100KB 이하다.
  - 판정 기준(구현): "쓰는 글자"는 `src/` 아래 텍스트 파일에 나오는 글자이며 주석도 포함한다. 화면 문구의 `//`를 주석으로 오인해 지우지 않기 위해서다(Codex 리뷰 PR #34). 그래서 주석에만 나오는 ⌘(U+2318, `src/scripts/command-launcher.ts`·`src/components/CommandButton.astro`)를 덮는 범위 2개(Fontsource 범위 58의 400·700, CSS 약 1.6KB)는 화면에 나오지 않는데도 의도적으로 남긴다. 빌드 결과에 ⌘가 없어 이 범위의 글꼴 파일은 받지 않는다. 공통 CSS는 52,819B로 100KB 이하다.
- [x] 글자 누락 검사 결과, 빌드 결과와 디코딩 임의 글자 목록에 쓰인 글자 중 남긴 범위가 덮지 않는 글자가 0개다(원래 글꼴에 없는 글자는 목록으로 제외). 검사 방법이 문서(`docs/ARCHITECTURE.md` 또는 `AGENTS.md` §6)에 있어 원고 반영 때 다시 실행할 수 있다.
- [x] 페이지별 받는 글꼴 파일 수·크기가 main보다 늘지 않는다.
- [x] 측정한 모든 페이지(`/ja/`, `/en/`, `/ja/about/`, `/ja/projects/`, 프로젝트 상세 1개, `/ja/contact/`)에서 CLS가 0.1 이하다: Playwright 1280px·375px, Lighthouse 모바일·데스크톱 중앙값 모두. 범위 3-4로 사용자 결정이 필요하면 PR에서 묻고, 결정에 따라 적용한 뒤 이 조건을 확인한다.
- [x] Lighthouse Performance 중앙값이 측정한 모든 페이지에서 모바일 90 이상, 데스크톱 95 이상이고 main보다 낮아지지 않는다. 못 미치는 페이지는 원인(진단 항목)과 이 범위에서 고치지 않은 이유를 PR에 적는다. "렌더 차단 리소스" 진단의 예상 절감이 main보다 줄어든다.
- [x] 화면이 T10과 같다: 글꼴(IBM Plex Sans JP·Mono)이 적용된 뒤의 Home·About·Projects·상세·Contact가 ja·en, 라이트·다크에서 main과 같아 보인다(캡처 비교). 디코딩·틸트·전환·타임라인·팔레트·터미널이 그대로 동작한다.
- [x] 글꼴 요청을 막으면(개발자 도구 Network 요청 차단) 대체 글꼴로 모든 본문을 읽을 수 있고 가로 스크롤이 생기지 않는다(320px·1280px).
- [x] 첫 로드에 React 관련 파일·`command-ui.*.css`·`commands.json`을 받지 않는다. 헤더 스크립트가 압축 전 4KB 이하이고 페이지가 받는 JS 파일 수가 T10과 같다. Vite 도우미 처리 결과(없앴는지, 못 없앤 이유)를 PR에 적는다.
- [x] 디코딩이 Home LCP에 주는 영향을 PR에 적는다.
- [x] 새 의존성이 없다(`package.json` 의존성 항목, `pnpm-lock.yaml` 변경 없음).
- [x] PR 본문에 최신 커밋 기준 캡처가 있다: Home ja 라이트 1280px, Home en 다크 375px, About ja 라이트 1280px(글꼴 적용 후). 가능하면 `/ja/` 1280px 느린 연결 로딩을 연속 캡처나 Performance 패널 Layout Shift 구간 캡처로 남긴다.
- [x] `docs/DESIGN.md` §2·§5, `docs/ARCHITECTURE.md` §2(필요하면 §3), `docs/PLAN.md` §8 이월 항목이 갱신되어 있다.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`와 GitHub CI가 통과한다.
- [x] `docs/PLAN.md`의 진행 상태와 작업 지시서 표 갱신, 비밀 값 미포함.

## 확인 방법

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm check && pnpm build
ls -l dist/_astro/*.css                     # 공통 CSS 크기
grep -o "@font-face" dist/_astro/*.css | wc -l
pnpm preview
```

### 측정 방법

- **CLS·글꼴 요청 (Playwright Chromium)**: 페이지마다 새 컨텍스트(캐시 없음)를 열고 CDP `Network.emulateNetworkConditions`로 지연 150ms·내려받기 1.6Mbps를 건다. `addInitScript`로 `PerformanceObserver({ type: 'layout-shift', buffered: true })`를 등록해 `hadRecentInput`이 아닌 값을 더하고, `networkidle` 후 1.5초 기다린 값을 쓴다. 같은 컨텍스트에서 `.woff2`·`.woff` 응답 수와 크기를 센다. 폭은 1280×800, 375×800.
- **Lighthouse**: `CHROME_PATH=<Chromium 경로> npx --yes lighthouse@<버전> http://localhost:4321/ja/ --chrome-flags="--headless --no-sandbox" --output=json` (모바일 기본값), 데스크톱은 `--preset=desktop`. 페이지마다 3회 재서 중앙값을 쓴다.
- 대상 페이지: `/ja/`, `/en/`, `/ja/about/`, `/ja/projects/`, `/ja/projects/<slug>/` 1개, `/ja/contact/`. 범위 2에서 언어별로 나눴다면 `/en/about/`도 잰다.
- 개발자 도구 Network 요청 차단으로 `*.woff2`·`*.woff`를 막고 320px·1280px 화면을 확인한다.
- 명령 팔레트를 처음 열 때와 첫 로드의 Network 목록을 비교한다.

## 메모

- 아래는 지시서 작성 시 정한 기본안이다. 사용자(choi)가 구현 PR에서 바꿀 수 있다: CLS 목표 0.1(Core Web Vitals "좋음" 경계), 공통 CSS 100KB 이하, Lighthouse 모바일 90·데스크톱 95 이상, preload 페이지당 4개 이하, CLS 대책 적용 순서.
- `font-display: optional`과 히어로 최소 높이는 화면 동작이 바뀌므로(첫 방문 글꼴, 원고 길이 의존) 사용자 결정 없이 넣지 않는다.
- 글꼴 파일을 실제 사용 글자만으로 다시 자르면 요청 수(지금 `/ja/` 48개)까지 줄일 수 있지만 새 도구(예: `subset-font`, fonttools)가 필요하고, 원고가 바뀔 때마다 다시 만들어야 한다. 이번에는 Fontsource가 나눠 둔 범위 중 고르는 데까지만 한다. 효과가 부족하면 측정값을 근거로 사용자에게 제안한다.
- 원고 반영 때 쓰이는 글자가 바뀌므로, 범위 선택이 원본 텍스트에서 자동으로 다시 계산되어야 한다(글자 목록을 손으로 관리하지 않는다).
- Lighthouse 수치는 이 컨테이너에서 흔들림이 크다. 절대값보다 같은 환경의 전후 비교를 우선한다.
