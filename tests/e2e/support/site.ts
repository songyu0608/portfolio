// 테스트가 함께 쓰는 사이트 정보. 페이지 경로와 화면 문구는 테스트에 직접 쓰지 않는다(T15).
// - 페이지 목록: 빌드 결과의 sitemap.xml(미리보기 서버가 내보내는 파일과 같다). 테스트를 페이지마다
//   나누려면 테스트를 모을 때 목록이 있어야 해서 서버 대신 파일을 동기로 읽는다.
// - sitemap이 빠짐없는지는 seo.chromium.spec.ts가 dist/ HTML 목록과 따로 비교한다.
// - 문구: src/i18n/ui.ts(화면 UI 문구의 원본)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { CommandData } from '../../../src/components/interactive/commands';
import { localeNames, locales, ui, type Locale } from '../../../src/i18n/ui';

export { localeNames, locales, ui, type Locale };

export const DIST = path.resolve(import.meta.dirname, '../../../dist');

function readDist(file: string): string {
  const full = path.join(DIST, file);
  if (!existsSync(full)) {
    throw new Error(
      `${full}이 없습니다. 테스트 전에 \`pnpm build\`를 실행하세요.`,
    );
  }
  return readFileSync(full, 'utf8');
}

/** sitemap.xml의 <loc>에서 `site` 부분을 뗀 경로(끝 슬래시 포함) */
export function sitemapPaths(): string[] {
  const xml = readDist('sitemap.xml');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, loc]) => new URL(loc).pathname,
  );
}

/** sitemap.xml에 쓰인 절대 URL의 origin(= astro.config.mjs의 `site`) */
export function siteOrigin(): string {
  const loc = /<loc>([^<]+)<\/loc>/.exec(readDist('sitemap.xml'))?.[1];
  if (!loc) throw new Error('sitemap.xml에 <loc>이 없습니다.');
  return new URL(loc).origin;
}

/** 빌드된 ja·en 페이지 경로. sitemap과 독립된 목록이다(루트 이동·404·commands.json 제외). */
export function builtPagePaths(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(path.join(DIST, dir), {
      withFileTypes: true,
    })) {
      const rel = path.posix.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (entry.name === 'index.html') out.push(`/${dir}/`);
    }
  };
  for (const locale of locales) walk(locale);
  return out.sort();
}

export function localeOf(pagePath: string): Locale {
  const first = pagePath.split('/')[1];
  if (!(locales as string[]).includes(first)) {
    throw new Error(`언어를 알 수 없는 경로: ${pagePath}`);
  }
  return first as Locale;
}

export type PageKind = 'home' | 'about' | 'projects' | 'detail' | 'contact';

/** 경로로 페이지 종류를 정한다. 경로 규칙은 src/i18n/paths.ts(pagePaths)와 같다. */
export function kindOf(pagePath: string): PageKind {
  const rest = pagePath.split('/').filter(Boolean).slice(1);
  if (rest.length === 0) return 'home';
  if (rest[0] === 'projects') return rest.length === 1 ? 'projects' : 'detail';
  if (rest[0] === 'about' || rest[0] === 'contact') return rest[0];
  throw new Error(`종류를 알 수 없는 경로: ${pagePath}`);
}

export const NOT_FOUND_PATH = '/404.html';

export interface SitePage {
  path: string;
  locale: Locale;
  kind: PageKind | 'notFound';
}

/** 18페이지(sitemap) + 404 */
export function sitePages(): SitePage[] {
  const pages: SitePage[] = sitemapPaths().map((p) => ({
    path: p,
    locale: localeOf(p),
    kind: kindOf(p),
  }));
  // 404는 하나의 이중 언어 페이지이고 <html lang="ja">다(docs/ARCHITECTURE.md §2 SEO).
  pages.push({ path: NOT_FOUND_PATH, locale: 'ja', kind: 'notFound' });
  return pages;
}

/** 페이지 종류마다 대표 하나(ja). 키보드 점검처럼 종류별로 보는 테스트에 쓴다. */
export function representativePages(): SitePage[] {
  const seen = new Set<string>();
  return sitePages().filter((page) => {
    if (page.locale !== 'ja' || seen.has(page.kind)) return false;
    seen.add(page.kind);
    return true;
  });
}

/** 같은 페이지의 다른 언어 경로. 짝 페이지는 언어 접두어만 다르다(상세는 같은 slug). */
export function pairPath(pagePath: string, locale: Locale): string {
  return `/${locale}/${pagePath.split('/').slice(2).join('/')}`;
}

export function otherLocale(locale: Locale): Locale {
  const other = locales.find((code) => code !== locale);
  if (!other) throw new Error('언어가 하나뿐입니다.');
  return other;
}

/** 명령 팔레트·터미널 데이터(빌드 결과의 /<locale>/commands.json). 콘텐츠 값을 테스트에 쓰지 않으려고 읽는다. */
export function commandData(locale: Locale): CommandData {
  return JSON.parse(readDist(`${locale}/commands.json`)) as CommandData;
}

/** 빌드된 HTML을 읽는다(HTML만 보는 검사용). */
export function builtHtml(pagePath: string): string {
  const file = pagePath.endsWith('/') ? `${pagePath}index.html` : pagePath;
  return readDist(file);
}
