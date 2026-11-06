// Windows에서도 셸 환경 변수 문법 없이 같은 빌드를 실행한다.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { checkVariant, globalHeaders } from './check-variant.mjs';

const astro = fileURLToPath(
  new URL('../node_modules/astro/bin/astro.mjs', import.meta.url),
);
const result = spawnSync(process.execPath, [astro, 'build'], {
  stdio: 'inherit',
  env: { ...process.env, SITE_VARIANT: 'assign' },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
const path = new URL('../dist/_headers', import.meta.url);
let headers = readFileSync(path, 'utf8');
if (!/^\s*X-Robots-Tag:\s*noindex\s*$/im.test(globalHeaders(headers))) {
  if (/^\/\*[ \t]*$/m.test(headers))
    headers = headers.replace(/^(\/\*[ \t]*)$/m, '$1\n  X-Robots-Tag: noindex');
  else headers += '\n/*\n  X-Robots-Tag: noindex\n';
  writeFileSync(path, headers);
}
await checkVariant();
