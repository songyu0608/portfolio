# PLAN — 전체 계획과 진행 상태

이 파일은 계획·결정·진행 상태의 **원본**이다. 결정이 바뀌면 이 파일을 먼저 고친다.

마지막 갱신: 2026-10-31 (T10 구현)

## 현재 진행 상태

| 항목 | 값 |
| --- | --- |
| 현재 단계 | 단계 5 인터랙션 — T10 구현 리뷰 |
| 진행 중인 작업 | T10 구현(컨셉 3·4, claude) PR 리뷰 |
| 다음 작업 | T10 merge 후 단계 5 완료 → 단계 6~8. 원고 반영은 맨 마지막(2026-10-31 사용자 결정) |
| 블로커 | 없음. 콘텐츠 원고(`docs/CONTENT.md`)는 미수집이며, 단계 4는 임시 문구로 진행한다. 배포(단계 8) 전에 실제 원고로 교체해야 한다 |

## 1. 개요

IT 엔지니어(백엔드)인 choi의 이직·채용용 포트폴리오 사이트를 정적 사이트 기반으로 만든다. 백엔드 경력과 함께 AI 활용 개발 경험을 어필한다(2026-10-30 사용자 결정, §2).

- 주 독자: 채용 담당자, 현업 엔지니어
- 목적: 경력, 프로젝트, 기술 스택을 짧은 시간에 파악하고 바로 연락할 수 있게 한다.
- 범위 제외: 기술 블로그
- 개발 방식: 단계별로 나눠 개발한다. 기간과 코드량보다 완성도를 우선한다.
- 작업자: Claude와 ChatGPT(Codex)가 같은 GitHub 저장소에서 나눠 작업한다. 여러 노트북에서 작업할 수 있다.

## 2. 확정 사항

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| 목적 | 이직·채용용 포트폴리오 | 사용자 결정 |
| 전문 분야 | 백엔드 + AI 활용 개발. AI 엔지니어로도 어필한다 | 사용자 결정(2026-10-30 변경, 이전: 백엔드). 일본 채용 시장에서 AI 개발 경험을 높이 평가하기 때문. 프로젝트 카드는 설계·규모·성능·안정성 지표를 강조. 기술 스택 첫 분류를 「AI活用開発」로 둔다. 직함(후보 「AIエンジニア / バックエンドエンジニア」)·한 줄 소개는 원고 반영 때 확정 |
| 블로그 | 제외 | 사용자 결정 |
| 언어 | 일본어 기본, 영어 전환 (`/ja`, `/en`) | 사용자 결정 |
| 프레임워크 | Astro + TypeScript | 콘텐츠 중심, 기본 출력 JS가 거의 없어 빠름. i18n 라우팅 내장 |
| 인터랙션 | 기본은 Astro `<script>`·CSS(T08·T09). React는 상태가 많은 컨셉 3·4(T10)에만, 열 때 동적 import(island 아님). Motion / GSAP은 쓰지 않음 | 효과는 자유롭게, 페이지는 가볍게. 2026-10-31 T10 지시서에서 갱신(이전: React island + Motion / GSAP) |
| 인터랙션 컨셉 | 1~5 전부 채택 (`docs/DESIGN.md`) | 사용자 결정 |
| 렌더링 | 정적 기본 + 필요한 경로만 서버 실행 | 비용 0, 보안·유지보수 부담 최소 |
| 호스팅 | Cloudflare Workers 정적 자산, 무료 플랜 | 정적 파일 요청 무료. Cloudflare가 신규 프로젝트에 Workers를 권장 |
| 저장소 | GitHub `songyu0608/portfolio`, **Public** | 사용자 결정. 비밀 값은 저장소에 넣지 않음 |
| 도메인 | 미정. 우선 `*.workers.dev` 사용 | 단계 8 전에 결정 |
| 협업 | `AGENTS.md` 기반 작업 지시서 + CI. 교차 리뷰 절차는 `docs/REVIEW.md` | Claude와 ChatGPT가 같은 규칙을 읽음 |
| 접근성·성능 | reduced-motion 존중, Lighthouse 기준 유지 | 모바일 열람 대비 |
| 자격증 표기 | 취득 자격증(이름·연월) + 「〇〇 取得に向けて学習中」 최대 1개. 시안 A「シンプルリスト」 | 사용자 결정. 세부는 `docs/CONTENT.md` "자격증 표기 규칙" |
| 기술 스택 표기 | 분류별 태그 목록, 주력 기술만 채운 태그로 구분. 시안 B「分類別タグ」 | 사용자 결정. 세부는 `docs/CONTENT.md` "기술 스택 표기 규칙" |
| 기술 로고 | 아이콘 패키지(새 의존성) 도입 승인. 단색 로고 + 기술 이름 텍스트, 로고는 장식. 경력·기술 스택 원고 반영 때 한꺼번에 적용 | 사용자 결정(2026-10-30). 패키지 선택·크기·로고 없는 기술 처리는 적용 작업에서 정한다. 시안 B의 태그에 로고를 더하는 변경 |
| 디자인 색상·글꼴 | 색상 시안 E「Blue」(accent `#0F62FE` / 다크 `#78A9FF`), 글꼴 IBM Plex Sans JP + IBM Plex Mono. 색은 토큰 값 교체로 사이트 전체 변경, 회사별 강조색 구조는 만들지 않음 | 사용자 결정. 값은 `docs/tasks/T02-design-system.md` "사용자 선택 결과", 확정 기록은 T02 구현에서 `docs/DESIGN.md` §2 |

