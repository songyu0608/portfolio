// 2-6 키보드(T15, docs/DESIGN.md §11 키보드 기준). 페이지 종류 6개를 1280px에서 본다.
// 팔레트·터미널의 키보드 동작은 command-ui.spec.ts가 본다.
import { expect, test, type Page } from '@playwright/test';
import { representativePages, ui } from './support/site';

test.use({ viewport: { width: 1280, height: 800 } });

/** 지금 포커스된 요소의 정보. id는 문서 안 요소 순서(DOM이 바뀌지 않는 동안 같은 요소를 가리킨다). */
interface Stop {
  id: number;
  label: string;
  rect: { top: number; bottom: number; left: number; right: number };
  /** 자기 outline 또는 카드 ::after(docs/DESIGN.md §11 포커스)에 2px 이상 외곽선이 있다 */
  indicator: boolean;
  /** 화면 안에 있고, 가운데 지점에서 다른 요소에 가려지지 않는다 */
  visible: boolean;
}

function readFocus(page: Page): Promise<Stop | null> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!(el instanceof HTMLElement) || el === document.body) return null;
    const all = document.getElementsByTagName('*');
    const rect = el.getBoundingClientRect();
    const drawn = (style: CSSStyleDeclaration) =>
      style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    return {
      id: Array.prototype.indexOf.call(all, el),
      label: `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30)}" ${el.getAttribute('href') ?? ''}`,
      rect: {
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
        left: rect.left,
        right: rect.right,
      },
      indicator:
        drawn(getComputedStyle(el)) || drawn(getComputedStyle(el, '::after')),
      visible:
        rect.top >= 0 &&
        rect.bottom <= window.innerHeight &&
        hit !== null &&
        el.contains(hit),
    };
  });
}

/**
 * Tab을 눌러 가며 정지 위치를 모은다. 문서 밖으로 나가거나, 처음 정지 위치·시작 요소(startId)로
 * 돌아오면(순환) 멈춘다.
 */
async function collectStops(
  page: Page,
  key: 'Tab' | 'Shift+Tab',
  startId?: number,
  max = 200,
) {
  const stops: Stop[] = [];
  for (let i = 0; i < max; i += 1) {
    await page.keyboard.press(key);
    const stop = await readFocus(page);
    if (!stop || stop.id === stops[0]?.id || stop.id === startId) return stops;
    stops.push(stop);
  }
  throw new Error(`${key} ${max}번 안에 끝나지 않았습니다(포커스 함정 의심).`);
}

/**
 * 화면 순서: 다음 정지 위치는 아래 줄에 있거나, 같은 줄(세로 범위가 겹침)이면 오른쪽에 있다.
 * 반환값은 순서가 어긋난 쌍이다.
 */
function outOfOrder(stops: Stop[]): string[] {
  const errors: string[] = [];
  for (let i = 1; i < stops.length; i += 1) {
    const a = stops[i - 1].rect;
    const b = stops[i].rect;
    const sameRow = b.top < a.bottom && a.top < b.bottom;
    const ok = sameRow ? b.left >= a.left : b.top >= a.bottom - 1;
    if (!ok) errors.push(`${stops[i - 1].label} → ${stops[i].label}`);
  }
  return errors;
}

for (const { path: pagePath, locale, kind } of representativePages()) {
  test(`Tab 순서·포커스 표시·가림 ${kind} ${pagePath}`, async ({ page }) => {
    await page.goto(pagePath, { waitUntil: 'networkidle' });
    const forward = await collectStops(page, 'Tab');
    // 첫 Tab은 본문 바로가기다.
    await expect(
      page.getByRole('link', { name: ui[locale].skipLink }),
    ).toHaveAttribute('href', '#main');
    expect(forward[0]?.label).toContain(ui[locale].skipLink);
    expect(forward.length).toBeGreaterThan(3);

    // 본문 바로가기는 포커스될 때만 화면 위에 나타나므로 순서 비교는 그다음부터 한다.
    expect(outOfOrder(forward.slice(1)), '화면 순서와 다른 Tab 순서').toEqual(
      [],
    );
    expect(
      forward.filter((s) => !s.indicator).map((s) => s.label),
      '포커스 표시가 없는 곳',
    ).toEqual([]);
    expect(
      forward.filter((s) => !s.visible).map((s) => s.label),
      '화면 밖이거나 가려진 곳',
    ).toEqual([]);

    // Shift+Tab은 정확히 역순이다. 마지막 정지 위치에서 시작한다.
    const last = forward.at(-1);
    await page.evaluate((id) => {
      (document.getElementsByTagName('*')[id] as HTMLElement).focus();
    }, last?.id ?? -1);
    const backward = await collectStops(page, 'Shift+Tab', last?.id);
    expect(backward.map((s) => s.id)).toEqual(
      forward
        .slice(0, -1)
        .reverse()
        .map((s) => s.id),
    );
  });

  test(`본문 바로가기 ${kind} ${pagePath}`, async ({ page }) => {
    await page.goto(pagePath, { waitUntil: 'networkidle' });
    const forward = await collectStops(page, 'Tab');
    // main 안 첫 요소. main 안에 Tab 정지 위치가 없는 페이지(About)는 main 뒤 첫 요소(푸터)다.
    const mainId = await page.evaluate(() =>
      Array.prototype.indexOf.call(
        document.getElementsByTagName('*'),
        document.querySelector('main'),
      ),
    );
    const target = forward.find((s) => s.id > mainId);
    expect(target, 'main 이후에 Tab 정지 위치가 있다').toBeDefined();

    await page.reload({ waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: ui[locale].skipLink });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
    await page.keyboard.press('Tab');
    expect((await readFocus(page))?.id, '다음 Tab은 main 안 첫 요소').toBe(
      target?.id,
    );
  });
}
