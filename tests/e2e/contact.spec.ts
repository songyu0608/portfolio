// 2-5 Contact 메일 복사 버튼(T07). 메일 주소는 빌드 결과(commands.json, Contact와 같은 콘텐츠)에서 읽는다.
import { expect, test } from '@playwright/test';
import {
  commandData,
  kindOf,
  localeOf,
  sitemapPaths,
  ui,
} from './support/site';

for (const pagePath of sitemapPaths().filter((p) => kindOf(p) === 'contact')) {
  const locale = localeOf(pagePath);
  const text = ui[locale].contact.copy;
  const { address } = commandData(locale).contact.email;

  test(`메일 주소 복사 ${pagePath}`, async ({ page, context, browserName }) => {
    // 클립보드 권한 처리는 엔진마다 달라 값은 Chromium에서만 읽는다(T15 2-5).
    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    }
    await page.goto(pagePath);
    const button = page.getByRole('button', { name: text.name });
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('data-copy', address);
    const status = button.locator('xpath=..').getByRole('status');
    await expect(status).toHaveText('');

    await button.click();
    if (browserName === 'chromium') {
      await expect(status).toHaveText(text.done);
      await expect(button).toContainText(text.done);
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        address,
      );
    } else {
      await expect(status).not.toHaveText('');
      expect([text.done, text.failed]).toContain(await status.textContent());
    }
    // 접근 가능한 이름은 상태와 관계없이 그대로다.
    await expect(button).toHaveAccessibleName(text.name);
  });
}
