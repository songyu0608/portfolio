// 명령 팔레트(컨셉 4). WAI-ARIA APG 콤보박스(목록 자동완성) 패턴: 포커스는 입력란에 두고
// 선택은 aria-activedescendant로 알린다. 항목은 commands.ts의 paletteItems에서만 만든다.
import { useEffect, useId, useRef, useState } from 'react';
import Dialog from './Dialog';
import {
  fill,
  filterItems,
  paletteItems,
  type CommandContext,
  type CommandData,
  type Effect,
  type PaletteItem,
} from './commands';

interface Props {
  data: CommandData;
  ctx: CommandContext;
  onRun: (effect: Effect) => void;
  onClose: () => void;
}

export default function Palette({ data, ctx, onRun, onClose }: Props) {
  const text = data.text.palette;
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optionId = (id: string) => `${baseId}-${id}`;

  const results = filterItems(paletteItems(data, ctx), query);
  const activeIndex = Math.min(active, results.length - 1);
  const activeItem = results[activeIndex];
  // 묶음(ページ → プロジェクト → 操作)별로 나눈다. index는 results 전체에서의 위치다.
  const groups: {
    group: PaletteItem['group'];
    entries: { item: PaletteItem; index: number }[];
  }[] = [];
  results.forEach((item, index) => {
    const last = groups.at(-1);
    if (last?.group === item.group) last.entries.push({ item, index });
    else groups.push({ group: item.group, entries: [{ item, index }] });
  });

  useEffect(() => {
    if (!activeItem) return;
    document
      .getElementById(optionId(activeItem.id))
      ?.scrollIntoView({ block: 'nearest' });
    // optionId는 baseId에서 정해지므로 activeItem만 보면 된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem?.id]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // IME 변환 중의 키(후보 선택 ↑↓, 확정 Enter)는 IME에 맡긴다.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(Math.min(activeIndex + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeItem) onRun(activeItem.effect);
    }
  };

  return (
    <Dialog
      label={text.label}
      className="command-palette"
      onClose={onClose}
      initialFocus={inputRef}
    >
      <div className="command-palette__search">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="11" cy="11" r="7"></circle>
          <path d="M20 20l-3.5-3.5"></path>
        </svg>
        <label className="sr-only" htmlFor={`${baseId}-input`}>
          {text.input}
        </label>
        <input
          ref={inputRef}
          id={`${baseId}-input`}
          className="command-palette__input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeItem ? optionId(activeItem.id) : undefined
          }
          autoComplete="off"
          spellCheck={false}
          placeholder={text.placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      <div
        id={listId}
        className="command-palette__list"
        role="listbox"
        aria-label={text.results}
      >
        {results.length === 0 && (
          <p className="command-palette__empty">
            {fill(text.empty, { query: query.trim() })}
          </p>
        )}
        {groups.map(({ group, entries }) => (
          <div key={group} role="group" aria-label={text.group[group]}>
            <p className="command-palette__group" aria-hidden="true">
              {text.group[group]}
            </p>
            {entries.map(({ item: it, index }) => (
              <div
                key={it.id}
                id={optionId(it.id)}
                className="command-palette__option"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => {
                  if (index !== activeIndex) setActive(index);
                }}
                onClick={() => onRun(it.effect)}
              >
                <span className="command-palette__label">{it.label}</span>
                <span className="command-palette__hint">{it.hint}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="command-palette__footer">
        <span aria-hidden="true">{text.keys.move}</span>
        <span aria-hidden="true">{text.keys.run}</span>
        <span aria-hidden="true">{text.keys.close}</span>
        <p className="sr-only" role="status">
          {fill(text.count, { count: String(results.length) })}
        </p>
        <button
          type="button"
          className="command-palette__close"
          onClick={onClose}
        >
          {text.close}
        </button>
      </div>
    </Dialog>
  );
}