## 3. 페이지 구성

다섯 페이지를 일본어와 영어 두 벌로 생성한다.

| 페이지 | 내용 |
| --- | --- |
| Home | 한 줄 소개, 핵심 기술, 대표 프로젝트 2~3개 |
| About / 경력 | 경력 타임라인, 기술 스택, 자격증, 이력서 PDF |
| Projects | 프로젝트 카드 목록 + 프로젝트별 상세(課題 → 設計 → 結果 → 技術) |
| Contact | 연락 폼, 이메일, GitHub, LinkedIn |
| 회사별 비공개 페이지 (후반) | 지원 회사마다 강조점을 바꾼 페이지, 토큰 URL로 접근 |

모든 페이지 공통: 반응형, 다크 모드, SEO(meta·OG 이미지·sitemap), 접근성.

## 4. 동적 기능 (단계 8)

정적 부분을 완성한 뒤 추가한다. 별도 비용은 커스텀 도메인 구입비뿐인 것으로 조사했으나, 구현 시 재확인한다.

| 기능 | 상태 | 구성 |
| --- | --- | --- |
| 연락 폼 | 채택 | Turnstile + Workers 함수 + 메일 발송(Cloudflare Email Service 또는 Resend) + D1(선택) |
| 회사별 비공개 페이지 | 채택(선택) | 추측 불가능한 회사별 토큰 URL + Workers + KV 열람 기록. 로그인 없음 |
| AI 챗봇 | 보류 | API 키를 숨길 서버 필요, 사용료 발생 |
| 좋아요·방명록 등 | 제외 | 채용 목적과 관련 낮음 |

## 5. 개발 단계

각 단계가 끝날 때마다 미리보기로 확인한 뒤 다음으로 넘어간다.

| 단계 | 내용 | 상태 |
| --- | --- | --- |
| 0 | 요구사항·콘텐츠 정리, 저장소 뼈대(AGENTS.md, CLAUDE.md, docs/, 작업 지시서 템플릿) | done |
| 1 | 프로젝트 초기화: Astro, TypeScript, lint/format, CI | done |
| 2 | 디자인 시스템: 색, 타이포그래피, 간격, 다크 모드, 인터랙션 세부 확정 | done |
| 3 | 공통 레이아웃: 헤더, 푸터, 내비게이션, 언어 전환 | done |
| 4 | 페이지 구현: Home → About/경력 → Projects → Contact(정적 부분) | done |
| 5 | 인터랙션 구현: 컨셉 1~5 (T08 = 1·2, T09 = 5, T10 = 3·4) | in-progress |
| 6 | 품질: SEO, 접근성, 성능 최적화 | todo |
| 7 | 테스트: E2E(Playwright), Lighthouse CI | todo |
| 8 | 배포와 동적 기능: Cloudflare, 도메인, HTTPS, 방문 분석, 연락 폼, 회사별 비공개 페이지 | todo |
| 9 | 운영: 콘텐츠 추가 절차 문서화, 카드 클릭률 확인 후 효과 조정 | todo |

