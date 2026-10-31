// 2-10 접근성 트리(T15). 18페이지와 404의 body(본문 바로가기·헤더·main·푸터) ariaSnapshot을 기준 파일과 비교한다.
// 픽셀 캡처 대신 쓰는 화면 회귀 검사다(2026-10-31 사용자 결정 A안). 기준 파일은 tests/e2e/__snapshots__/.
// 원고·화면을 바꾸면 `pnpm test --project=chromium --update-snapshots`로 갱신하고 diff를 리뷰한다.
import { expect, test } from '@playwright/test';
import { sitePages } from './support/site';

/** 경로 → 기준 파일 이름. 예: /ja/projects/order-api/ → ja-projects-order-api.aria.yml */
const snapshotName = (pagePath: string) =>
  `${pagePath
    .replace(/\.html$/, '')
    .split('/')
    .filter(Boolean)
    .join('-')}.aria.yml`;

test.use({ viewport: { width: 1280, height: 800 } });

for (const { path: pagePath } of sitePages()) {
  test(`접근성 트리 ${pagePath}`, async ({ page }) => {
    await page.goto(pagePath, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await expect(page.locator('body')).toMatchAriaSnapshot({
      name: snapshotName(pagePath),
    });
  });
}
