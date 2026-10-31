// 레이아웃 검사 도우미(T15 2-9). layout.spec.ts와 layout.chromium.spec.ts가 함께 쓴다.
import type { Page } from '@playwright/test';

/** 문서가 화면 폭보다 넓은 정도(px). 0이면 가로 스크롤이 생기지 않는다. */
export const horizontalOverflow = (page: Page) =>
  page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
