// 팔레트와 터미널 중 무엇이 열려 있는지, 명령 실행 결과(이동·테마·복사)와 닫은 뒤 포커스를 관리한다.
import { useEffect, useRef, useState } from 'react';
import { clearTheme, getThemePreference, setTheme } from '../../scripts/theme';
import type { CommandContext, CommandData, Effect } from './commands';
import Palette from './Palette';
import Terminal from './Terminal';

export type Register = (
  handler: (returnFocus: HTMLElement | null) => void,
) => () => void;

type Mode = 'closed' | 'palette' | 'terminal';

// 메일 복사 결과 알림을 보여주는 시간(Contact 페이지의 복사 버튼과 같음)
const TOAST_MS = 2000;

interface Props {
  data: CommandData;
  alternateHref: string;
  register: Register;
}

export default function CommandUI({ data, alternateHref, register }: Props) {
  const [mode, setMode] = useState<Mode>('closed');
  const [toast, setToast] = useState('');
  const modeRef = useRef<Mode>('closed');
  // 닫을 때 포커스를 돌려보낼 곳. 팔레트에서 터미널로 넘어가도 처음 연 곳을 유지한다.
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);

  const changeMode = (next: Mode) => {
    const prev = modeRef.current;
    modeRef.current = next;
    setMode(next);
    if (next === 'closed' && prev !== 'closed') {
      // 다이얼로그가 닫힌 뒤(다음 프레임) 포커스를 돌려보낸다.
      const target = returnFocusRef.current;
      requestAnimationFrame(() => {
        if (target?.isConnected) target.focus();
      });
    }
  };

  useEffect(
    () =>
      register((focus) => {
        if (modeRef.current === 'closed') {
          returnFocusRef.current = focus;
          changeMode('palette');
        } else {
          changeMode('closed');
        }
      }),
    // changeMode는 ref와 setState만 쓰므로 등록은 register마다 한 번이면 된다.
    [register],
  );

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  const showToast = (message: string) => {
    window.clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => setToast(''), TOAST_MS);
  };

  const ctx: CommandContext = {
    alternateHref,
    theme: getThemePreference(),
    canCopy: Boolean(navigator.clipboard) && window.isSecureContext,
  };

  const run = (effect: Effect, from: 'palette' | 'terminal') => {
    switch (effect.type) {
      case 'navigate':
        changeMode('closed');
        window.location.assign(effect.href);
        break;
      case 'theme':
        if (effect.theme === 'system') clearTheme();
        else setTheme(effect.theme);
        if (from === 'palette') changeMode('closed');
        break;
      case 'copy':
        changeMode('closed');
        navigator.clipboard.writeText(effect.text).then(
          () => showToast(data.copy.done),
          () => showToast(data.copy.failed),
        );
        break;
      case 'terminal':
        changeMode('terminal');
        break;
      case 'close':
        changeMode('closed');
        break;
      case 'clear':
        break;
    }
  };

  return (
    <>
      {mode === 'palette' && (
        <Palette
          data={data}
          ctx={ctx}
          onRun={(effect) => run(effect, 'palette')}
          onClose={() => changeMode('closed')}
        />
      )}
      {mode === 'terminal' && (
        <Terminal
          data={data}
          ctx={ctx}
          onEffect={(effect) => run(effect, 'terminal')}
          onClose={() => changeMode('closed')}
        />
      )}
      {/* 다이얼로그 밖에 두어 팔레트를 닫은 뒤에도 결과가 읽힌다. 비어 있으면 보이지 않는다. */}
      <p className="command-toast" role="status">
        {toast}
      </p>
    </>
  );
}
