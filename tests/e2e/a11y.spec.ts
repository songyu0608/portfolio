// 2-7 axe, 세 브라우저 공통 조건(T15): 19페이지 × 라이트·다크 × 1280px, 팔레트·터미널은 라이트 1280px.
// Chromium만 도는 나머지 조건(375px, 다크 팔레트·터미널)은 a11y.chromium.spec.ts에 있다.
import { test } from '@playwright/test';
import {
  openPalette,
  openTerminal,
  overflowTerminalLog,
} from './support/command-ui';
import { expectNoViolations, setTheme, settle, THEMES } from './support/axe';
import { representativePages, sitePages } from './support/site';

const WIDTH = 1280;
test.use({ viewport: { width: WIDTH, height: 800 } });

for (const { path: pagePath } of sitePages()) {
  test(`axe ${pagePath} ${WIDTH}px`, async ({ page }) => {
    await page.goto(pagePath);
    await settle(page);
    for (const theme of THEMES) {
      await setTheme(page, theme);
      await expectNoViolations(page, `${theme}-${WIDTH}`);
    }
  });
}

const [home] = representativePages();

test(`axe 명령 팔레트 light ${WIDTH}px`, async ({ page }) => {
  await page.goto(home.path);
  await settle(page);
  await openPalette(page, home.locale);
  await expectNoViolations(page, `palette-light-${WIDTH}`);
});

test(`axe 터미널(출력이 넘친 상태) light ${WIDTH}px`, async ({ page }) => {
  await page.goto(home.path);
  await settle(page);
  await openTerminal(page, home.locale);
  await overflowTerminalLog(page, home.locale);
  await expectNoViolations(page, `terminal-light-${WIDTH}`);
});
