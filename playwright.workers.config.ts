// Cloudflare 동작 테스트 설정(T17, docs/ARCHITECTURE.md §2 "배포"). 먼저 `pnpm build`를 실행한다.
// wrangler dev(로컬, 로그인 없음)가 wrangler.jsonc대로 dist/를 정적 자산으로 낸다. 테스트는 브라우저 없이
// 요청만 보내고, 리다이렉트를 따라가지 않는다(tests/workers/cloudflare.spec.ts).
import { defineConfig } from '@playwright/test';

// E2E(4329)·Lighthouse(4330)·wrangler dev 기본값(8787, pnpm preview:workers)과 겹치지 않는 포트
const PORT = 8788;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: 'tests/workers',
  outputDir: 'test-results/workers',
  fullyParallel: true,
  forbidOnly: isCI,
  // 흔들리는 테스트는 재시도로 가리지 않고 고친다(E2E와 같음).
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
  },
  webServer: {
    // 대화형 단축키 안내를 끈다(CI 로그·Playwright가 띄우는 경우 필요 없음).
    command: `pnpm exec wrangler dev --ip 127.0.0.1 --port ${PORT} --show-interactive-dev-session=false`,
    url: `http://127.0.0.1:${PORT}/ja/`,
    reuseExistingServer: !isCI,
  },
});
