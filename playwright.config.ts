// E2E 테스트 설정(T15, docs/ARCHITECTURE.md "테스트"). 빌드 결과(dist/)를 astro preview로 띄워 테스트한다.
// 먼저 `pnpm build`를 실행한다. 테스트 파일은 tests/e2e/이며, 이름이 *.chromium.spec.ts인 파일은
// Chromium에서만 돌린다(HTML만 보는 검사, 강제 색상 에뮬레이션, 접근성 트리 비교 등).
import { defineConfig, devices } from '@playwright/test';

const PORT = 4329;
const isCI = !!process.env.CI;
// 브라우저를 내려받을 수 없는 환경(예: 미리 설치된 Chromium만 있는 실행 환경)에서 쓸 Chromium 실행 파일.
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const chromiumOnly = /\.chromium\.spec\.ts$/;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  // 흔들리는 테스트는 재시도로 가리지 않고 고친다.
  retries: 0,
  // 공식 문서 권장(안정성·재현성): https://playwright.dev/docs/ci
  workers: isCI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // 장식 애니메이션을 끈 상태가 기본이다. 모션 검사만 테스트 안에서 바꾼다.
    reducedMotion: 'reduce',
  },
  expect: {
    // 접근성 트리는 Chromium에서만 비교하므로 플랫폼·프로젝트 이름을 경로에 넣지 않는다.
    // 그래야 Linux CI와 Windows·macOS가 같은 기준 파일을 쓴다.
    toMatchAriaSnapshot: {
      pathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: chromiumExecutable
          ? { executablePath: chromiumExecutable }
          : {},
      },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: chromiumOnly,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: chromiumOnly,
    },
  ],
  webServer: {
    // --ignore-lock: 이미 떠 있는 미리보기 서버와 별개로 띄우고, AI 에이전트 실행 환경에서
    // astro preview가 스스로 백그라운드로 넘어가지 않게 한다(넘어가면 Playwright가 서버를 관리하지 못함).
    command: `pnpm exec astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/ja/`,
    reuseExistingServer: !isCI,
  },
});
