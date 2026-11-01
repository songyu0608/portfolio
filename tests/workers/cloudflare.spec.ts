// Cloudflare에서만 정해지는 동작(T17): `/` 301, 끝 슬래시 이동, 404, 응답 헤더, 설정 파일 비공개.
// wrangler dev가 wrangler.jsonc와 dist/_redirects·dist/_headers대로 낸 응답을 본다.
// 페이지 경로는 sitemap(tests/e2e/support/site.ts)에서 가져오고 직접 쓰지 않는다.
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  expect,
  test,
  type APIRequestContext,
  type APIResponse,
} from '@playwright/test';
import { builtHtml, DIST, sitemapPaths } from '../e2e/support/site';

// public/_headers의 `/*` 규칙. 기대값을 그 파일에서 읽으면 줄이 빠져도 통과하므로 여기에 따로 적는다.
const SECURITY_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'x-robots-tag': 'noindex',
};
// public/_headers의 `/_astro/*` 규칙
const IMMUTABLE = 'public, max-age=31536000, immutable';

const pages = sitemapPaths();
const notFoundBody = readFileSync(path.join(DIST, '404.html'), 'utf8');

/** 리다이렉트를 따라가지 않고 받는다. */
function get(request: APIRequestContext, url: string): Promise<APIResponse> {
  return request.get(url, { maxRedirects: 0 });
}

/** Location 헤더의 경로. 상대 주소와 절대 주소를 모두 받는다. */
function locationPath(response: APIResponse): string {
  const location = response.headers()['location'];
  expect(location, 'Location 헤더가 있다').toBeTruthy();
  return new URL(location, response.url()).pathname;
}

function expectSecurityHeaders(response: APIResponse): void {
  const headers = response.headers();
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    expect(headers[name], name).toBe(value);
  }
}

/** dist/index.html(Astro i18n이 만든 루트 이동 페이지)의 이동 대상 = 기본 언어 Home */
function rootTarget(): string {
  const url = /http-equiv="refresh" content="\d+;url=([^"]+)"/.exec(
    builtHtml('/'),
  )?.[1];
  if (!url) throw new Error('dist/index.html에 meta refresh가 없습니다.');
  return new URL(url, 'http://localhost').pathname;
}

/** 없는 경로: 하위 페이지가 있는 경로(언어 Home, 프로젝트 목록 등) 아래와 루트 바로 아래 */
function missingPaths(): string[] {
  const missing = `missing-${randomUUID()}`;
  const parents = new Set(
    pages
      .map((p) => p.replace(/[^/]+\/$/, ''))
      .filter((parent) => parent !== '/'),
  );
  return [...[...parents].sort().map((p) => `${p}${missing}/`), `/${missing}/`];
}

test('루트 /는 기본 언어 Home으로 301 이동한다', async ({ request }) => {
  const target = rootTarget();
  expect(pages, 'sitemap에 이동 대상이 있다').toContain(target);
  const response = await get(request, '/');
  expect(response.status()).toBe(301);
  expect(locationPath(response)).toBe(target);
});

for (const page of pages) {
  test(`${page}: 200, 보안 헤더, HTML은 오래 캐시하지 않는다`, async ({
    request,
  }) => {
    const response = await get(request, page);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expectSecurityHeaders(response);
    expect(response.headers()['cache-control'] ?? '').not.toContain(
      'immutable',
    );
  });

  const noSlash = page.slice(0, -1);
  test(`${noSlash}: 끝 슬래시 주소로 307 이동한다`, async ({ request }) => {
    const response = await get(request, noSlash);
    expect(response.status()).toBe(307);
    expect(locationPath(response)).toBe(page);
  });
}

for (const missing of missingPaths()) {
  test(`없는 경로 ${missing.replace(/missing-[^/]+/, '<임의>')}: 404 상태로 404 페이지를 낸다`, async ({
    request,
  }) => {
    const response = await get(request, missing);
    expect(response.status()).toBe(404);
    expect(await response.text()).toBe(notFoundBody);
    expectSecurityHeaders(response);
  });
}

test('/_astro/의 파일은 1년 immutable로 캐시한다', async ({ request }) => {
  const file = readdirSync(path.join(DIST, '_astro'), {
    withFileTypes: true,
  }).find((entry) => entry.isFile());
  if (!file) throw new Error('dist/_astro/에 파일이 없습니다.');
  const response = await get(request, `/_astro/${file.name}`);
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toBe(IMMUTABLE);
  expectSecurityHeaders(response);
});

for (const config of ['_redirects', '_headers']) {
  test(`설정 파일 /${config}는 내지 않는다`, async ({ request }) => {
    const response = await get(request, `/${config}`);
    expect(response.status()).toBe(404);
    expect(await response.text()).toBe(notFoundBody);
  });
}
