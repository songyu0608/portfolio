// 2-4 명령 팔레트·터미널(T10, T14). 항목·출력 값은 빌드 결과의 commands.json과 ui.ts에서 가져온다.
import { expect, test, type Page } from '@playwright/test';
import { fill } from '../../src/components/interactive/commands';
import {
  commandButton,
  openPalette,
  openTerminal,
  overflowTerminalLog,
  paletteDialog,
  runCommand,
  terminalDialog,
  terminalInput,
  terminalLog,
} from './support/command-ui';
import {
  commandData,
  otherLocale,
  pairPath,
  representativePages,
  ui,
} from './support/site';

// 팔레트·터미널은 모든 페이지에서 같은 UI라 대표 페이지(ja Home)와 상세(언어 전환 대상) 하나로 본다.
const home = representativePages()[0];
const detail = representativePages().find((p) => p.kind === 'detail');
if (!detail) throw new Error('상세 페이지가 없습니다.');
const { locale } = home;
const text = ui[locale].command;
const data = commandData(locale);

const options = (page: Page) => paletteDialog(page, locale).getByRole('option');

test.describe('명령 팔레트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(home.path);
  });

  test('⌘K/Ctrl+K로 열고 Esc로 닫으면 연 자리로 포커스가 돌아간다', async ({
    page,
  }) => {
    const origin = page.locator('header a').first();
    await origin.focus();
    await page.keyboard.press('ControlOrMeta+k');
    const dialog = paletteDialog(page, locale);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('combobox')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(origin).toBeFocused();
    // 다시 누르면 다시 열린다(두 번째부터는 이미 불러온 UI).
    await page.keyboard.press('ControlOrMeta+k');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('ControlOrMeta+k');
    await expect(dialog).toBeHidden();
  });

  test('헤더 버튼으로 열고 Esc로 닫으면 버튼으로 포커스가 돌아간다', async ({
    page,
  }) => {
    await openPalette(page, locale);
    await expect(paletteDialog(page, locale)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(paletteDialog(page, locale)).toBeHidden();
    await expect(commandButton(page, locale)).toBeFocused();
  });

  test('검색어로 거르고, 맞는 항목이 없으면 안내한다', async ({ page }) => {
    const input = await openPalette(page, locale);
    const all = await options(page).count();
    expect(all).toBeGreaterThan(data.pages.length + data.projects.length);
    await expect(paletteDialog(page, locale).getByRole('status')).toHaveText(
      fill(text.palette.count, { count: String(all) }),
    );

    const [project] = data.projects;
    await input.fill(project.slug);
    await expect(options(page)).toHaveCount(1);
    await expect(options(page)).toContainText(project.title);

    // 일부러 어느 항목에도 없는 검색어다.
    const query = 'zzzz-no-match';
    await input.fill(query);
    await expect(options(page)).toHaveCount(0);
    await expect(paletteDialog(page, locale)).toContainText(
      fill(text.palette.empty, { query }),
    );
  });

  test('↑↓로 고르고 Enter로 이동한다', async ({ page }) => {
    const input = await openPalette(page, locale);
    const first = options(page).nth(0);
    const second = options(page).nth(1);
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await input.press('ArrowDown');
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(first).toHaveAttribute('aria-selected', 'false');
    await expect(input).toHaveAttribute(
      'aria-activedescendant',
      (await second.getAttribute('id')) ?? '',
    );
    await input.press('ArrowUp');
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await input.press('ArrowDown');
    await input.press('Enter');
    // 첫 묶음은 페이지 목록이다(commands.ts paletteItems).
    await expect(page).toHaveURL(data.pages[1].href);
  });

  test('테마 명령으로 바꾸고 시스템 설정으로 되돌린다', async ({ page }) => {
    const html = page.locator('html');
    for (const theme of ['dark', 'light'] as const) {
      const input = await openPalette(page, locale);
      await input.fill(`theme ${theme}`);
      await expect(options(page)).toHaveCount(1);
      await input.press('Enter');
      await expect(paletteDialog(page, locale)).toBeHidden();
      await expect(html).toHaveAttribute('data-theme', theme);
    }
    const input = await openPalette(page, locale);
    await input.fill('theme system');
    await input.press('Enter');
    await expect(html).not.toHaveAttribute('data-theme');
  });

  test('언어 명령으로 같은 페이지의 다른 언어로 간다', async ({ page }) => {
    await page.goto(detail.path);
    const other = otherLocale(locale);
    const input = await openPalette(page, locale);
    await input.fill(`lang ${other}`);
    await expect(options(page)).toHaveCount(1);
    await input.press('Enter');
    await expect(page).toHaveURL(pairPath(detail.path, other));
  });
});

