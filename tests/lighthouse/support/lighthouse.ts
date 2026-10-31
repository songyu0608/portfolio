// Lighthouse 실행과 결과 읽기(T16). 측정 1회마다 lighthouse 패키지의 CLI를 새 프로세스로 띄운다.
// CLI가 회차마다 새 프로필로 Chrome을 띄우므로 회차끼리 캐시·저장소가 섞이지 않는다.
// Playwright로 연 브라우저에 붙이지 않는 이유: Playwright는 headless Chromium에 hover·pointer 종류를
// 바꾸는 실행 옵션(--blink-settings)을 더해, 카드 틸트(hover 조건, T08) 같은 화면 조건이 실제 Chrome과
// 달라질 수 있다(docs/tasks/T16-lighthouse-ci.md "확인한 공식 문서").
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { chromium } from '@playwright/test';

export type FormFactor = 'mobile' | 'desktop';

export const formFactors: readonly FormFactor[] = ['mobile', 'desktop'];

/** 결과(LHR)에서 쓰는 부분만 적은 타입 */
export interface AuditResult {
  id: string;
  title: string;
  score: number | null;
  scoreDisplayMode: string;
  numericValue?: number;
}

export interface CategoryResult {
  id: string;
  title: string;
  score: number | null;
  auditRefs: { id: string; weight: number }[];
}

export interface LighthouseResult {
  lighthouseVersion: string;
  finalDisplayedUrl: string;
  runtimeError?: { code: string; message: string };
  environment: { hostUserAgent: string };
  categories: Record<string, CategoryResult>;
  audits: Record<string, AuditResult>;
}

export interface LighthouseRun {
  lhr: LighthouseResult;
  htmlPath: string;
}

const require = createRequire(import.meta.url);
const CLI = path.join(
  path.dirname(require.resolve('lighthouse/package.json')),
  'cli/index.js',
);

/**
 * Chrome 실행 파일. Playwright가 설치한 Chromium을 써서 브라우저 버전을 lockfile의 Playwright 버전으로
 * 고정한다. 브라우저를 내려받을 수 없는 환경은 E2E와 같은 환경 변수로 경로를 준다.
 */
export function chromePath(): string {
  const file =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    chromium.executablePath();
  if (!existsSync(file)) {
    throw new Error(
      `Chromium 실행 파일이 없습니다: ${file}. \`pnpm exec playwright install chromium\`을 실행하거나 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH에 경로를 주세요.`,
    );
  }
  return file;
}

/**
 * Lighthouse를 한 번 실행한다. outBase에 `.report.json`·`.report.html`이 생긴다.
 * 스로틀링 등은 기본값(모바일) 또는 desktop 프리셋이다(T11·T13·T14 수동 측정과 같은 설정).
 */
export async function runLighthouse(
  url: string,
  formFactor: FormFactor,
  outBase: string,
): Promise<LighthouseRun> {
  const args = [
    CLI,
    url,
    '--output=json',
    '--output=html',
    `--output-path=${outBase}`,
    // --no-sandbox: 루트로 도는 컨테이너 등에서는 Chrome 샌드박스가 시작되지 않는다. 우리 빌드 결과만 연다.
    '--chrome-flags=--headless=new --no-sandbox',
    '--quiet',
  ];
  if (formFactor === 'desktop') args.push('--preset=desktop');

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      env: { ...process.env, CHROME_PATH: chromePath() },
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `Lighthouse가 실패했습니다(종료 코드 ${String(code)}): ${url}\n${stderr.slice(-2000)}`,
          ),
        );
    });
  });

  const lhr = JSON.parse(
    await readFile(`${outBase}.report.json`, 'utf8'),
  ) as LighthouseResult;
  if (lhr.runtimeError) {
    throw new Error(
      `Lighthouse 실행 오류 ${lhr.runtimeError.code}: ${lhr.runtimeError.message} (${url})`,
    );
  }
  return { lhr, htmlPath: `${outBase}.report.html` };
}

/** 카테고리 점수(0~1). 점수가 없으면(감사 오류 등) 0으로 본다. */
export function categoryScore(lhr: LighthouseResult, id: string): number {
  return lhr.categories[id]?.score ?? 0;
}

/** 0~1 점수를 화면에 쓰는 0~100 정수로 */
export function points(score: number): number {
  return Math.round(score * 100);
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** 성능 점수가 중앙값인 회차(대표 회차). 보고서·요약 표의 지표 값은 이 회차 것을 쓴다. */
export function representativeRun(runs: LighthouseRun[]): LighthouseRun {
  const sorted = [...runs].sort(
    (a, b) =>
      categoryScore(a.lhr, 'performance') - categoryScore(b.lhr, 'performance'),
  );
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

/** 카테고리 점수를 깎은 감사(가중치가 있고 점수가 1 미만이거나 오류인 것)의 「ID(제목)」 */
export function failingAudits(lhr: LighthouseResult, id: string): string[] {
  const ignored = new Set(['informative', 'manual', 'notApplicable']);
  return (lhr.categories[id]?.auditRefs ?? [])
    .filter((ref) => ref.weight > 0)
    .map((ref) => lhr.audits[ref.id])
    .filter(
      (audit): audit is AuditResult =>
        audit !== undefined &&
        (audit.scoreDisplayMode === 'error' ||
          (audit.score !== null &&
            audit.score < 1 &&
            !ignored.has(audit.scoreDisplayMode))),
    )
    .map((audit) => `${audit.id}(${audit.title})`);
}

export function numericValue(lhr: LighthouseResult, id: string): number {
  const value = lhr.audits[id]?.numericValue;
  if (value === undefined) throw new Error(`감사 값이 없습니다: ${id}`);
  return value;
}

/** HeadlessChrome/153.0.0.0 → 153.0.0.0 */
export function chromeVersion(lhr: LighthouseResult): string {
  return /Chrome\/([\d.]+)/.exec(lhr.environment.hostUserAgent)?.[1] ?? '?';
}
