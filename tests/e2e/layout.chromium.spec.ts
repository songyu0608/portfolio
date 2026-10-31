// 2-9 레이아웃, Chromium만(T15): 텍스트 간격(1.4.12) 주입 시 잘림 0, CSS 순서 회귀(T12 이월).
import { expect, test, type Locator, type Page } from '@playwright/test';
import { horizontalOverflow } from './support/layout';
import { representativePages, sitePages, ui } from './support/site';

// WCAG 1.4.12 텍스트 간격(docs/DESIGN.md §11 화면 크기·글자)
const TEXT_SPACING = `
  * {
    line-height: 1.5 !important;
    letter-spacing: 0.12em !important;
    word-spacing: 0.16em !important;
  }
  p { margin-bottom: 2em !important; }
`;

/**
 * 텍스트 간격을 넣은 뒤 내용이 상자를 벗어난 요소.
 * - 넘친 내용을 숨기는(overflow hidden·clip) 요소에서 내용이 잘린 것
 * - 글자를 직접 담은 블록 요소(버튼·제목·문단 등)에서 글자가 상자 밖으로 넘친 것(고정 높이 등)
 * 시각적으로 숨긴 텍스트(.sr-only, 1px)와 SVG는 뺀다.
 */
const clipped = (page: Page) =>
  page.evaluate(() => {
    const found: string[] = [];
    const hides = (value: string) => value === 'hidden' || value === 'clip';
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      if (el.closest('svg')) continue;
      const style = getComputedStyle(el);
      if (['inline', 'contents', 'none'].includes(style.display)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) continue;
      const overX = el.scrollWidth > el.clientWidth + 1;
      const overY = el.scrollHeight > el.clientHeight + 1;
      const hasText = [...el.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      );
      const cut =
        (hides(style.overflowX) && overX) ||
        (hides(style.overflowY) && overY) ||
        (hasText && (overX || overY));
      if (cut) {
        found.push(
          `${el.tagName.toLowerCase()}.${el.className} "${(el.textContent ?? '').trim().slice(0, 30)}"`,
        );
      }
    }
    return found;
  });

for (const { path: pagePath } of sitePages()) {
  test(`텍스트 간격 주입 시 잘림 없음 ${pagePath}`, async ({ page }) => {
    for (const width of [375, 640]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(pagePath);
      await page.addStyleTag({ content: TEXT_SPACING });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      expect(await clipped(page), `${width}px 잘린 요소`).toEqual([]);
      expect(await horizontalOverflow(page), `${width}px 가로 넘침`).toBe(0);
    }
  });
}

/** CSS 변수(간격 토큰)를 px로 */
const tokenPx = (page: Page, name: string) =>
  page.evaluate((token) => {
    const root = getComputedStyle(document.documentElement);
    return parseFloat(root.getPropertyValue(token)) * parseFloat(root.fontSize);
  }, name);

const marginTop = (locator: Locator) =>
  locator.first().evaluate((el) => parseFloat(getComputedStyle(el).marginTop));

// CSS 순서 회귀(T12): 레이아웃이 BaseLayout(전역 CSS)을 화면 컴포넌트보다 먼저 import해야
// 컴포넌트 CSS Modules의 위 여백이 전역 .tag-list·.project-grid의 margin: 0보다 뒤에 놓인다.
// 기대값은 main 빌드(a048882)에서 잰 값이며, 각 CSS Module이 쓰는 간격 토큰이다.
test.describe('CSS 순서 회귀', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('About 기술 스택 첫 태그 목록의 위 여백', async ({ page }) => {
    const about = representativePages().find((p) => p.kind === 'about');
    if (!about) throw new Error('About 페이지가 없습니다.');
    await page.goto(about.path);
    const section = page.getByRole('region', {
      name: ui[about.locale].about.skills.title,
    });
    const value = await marginTop(section.locator('.tag-list'));
    // SkillStack.module.css .tags { margin-top: var(--space-3) } = 12px
    expect(value).toBe(await tokenPx(page, '--space-3'));
    expect(value).toBe(12);
  });

  test('Projects 카드 목록의 위 여백', async ({ page }) => {
    const projects = representativePages().find((p) => p.kind === 'projects');
    if (!projects) throw new Error('Projects 페이지가 없습니다.');
    await page.goto(projects.path);
    // ProjectsPage.module.css .body { margin-top: var(--space-6) } = 24px
    const value = await marginTop(page.locator('main .project-grid'));
    expect(value).toBe(await tokenPx(page, '--space-6'));
    expect(value).toBe(24);
  });
});
