# T01-followup: 교차 리뷰 후속 정리

| 항목 | 값 |
| --- | --- |
| 단계 | 1 |
| 선행 작업 | T01 (PR #4 merge 완료) |
| 담당 | codex |
| 상태 | review |
| 브랜치 | `codex/T01-followup` |

## 목표

PR #4 교차 리뷰의 개선 제안을 반영하고, T02 착수 전 검사 설정과 후속 작업 기록을 정리한다.

## 배경

[Claude 교차 리뷰](https://github.com/songyu0608/portfolio/pull/4#issuecomment-6497967214)는 수정 필수 사항 없이 merge 가능으로 결론 냈다. 아래 항목은 유지보수 개선이다.

## 범위

포함:
- T01 완료 상태와 PR #4를 계획·기존 지시서에 반영
- A7에 pnpm 11.25.0 선택 이유 기록
- 두 권장 설정에서 이름이 겹치는 React Hooks 규칙 9개는 `react-hooks`로 통일하고, 대응하는 `@eslint-react` 규칙만 해제. 기타 React 검사 유지
- 직접 의존성의 정확한 버전 표기 통일. 설치되는 버전은 변경하지 않음
- 단계 8 HTTP 301 처리와 다음 의존성 갱신 시 release-age 예외 삭제 검증을 PLAN에 기록

제외:
- pnpm 및 의존성 업그레이드, release-age 예외 즉시 삭제
- 배포 설정 변경, 디자인 구현 (T02)

## 수정 가능한 파일

- `eslint.config.mjs`, `package.json`, `pnpm-lock.yaml`
- `docs/PLAN.md`, `docs/ARCHITECTURE.md` (A7 및 버전 정책), `docs/tasks/T01-init.md` (상태·완료 조건)
- `docs/tasks/T01-followup.md`

## 완료 조건

- [x] 잘못된 Hook 호출, 누락된 effect 의존성, effect 내부의 동기 setState가 각각 한 규칙에서 보고되고 정상 예제는 통과
- [x] 기타 React 및 Hooks 권장 규칙이 유지됨
- [x] 직접 의존성 버전 표기 통일, lockfile의 실제 패키지 버전 변화 없음
- [x] frozen-lockfile 설치, 포맷·lint·타입·빌드 및 CI 통과 (최신 커밋 결과는 PR 본문에 기록)
- [x] T01 완료 기록 및 후속 항목·T02 준비 순서 반영

## 확인 방법

`pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`를 실행한다.
ESLint의 `lintText`로 TSX 예제를 메모리에서 검사한다. 조건부 Hook 호출, effect 의존성 누락, effect 내부의 동기 setState는 `react-hooks/*`에서 각각 한 번 보고되어야 한다. 정상 Hook 예제는 통과해야 한다. 최종 설정에서 두 플러그인의 활성 동명 규칙 교집합이 비어 있고 다른 권장 규칙이 유지되는지도 확인한다.
lockfile diff는 직접 의존성 3개의 specifier에서 `^` 제거만 포함해야 한다.

## 메모

이 PR은 Claude 교차 리뷰와 사용자 merge 후 완료 처리한다. 다음은 `docs/DESIGN.md`를 기준으로 T02 디자인 시스템 지시서 작성이다.
