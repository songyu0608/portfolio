import { getRelativeLocaleUrl } from 'astro:i18n';
import { locales, type Locale } from './ui';

// 언어 접두어를 뺀 페이지 경로. Home은 빈 문자열이다.
export const pagePaths = {
  home: '',
  about: 'about',
  projects: 'projects',
  contact: 'contact',
} as const;

export type PageKey = keyof typeof pagePaths;

/** 페이지의 언어별 URL. 예: ('en', 'about') → '/en/about/' */
export function localizePath(locale: Locale, page: PageKey): string {
  return getRelativeLocaleUrl(locale, pagePaths[page]);
}

/**
 * 현재 경로를 다른 언어의 같은 페이지 경로로 바꾼다. 언어 전환 링크는 이 함수만 쓴다.
 * 예: ('/ja/about/', 'en') → '/en/about/'. 언어 접두어가 없는 경로는 그 언어의 Home으로 보낸다.
 */
export function switchLocalePath(pathname: string, locale: Locale): string {
  const [, current, ...rest] = pathname.split('/');
  const path = locales.includes(current as Locale) ? rest.join('/') : '';
  return getRelativeLocaleUrl(locale, path);
}
