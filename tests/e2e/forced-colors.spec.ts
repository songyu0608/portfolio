// 2-8 강제 색상(T14, docs/DESIGN.md §11 강제 색상 모드). 주력 기술 태그(.tag--featured)는 채움이 뜻이므로
// 강제 색상에서도 채워져 일반 태그와 달라야 한다(1.4.1). Windows 고대비 테마의 실제 색은 확인하지 않는다.
// 강제 색상에서 getComputedStyle은 작성자 색을 돌려주는 경우가 있어, 실제로 그려진 픽셀로 판단한다.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { THEMES } from './support/axe';
import { representativePages } from './support/site';

const pages = representativePages().filter(
  (p) => p.kind === 'home' || p.kind === 'about',
);

interface Paint {
  /** 가장 많이 칠해진 색(rgb) = 태그 바탕 */
  dominant: string;
  /** 바탕색과 다른 픽셀의 비율(글자·테두리) */
  other: number;
}

/** 요소를 캡처해 브라우저 캔버스로 픽셀을 센다(이미지 처리 의존성을 늘리지 않기 위함). */
async function paintOf(page: Page, locator: Locator): Promise<Paint> {
  const png = (await locator.screenshot()).toString('base64');
  return page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes]));
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2d context');
    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
    const counts = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4) {
      const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const [dominant, top] = [...counts].sort((a, b) => b[1] - a[1])[0];
    const total = data.length / 4;
    return { dominant, other: (total - top) / total };
  }, png);
}

for (const theme of THEMES) {
  test.describe(`강제 색상 ${theme}`, () => {
    test.use({ forcedColors: 'active', colorScheme: theme });

    for (const { path: pagePath } of pages) {
      test(`주력 태그가 채워진다 ${pagePath}`, async ({ page }) => {
        await page.goto(pagePath);
        await page.evaluate(() => document.fonts.ready.then(() => undefined));
        // 에뮬레이션이 켜졌는지 먼저 본다(엔진별 지원 확인, T15 메모).
        expect(
          await page.evaluate(
            () => matchMedia('(forced-colors: active)').matches,
          ),
          'forced-colors 에뮬레이션',
        ).toBe(true);
        const featured = await paintOf(
          page,
          page.locator('main .tag.tag--featured').first(),
        );
        const normal = await paintOf(
          page,
          page.locator('main .tag:not(.tag--featured)').first(),
        );
        expect(featured.dominant, '주력 태그와 일반 태그의 바탕').not.toBe(
          normal.dominant,
        );
        // 주력 태그 위의 글자가 바탕과 다른 색으로 그려진다.
        expect(featured.other, '주력 태그 글자').toBeGreaterThan(0.05);
      });
    }
  });
}
