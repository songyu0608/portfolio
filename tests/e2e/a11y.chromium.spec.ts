// 2-7 axe, Chromium만 도는 조건(T15): 19페이지 × 라이트·다크 × 375px,
// 팔레트·터미널 다크 1280px과 라이트·다크 375px. 세 브라우저 공통 조건은 a11y.spec.ts에 있다.
import { test } from '@playwright/test';
import {
  openPalette,
  openTerminal,
  overflowTerminalLog,
} from './support/command-ui';
import {
  expectNoViolations,
  setTheme,
  settle,
  THEMES,
  type Theme,
} from './support/axe';
import { representativePages, sitePages } from './support/site';

test.describe('375px', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const { path: pagePath } of sitePages()) {
    test(`axe ${pagePath} 375px`, async ({ page }) => {
      await page.goto(pagePath);
      await settle(page);
      for (const theme of THEMES) {
        await setTheme(page, theme);
        await expectNoViolations(page, `${theme}-375`);
      }
    });
  }
});

const [home] = representativePages();
const dialogConditions: { theme: Theme; width: number }[] = [
  { theme: 'dark', width: 1280 },
  { theme: 'light', width: 375 },
  { theme: 'dark', width: 375 },
];

for (const { theme, width } of dialogConditions) {
  test.describe(`${theme} ${width}px`, () => {
    test.use({ colorScheme: theme, viewport: { width, height: 800 } });

    test(`axe 명령 팔레트 ${theme} ${width}px`, async ({ page }) => {
      await page.goto(home.path);
      await settle(page);
      await setTheme(page, theme);
      await openPalette(page, home.locale);
      await expectNoViolations(page, `palette-${theme}-${width}`);
    });

    test(`axe 터미널(출력이 넘친 상태) ${theme} ${width}px`, async ({
      page,
    }) => {
      await page.goto(home.path);
      await settle(page);
      await setTheme(page, theme);
      await openTerminal(page, home.locale);
      await overflowTerminalLog(page, home.locale);
      await expectNoViolations(page, `terminal-${theme}-${width}`);
    });
  });
}
