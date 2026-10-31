// 터미널 모드(컨셉 3, 이스터에그). 명령은 commands.ts의 runTerminal만 실행한다.
// 출력은 role="log"로 스크린 리더에 읽히고, 링크는 실제 <a>로 그린다(HTML 문자열은 만들지 않는다).
import { useEffect, useId, useRef, useState } from 'react';
import Dialog from './Dialog';
import {
  runTerminal,
  SUGGESTED_COMMANDS,
  welcomeLines,
  type CommandContext,
  type CommandData,
  type Effect,
  type Line,
} from './commands';

// 출력은 최근 줄만 남긴다.
const MAX_LINES = 200;

interface Props {
  data: CommandData;
  ctx: CommandContext;
  onEffect: (effect: Effect) => void;
  onClose: () => void;
}

interface Entry {
  id: number;
  line: Line;
}

export default function Terminal({ data, ctx, onEffect, onClose }: Props) {
  const text = data.text.terminal;
  const nextIdRef = useRef(0);
  // 환영 문구는 음수 id로 두어 이후 줄(0부터)과 겹치지 않게 한다.
  const [entries, setEntries] = useState<Entry[]>(() =>
    welcomeLines(data).map((line, index) => ({ id: -1 - index, line })),
  );
  const [input, setInput] = useState('');
  // 실행한 명령. 창을 연 동안만 기억한다(↑↓로 불러오기).
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [entries]);

  const run = (value: string) => {
    const result = runTerminal(value, data, ctx);
    setInput('');
    if (!result) return;
    historyRef.current.push(value.trim());
    historyIndexRef.current = historyRef.current.length;
    if (result.effect?.type === 'clear') {
      setEntries([]);
      return;
    }
    const added = result.lines.map((line) => ({
      id: nextIdRef.current++,
      line,
    }));
    setEntries((prev) => [...prev, ...added].slice(-MAX_LINES));
    if (result.effect) onEffect(result.effect);
  };

  const recall = (step: -1 | 1) => {
    const list = historyRef.current;
    const index = Math.min(
      Math.max(historyIndexRef.current + step, 0),
      list.length,
    );
    historyIndexRef.current = index;
    setInput(list[index] ?? '');
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // IME 변환 중의 키(후보 선택 ↑↓, 확정 Enter)는 IME에 맡긴다.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      run(input);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      recall(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      recall(1);
    }
  };

  return (
    <Dialog
      label={text.label}
      className="command-terminal"
      onClose={onClose}
      initialFocus={inputRef}
    >
      <div className="command-terminal__bar">
        <span aria-hidden="true">{`guest@${data.siteName}: ~`}</span>
        <button
          type="button"
          className="command-terminal__close"
          aria-label={text.close}
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18"></path>
          </svg>
        </button>
      </div>
      <div
        ref={logRef}
        className="command-terminal__log"
        role="log"
        aria-label={text.output}
      >
        {entries.map(({ id, line }) => (
          <p key={id} className="command-terminal__line" data-kind={line.kind}>
            {line.parts.map((part) =>
              typeof part === 'string' ? (
                part
              ) : (
                <a key={part.href} href={part.href}>
                  {part.text}
                </a>
              ),
            )}
          </p>
        ))}
      </div>
      <div className="command-terminal__prompt">
        <span aria-hidden="true">$</span>
        <label className="sr-only" htmlFor={inputId}>
          {text.input}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          className="command-terminal__input"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="command-terminal__suggest">
        <span id={`${inputId}-suggest`}>{text.suggest}</span>
        <ul aria-labelledby={`${inputId}-suggest`}>
          {SUGGESTED_COMMANDS.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => {
                  run(name);
                  inputRef.current?.focus();
                }}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}
