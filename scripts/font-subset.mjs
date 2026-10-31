// Fontsource 글꼴 CSS에서 사이트가 쓰는 글자를 포함하는 `@font-face`만 남기고, 첫 화면에 필요한
// 글꼴 파일의 preload 목록을 만드는 Astro 통합(docs/tasks/T11-performance.md 범위 2·3,
// docs/ARCHITECTURE.md §2).
// Fontsource CSS는 문자 범위(unicode-range)마다 `@font-face`를 하나씩 담고 있어, 브라우저가 쓰지
// 않는 범위의 글꼴 파일은 받지 않더라도 CSS는 첫 렌더 전에 전부 받는다. 이 통합은 빌드할 때
// `src/` 아래 텍스트 파일에 나오는 글자를 모아, 그 글자와 겹치는 범위의 규칙만 남긴다.
// 글꼴 파일은 바꾸지 않는다. 주석·코드의 글자까지 모으므로 실제보다 조금 많이 남을 수 있지만(안전한
// 쪽), 글자 목록을 손으로 관리하지 않아도 원고가 바뀌면 다시 계산된다. 주석은 지우지 않는다. 화면
// 문구에도 `//`·`/*` 같은 글자가 나올 수 있어, 주석으로 오인해 지우면 쓰는 글자를 놓친다.
// 빌드가 끝나면 dist의 HTML·JSON·JS에 쓰인 글자 중 남긴 범위가 덮지 않는 글자가 있는지 검사하고,
// 있으면 빌드를 실패시킨다.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FONTSOURCE_CSS = /[\\/]@fontsource[\\/][^\\/]+[\\/][^\\/]+\.css$/;
const SOURCE_FILE = /\.(astro|ts|tsx|mjs|ya?ml|md|json|css)$/;
const OUTPUT_FILE = /\.(html|json|js)$/;
const FONT_FACE = /@font-face\s*\{[^}]*\}/g;
// 글꼴에 없는 글자를 알릴 때는 화면에 나오지 않는 HTML 주석과 인라인 스크립트·스타일(한국어 주석
// 등)을 뺀다. HTML 본문의 `<`는 `&lt;`로 출력되므로 화면 문구가 지워지지 않는다.
const HIDDEN_HTML = /<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1>/g;
const PRELOAD_MODULE = 'virtual:font-preloads';
const RESOLVED_PRELOAD_MODULE = `\0${PRELOAD_MODULE}`;

async function listFiles(dir, pattern) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

async function collectCodePoints(files, transform = (text) => text) {
  const codePoints = new Set();
  for (const file of files) {
    for (const char of transform(await readFile(file, 'utf8'))) {
      codePoints.add(char.codePointAt(0));
    }
  }
  return codePoints;
}

/** `U+30??`, `U+4E00-9FFF`, `U+3042` 형식을 [시작, 끝] 목록으로 바꾼다. */
function parseUnicodeRange(rule) {
  const value = /unicode-range:\s*([^;}]*)/.exec(rule)?.[1];
  if (!value) return null;
  return value.split(',').map((part) => {
    const range = part.trim().replace(/^U\+/i, '');
    if (range.includes('?')) {
      return [
        parseInt(range.replaceAll('?', '0'), 16),
        parseInt(range.replaceAll('?', 'F'), 16),
      ];
    }
    const [start, end = start] = range.split('-');
    return [parseInt(start, 16), parseInt(end, 16)];
  });
}

function covers(ranges, codePoint) {
  // unicode-range가 없는 규칙은 모든 글자를 덮는다.
  return (
    ranges === null ||
    ranges.some(([start, end]) => codePoint >= start && codePoint <= end)
  );
}

function formatCodePoint(codePoint) {
  return `${String.fromCodePoint(codePoint)} (U+${codePoint.toString(16).toUpperCase().padStart(4, '0')})`;
}

/**
 * @param {object} options
 * @param {string[]} options.preloadCss preload할 글꼴 파일을 고를 Fontsource CSS(패키지 경로)
 * @param {Record<string, string>} options.preloadChars 언어별로, 이 글자를 덮는 범위의 woff2를 preload한다
 * @returns {import('astro').AstroIntegration}
 */
