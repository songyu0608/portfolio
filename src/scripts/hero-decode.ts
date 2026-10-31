// Home 히어로 한 줄 소개 디코딩(docs/DESIGN.md §3 컨셉 1, §5).
// 최종 문구 요소는 바꾸지 않고 글자색만 투명하게 한 뒤, 같은 구조를 복제한 장식용 겹침 요소
// (aria-hidden)에 임의 글자를 그린다. 스크린 리더·복사·SEO에는 처음부터 최종 문구만 있다.
// reduced-motion이면 아무것도 하지 않는다.

const DURATION = 1000;
// 확정되지 않은 글자를 바꾸는 간격. 매 프레임 바꾸면 깜빡임이 지나치게 많다.
const SCRAMBLE_INTERVAL = 50;
const WIDE_POOL =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン';
const NARROW_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// 글자·숫자만 바꾸고 공백·구두점·괄호는 그대로 둔다. 겹침 줄바꿈이 원문과 맞도록 폭을 유지해,
// 전각(가나·한자·한글·전각 영숫자)은 전각 가타카나로, 반각(반각 가나 포함)은 영문 대문자·숫자로 바꾼다.
const LETTER = /[\p{L}\p{N}]/u;
const WIDE = /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꥠ-꥿가-힣豈-﫿！-｠￠-￦]/u;

function randomFrom(pool: string): string {
  return pool[Math.floor(Math.random() * pool.length)] ?? '';
}

function scramble(char: string): string {
  if (!LETTER.test(char)) return char;
  return randomFrom(WIDE.test(char) ? WIDE_POOL : NARROW_POOL);
}

function decode(target: HTMLElement): void {
  // 문단 자체가 아니라 안쪽 내용(문절 span 포함)만 복제해 문단의 여백·폭 규칙을 다시 받지 않게 한다.
  const overlay = document.createElement('span');
  overlay.append(
    ...Array.from(target.childNodes, (node) => node.cloneNode(true)),
  );
  overlay.setAttribute('aria-hidden', 'true');
  overlay.className = 'decode-overlay';

  const walker = document.createTreeWalker(overlay, NodeFilter.SHOW_TEXT);
  const nodes: { node: Text; chars: string[] }[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    nodes.push({ node: text, chars: Array.from(text.data) });
  }
  const total = nodes.reduce((sum, { chars }) => sum + chars.length, 0);
  if (total === 0) return;

  target.classList.add('is-decoding');
  target.append(overlay);

  let start: number | undefined;
  let lastScramble = -Infinity;
  let frame = 0;

  const render = (revealed: number) => {
    let index = 0;
    for (const { node, chars } of nodes) {
      node.data = chars
        .map((char) => (index++ < revealed ? char : scramble(char)))
        .join('');
    }
  };

  const finish = () => {
    cancelAnimationFrame(frame);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    overlay.remove();
    target.classList.remove('is-decoding');
  };

  // 탭이 백그라운드로 가면 프레임이 멈추므로 바로 최종 상태로 끝낸다.
  const onVisibilityChange = () => {
    if (document.hidden) finish();
  };

  const tick = (now: number) => {
    start ??= now;
    const progress = Math.min((now - start) / DURATION, 1);
    if (progress >= 1) {
      finish();
      return;
    }
    if (now - lastScramble >= SCRAMBLE_INTERVAL) {
      lastScramble = now;
      // 끝으로 갈수록 천천히 확정되지 않도록 ease-out으로 앞에서부터 확정한다.
      render(Math.floor(total * (1 - (1 - progress) ** 2)));
    }
    frame = requestAnimationFrame(tick);
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  render(0);
  frame = requestAnimationFrame(tick);
}

const target = document.querySelector<HTMLElement>('[data-decode]');
if (
  target &&
  !document.hidden &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  decode(target);
}
