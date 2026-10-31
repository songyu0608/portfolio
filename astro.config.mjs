import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import fontSubset from './scripts/font-subset.mjs';

export default defineConfig({
  output: 'static',
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
  ],
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
});