export default function fontSubset({ preloadCss, preloadChars }) {
  let root;
  let codePointsPromise;
  // 원래 CSS 파일 경로 → { 전체 규칙의 범위 목록, 남긴 규칙의 범위 목록 }. 빌드 후 검사에 쓴다.
  const families = new Map();

  const sourceCodePoints = () => {
    codePointsPromise ??= listFiles(path.join(root, 'src'), SOURCE_FILE).then(
      collectCodePoints,
    );
    return codePointsPromise;
  };

  /** @type {import('vite').Plugin} */
  const vitePlugin = {
    name: 'portfolio:font-subset',
    enforce: 'pre',
    resolveId(id) {
      return id === PRELOAD_MODULE ? RESOLVED_PRELOAD_MODULE : null;
    },
    // 언어별 preload URL 목록. woff2를 `?url`로 import해 CSS가 참조하는 것과 같은 해시 파일 이름을 받는다.
    async load(id) {
      if (id !== RESOLVED_PRELOAD_MODULE) return null;
      const imports = [];
      const locales = {};
      for (const [locale, chars] of Object.entries(preloadChars)) {
        locales[locale] = [];
        for (const specifier of preloadCss) {
          const cssFile = (await this.resolve(specifier))?.id;
          if (!cssFile) throw new Error(`${specifier}를 찾을 수 없다.`);
          const rules =
            (await readFile(cssFile, 'utf8')).match(FONT_FACE) ?? [];
          for (const char of chars) {
            // 범위가 겹치면 브라우저는 나중에 정의된 규칙을 먼저 쓴다(CSS Fonts 명세의 unicode-range 규칙).
            const rule = rules.findLast((r) =>
              covers(parseUnicodeRange(r), char.codePointAt(0)),
            );
            const href = rule && /url\(([^)]+\.woff2)\)/.exec(rule)?.[1];
            if (!href)
              throw new Error(
                `${specifier}에 ${formatCodePoint(char.codePointAt(0))}를 덮는 woff2가 없다.`,
              );
            const file = path.resolve(path.dirname(cssFile), href);
            let index = imports.indexOf(file);
            if (index === -1) index = imports.push(file) - 1;
            if (!locales[locale].includes(index)) locales[locale].push(index);
          }
        }
      }
      return [
        ...imports.map(
          (file, i) => `import font${i} from ${JSON.stringify(`${file}?url`)};`,
        ),
        `export default {${Object.entries(locales)
          .map(
            ([locale, indexes]) =>
              `${JSON.stringify(locale)}: [${indexes.map((i) => `font${i}`).join(', ')}]`,
          )
          .join(', ')}};`,
      ].join('\n');
    },
    async transform(code, id) {
      const file = id.split('?')[0];
      if (!FONTSOURCE_CSS.test(file) || id.includes('?')) return null;
      const codePoints = await sourceCodePoints();
      const all = [];
      const kept = [];
      const css = code.replace(FONT_FACE, (rule) => {
        const ranges = parseUnicodeRange(rule);
        all.push(ranges);
        if (![...codePoints].some((codePoint) => covers(ranges, codePoint)))
          return '';
        kept.push(ranges);
        return rule;
      });
      families.set(file, { all, kept });
      return { code: css, map: null };
    },
  };

  return {
    name: 'portfolio:font-subset',
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        root = fileURLToPath(config.root);
        updateConfig({ vite: { plugins: [vitePlugin] } });
      },
      'astro:config:done': ({ injectTypes }) => {
        injectTypes({
          filename: 'font-preloads.d.ts',
          content: `declare module '${PRELOAD_MODULE}' {\n  const preloads: Record<string, string[]>;\n  export default preloads;\n}\n`,
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const outputFiles = await listFiles(outDir, OUTPUT_FILE);
        const used = await collectCodePoints(outputFiles);
        const visible = await collectCodePoints(
          outputFiles.filter((file) => !file.endsWith('.js')),
          (text) => text.replace(HIDDEN_HTML, ''),
        );
        const groups = [...families.values()];
        const missing = [];
        const notInFont = [];
        for (const codePoint of used) {
          if (codePoint < 0x20) continue;
          if (
            groups.some(({ kept }) =>
              kept.some((ranges) => covers(ranges, codePoint)),
            )
          )
            continue;
          if (
            groups.some(({ all }) =>
              all.some((ranges) => covers(ranges, codePoint)),
            )
          ) {
            missing.push(codePoint);
          } else if (visible.has(codePoint)) {
            notInFont.push(codePoint);
          }
        }
        const total = groups.reduce((sum, { all }) => sum + all.length, 0);
        const kept = groups.reduce((sum, { kept }) => sum + kept.length, 0);
        logger.info(
          `@font-face ${kept}/${total}개 유지, 빌드 결과의 글자 ${used.size}종 검사`,
        );
        if (notInFont.length > 0) {
          logger.info(
            `글꼴에 없는 글자(대체 글꼴로 표시): ${notInFont.map(formatCodePoint).join(', ')}`,
          );
        }
        if (missing.length > 0) {
          throw new Error(
            `남긴 @font-face가 덮지 않는 글자가 있다: ${missing.map(formatCodePoint).join(', ')}. ` +
              'scripts/font-subset.mjs가 모으는 파일 범위를 확인한다.',
          );
        }
      },
    },
  };
}
