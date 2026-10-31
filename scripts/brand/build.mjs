// 파비콘·공유 이미지를 만든다(T13). 만든 파일은 커밋하고, 빌드(pnpm build)에서는 만들지 않는다.
//
//   node scripts/brand/build.mjs
//
// 입력: public/favicon.svg(파비콘 원본), scripts/brand/og.html(공유 이미지 원본),
//       src/content/profile/<locale>.yaml의 name, src/i18n/ui.ts의 site.ogImageLabel
// 출력: public/favicon.ico(16·32·48px), public/apple-touch-icon.png(180px), public/og/<locale>.png(1200×630)
//
// Playwright(Chromium)로 그린다. E2E 테스트(T15)와 같은 프로젝트 의존성(@playwright/test)을 쓴다.
// 준비 방법은 scripts/brand/README.md.
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const fromRoot = (...parts) => path.join(root, ...parts);

// src/i18n/ui.ts는 Node 24의 타입 제거(type stripping)로 바로 읽는다.
const { ui, locales } = await import(fromRoot('src/i18n/ui.ts'));

const svg = await readFile(fromRoot('public/favicon.svg'));
const svgDataUrl = `data:image/svg+xml;base64,${svg.toString('base64')}`;

/** PNG 여러 장을 ICO 하나로 묶는다(ICO 안에 PNG를 그대로 넣는 형식, 모든 현행 브라우저가 읽는다). */
function packIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // 예약
  header.writeUInt16LE(1, 2); // 1 = 아이콘
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // 너비(256은 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // 높이
    entry.writeUInt8(0, 2); // 팔레트 색 수
    entry.writeUInt8(0, 3); // 예약
    entry.writeUInt16LE(1, 4); // 색 평면
    entry.writeUInt16LE(32, 6); // 픽셀당 비트
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

/** src/content/profile/<locale>.yaml의 name(한 줄 값)을 읽는다. YAML 파서 의존성을 늘리지 않기 위해 한 줄만 본다. */
async function profileName(locale) {
  const yaml = await readFile(
    fromRoot(`src/content/profile/${locale}.yaml`),
    'utf8',
  );
  const match = yaml.match(/^name:\s*(.+?)\s*$/m);
  if (!match)
    throw new Error(`profile/${locale}.yaml에서 name을 찾지 못했습니다.`);
  return match[1].replace(/^(['"])(.*)\1$/, '$2');
}

const escapeHtml = (value) =>
  value.replace(
    /[&<>"]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char],
  );

const contentTypes = {
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const browser = await chromium.launch();
try {
  // 파비콘: 투명 배경 16·32·48px → ICO
  const iconPage = await browser.newPage({ deviceScaleFactor: 1 });
  const renderIcon = async (size, background) => {
    await iconPage.setViewportSize({ width: size, height: size });
    await iconPage.setContent(
      `<body style="margin:0;background:${background}"><img src="${svgDataUrl}" width="${size}" height="${size}" style="display:block"></body>`,
    );
    return iconPage.screenshot({
      omitBackground: background === 'transparent',
    });
  };
  const icoImages = [];
  for (const size of [16, 32, 48]) {
    icoImages.push({ size, png: await renderIcon(size, 'transparent') });
  }
  await writeFile(fromRoot('public/favicon.ico'), packIco(icoImages));
  // apple-touch-icon: iOS가 모서리를 둥글게 자르므로 바탕을 강조색으로 채운 불투명 정사각형으로 만든다.
  await writeFile(
    fromRoot('public/apple-touch-icon.png'),
    await renderIcon(180, '#0F62FE'),
  );
  await iconPage.close();

  // 공유 이미지: og.html을 가짜 주소(http://brand.local/)로 열고, 저장소 파일을 그 주소로 내준다.
  // file://로 열면 Chromium이 글꼴을 막을 수 있어서다.
  const template = await readFile(fromRoot('scripts/brand/og.html'), 'utf8');
  const ogPage = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
  });
  let html = '';
  await ogPage.route('http://brand.local/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === '/') {
      await route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: html,
      });
      return;
    }
    const file = path.join(root, decodeURIComponent(pathname));
    if (!file.startsWith(root + path.sep)) {
      await route.abort();
      return;
    }
    try {
      await route.fulfill({
        body: await readFile(file),
        contentType:
          contentTypes[path.extname(file)] ?? 'application/octet-stream',
      });
    } catch {
      await route.fulfill({ status: 404, body: '' });
    }
  });
  for (const locale of locales) {
    html = template
      .replaceAll('{{lang}}', locale)
      .replaceAll('{{name}}', escapeHtml(await profileName(locale)))
      .replaceAll('{{label}}', escapeHtml(ui[locale].site.ogImageLabel))
      .replaceAll('{{mark}}', svgDataUrl);
    await ogPage.goto('http://brand.local/', { waitUntil: 'networkidle' });
    // 글꼴을 다 받은 뒤 찍는다(브라우저 안에서 실행하는 식이라 문자열로 넘긴다).
    await ogPage.evaluate('document.fonts.ready.then(() => true)');
    await writeFile(
      fromRoot(`public/og/${locale}.png`),
      await ogPage.screenshot(),
    );
  }
} finally {
  await browser.close();
}

console.log(
  'public/favicon.ico, public/apple-touch-icon.png, public/og/*.png 를 만들었습니다.',
);
