// 테스트가 붙이는 요약(attachment)과 요약 표 만들기(T16). 테스트와 reporter가 함께 쓴다.
import type { FormFactor } from './lighthouse';

export const SUMMARY_ATTACHMENT = 'lighthouse-summary';

/** 페이지 하나 × 폼팩터 하나의 결과. 점수는 0~100 정수 */
export interface Summary {
  path: string;
  formFactor: FormFactor;
  /** 회차별 Performance */
  performance: number[];
  performanceMedian: number;
  /** 접근성·Best Practices·SEO는 3회 중 최저(기준은 3회 모두 100) */
  accessibility: number;
  bestPractices: number;
  seo: number;
  /** 대표 회차. 기준 없이 기록만 한다 */
  agenticBrowsing: number | null;
  /** 대표 회차(ms) */
  lcp: number;
  /** 3회 중앙값 */
  cls: number;
  /** 대표 회차(ms) */
  tbt: number;
  lighthouseVersion: string;
  chromeVersion: string;
}

export interface SummaryRow {
  title: string;
  project: string;
  status: string;
  summary?: Summary;
}

const statusMark: Record<string, string> = {
  passed: '✅',
  failed: '❌',
  timedOut: '⏱️',
  interrupted: '⚠️',
  skipped: '⏭️',
};

/** GitHub 작업 요약·콘솔용 Markdown 표 */
export function summaryTable(rows: SummaryRow[]): string {
  const first = rows.find((row) => row.summary)?.summary;
  const header = first
    ? `### Lighthouse ${first.lighthouseVersion} · Chrome ${first.chromeVersion}`
    : '### Lighthouse';
  const lines = [
    header,
    '',
    '| 판정 | 폼팩터 | 페이지 | Performance(중앙값 / 3회) | 접근성 | BP | SEO | Agentic Browsing | LCP | CLS | TBT |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const { title, project, status, summary: s } of rows) {
    const mark = statusMark[status] ?? status;
    if (!s) {
      lines.push(
        `| ${mark} | ${project} | ${title} | — | — | — | — | — | — | — | — |`,
      );
      continue;
    }
    const cells = [
      mark,
      s.formFactor,
      `\`${s.path}\``,
      `${s.performanceMedian} / ${s.performance.join(', ')}`,
      s.accessibility,
      s.bestPractices,
      s.seo,
      s.agenticBrowsing ?? '—',
      `${Math.round(s.lcp)}ms`,
      s.cls.toFixed(3),
      `${Math.round(s.tbt)}ms`,
    ];
    lines.push(`| ${cells.join(' | ')} |`);
  }
  lines.push(
    '',
    '접근성·BP·SEO는 3회 중 최저, LCP·TBT·Agentic Browsing은 성능 중앙값 회차, CLS는 3회 중앙값이다. 기준은 `docs/tasks/T16-lighthouse-ci.md` 범위 2.',
  );
  return lines.join('\n');
}
