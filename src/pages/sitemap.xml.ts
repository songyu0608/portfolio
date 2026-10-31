// 검색 엔진용 사이트맵(T13). 빌드 시 정적 파일 /sitemap.xml로 나간다.
// 18페이지(ja·en × Home·About·Projects·Contact·프로젝트 상세)와 각 페이지의 언어 묶음(xhtml:link)을 넣는다.
// 언어 묶음은 <head>의 hreflang과 같은 함수(src/lib/seo.ts)로 만든다. 루트 이동 페이지·404·JSON은 넣지 않는다.
// lastmod는 정확한 수정일을 낼 방법이 없어 넣지 않는다(docs/tasks/T13-seo.md 메모).
import type { APIRoute } from 'astro';
import {
  localizePath,
  localizeProjectPath,
  pagePaths,
  type PageKey,
} from '../i18n/paths';
import { locales } from '../i18n/ui';
import { getProjectPages } from '../lib/content';
import { absoluteUrl, languageAlternates, requireSite } from '../lib/seo';

const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[char] ?? char,
  );

export const GET: APIRoute = async ({ site }) => {
  const base = requireSite(site);
  const pageKeys = Object.keys(pagePaths) as PageKey[];
  const paths: string[] = [];
  for (const locale of locales) {
    paths.push(...pageKeys.map((page) => localizePath(locale, page)));
    const projects = await getProjectPages(locale);
    paths.push(
      ...projects.map(({ project }) =>
        localizeProjectPath(locale, project.slug),
      ),
    );
  }

  const urls = paths.map((path) => {
    const links = languageAlternates(path, base).map(
      ({ hreflang, href }) =>
        `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(href)}"/>`,
    );
    return [
      '  <url>',
      `    <loc>${escapeXml(absoluteUrl(path, base))}</loc>`,
      ...links,
      '  </url>',
    ].join('\n');
  });

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
