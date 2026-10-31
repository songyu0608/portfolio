// 2-8 reduced-motion(T15, docs/DESIGN.md §3 공통 구현 규칙). 장식 효과 5개가 reduce에서 꺼지는지 본다.
// 같은 검사를 no-preference로도 돌려 그 조건에서는 효과가 실제로 동작함을 확인한다(빈 검사 방지).
// cross-document View Transitions·scroll-driven animation을 지원하는 Chromium에서만 돌린다.
import { expect, test, type Page } from '@playwright/test';
import { paletteDialog, openPalette } from './support/command-ui';
import { representativePages } from './support/site';

const pageOf = (kind: string) => {
  const found = representativePages().find((p) => p.kind === kind);
  if (!found) throw new Error(`${kind} 페이지가 없습니다.`);
  return found;
};

/** 실행 중인 CSS 애니메이션 이름(CSS Modules가 붙인 접두어·접미어 포함) */
const animationNames = (page: Page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      .map((animation) =>
        animation instanceof CSSAnimation ? animation.animationName : '',
      ),
  );

for (const mode of ['reduce', 'no-preference'] as const) {
  const on = mode === 'no-preference';

  test.describe(`reducedMotion ${mode}`, () => {
    test.use({ reducedMotion: mode });

    test(`Home 한 줄 소개 디코딩이 ${on ? '동작한다' : '꺼진다'}`, async ({
      page,
    }) => {
      // 디코딩은 1초 안에 끝나므로 겹침 요소가 한 번이라도 붙었는지 처음부터 지켜본다.
      await page.addInitScript(() => {
        const state = { decoded: false };
        Object.assign(window, { __motion: state });
        new MutationObserver((records) => {
          for (const record of records) {
            for (const node of record.addedNodes) {
              if (node instanceof Element && node.matches('.decode-overlay')) {
                state.decoded = true;
              }
            }
          }
        }).observe(document, { childList: true, subtree: true });
      });
      const home = pageOf('home');
      await page.goto(home.path, { waitUntil: 'networkidle' });
      await expect(page.locator('[data-decode]')).toHaveCount(1);
      expect(
        await page.evaluate(
          () =>
            (window as unknown as { __motion: { decoded: boolean } }).__motion
              .decoded,
        ),
      ).toBe(on);
      // 끝난 뒤에는 겹침 요소가 남지 않는다.
      await expect(page.locator('.decode-overlay')).toHaveCount(0);
    });

    test(`프로젝트 카드 틸트가 ${on ? '동작한다' : '꺼진다'}`, async ({
      page,
    }) => {
      await page.goto(pageOf('projects').path, { waitUntil: 'networkidle' });
      const card = page.locator('[data-tilt]').first();
      const box = await card.boundingBox();
      if (!box) throw new Error('카드가 보이지 않습니다.');
      await page.mouse.move(
        box.x + box.width * 0.25,
        box.y + box.height * 0.25,
      );
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2, {
        steps: 4,
      });
      if (on) {
        await expect(card).toHaveClass(/\bis-tilting\b/);
        await expect
          .poll(() => card.evaluate((el) => getComputedStyle(el).transform))
          .not.toBe('none');
      } else {
        // 틸트 스크립트가 등록되지 않으므로 다음 프레임 뒤에도 클래스가 붙지 않는다.
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
        );
        await expect(card).not.toHaveClass(/\bis-tilting\b/);
        expect(
          await card.evaluate((el) => getComputedStyle(el).transform),
        ).toBe('none');
      }
    });

    test(`카드 → 상세 전환이 ${on ? '동작한다' : '꺼진다'}`, async ({
      page,
    }) => {
      // 이동한 문서가 View Transition으로 나타났는지 pagereveal 이벤트로 기록한다.
      await page.addInitScript(() => {
        window.addEventListener('pagereveal', (event) => {
          const transition = (event as Event & { viewTransition: unknown })
            .viewTransition;
          sessionStorage.setItem(
            't15-view-transition',
            String(Boolean(transition)),
          );
        });
      });
      await page.goto(pageOf('projects').path, { waitUntil: 'networkidle' });
      const link = page.locator('[data-tilt] a').first();
      const href = await link.getAttribute('href');
      await link.click();
      await expect(page).toHaveURL(href ?? '');
      await expect
        .poll(() =>
          page.evaluate(() => sessionStorage.getItem('t15-view-transition')),
        )
        .toBe(String(on));
    });

    test(`About 타임라인 스크롤 강조가 ${on ? '동작한다' : '꺼진다'}`, async ({
      page,
    }) => {
      await page.goto(pageOf('about').path, { waitUntil: 'networkidle' });
      const names = (await animationNames(page)).filter((name) =>
        name.includes('timeline'),
      );
      if (on) expect(names.length).toBeGreaterThan(0);
      else expect(names).toEqual([]);
    });

    test(`명령 팔레트 열림 애니메이션이 ${on ? '동작한다' : '꺼진다'}`, async ({
      page,
    }) => {
      const home = pageOf('home');
      await page.goto(home.path, { waitUntil: 'networkidle' });
      await openPalette(page, home.locale);
      const name = await paletteDialog(page, home.locale).evaluate(
        (el) => getComputedStyle(el).animationName,
      );
      if (on) expect(name).toContain('command-dialog-in');
      else expect(name).toBe('none');
    });
  });
}
