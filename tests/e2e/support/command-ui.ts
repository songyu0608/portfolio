// 명령 팔레트·터미널(T10)을 여는 도우미. command-ui.spec.ts와 a11y.spec.ts가 함께 쓴다.
import { expect, type Locator, type Page } from '@playwright/test';
import { ui, type Locale } from './site';

export const paletteDialog = (page: Page, locale: Locale) =>
  page.getByRole('dialog', { name: ui[locale].command.palette.label });

export const terminalDialog = (page: Page, locale: Locale) =>
  page.getByRole('dialog', { name: ui[locale].command.terminal.label });

export const paletteInput = (page: Page, locale: Locale) =>
  paletteDialog(page, locale).getByRole('combobox', {
    name: ui[locale].command.palette.input,
  });

export const terminalInput = (page: Page, locale: Locale) =>
  terminalDialog(page, locale).getByRole('textbox', {
    name: ui[locale].command.terminal.input,
  });

export const terminalLog = (page: Page, locale: Locale) =>
  terminalDialog(page, locale).getByRole('log', {
    name: ui[locale].command.terminal.output,
  });

export const commandButton = (page: Page, locale: Locale) =>
  page.getByRole('button', { name: ui[locale].command.open });

/** 헤더 버튼으로 팔레트를 연다(처음 열 때 UI·데이터를 불러온다). */
export async function openPalette(
  page: Page,
  locale: Locale,
): Promise<Locator> {
  await commandButton(page, locale).click();
  const input = paletteInput(page, locale);
  await expect(input).toBeFocused();
  return input;
}

/** 팔레트의 「ターミナルを開く」로 터미널을 연다. */
export async function openTerminal(
  page: Page,
  locale: Locale,
): Promise<Locator> {
  const input = await openPalette(page, locale);
  await input.fill('terminal');
  await input.press('Enter');
  const terminal = terminalInput(page, locale);
  await expect(terminal).toBeFocused();
  return terminal;
}

/** 터미널에 명령을 입력해 실행한다. */
export async function runCommand(input: Locator, command: string) {
  await input.fill(command);
  await input.press('Enter');
  await expect(input).toHaveValue('');
}

/** 출력 영역이 넘쳐 스크롤되게 한다(T14: 출력 영역 키보드 스크롤 확인용). */
export async function overflowTerminalLog(page: Page, locale: Locale) {
  const input = terminalInput(page, locale);
  const log = terminalLog(page, locale);
  for (let i = 0; i < 4; i += 1) {
    await runCommand(input, 'help');
    const overflowing = await log.evaluate(
      (el) => el.scrollHeight > el.clientHeight,
    );
    if (overflowing) return;
  }
  throw new Error('터미널 출력이 넘치지 않았습니다.');
}
