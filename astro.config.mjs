import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import fontSubset from './scripts/font-subset.mjs';

// 사이트의 절대 주소. canonical·hreflang·OG·sitemap·robots의 절대 URL은 모두 이 값에서 만든다(T13).
// 도메인을 정하기 전(단계 8)까지는 예약 도메인 .example의 임시 값이며, 빌드할 때 경고가 나온다.
const site = 'https://portfolio.example';

/** site가 임시 값이면 빌드 로그에 경고한다. 배포 전 확인 항목이다(docs/PLAN.md §8). */
function sitePlaceholderWarning() {
  return {
    name: 'portfolio:site-placeholder',
    hooks: {
      'astro:build:done': ({ logger }) => {
        if (new URL(site).hostname.endsWith('.example')) {
          logger.warn(
            `site is a placeholder (${site}). Replace it before deploying.`,
          );
        }
      },
    },
  };
}

export default defineConfig({
  output: 'static',
  site,
  trailingSlash: 'always',
  integrations: [
    react(),
    // 일본어 페이지에서 가나·문장부호가 든 범위(400·700)만 preload한다. 대체 글꼴과 폭이 달라 첫 화면
    // 줄바꿈을 바꾸는 글자들이다. 라틴 범위까지 넣으면 파일 4개가 대역을 나눠 늦게 도착해 CLS가 오히려
    // 커졌다(T11 측정, docs/DESIGN.md §2).
    fontSubset({
      preloadCss: [
        '@fontsource/ibm-plex-sans-jp/400.css',
        '@fontsource/ibm-plex-sans-jp/700.css',
      ],
      preloadChars: { ja: 'あ' },
    }),
    sitePlaceholderWarning(),
  ],
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
});
