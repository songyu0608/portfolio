// 2-2 SEO 태그(T15). docs/ARCHITECTURE.md §2 "검증 방법(T13)"을 옮긴 것이다. HTML만 보므로 Chromium에서만 돌린다.
import { expect, test, type Page } from '@playwright/test';
import {
  builtPagePaths,
  locales,
  localeOf,
  NOT_FOUND_PATH,
  siteOrigin,
  sitemapPaths,
} from './support/site';

// 절대 URL의 앞부분(Astro `site`). 도메인이 정해지면 바뀌므로 sitemap에서 읽는다.
const site = siteOrigin();

const OG_LOCALES = { ja: 'ja_JP', en: 'en_US' } as const;
const OG_PROPERTIES = [
  'og:type',
  'og:site_name',
  'og:title',
  'og:description',
  'og:url',
  'og:locale',
  'og:locale:alternate',
  'og:image',
  'og:image:width',
  'og:image:height',
  'og:image:alt',
];

interface Head {
  title: string;
  description: string | null;
  canonical: string[];
  alternates: { hreflang: string; href: string }[];
  og: Record<string, string[]>;
  twitterCard: string[];
  icons: string[];
  robots: string[];
}

async function readHead(page: Page): Promise<Head> {
  return page.evaluate(() => {
    const all = (selector: string) => [
      ...document.head.querySelectorAll(selector),
    ];
    const og: Record<string, string[]> = {};
    for (const meta of all('meta[property]')) {
      const key = meta.getAttribute('property') ?? '';
      (og[key] ??= []).push(meta.getAttribute('content') ?? '');
    }
    return {
      title: document.title,
      description:
        document.head
          .querySelector('meta[name="description"]')
          ?.getAttribute('content') ?? null,
      canonical: all('link[rel="canonical"]').map(
        (el) => el.getAttribute('href') ?? '',
      ),
      alternates: all('link[rel="alternate"][hreflang]').map((el) => ({
        hreflang: el.getAttribute('hreflang') ?? '',
        href: el.getAttribute('href') ?? '',
      })),
      og,
      twitterCard: all('meta[name="twitter:card"]').map(
        (el) => el.getAttribute('content') ?? '',
      ),
      icons: all('link[rel="icon"], link[rel="apple-touch-icon"]').map(
        (el) => el.getAttribute('href') ?? '',
      ),
      robots: all('meta[name="robots"]').map(
        (el) => el.getAttribute('content') ?? '',
      ),
    };
  });
}

const alternatesOf = (head: Head) =>
  Object.fromEntries(head.alternates.map((a) => [a.hreflang, a.href]));

test('sitemap이 빌드된 페이지를 빠짐없이 담는다', () => {
  // sitemap에서 만든 목록이 아니라 dist/의 HTML 파일 목록과 비교한다(T15 2-2).
  const built = builtPagePaths();
  expect(built.length).toBeGreaterThan(0);
  expect([...sitemapPaths()].sort()).toEqual(built);
  for (const loc of sitemapPaths()) expect(`${site}${loc}`).toMatch(/^https:/);
});

for (const pagePath of sitemapPaths()) {
  test(`<head> SEO 태그 ${pagePath}`, async ({ page, request }) => {
    await page.goto(pagePath);
    const head = await readHead(page);
    const url = `${site}${pagePath}`;
    const locale = localeOf(pagePath);

    expect(head.canonical).toEqual([url]);
    expect(head.robots).toEqual([]);
    const alternates = alternatesOf(head);
    expect(head.alternates).toHaveLength(3);
    expect(Object.keys(alternates).sort()).toEqual(
      [...locales, 'x-default'].sort(),
    );
    expect(alternates[locale]).toBe(url);
    expect(alternates['x-default']).toBe(alternates.ja);

    for (const property of OG_PROPERTIES) {
      expect(head.og[property], property).toHaveLength(1);
    }
    expect(head.og['og:url']).toEqual([url]);
    expect(head.og['og:title']).toEqual([head.title]);
    expect(head.og['og:description']).toEqual([head.description]);
    expect(head.og['og:locale']).toEqual([OG_LOCALES[locale]]);
    expect(head.og['og:image']).toEqual([`${site}/og/${locale}.png`]);
    const image = await request.get(`/og/${locale}.png`);
    expect(image.status()).toBe(200);
    expect(head.twitterCard).toEqual(['summary_large_image']);
    expect(head.icons).toEqual([
      '/favicon.ico',
      '/favicon.svg',
      '/apple-touch-icon.png',
    ]);
  });
}

test('짝 페이지의 hreflang 묶음과 sitemap의 xhtml:link가 같다', async ({
  page,
  request,
}) => {
  const groups = new Map<string, Record<string, string>>();
  for (const pagePath of sitemapPaths()) {
    await page.goto(pagePath);
    groups.set(pagePath, alternatesOf(await readHead(page)));
  }
  for (const [pagePath, alternates] of groups) {
    for (const locale of locales) {
      const pair = alternates[locale].replace(site, '');
      expect(groups.get(pair), `${pagePath} → ${pair}`).toEqual(alternates);
    }
  }
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const block of xml.match(/<url>[\s\S]*?<\/url>/g) ?? []) {
    const loc = /<loc>([^<]+)<\/loc>/.exec(block)?.[1] ?? '';
    const links = Object.fromEntries(
      [...block.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(
        ([, hreflang, href]) => [hreflang, href],
      ),
    );
    expect(links, loc).toEqual(groups.get(loc.replace(site, '')));
  }
});

test('404는 noindex이고 canonical·hreflang·og:url이 없다', async ({ page }) => {
  await page.goto(NOT_FOUND_PATH);
  const head = await readHead(page);
  expect(head.robots).toEqual(['noindex']);
  expect(head.canonical).toEqual([]);
  expect(head.alternates).toEqual([]);
  expect(head.og['og:url']).toBeUndefined();
});

test('robots.txt가 전체 허용과 sitemap 위치를 알린다', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toMatch(/^User-agent: \*$/m);
  expect(text).toMatch(/^Allow: \/$/m);
  expect(text).toContain(`Sitemap: ${site}/sitemap.xml`);
});