## 6. 작업 지시서 목록

상태: `todo` / `in-progress` / `review` / `done`. 담당: `claude` / `codex` / `-`(미배정).
새 지시서는 `docs/tasks/_TEMPLATE.md`를 복사해 만들고 이 표에 추가한다.

| ID | 제목 | 단계 | 선행 | 담당 | 상태 | 파일 |
| --- | --- | --- | --- | --- | --- | --- |
| T00 | 저장소 뼈대 | 0 | - | claude | done | PR #1 |
| T01 | 프로젝트 초기화 | 1 | T00 | codex | done | `docs/tasks/T01-init.md` — [PR #4](https://github.com/songyu0608/portfolio/pull/4) |
| T01-followup | 교차 리뷰 후속 정리 | 1 | T01 | codex | done | `docs/tasks/T01-followup.md` — [PR #5](https://github.com/songyu0608/portfolio/pull/5) |
| T02 | 디자인 시스템 | 2 | T01-followup | codex | done | `docs/tasks/T02-design-system.md` — [PR #9](https://github.com/songyu0608/portfolio/pull/9) |
| T03 | 공통 레이아웃·언어·테마 전환 | 3 | T02 | claude | done | `docs/tasks/T03-common-layout.md` — 지시서 [PR #10](https://github.com/songyu0608/portfolio/pull/10), 구현 [PR #11](https://github.com/songyu0608/portfolio/pull/11) |
| T04 | Home (한 줄 소개·핵심 기술·대표 프로젝트, 임시 문구) | 4 | T03 | claude | done | `docs/tasks/T04-home.md` — 지시서 [PR #12](https://github.com/songyu0608/portfolio/pull/12), 구현 [PR #13](https://github.com/songyu0608/portfolio/pull/13) |
| T05 | About/경력 (경력 타임라인·기술 스택·자격증·이력서 PDF, 임시 문구) | 4 | T04 | claude | done | `docs/tasks/T05-about.md` — 지시서 [PR #15](https://github.com/songyu0608/portfolio/pull/15), 구현 [PR #16](https://github.com/songyu0608/portfolio/pull/16) |
| T06 | Projects (목록·상세·担当工程, 임시 문구) | 4 | T05 | claude | done | `docs/tasks/T06-projects.md` — 지시서 [PR #18](https://github.com/songyu0608/portfolio/pull/18), 구현 [PR #19](https://github.com/songyu0608/portfolio/pull/19) |
| T07 | Contact (연락 수단 목록·메일 복사 버튼·푸터 연락 링크, 임시 문구) | 4 | T06 | claude | done | `docs/tasks/T07-contact.md` — 지시서 [PR #21](https://github.com/songyu0608/portfolio/pull/21), 구현 [PR #22](https://github.com/songyu0608/portfolio/pull/22) |
| T08 | Hero 디코딩·프로젝트 카드 틸트와 상세 전환 (인터랙션 컨셉 1·2) | 5 | T07 | claude | done | `docs/tasks/T08-hero-cards.md` — 지시서 [PR #24](https://github.com/songyu0608/portfolio/pull/24), 구현 [PR #25](https://github.com/songyu0608/portfolio/pull/25) |
| T09 | 스크롤 경력 타임라인 (인터랙션 컨셉 5) | 5 | T08 | claude | done | `docs/tasks/T09-career-timeline.md` — 지시서 [PR #27](https://github.com/songyu0608/portfolio/pull/27), 구현 [PR #28](https://github.com/songyu0608/portfolio/pull/28) |
| T10 | 명령 팔레트·터미널 모드 (인터랙션 컨셉 3·4) | 5 | T09 | claude | review | `docs/tasks/T10-command-palette-terminal.md` — 지시서 [PR #30](https://github.com/songyu0608/portfolio/pull/30) |

이후 지시서는 앞 작업이 끝날 때 작성한다. 예정: 단계 6~8. 원고 반영(기술 로고 포함)은 개발 작업 중 맨 마지막에 하되, 임시 항목이 남은 채 공개 배포하지 않는다(`docs/CONTENT.md` "임시 문구 규칙").

## 7. 미결 사항

- [ ] 커스텀 도메인 구입 여부와 도메인 이름 (단계 8 전, 메일 발송 설정에 필요할 가능성 높음)
- [ ] 콘텐츠 원고 (`docs/CONTENT.md` 체크리스트). 단계 4는 임시 문구로 진행하고, 단계 8 배포 전에 교체한다
- [x] 패키지 매니저 확정: pnpm 11.25.0 (T01)

## 8. 구현 시 공식 문서로 재확인할 항목

- Cloudflare Email Service: 공개 베타. 공식 문서는 발송을 Workers 유료 플랜 기능으로 안내한다는 조사 결과가 있다. 대안: Resend 무료 플랜(월 3,000통, 하루 100통, 확인 필요)
- 발신 주소에 커스텀 도메인이 필수인지
- Cloudflare Access 무료 한도 계산 방식 (Access를 쓸 경우만)
- 무료 플랜 수치 전반 (Workers 하루 10만 요청, KV 하루 읽기 10만·쓰기 1,000 등): 2026년 조사 시점 기준이므로 배포 전에 재확인

### T01 교차 리뷰에서 이월한 항목

- [ ] 단계 8: `/` → `/ja/`를 HTTP 301로 처리해 현재 정적 HTML의 2초 meta refresh를 대체한다. 언어 정책이 바뀌면 상태 코드도 재검토한다. 배포 URL에서 응답 상태와 Location을 확인한다.
- [ ] 다음 의존성 갱신: `pnpm-workspace.yaml`의 `minimumReleaseAgeExclude`에 있는 특정 버전 예외를 재검토한다. 대기 기간 경과 또는 의존성 교체 후 예외 없이 설치·CI가 통과하는 것을 확인하고 불필요한 항목을 삭제한다.
- 근거: [PR #4 교차 리뷰](https://github.com/songyu0608/portfolio/pull/4#issuecomment-6497967214). 나머지 설정·문서 개선은 T01-followup에서 처리한다.

### T02 교차 리뷰에서 이월한 항목

- [ ] 단계 6: 글꼴 CSS 크기 재검토. T02 시점 빌드에서 공통 CSS가 357,868B(gzip 172,181B), `@font-face` 251개이며 `/ja/`, `/en/` 모두 첫 렌더 전에 받는다. 후보: 빌드 시 실제 사용 글자 기준 서브셋, 일본어 글꼴 CSS를 `/ja/`에만 적용. Lighthouse로 전후를 측정한다.
- [x] T03: 일본어 제목 `word-break: auto-phrase`를 Safari·Firefox에서 확인하고, 필요하면 명시적 줄바꿈을 검토한다 (T03 범위 8). → 지원 현황은 공식 자료로 확인(Firefox·Safari 미지원), 실제 Firefox·WebKit 화면은 미확인. 결과·대안은 `docs/DESIGN.md` §2 타이포그래피, 후속은 아래 T03 이월 항목.
- [x] T03: PR #9 캡처는 `4aa6183` 기준이라 이후 수정이 반영되지 않았다. T03 PR에 최신 캡처를 싣는다 (T03 범위 8). → `docs/screenshots/T03-*`, T03 PR 본문.
- 근거: [PR #9](https://github.com/songyu0608/portfolio/pull/9) Claude 교차 리뷰, ChatGPT 재검증 리뷰.

### T03에서 이월한 항목

- [x] T04: Home 히어로 등 긴 일본어 제목은 Firefox·Safari(`auto-phrase` 미지원)에서 단어 중간에서 끊길 수 있다(T03 확인 화면 h1: 「読みやすさを、設計/する。」). 문절 단위 `<wbr>` 또는 `inline-block` span을 검토한다. BudouX(새 의존성)는 사용자 확인 후에만 도입한다. 근거: `docs/DESIGN.md` §2 타이포그래피. → T04: 콘텐츠에 문절 배열로 쓰고 `keep-all` + CSS 생성 U+200B로 문절 사이에서만 줄바꿈. `<wbr>`·`inline-block`은 Chromium 접근성 이름에 공백이 생겨 쓰지 않음. 결과는 `docs/DESIGN.md` §2.
- [ ] 단계 7 또는 Firefox·WebKit을 쓸 수 있는 환경: `auto-phrase` 미지원 브라우저의 실제 줄바꿈과 T03 헤더 배치(320px·1280px)를 확인한다. T04 문절 처리(`Phrases.astro`)가 같은 위치에서 줄을 바꾸는지, 실제 스크린 리더(VoiceOver, NVDA)가 문절 사이에서 끊어 읽지 않는지도 함께 확인한다.
- [x] `@astrojs/react` 통합 때문에 어느 페이지도 참조하지 않는 React 클라이언트 번들(`dist/_astro/client.*.js`, 220,749B)이 T01부터 빌드 결과에 생성된다. 페이지가 받는 JS에는 영향이 없다. → 2026-10-30 사용자 결정: 단계 5 인터랙션(A2)에서 React를 쓰므로 통합을 그대로 둔다. 단계 6 성능 점검 때 번들이 페이지에서 참조되지 않는지만 다시 확인한다. → T10: React·ReactDOM 청크는 명령 팔레트를 처음 열 때 받는 청크로 쓰인다. 참조되지 않는 파일은 Astro React 렌더러 진입 파일(약 1.8KB)뿐이다(`docs/ARCHITECTURE.md` §2).

### T04 지시서 작성 시 추가한 항목

- [ ] 단계 8 배포 전: 임시 문구(`placeholder: true`)가 0건인지 빌드 로그로 확인한다. 규칙은 `docs/CONTENT.md` "임시 문구 규칙".

### T07 지시서 작성 시 추가한 항목

- [ ] 연락처(메일 `songyu0608@gmail.com`·GitHub·LinkedIn)는 2026-10-30 수집 완료. Public 사이트의 `mailto:` 주소는 수집 봇에 노출될 수 있음을 알고 사용자가 공개를 정했다. 스팸이 늘면 난독화·전용 주소를 검토하고, 단계 8 연락 폼 도입 후 메일 주소를 계속 보일지 다시 정한다.

### T09 구현 시 추가한 항목

- [ ] 원고 반영 후: About 경력 타임라인의 마지막 선·점이 페이지 끝에서 강조되는지 1280×800·1280×1200·375×667에서 확인한다. 기준선이 화면 가운데라 타임라인 아래 내용이 화면 높이의 절반보다 짧으면 닿지 못한다(2026-10-31 사용자 결정, `docs/DESIGN.md` §6 스크롤 강조).

### T10 구현 시 발견한 항목

- [x] 헤더 스크립트(테마 버튼 + 팔레트 런처)가 압축 전 약 3.5KB로 지시서의 처음 기준 "런처 1.5KB 이하"를 넘었다(약 1.7KB는 Vite 동적 import 도우미, `vite.build.modulePreload: false`는 Astro 설정에 밀려 미적용). 2026-10-31 사용자 결정으로 기준을 "헤더 스크립트 1개, 압축 전 4KB 이하"로 바꿨다. 단계 6 성능 점검에서 Lighthouse로 영향만 확인한다.
- [ ] Firefox·Safari 실기, 실제 IME(일본어 입력 확정 Enter), 실제 스크린 리더(VoiceOver, NVDA)로 팔레트·터미널을 확인한다(단계 7 또는 해당 환경). 이 환경에서는 Chromium만 확인했다.

### T08 구현 시 발견한 항목

- [ ] 단계 6: Home의 CLS가 Chromium 1280px에서 0.32~0.37이다(T07 main도 같음, 2026-10-31 측정). 원인은 IBM Plex Sans JP 글꼴 교체 때 히어로 줄바꿈이 바뀌어 아래 내용이 약 35px 올라가는 것이다. 글꼴 로딩 방식(`font-display`, preload, 대체 글꼴 크기 맞춤 등)을 단계 6에서 정한다.

### T05 지시서 작성 시 추가한 항목

- [x] T06 Projects 지시서: 프로젝트 스키마에 担当工程(要件定義・設計・開発・テスト・運用) 필드를 추가한다. 카드에도 표시할지 상세에만 둘지는 T06에서 정한다(2026-10-30 사용자 확인: 担当工程은 경력이 아니라 프로젝트 단위). → 2026-10-30 사용자 결정: 카드와 상세 모두에 표시. `docs/tasks/T06-projects.md` 범위 1·4.
- [ ] 원고 반영: 이력서 PDF 공개 범위(공개용 판 또는 회사별 비공개 페이지만)를 사용자가 정한다. Public 저장소의 `public/`에 넣은 PDF는 누구나 내려받을 수 있다.

## 9. 결정 변경 기록

| 날짜 | 변경 | 비고 |
| --- | --- | --- |
| 2026-10-28 | 초기 결정 확정: 백엔드, 인터랙션 1~5 채택, Public 저장소, 도메인 미정 | T00 |
| 2026-10-28 | 자격증 표기 방식 확정: 학습 중 표기는 1개까지, 시안 A 채택 | 지시서 없음 (문서만 변경) |
| 2026-10-29 | AI 교차 리뷰 절차 확정 (`docs/REVIEW.md`) | 지시서 없음 (문서만 변경) |
| 2026-10-29 | T01 PR #4 merge·교차 리뷰 완료, 후속 개선의 처리 시점 기록 | T01-followup |
| 2026-10-29 | 기술 스택 표기 방식 확정: 분류별 태그, 시안 B 채택 | 지시서 없음 (문서만 변경) |
| 2026-10-30 | T01-followup PR #5 완료 반영, T02 디자인 시스템 지시서 작성 | T02 착수 전 |
| 2026-10-30 | 디자인 색상(시안 E)·글꼴(IBM Plex) 선택, 색 변경은 토큰 교체 방식으로 결정 | T02 |
| 2026-10-30 | T02 PR #9 merge 완료 반영, T03 공통 레이아웃 지시서 작성 | T03 착수 전 |
| 2026-10-30 | 언어별 페이지 파일 + 공유 화면 컴포넌트 방식, UI 문구 위치(`src/i18n/ui.ts`, 일본어 기준 타입), 테마 저장 키 `theme` 확정 | T03 (`docs/ARCHITECTURE.md` §2, A8) |
| 2026-10-30 | `@astrojs/react` 통합 유지(단계 5에서 사용). T03 완료 조건의 "빌드 결과에 React 런타임 미포함"은 참조되지 않는 번들이 남는 상태로 사용자가 수용 | T03 |
| 2026-10-30 | 내비게이션 일본어 문구 「経歴」「プロジェクト」「連絡先」 확정. 바꿀 때는 `src/i18n/ui.ts`의 `pages.*.name`만 고친다(URL은 그대로) | T03 사용자 확인 |
| 2026-10-30 | T03 PR #11 merge 완료 반영. 단계 4는 원고 수집 전에 임시 문구(placeholder)로 진행하고, 원고는 콘텐츠 파일만 바꿔 반영 | 사용자 결정, T04 지시서 |
| 2026-10-30 | 콘텐츠 구조(YAML content collections + `src/lib/content.ts` 규칙 검사), 일본어 문절 줄바꿈 방식, Home h1 = 이름, 사이트 이름과 프로필 이름은 별개 값 | T04 구현 (`docs/ARCHITECTURE.md` §2, A9, `docs/DESIGN.md` §2·§5) |
| 2026-10-30 | Home h1 = 이름 확정, 프로필 이름 일본어 「チェ ソンギュ」·영어 `choi seonggyu`. 일본어 UI 문구(「主な技術」 등)는 지시서 기본안으로 두고 나중에 사용자가 `src/i18n/ui.ts`에서 직접 고친다. 한 줄 소개는 원고 합의 후 반영 | T04 사용자 확인 |
| 2026-10-30 | T04 PR #13 merge 완료 반영(Codex 교차 리뷰 수정 필요 1건·개선 제안 1건 반영 후 재검증 통과) | 지시서 없음 (문서만 변경) |
| 2026-10-30 | T04 done 반영 PR #14 merge. 전문 분야를 백엔드 + AI 활용 개발로 변경(AI 엔지니어로도 어필), 기술 스택 첫 분류 「AI活用開発」(실제 값 4개) 추가, 기술 로고 아이콘 패키지 승인(원고 반영 때 적용), 担当工程은 프로젝트 단위(T06) | 사용자 결정, T05 지시서 |
| 2026-10-30 | T05 지시서 PR #15 merge. T05 구현: 주력 기술 범례 UI 문구 키를 `home.skills.legend`에서 `skill.legend`로 옮겨 Home·About이 공유. About 섹션 제목·학습 중 문형·기술 스택 영어 분류 이름은 지시서 기본안으로 구현(사용자 확인 대기) | T05 구현 (`docs/DESIGN.md` §6, `docs/ARCHITECTURE.md` §2) |
| 2026-10-30 | T05 PR #16 merge 완료 반영(Codex 교차 리뷰 수정 필요·개선 제안 없음). About 섹션 제목·학습 중 문형·About 설명·기술 스택 영어 분류 이름은 지시서 기본안으로 merge했고 사용자 확인 전이다. 바꿀 때는 `src/i18n/ui.ts`, `src/content/skills.yaml`만 고친다 | 지시서 없음 (문서만 변경) |
| 2026-10-30 | T06 Projects 지시서 작성. 担当工程은 카드와 상세 모두에 표시(다섯 공정 고정 순서, 맡은 공정은 채움·체크). 목록은 代表プロジェクト + その他のプロジェクト, 카드 전체가 상세 링크(애니메이션은 단계 5). 상세에 「チーム」 칸·「代表プロジェクト」 표시·이전·다음 링크 추가 | 사용자 결정(시안 확인), T06 지시서 |
| 2026-10-30 | T06 구현: 担当工程 id·순서의 원본을 `src/content.config.ts`의 `PHASES`로, 카드 전체 링크는 제목 링크 `::after` 확장 방식, 카드 그리드(`.project-grid`)를 `global.css`로 이동, 「代表プロジェクト」 UI 문구 키를 `project.featured`로 공용화. UI 문구는 지시서 기본안(사용자 확인 전) | T06 구현 (`docs/DESIGN.md` §7, `docs/ARCHITECTURE.md` §2) |
| 2026-10-30 | T06 PR #19 merge 완료 반영(Codex 교차 리뷰 수정 필요·개선 제안 없음). Projects UI 문구(공정 영어 이름, 「（担当）」 상태 텍스트, 소개 문단 등)는 지시서 기본안으로 merge했고 사용자 확인 전이다. 바꿀 때는 `src/i18n/ui.ts`만 고친다 | 지시서 없음 (문서만 변경) |
| 2026-10-30 | `.gitattributes`로 줄바꿈을 LF에 고정. Windows 노트북에서도 작업하기 때문(사용자 확인). 기존 Windows 체크아웃의 재체크아웃 방법은 `AGENTS.md` §6 | 지시서 없음, Codex 리뷰(PR #19)에서 `core.autocrlf=true` 환경의 `pnpm format:check` 실패 보고 |
| 2026-10-30 | T07 Contact 지시서 작성. 연락 수단 목록(메일·GitHub·LinkedIn, 값이 있는 것만), 메일 복사 버튼(점진적 향상), 모든 페이지 푸터에 연락 링크. 희망 조건 칸·폼 자리는 두지 않고 Home 히어로는 「連絡する」 버튼만 유지 | 사용자 결정(범위 정리·시안 확인), T07 지시서 |
| 2026-10-30 | T07 지시서 PR #21 merge(GitHub Actions 실행 대기로 최신 커밋 CI 결과 없이 사용자가 merge. 문서만 변경, 첫 커밋 CI는 4단계 통과). 연락처 3개(메일·GitHub·LinkedIn)를 실제 값으로 수집. T07 구현 담당 claude | 사용자 결정 |
| 2026-10-31 | T07 PR #22 merge 완료 반영(CI 통과, Codex 교차 리뷰 수정 필요·개선 제안 없음). 단계 4 완료. Contact UI 문구(「連絡方法」「コピー」 등)는 지시서 기본안으로 merge했고 사용자 확인 전이다. 바꿀 때는 `src/i18n/ui.ts`만 고친다 | 지시서 없음 (문서만 변경) |
| 2026-10-31 | 작업 순서: 원고 반영(실제 경력·프로젝트 문구, 기술 로고)은 맨 마지막에 한다. 다음은 단계 5 인터랙션. 임시 항목 0건 확인 후 공개 배포하는 규칙은 유지 | 사용자 결정 |
| 2026-10-31 | 단계 5 지시서를 3개로 나눔: T08 = 컨셉 1·2, T09 = 컨셉 5, T10 = 컨셉 3·4. T08 지시서 작성: 컨셉 1·2는 React island·새 의존성 없이 Astro `<script>`와 CSS cross-document View Transitions로 구현(`docs/ARCHITECTURE.md` A2 비고, `docs/DESIGN.md` §3) | 사용자 결정(나눔), T08 지시서 |
| 2026-10-31 | T08 지시서 PR #24 merge, T08 구현 담당 claude. 구현: 디코딩·틸트는 인라인 모듈 2개(압축 전 합계 약 2.5KB), 상세 전환은 CSS View Transitions. 프로젝트 slug 형식 검사 추가. Home CLS(기존 글꼴 교체)는 단계 6 항목으로 이월 | 사용자 결정(담당), T08 구현 |
| 2026-10-31 | T08 PR #25 merge 완료 반영(CI 통과, Codex 교차 리뷰 수정 필요 1건(디코딩 문자 폭 분류)·개선 제안 2건 반영 후 재검증 통과). 디코딩 1초·틸트 4°·전환 280ms는 지시서 기본안으로 merge했고 사용자 확인 전이다 | 지시서 없음 (문서만 변경) |
| 2026-10-31 | T09 지시서 작성: 컨셉 5는 JS·React island·새 의존성 없이 CSS 스크롤 기반 애니메이션(`animation-timeline: view()`)으로 선 채움·점 강조만 한다. 글자는 흐리게 하지 않는다(시안의 불투명도 나타남 미적용). 미지원 브라우저·reduced-motion은 T05 화면 그대로(`docs/DESIGN.md` §3, `docs/ARCHITECTURE.md` A2 비고) | T09 지시서 |
| 2026-10-31 | T09 지시서 PR #27 merge(Codex 수정 필요 1건·개선 제안 1건 반영), T09 구현 담당 claude. 구현: 채움 구간을 지시서 기본안(`entry 100%` ~ `cover 50%`)에서 화면 가운데 기준(`view-timeline-inset: 50%`, `cover 0%` ~ `cover 100%`)으로 바꿔 선이 다음 점에 닿을 때 점이 강조되게 했다. 인쇄에서는 효과를 끈다(`@media screen`) | 사용자 결정(담당), T09 구현 |
| 2026-10-31 | T09 기준선은 화면 가운데로 유지(Codex 리뷰 PR #28: 지시서의 `cover 50%` 상한과 어긋남 지적). 지시서 조건을 바꾸고, 원고 반영 때 마지막 항목 도달을 다시 확인한다(§8) | 사용자 결정 |
| 2026-10-31 | T09 PR #28 merge 완료 반영(CI 통과, Codex 교차 리뷰 수정 필요 1건(기준선 위치)은 사용자 결정으로 가운데 기준 유지·지시서 조건 갱신, 개선 제안 2건 반영 후 재검증 통과). 글자 나타남 효과 미적용은 지시서 기본안으로 merge | 지시서 없음 (문서만 변경) |
| 2026-10-31 | T10 지시서 작성: 컨셉 3·4는 모든 페이지에 런처 스크립트만 넣고 열 때 React UI(동적 import, island 아님)와 언어별 정적 JSON(`/ja/commands.json` 등)을 불러온다. 명령 정의는 `src/components/interactive/commands.ts` 하나, 모달은 `<dialog>`, 새 의존성·Motion/GSAP 없음. 팔레트에 프로젝트 상세·시스템 설정 테마 포함, 터미널은 팔레트에서만 연다(기본안) | T10 지시서 (`docs/DESIGN.md` §3, `docs/ARCHITECTURE.md` A2 비고) |
| 2026-10-31 | T10 지시서 PR #30 merge(Codex 수정 필요 1건·개선 제안 2건 반영), T10 구현 담당 claude. 구현: 테마 버튼 스크립트를 런처와 같은 헤더 스크립트(`SiteHeader.astro`)로 합쳐 페이지가 받는 JS 파일을 1개로 유지, 팔레트 CSS는 `?url`로 열 때 붙임(일반 import는 모든 페이지에 `<link>`가 생김). 헤더 스크립트가 런처 목표 크기(1.5KB)를 넘는 점은 §8 항목으로 이월. Codex 리뷰 후 기준을 "헤더 스크립트 압축 전 4KB 이하"로 변경 | 사용자 결정(담당), T10 구현 |
