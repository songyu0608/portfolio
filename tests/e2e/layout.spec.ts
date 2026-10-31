// 2-9 레이아웃, 세 브라우저 공통(T15): 320·640px 가로 넘침 0, 1280px 헤더 한 줄(T03 배치).
// 텍스트 간격·CSS 순서 회귀는 layout.chromium.spec.ts에 있다.
import { expect, test } from '@playwright/test';
import { horizontalOverflow } from './support/layout';
import { sitePages } from './support/site';

for (const { path: pagePath } of sitePages()) {
  test(`가로 넘침·헤더 ${pagePath}`, async ({ page }) => {
    for (const width of [320, 640]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(pagePath);
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      expect(await horizontalOverflow(page), `${width}px 가로 넘침`).toBe(0);
    }

    // 1280px에서 사이트 이름 → 내비게이션 → 도구가 한 줄에 놓인다.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(pagePath);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const rows = await page
      .locator('body > header')
      .locator('a, button, [aria-current]')
      .evaluateAll((items) =>
        items
          .map((el) => el.getBoundingClientRect())
          .filter((rect) => rect.width > 0 && rect.height > 0)
          .map((rect) => ({ top: rect.top, bottom: rect.bottom })),
      );
    expect(rows.length).toBeGreaterThan(3);
    const lowestTop = Math.max(...rows.map((r) => r.top));
    const highestBottom = Math.min(...rows.map((r) => r.bottom));
    expect(
      lowestTop,
      '1280px 헤더 항목이 한 줄(세로 범위가 모두 겹침)',
    ).toBeLessThan(highestBottom);
  });
}
