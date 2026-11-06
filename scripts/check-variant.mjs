// 금지 값의 원본은 콘텐츠와 Astro 설정이다. 새 의존성 없이 Astro의 YAML 파서를 사용한다.
import { createRequire } from 'node:module';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { sites } from '../astro.config.mjs';
const require = createRequire(import.meta.url);
const { parse } = require(
  require.resolve('yaml', {
    paths: [require.resolve('astro/package.json')],
  }),
);

export function globalHeaders(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === '/*');
  if (start < 0) return '';
  let end = start + 1;
  while (end < lines.length && !/^\S/.test(lines[end].replace(/^#.*$/, '')))
    end++;
  return lines.slice(start + 1, end).join('\n');
}

export async function checkVariant() {
  const contact = parse(
    readFileSync(
      new URL('../src/content/contact.yaml', import.meta.url),
      'utf8',
    ),
  );
  const forbidden = [
    ...new Set([
      contact.email.address,
      ...contact.links.map((link) =>
        new URL(link.url).hostname.replace(/^www\./, ''),
      ),
      new URL(sites.default).hostname,
    ]),
  ];
  const root = new URL('../dist/', import.meta.url);
  const errors = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
      if (entry.isDirectory()) walk(path);
      else if (/\.(?:html?|m?js|cjs|json|xml|txt)$/i.test(entry.name)) {
        const body = readFileSync(path, 'utf8').toLowerCase();
        for (const value of forbidden)
          if (body.includes(value.toLowerCase()))
            errors.push(`${fileURLToPath(path)}: forbidden ${value}`);
      }
    }
  }
  walk(root);
  if (
    !/^\s*X-Robots-Tag:\s*noindex\s*$/im.test(
      globalHeaders(readFileSync(new URL('_headers', root), 'utf8')),
    )
  )
    errors.push('dist/_headers: /* must contain X-Robots-Tag: noindex');
  if (errors.length)
    throw new Error(`[assign] leak/header check failed\n${errors.join('\n')}`);
  console.log(
    '[assign] leak check passed (HTML/JS/JSON/XML/txt); /* noindex confirmed',
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await checkVariant();
