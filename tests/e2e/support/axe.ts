// axe 검사(T15 2-7, docs/DESIGN.md §11 자동 검사). 기준은 위반 0건이다.
// 실행한 axe 버전과 규칙 ID는 테스트 결과에 attachment(axe-<조건>.json)로 남긴다.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

export const AXE_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice',
];

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** 글꼴까지 불러온 뒤 검사한다(대비·겹침 판정이 글꼴에 따라 달라질 수 있다). */
export async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

/** 시스템 설정(colorScheme)으로 테마를 바꾼다. 저장 값이 없으면 사이트가 시스템 설정을 따른다(T02). */
export async function setTheme(page: Page, theme: Theme) {
  await page.emulateMedia({ colorScheme: theme });
  await expect
    .poll(() =>
      page.evaluate(
        () => getComputedStyle(document.documentElement).colorScheme,
      ),
    )
    .toBe(theme);
}

/** 지금 화면을 검사하고 결과를 남긴 뒤 위반 0건을 확인한다. */
export async function expectNoViolations(page: Page, condition: string) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const ids = (list: { id: string }[]) => list.map((rule) => rule.id).sort();
  await test.info().attach(`axe-${condition}.json`, {
    contentType: 'application/json',
    body: JSON.stringify(
      {
        url: results.url,
        condition,
        axeVersion: results.testEngine.version,
        tags: AXE_TAGS,
        violations: ids(results.violations),
        incomplete: ids(results.incomplete),
        passes: ids(results.passes),
        inapplicable: ids(results.inapplicable),
      },
      null,
      2,
    ),
  });
  const violations = results.violations.map((rule) => ({
    id: rule.id,
    impact: rule.impact,
    nodes: rule.nodes.map((node) => node.target.join(' ')),
  }));
  expect(
    violations,
    `axe 위반 ${condition} (axe ${results.testEngine.version})`,
  ).toEqual([]);
}
