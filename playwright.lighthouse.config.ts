// Lighthouse 점수 검사 설정(T16, docs/ARCHITECTURE.md "테스트"). 먼저 `pnpm build`를 실행한다.
// 테스트는 브라우저를 직접 쓰지 않는다. 측정 1회마다 Lighthouse CLI가 Chrome을 새로 띄운다
// (tests/lighthouse/support/lighthouse.ts). 프로젝트 이름(mobile·desktop)이 폼팩터다.
import { defineConfig } from '@playwright/test';

// E2E(playwright.config.ts, 4329)와 동시에 띄워도 겹치지 않는 포트
const PORT = 4330;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: 'tests/lighthouse',
  outputDir: 'test-results/lighthouse',
  // 측정끼리 CPU를 나눠 쓰면 점수가 흔들린다. 로컬도 한 번에 하나씩 잰다.
  workers: 1,
  fullyParallel: false,
  forbidOnly: isCI,
  // 흔들리는 결과는 재시도로 가리지 않는다(docs/tasks/T16-lighthouse-ci.md 메모).
  retries: 0,
  // 테스트 하나 = 페이지 하나 × 폼팩터 하나 × 3회 측정
  timeout: 180_000,
  // 측정이 원래 오래 걸리므로(테스트 하나 약 35초) 느린 파일 경고를 끈다.
  reportSlowTests: null,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'lighthouse-report' }],
    ['./tests/lighthouse/support/summary-reporter.ts'],
  ],
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [{ name: 'mobile' }, { name: 'desktop' }],
  webServer: {
    // --ignore-lock의 이유는 playwright.config.ts와 같다.
    command: `pnpm exec astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/ja/`,
    reuseExistingServer: !isCI,
  },
});
