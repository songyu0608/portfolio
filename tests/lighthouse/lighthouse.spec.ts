// Lighthouse 점수 기준(T16, docs/tasks/T16-lighthouse-ci.md 범위 2). 페이지 하나 × 폼팩터(프로젝트) 하나를
// 3회 재서 판정한다. 기준은 T11(성능·CLS)·T13(Best Practices·SEO)·T14(접근성)에서 정한 값이다.
import { expect, test } from '@playwright/test';
import {
  categoryScore,
  chromeVersion,
  failingAudits,
  formFactors,
  median,
  numericValue,
  points,
  representativeRun,
  runLighthouse,
  type FormFactor,
  type LighthouseRun,
} from './support/lighthouse';
import { SUMMARY_ATTACHMENT, type Summary } from './support/summary';
import { lighthouseTargets } from './support/targets';

const RUNS = 3;

/** Performance 3회 중앙값의 최저 기준(0~1) */
const minPerformance: Record<FormFactor, number> = {
  mobile: 0.9,
  desktop: 0.95,
};

/** CLS 3회 중앙값의 최대 기준 */
const maxCls = 0.1;

/** 3회 모두 100이어야 하는 카테고리 */
const perfectCategories = ['accessibility', 'best-practices', 'seo'] as const;

function formFactorOf(projectName: string): FormFactor {
  const found = formFactors.find((f) => f === projectName);
  if (!found) {
    throw new Error(`프로젝트 이름은 폼팩터여야 합니다: ${projectName}`);
  }
  return found;
}

function metrics(run: LighthouseRun): string {
  const { lhr } = run;
  const ms = (id: string) => `${Math.round(numericValue(lhr, id))}ms`;
  return [
    `${points(categoryScore(lhr, 'performance'))}점`,
    `FCP ${ms('first-contentful-paint')}`,
    `LCP ${ms('largest-contentful-paint')}`,
    `TBT ${ms('total-blocking-time')}`,
    `CLS ${numericValue(lhr, 'cumulative-layout-shift').toFixed(3)}`,
    `SI ${ms('speed-index')}`,
  ].join(' ');
}

for (const target of lighthouseTargets()) {
  test(`${target.kind} ${target.path}`, async ({ baseURL }, testInfo) => {
    const formFactor = formFactorOf(testInfo.project.name);
    const url = new URL(target.path, baseURL).href;

    const runs: LighthouseRun[] = [];
    for (let i = 1; i <= RUNS; i += 1) {
      runs.push(
        await runLighthouse(url, formFactor, testInfo.outputPath(`run-${i}`)),
      );
    }
    const rep = representativeRun(runs);
    const repIndex = runs.indexOf(rep) + 1;
    const performance = runs.map((r) => categoryScore(r.lhr, 'performance'));
    const cls = median(
      runs.map((r) => numericValue(r.lhr, 'cumulative-layout-shift')),
    );
    const lowest = (id: string) =>
      Math.min(...runs.map((r) => categoryScore(r.lhr, id)));

    // 실패해도 보고서와 요약이 남도록 판정보다 먼저 붙인다.
    await testInfo.attach(`lighthouse-${formFactor}-run${repIndex}.html`, {
      path: rep.htmlPath,
      contentType: 'text/html',
    });
    const agentic = rep.lhr.categories['agentic-browsing']?.score;
    const summary: Summary = {
      path: target.path,
      formFactor,
      performance: performance.map(points),
      performanceMedian: points(median(performance)),
      accessibility: points(lowest('accessibility')),
      bestPractices: points(lowest('best-practices')),
      seo: points(lowest('seo')),
      agenticBrowsing:
        agentic === undefined || agentic === null ? null : points(agentic),
      lcp: numericValue(rep.lhr, 'largest-contentful-paint'),
      cls,
      tbt: numericValue(rep.lhr, 'total-blocking-time'),
      lighthouseVersion: rep.lhr.lighthouseVersion,
      chromeVersion: chromeVersion(rep.lhr),
    };
    await testInfo.attach(SUMMARY_ATTACHMENT, {
      body: JSON.stringify(summary),
      contentType: 'application/json',
    });

    // 모든 기준을 본 뒤 한 번에 실패시킨다(expect.soft).
    const perRun = runs.map((r, i) => `${i + 1}회차 ${metrics(r)}`).join(' / ');
    expect
      .soft(
        median(performance),
        `Performance 3회 중앙값이 ${points(minPerformance[formFactor])} 이상: ${perRun}`,
      )
      .toBeGreaterThanOrEqual(minPerformance[formFactor]);
    expect
      .soft(cls, `CLS 3회 중앙값이 ${maxCls} 이하: ${perRun}`)
      .toBeLessThanOrEqual(maxCls);
    for (const id of perfectCategories) {
      const title = rep.lhr.categories[id]?.title ?? id;
      const problems = runs
        .map((r, i) => ({
          run: i + 1,
          score: categoryScore(r.lhr, id),
          audits: failingAudits(r.lhr, id),
        }))
        .filter((r) => r.score < 1)
        .map(
          (r) =>
            `${r.run}회차 ${points(r.score)}점: ${r.audits.join(', ') || '(감사 없음)'}`,
        );
      expect.soft(problems, `${title} 3회 모두 100`).toEqual([]);
    }
  });
}
