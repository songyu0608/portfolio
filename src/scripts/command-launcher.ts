// 명령 팔레트·터미널(T10)의 런처. 모든 페이지가 받는 유일한 T10 코드다.
// ⌘K / Ctrl+K 또는 헤더 버튼으로 처음 열 때만 React UI(동적 import)와 데이터(JSON)를 불러온다.
// React를 import하지 않는다. 규칙은 docs/DESIGN.md "명령 팔레트·터미널".
import type { CommandController } from '../components/interactive/mount';

const button = document.querySelector<HTMLButtonElement>(
  '[data-command-palette]',
);
let loading: Promise<CommandController> | undefined;

function load(trigger: HTMLButtonElement): Promise<CommandController> {
  const { src = '', alternate = '' } = trigger.dataset;
  loading ??= Promise.all([
    import('../components/interactive/mount'),
    fetch(src).then((response) => {
      if (!response.ok) throw new Error(`${src}: ${response.status}`);
      return response.json();
    }),
  ])
    .then(([{ mount }, data]) => mount(data, alternate))
    .catch((error: unknown) => {
      // 다음에 열 때 다시 시도한다.
      loading = undefined;
      throw error;
    });
  return loading;
}

async function toggle(trigger: HTMLButtonElement) {
  // 닫을 때 돌려보낼 곳. 불러오는 동안 포커스가 바뀌지 않게 지금 기억한다.
  const returnFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const controller = await load(trigger);
  controller.toggle(returnFocus);
}

if (button) {
  button.addEventListener('click', () => {
    toggle(button).catch(console.error);
  });
  document.addEventListener('keydown', (event) => {
    if (
      event.key.toLowerCase() !== 'k' ||
      !(event.metaKey || event.ctrlKey) ||
      event.altKey ||
      event.shiftKey ||
      event.isComposing
    ) {
      return;
    }
    event.preventDefault();
    toggle(button).catch(console.error);
  });
}
