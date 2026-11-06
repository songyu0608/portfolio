// 어사인 빌드에서만 실행한다. 기본 E2E에는 영향을 주지 않는다.
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { locales, ui } from './support/site';
import { openTerminal, runCommand, terminalLog } from './support/command-ui';

for (const locale of locales) {
  const data = JSON.parse(readFileSync(`dist/${locale}/commands.json`, 'utf8'));
  for (const width of [1280, 375]) {
    test(`assign Contact·footer·terminal ${locale} ${width}`, async ({
      page,
    }, info) => {
      test.skip(data.contact.links.length > 0, '기본 빌드는 기존 E2E로 확인');
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/contact/`);
      await expect(page.locator('main a[href^="mailto:"]')).toHaveText(
        data.contact.email.address,
      );
      await expect(page.locator('main li')).toHaveCount(1);
      await expect(page.locator('footer li')).toHaveCount(1);
      await expect(page.locator('footer a')).toHaveAttribute(
        'href',
        `mailto:${data.contact.email.address}`,
      );
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const contact = info.outputPath(`assign-${locale}-${width}-contact.png`);
      await page.screenshot({ path: contact, fullPage: true });
      await info.attach('Contact and footer', {
        path: contact,
        contentType: 'image/png',
      });
      const input = await openTerminal(page, locale);
      await runCommand(input, 'contact');
      await expect(
        terminalLog(page, locale).getByRole('link', {
          name: data.contact.email.address,
        }),
      ).toBeVisible();
      await expect(terminalLog(page, locale)).not.toContainText(
        ui[locale].contact.method.github,
      );
      await expect(terminalLog(page, locale)).not.toContainText(
        ui[locale].contact.method.linkedin,
      );
      const terminal = info.outputPath(
        `assign-${locale}-${width}-terminal.png`,
      );
      await page.screenshot({ path: terminal, fullPage: true });
      await info.attach('Terminal contact', {
        path: terminal,
        contentType: 'image/png',
      });
    });
  }
}