test.describe('터미널', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(home.path);
  });

  test('팔레트에서 열면 입력란에 포커스가 가고 명령을 실행한다', async ({
    page,
  }) => {
    const input = await openTerminal(page, locale);
    await expect(paletteDialog(page, locale)).toBeHidden();
    const log = terminalLog(page, locale);
    const lines = log.locator('p');
    await expect(log).toContainText(
      fill(text.terminal.welcome, { name: data.siteName }),
    );

    await runCommand(input, 'help');
    await expect(
      lines.filter({ hasText: text.terminal.help.title }),
    ).toHaveCount(1);
    for (const description of Object.values(text.terminal.help)) {
      await expect(log).toContainText(description);
    }

    await runCommand(input, 'whoami');
    await expect(log).toContainText(data.profile.name);

    await runCommand(input, 'projects');
    for (const project of data.projects) {
      await expect(
        log.getByRole('link', { name: project.title, exact: true }),
      ).toHaveAttribute('href', project.href);
    }

    // 일부러 없는 명령이다.
    await runCommand(input, 'xyzzy');
    await expect(lines.last()).toHaveAttribute('data-kind', 'error');
    await expect(lines.last()).toHaveText(
      fill(text.terminal.notFound, { command: 'xyzzy' }),
    );

    await runCommand(input, 'clear');
    await expect(lines).toHaveCount(0);
  });

  test('↑↓로 실행한 명령을 다시 불러온다', async ({ page }) => {
    const input = await openTerminal(page, locale);
    await runCommand(input, 'whoami');
    await runCommand(input, 'help');
    await input.press('ArrowUp');
    await expect(input).toHaveValue('help');
    await input.press('ArrowUp');
    await expect(input).toHaveValue('whoami');
    await input.press('ArrowDown');
    await expect(input).toHaveValue('help');
    await input.press('ArrowDown');
    await expect(input).toHaveValue('');
  });

  test('출력 영역에 Tab으로 닿고, 포커스가 보이고, 키로 스크롤된다(T14)', async ({
    page,
  }) => {
    await openTerminal(page, locale);
    await overflowTerminalLog(page, locale);
    const log = terminalLog(page, locale);
    // Chromium은 tabindex가 없어도 넘치는 스크롤 영역을 Tab 순서에 넣으므로, 그렇지 않은 엔진(Safari 등)을
    // 위한 속성 자체도 확인한다(docs/DESIGN.md §11 스크롤 영역).
    await expect(log).toHaveAttribute('tabindex', '0');
    // 다이얼로그 안 순서: 닫기 버튼 → 출력 → 입력란 → 추천 명령
    await page.keyboard.press('Shift+Tab');
    await expect(log).toBeFocused();
    const outline = await log.evaluate((el) => {
      const style = getComputedStyle(el);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });
    expect(outline.style).not.toBe('none');
    expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);

    const scrollTop = () => log.evaluate((el) => el.scrollTop);
    const bottom = await scrollTop();
    expect(bottom).toBeGreaterThan(0);
    await page.keyboard.press('Home');
    // 키 스크롤은 브라우저가 부드럽게 움직일 수 있어 값이 바뀔 때까지 기다린다.
    await expect.poll(scrollTop).toBe(0);
    await page.keyboard.press('End');
    await expect.poll(scrollTop).toBe(bottom);
  });

  test('exit와 Esc로 닫으면 연 자리로 포커스가 돌아간다', async ({ page }) => {
    const input = await openTerminal(page, locale);
    // exit는 창을 닫으므로 입력란이 비워지기를 기다리지 않는다(runCommand를 쓰지 않음).
    await input.fill('exit');
    await input.press('Enter');
    await expect(terminalDialog(page, locale)).toBeHidden();
    await expect(commandButton(page, locale)).toBeFocused();

    await openTerminal(page, locale);
    await page.keyboard.press('Escape');
    await expect(terminalDialog(page, locale)).toBeHidden();
    await expect(commandButton(page, locale)).toBeFocused();
    await expect(terminalInput(page, locale)).toHaveCount(0);
  });
});
