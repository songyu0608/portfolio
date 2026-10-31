// 2-3 언어·테마·내비게이션(T15). 헤더의 현재 위치 표시(T03), 언어 전환(짝 페이지), 테마 저장(T02·T10).
import { expect, test, type Page } from '@playwright/test';
import { THEME_STORAGE_KEY } from '../../src/scripts/theme';
import {
  kindOf,
  localeNames,
  localeOf,
  NOT_FOUND_PATH,
  otherLocale,
  pairPath,
  representativePages,
  sitemapPaths,
  ui,
  type Locale,
} from './support/site';

/** 헤더에서 aria-current가 붙은 링크(href → 값) */
async function currentLinks(page: Page) {
  return page
    .locator('header a[aria-current]')
    .evaluateAll((links) =>
      links.map((a) => [
        a.getAttribute('href'),
        a.getAttribute('aria-current'),
      ]),
    );
}

/**
 * T03 규칙: 그 페이지 자체면 'page', 하위 경로(프로젝트 상세)면 'true'.
 * Home은 내비게이션 항목이 없어 사이트 이름 링크(Home 링크)에 'page'를 붙인다.
 */
function expectedCurrent(pagePath: string): [string, string][] {
  const locale = localeOf(pagePath);
  const kind = kindOf(pagePath);
  if (kind === 'home') return [[`/${locale}/`, 'page']];
  if (kind === 'detail') return [[`/${locale}/projects/`, 'true']];
  return [[pagePath, 'page']];
}

test('헤더의 현재 위치 표시와 언어 전환 링크', async ({ page }) => {
  for (const pagePath of sitemapPaths()) {
    await page.goto(pagePath);
    const locale = localeOf(pagePath);
    const other = otherLocale(locale);
    expect(await currentLinks(page), pagePath).toEqual(
      expectedCurrent(pagePath),
    );

    const language = page.getByRole('navigation', {
      name: ui[locale].language.label,
    });
    // 지금 언어는 링크가 아닌 글자(aria-current), 다른 언어는 짝 페이지 링크다.
    const current = language.locator('[aria-current="true"]');
    await expect(current, pagePath).toHaveText(localeNames[locale]);
    await expect(current).toHaveAttribute('lang', locale);
    expect(await current.evaluate((el) => el.tagName), pagePath).not.toBe('A');
    const link = language.getByRole('link');
    await expect(link).toHaveCount(1);
    await expect(link, pagePath).toHaveText(localeNames[other]);
    await expect(link).toHaveAttribute('href', pairPath(pagePath, other));
  }
});

test('404에는 현재 위치 표시가 없다', async ({ page }) => {
  await page.goto(NOT_FOUND_PATH);
  expect(await currentLinks(page)).toEqual([]);
});

for (const { path: pagePath, kind } of representativePages()) {
  if (kind === 'notFound') continue;
  test(`언어 전환을 누르면 짝 페이지로 간다 ${pagePath}`, async ({ page }) => {
    await page.goto(pagePath);
    const locale = localeOf(pagePath);
    const other = otherLocale(locale);
    await page
      .getByRole('navigation', { name: ui[locale].language.label })
      .getByRole('link')
      .click();
    await expect(page).toHaveURL(pairPath(pagePath, other));
    await expect(page.locator('html')).toHaveAttribute('lang', other);
    // 돌아가는 링크도 원래 페이지다.
    await page
      .getByRole('navigation', { name: ui[other].language.label })
      .getByRole('link')
      .click();
    await expect(page).toHaveURL(pagePath);
  });
}

const themeButton = (page: Page, locale: Locale) =>
  page.getByRole('button', { name: ui[locale].theme.label });

const storedTheme = (page: Page) =>
  page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY);

const appliedScheme = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`시스템 설정 ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    test('저장 값이 없으면 시스템 설정을 따른다', async ({ page }) => {
      const [{ path: pagePath, locale }] = representativePages();
      await page.goto(pagePath);
      await expect(page.locator('html')).not.toHaveAttribute('data-theme');
      expect(await storedTheme(page)).toBeNull();
      expect(await appliedScheme(page)).toBe(scheme);
      // 눌림 상태는 다크 모드 여부다(ThemeToggle).
      await expect(themeButton(page, locale)).toHaveAttribute(
        'aria-pressed',
        String(scheme === 'dark'),
      );
    });
  });
}

test('테마 버튼으로 바꾼 값이 이동·새로고침 뒤에도 남는다', async ({
  page,
}) => {
  const pages = representativePages().filter((p) => p.kind !== 'notFound');
  const [first, second] = pages;
  await page.goto(first.path);
  const html = page.locator('html');
  const before = await appliedScheme(page);
  const after = before === 'dark' ? 'light' : 'dark';

  await themeButton(page, first.locale).click();
  await expect(html).toHaveAttribute('data-theme', after);
  expect(await storedTheme(page)).toBe(after);
  expect(await appliedScheme(page)).toBe(after);
  await expect(themeButton(page, first.locale)).toHaveAttribute(
    'aria-pressed',
    String(after === 'dark'),
  );

  // 헤더 링크로 다른 페이지로 이동
  await page.locator(`header a[href="${second.path}"]`).first().click();
  await expect(page).toHaveURL(second.path);
  await expect(html).toHaveAttribute('data-theme', after);
  expect(await appliedScheme(page)).toBe(after);

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', after);
  await expect(themeButton(page, second.locale)).toHaveAttribute(
    'aria-pressed',
    String(after === 'dark'),
  );

  // 다시 누르면 원래 테마가 저장된다.
  await themeButton(page, second.locale).click();
  await expect(html).toHaveAttribute('data-theme', before);
  expect(await storedTheme(page)).toBe(before);
});
