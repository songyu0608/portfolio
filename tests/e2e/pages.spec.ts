// 2-1 페이지 스모크(T15): 19페이지가 열리고 기본 구조가 맞는지, 루트 이동·없는 경로 처리.
import { expect, test, type Page } from '@playwright/test';
import { NOT_FOUND_PATH, sitePages, ui } from './support/site';

/** 페이지 오류와 콘솔 오류를 모은다. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

for (const { path, locale } of sitePages()) {
  test(`페이지 ${path}`, async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto(path, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('h1')).toHaveCount(1);
    expect((await page.title()).trim()).not.toBe('');
    // 헤더·main·푸터와 본문 바로가기(docs/DESIGN.md §4)
    await expect(page.locator('body > header, header').first()).toBeVisible();
    await expect(page.locator('main#main')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(
      page.getByRole('link', { name: ui[locale].skipLink }),
    ).toHaveAttribute('href', '#main');
    expect(errors).toEqual([]);
  });
}

test('같은 언어 안에서 페이지 제목이 겹치지 않는다', async ({ page }) => {
  const titles = new Map<string, string>();
  for (const { path, locale, kind } of sitePages()) {
    if (kind === 'notFound') continue;
    await page.goto(path);
    const key = `${locale}:${await page.title()}`;
    expect(titles.get(key), `${path}와 ${titles.get(key)}의 제목이 같다`).toBe(
      undefined,
    );
    titles.set(key, path);
  }
});

test('루트 /는 /ja/로 이동한다', async ({ page }) => {
  await page.goto('/');
  // 지금은 정적 HTML의 meta refresh(2초)다. 단계 8에서 HTTP 301로 바뀔 수 있어 도착만 본다.
  await page.waitForURL('**/ja/', { timeout: 10_000 });
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
});

test('없는 경로는 404 상태로 404 페이지를 보인다', async ({ page }) => {
  // 일부러 없는 경로다(페이지 목록에서 가져올 수 없음).
  const response = await page.goto('/ja/no-such-page/');
  expect(response?.status()).toBe(404);
  const notFound = await page.request.get(NOT_FOUND_PATH);
  const expected = (await notFound.text()).match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1];
  expect(expected).toBeTruthy();
  await expect(page.locator('h1')).toHaveCount(1);
  expect(await page.locator('h1').innerHTML()).toBe(expected);
});
