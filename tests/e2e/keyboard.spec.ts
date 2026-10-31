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
  /** document.hasFocus(). 실패 메시지에서 문서 밖으로 나갔는지 보려고 남긴다 */
  documentFocused: boolean;
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
      documentFocused: document.hasFocus(),
    };
  });
}

/**
 * DOM 순서로 id 요소 뒤(after) 또는 앞에 있는, Tab으로 갈 수 있어 보이는 요소의 라벨.
 * 포커스가 움직이지 않았을 때 「문서 끝에 닿음」과 「한 요소에 갇힘」을 가르는 데 쓴다.
 */
function focusableBeyond(page: Page, id: number, after: boolean) {
  return page.evaluate(
    ({ id, after }) => {
      const all = [...document.getElementsByTagName('*')];
      const rest = after ? all.slice(id + 1) : all.slice(0, id);
      const selector = [
        'a[href]',
        'area[href]',
        'button',
        'input:not([type="hidden"])',
        'select',
        'textarea',
        'summary',
        'iframe',
        '[contenteditable]:not([contenteditable="false"])',
        '[tabindex]',
      ].join(',');
      return rest
        .filter(
          (el): el is HTMLElement =>
            el instanceof HTMLElement &&
            el.matches(selector) &&
            !el.matches(':disabled') &&
            el.tabIndex >= 0 &&
            el.closest('[inert]') === null &&
            el.checkVisibility({
              checkVisibilityCSS: true,
              visibilityProperty: true,
            }),
        )
        .map(
          (el) =>
            `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30)}"`,
        );
    },
    { id, after },
  );
}

/**
 * Tab을 눌러 가며 정지 위치를 모은다. 다음 중 하나면 멈춘다.
 * - 포커스가 문서 밖으로 나가 activeElement가 body가 된다(Chromium·WebKit).
 * - 포커스가 직전 정지 위치에서 움직이지 않는다. 마지막 요소에서 Tab을 누르면 포커스가 브라우저 UI로
 *   가고 activeElement는 마지막 요소로 남는 엔진이 있다(Firefox, T15 CI). 이때는 그 뒤(Shift+Tab이면
 *   앞)에 Tab으로 갈 수 있는 요소가 남아 있지 않은지 확인해, 한 요소에 갇힌 경우와 구분한다.
 * - 처음 정지 위치나 시작 요소(startId)로 돌아온다(순환).
 */
async function collectStops(
  page: Page,
  key: 'Tab' | 'Shift+Tab',
  startId?: number,
  max = 200,
) {
  const stops: Stop[] = [];
  let previous = startId;
  for (let i = 0; i < max; i += 1) {
    await page.keyboard.press(key);
    const stop = await readFocus(page);
    if (!stop || stop.id === stops[0]?.id) return stops;
    if (stop.id === previous) {
      const left = await focusableBeyond(page, stop.id, key === 'Tab');
      if (left.length > 0) {
        throw new Error(
          `${key}을 눌러도 포커스가 ${stop.label}에서 움직이지 않습니다(포커스 함정 의심). 남은 요소: ${left.slice(0, 5).join(', ')}`,
        );
      }
      return stops;
    }
    if (stop.id === startId) return stops;
    stops.push(stop);
    previous = stop.id;
  }
  const tail = stops
    .slice(-6)
    .map((s) => `${s.id} ${s.label} focused=${String(s.documentFocused)}`);
  throw new Error(
    `${key} ${max}번 안에 끝나지 않았습니다(포커스 함정 의심). 마지막 정지 위치: ${tail.join(' | ')}`,
  );
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
    // 포커스가 브라우저 UI로 나간 엔진(Firefox)을 위해 먼저 페이지로 되돌린다.
    const last = forward.at(-1);
    await page.bringToFront();
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
    await page.bringToFront();
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
