// SEO용 절대 URL과 언어 묶음(T13). <head>(BaseLayout)와 sitemap.xml·robots.txt가 함께 쓴다.
// 절대 URL은 모두 astro.config.mjs의 site에서 만든다(docs/ARCHITECTURE.md §2 "SEO").
import { switchLocalePath } from '../i18n/paths';
import { locales, type Locale } from '../i18n/ui';

/** hreflang="x-default"가 가리키는 언어. astro.config.mjs의 i18n.defaultLocale과 같다. */
export const DEFAULT_LOCALE: Locale = 'ja';

/** og:locale 값(language_TERRITORY 형식, https://ogp.me/) */
export const OG_LOCALES: Record<Locale, string> = {
  ja: 'ja_JP',
  en: 'en_US',
};

/** 언어별 공유 이미지(public/og/<locale>.png, scripts/brand/에서 만든다)의 크기 */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** Astro.site(또는 엔드포인트의 site)가 없으면 빌드를 멈춘다. 상대 URL로 내보내지 않기 위해서다. */
export function requireSite(site: URL | undefined): URL {
  if (!site) {
    throw new Error(
      'astro.config.mjs에 site가 없습니다. 절대 URL을 만들 수 없습니다.',
    );
  }
  return site;
}

/** 사이트 안 경로(예: '/ja/about/')의 절대 URL */
export function absoluteUrl(path: string, site: URL): string {
  return new URL(path, site).href;
}

export interface LanguageAlternate {
  /** 'ja' | 'en' | 'x-default' */
  hreflang: string;
  href: string;
}

/**
 * 같은 페이지의 언어별 절대 URL과 x-default. pathname은 언어 접두어가 있는 페이지 경로다.
 * ja·en 짝 페이지는 같은 목록을 돌려받는다(Google 권장: 자신을 포함한 모든 언어를 서로 적는다).
 */
export function languageAlternates(
  pathname: string,
  site: URL,
): LanguageAlternate[] {
  return [
    ...locales.map((locale) => ({
      hreflang: locale,
      href: absoluteUrl(switchLocalePath(pathname, locale), site),
    })),
    {
      hreflang: 'x-default',
      href: absoluteUrl(switchLocalePath(pathname, DEFAULT_LOCALE), site),
    },
  ];
}

/** 언어별 공유 이미지의 절대 URL */
export function ogImageUrl(locale: Locale, site: URL): string {
  return absoluteUrl(`/og/${locale}.png`, site);
}
