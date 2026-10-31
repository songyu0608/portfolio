// 명령 팔레트·터미널 UI를 <body> 끝에 한 번만 마운트한다. 런처(src/scripts/command-launcher.ts)가
// 처음 열 때 동적 import로 불러온다. Astro island(client:*)는 쓰지 않는다(docs/ARCHITECTURE.md A2).
import { createRoot } from 'react-dom/client';
import CommandUI, { type Register } from './CommandUI';
import type { CommandData } from './commands';
// CSS를 일반 import하면 Astro가 런처를 넣은 모든 페이지에 <link>를 추가하므로, URL만 받아 열 때 직접 붙인다.
import cssHref from './command-ui.css?url';

export interface CommandController {
  /** 닫혀 있으면 팔레트를 열고, 열려 있으면(팔레트·터미널) 닫는다. */
  toggle(returnFocus: HTMLElement | null): void;
}

/** 스타일을 붙이고 로드를 기다린다. 실패해도 열 수는 있게 한다. */
function loadStyle(): Promise<void> {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    link.addEventListener('load', () => resolve());
    link.addEventListener('error', () => resolve());
    document.head.append(link);
  });
}

export async function mount(
  data: CommandData,
  alternateHref: string,
): Promise<CommandController> {
  await loadStyle();
  const container = document.createElement('div');
  document.body.append(container);

  // React가 첫 렌더를 끝내기 전에 온 요청은 모아 두었다가 등록되면 처리한다.
  let handler: ((returnFocus: HTMLElement | null) => void) | undefined;
  const pending: (HTMLElement | null)[] = [];
  const register: Register = (next) => {
    handler = next;
    pending.splice(0).forEach((returnFocus) => next(returnFocus));
    return () => {
      handler = undefined;
    };
  };

  createRoot(container).render(
    <CommandUI data={data} alternateHref={alternateHref} register={register} />,
  );

  return {
    toggle(returnFocus) {
      if (handler) handler(returnFocus);
      else pending.push(returnFocus);
    },
  };
}
