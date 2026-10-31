// Lighthouse로 잴 페이지(T16). 페이지 경로는 하드코딩하지 않고 sitemap(tests/e2e/support/site.ts)에서 고른다.
import {
  locales,
  pageKinds,
  sitePages,
  type SitePage,
} from '../../e2e/support/site';

/**
 * 언어·페이지 종류마다 sitemap 순서의 첫 페이지. 지금은 ja·en × 5종류 = 10페이지다.
 * 404는 noindex라 SEO "크롤링 가능" 감사가 의도대로 실패하므로 넣지 않는다(pageKinds에 없음).
 * 언어·종류 조합이 하나라도 빠지면 측정 대상이 조용히 줄지 않도록 바로 실패한다.
 */
export function lighthouseTargets(): SitePage[] {
  const pages = sitePages();
  const targets: SitePage[] = [];
  const missing: string[] = [];
  for (const locale of locales) {
    for (const kind of pageKinds) {
      const page = pages.find((p) => p.locale === locale && p.kind === kind);
      if (page) targets.push(page);
      else missing.push(`${locale}·${kind}`);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `sitemap에 없는 언어·페이지 종류가 있습니다: ${missing.join(', ')}`,
    );
  }
  return targets;
}
