// 요약 표 reporter(T16). 테스트가 붙인 요약을 모아 끝에 Markdown 표로 출력하고,
// GitHub Actions에서는 작업 요약($GITHUB_STEP_SUMMARY)에도 쓴다. artifact를 내려받지 않고 점수를 보기 위해서다.
import { appendFileSync } from 'node:fs';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import {
  SUMMARY_ATTACHMENT,
  summaryTable,
  type Summary,
  type SummaryRow,
} from './summary';

export default class SummaryReporter implements Reporter {
  private rows: SummaryRow[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    const attachment = result.attachments.find(
      (a) => a.name === SUMMARY_ATTACHMENT && a.body,
    );
    this.rows.push({
      title: test.title,
      project: test.parent.project()?.name ?? '?',
      status: result.status,
      summary: attachment?.body
        ? (JSON.parse(attachment.body.toString()) as Summary)
        : undefined,
    });
  }

  onEnd() {
    if (this.rows.length === 0) return;
    const table = summaryTable(this.rows);
    console.log(`\n${table}\n`);
    const file = process.env.GITHUB_STEP_SUMMARY;
    if (file) appendFileSync(file, `${table}\n`);
  }

  printsToStdio() {
    return false;
  }
}
