// 프로젝트 카드 틸트(docs/DESIGN.md §3 컨셉 2, §5 프로젝트 카드).
// 마우스처럼 정밀한 포인터로 hover할 수 있고 reduced-motion이 아닐 때만 동작한다.
// 페이지에 한 번만 등록하고, 이벤트를 document에 위임해 모든 .project-card에 적용한다.
// 기울기 값은 CSS 변수로 넘기고 transform·전환 시간은 ProjectCard.astro의 CSS가 정한다.

const MAX_DEG = 4;
const query = window.matchMedia(
  '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
);

let active: HTMLElement | null = null;
let pointer: { x: number; y: number } | null = null;
let frame = 0;

function reset(): void {
  cancelAnimationFrame(frame);
  frame = 0;
  pointer = null;
  if (!active) return;
  active.classList.remove('is-tilting');
  active.style.removeProperty('--tilt-x');
  active.style.removeProperty('--tilt-y');
  active = null;
}

function apply(): void {
  frame = 0;
  if (!active || !pointer) return;
  const rect = active.getBoundingClientRect();
  // 카드 중심을 0으로 한 -0.5~0.5 위치. 위쪽을 누르면 위가 멀어지도록 X축은 부호를 바꾼다.
  const x =
    Math.min(Math.max((pointer.x - rect.left) / rect.width, 0), 1) - 0.5;
  const y =
    Math.min(Math.max((pointer.y - rect.top) / rect.height, 0), 1) - 0.5;
  active.style.setProperty('--tilt-x', `${(-y * 2 * MAX_DEG).toFixed(2)}deg`);
  active.style.setProperty('--tilt-y', `${(x * 2 * MAX_DEG).toFixed(2)}deg`);
  active.classList.add('is-tilting');
}

function onPointerMove(event: PointerEvent): void {
  if (event.pointerType !== 'mouse') return;
  const card =
    event.target instanceof Element
      ? event.target.closest<HTMLElement>('.project-card')
      : null;
  if (card !== active) reset();
  if (!card) return;
  active = card;
  pointer = { x: event.clientX, y: event.clientY };
  if (!frame) frame = requestAnimationFrame(apply);
}

function update(): void {
  if (query.matches) {
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);
  } else {
    document.removeEventListener('pointermove', onPointerMove);
    document.documentElement.removeEventListener('pointerleave', reset);
    reset();
  }
}

if (document.querySelector('.project-card')) {
  update();
  query.addEventListener('change', update);
}
