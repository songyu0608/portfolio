// 명령 팔레트(컨셉 4)와 터미널(컨셉 3)이 함께 쓰는 명령 정의. 규칙은 docs/DESIGN.md "명령 팔레트·터미널".
// 팔레트 항목과 터미널 명령은 모두 이 파일에서 만든다. React와 서버 전용 모듈(astro:*)을 import하지 않는다.
// 데이터(CommandData)는 빌드 시 src/lib/content.ts의 getCommandData가 /<locale>/commands.json으로 만든다.
import type { UiText } from '../../i18n/ui';

export type CommandText = UiText['command'];
export type PageId = 'home' | 'about' | 'projects' | 'contact';
export type ThemeChoice = 'light' | 'dark' | 'system';

export const PAGE_IDS: readonly PageId[] = [
  'home',
  'about',
  'projects',
  'contact',
];
export const THEME_CHOICES: readonly ThemeChoice[] = [
  'light',
  'dark',
  'system',
];

/** /<locale>/commands.json의 내용. 값은 페이지와 같은 콘텐츠(임시 표식 포함)다. */
export interface CommandData {
  locale: string;
  siteName: string;
  text: CommandText;
  /** 메일 복사 결과 문구(Contact 페이지와 같은 값) */
  copy: { name: string; done: string; failed: string };
  pages: { id: PageId; name: string; href: string }[];
  /** 목록 표시 순서 */
  projects: { slug: string; title: string; href: string }[];
  /** 다른 언어. 이동할 URL은 페이지마다 다르므로 헤더 버튼의 data-alternate에서 받는다. */
  alternate: { locale: string; name: string };
  profile: { name: string; role: string; tagline: string };
  skills: { name: string; items: { name: string; primary: boolean }[] }[];
  contact: {
    email: { label: string; address: string };
    links: { label: string; url: string; display: string }[];
  };
  resumes: { label: string; href: string }[];
}

/** 실행할 때마다 달라지는 값. */
export interface CommandContext {
  /** 같은 페이지의 다른 언어 URL */
  alternateHref: string;
  /** 저장된 테마 선택. 저장 값이 없으면 'system' */
  theme: ThemeChoice;
  /** 클립보드에 쓸 수 있는지 */
  canCopy: boolean;
}

export type Effect =
  | { type: 'navigate'; href: string }
  | { type: 'theme'; theme: ThemeChoice }
  | { type: 'copy'; text: string }
  | { type: 'terminal' }
  | { type: 'clear' }
  | { type: 'close' };

export type PaletteGroup = 'pages' | 'projects' | 'actions';

export interface PaletteItem {
  id: string;
  group: PaletteGroup;
  label: string;
  hint: string;
  /** 검색 대상(소문자). 표시 이름, 힌트, 터미널 명령 이름 */
  search: string;
  effect: Effect;
}

/** '{name}' 형식의 자리를 값으로 바꾼다. */
export const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

const item = (
  id: string,
  group: PaletteGroup,
  label: string,
  hint: string,
  effect: Effect,
  terms: string[] = [],
): PaletteItem => ({
  id,
  group,
  label,
  hint,
  effect,
  search: [label, hint, ...terms].join(' ').toLowerCase(),
});

/** 팔레트 항목. 묶음 순서(ページ → プロジェクト → 操作)대로 돌려준다. */
export function paletteItems(
  data: CommandData,
  ctx: CommandContext,
): PaletteItem[] {
  const { text } = data;
  const items: PaletteItem[] = [];

  for (const page of data.pages) {
    items.push(
      item(
        `page-${page.id}`,
        'pages',
        page.name,
        page.href,
        { type: 'navigate', href: page.href },
        [`open ${page.id}`],
      ),
    );
  }
  for (const project of data.projects) {
    items.push(
      item(
        `project-${project.slug}`,
        'projects',
        project.title,
        project.href,
        { type: 'navigate', href: project.href },
        [project.slug],
      ),
    );
  }

  const { alternate } = data;
  items.push(
    item(
      'lang',
      'actions',
      fill(text.palette.lang, { language: alternate.name }),
      `lang ${alternate.locale}`,
      { type: 'navigate', href: ctx.alternateHref },
    ),
  );
  for (const theme of THEME_CHOICES) {
    const hint = `theme ${theme}`;
    items.push(
      item(
        `theme-${theme}`,
        'actions',
        text.palette.theme[theme],
        ctx.theme === theme ? `${hint} · ${text.palette.current}` : hint,
        { type: 'theme', theme },
      ),
    );
  }
  if (ctx.canCopy) {
    items.push(
      item(
        'copy-email',
        'actions',
        data.copy.name,
        data.contact.email.address,
        { type: 'copy', text: data.contact.email.address },
        ['copy', 'mail'],
      ),
    );
  }
  data.resumes.forEach((resume, index) => {
    items.push(
      item(
        `resume-${index}`,
        'actions',
        resume.label,
        resume.href,
        { type: 'navigate', href: resume.href },
        ['pdf'],
      ),
    );
  });
  items.push(
    item(
      'terminal',
      'actions',
      text.palette.terminal,
      '>_',
      { type: 'terminal' },
      ['terminal'],
    ),
  );
  return items;
}

/** 입력을 공백으로 나눈 모든 단어가 검색 대상에 들어 있는 항목만 남긴다. */
export function filterItems(items: PaletteItem[], query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((it) => words.every((word) => it.search.includes(word)));
}

/** 터미널 출력 한 줄의 조각. 링크는 실제 <a>로 그린다. */
export type LinePart = string | { text: string; href: string };
export type LineKind = 'input' | 'output' | 'muted' | 'error';
export interface Line {
  kind: LineKind;
  parts: LinePart[];
}

export interface TerminalResult {
  lines: Line[];
  effect?: Effect;
}

/** 추천 명령 버튼 */
export const SUGGESTED_COMMANDS = [
  'help',
  'whoami',
  'skills',
  'projects',
  'contact',
  'clear',
] as const;

const line = (kind: LineKind, ...parts: LinePart[]): Line => ({ kind, parts });

/** 터미널을 처음 열 때의 출력 */
export function welcomeLines(data: CommandData): Line[] {
  return [
    line('output', fill(data.text.terminal.welcome, { name: data.siteName })),
    line('muted', data.text.terminal.hint),
  ];
}

/** 이동 안내. 이동이 늦거나 막혀도 누를 수 있게 목적지를 링크로 둔다. */
const navigateLine = (data: CommandData, href: string) =>
  line('muted', `${data.text.terminal.navigate} `, { text: href, href });

const HELP_COLUMN = 27;

/** 터미널 명령. 이름은 두 언어 공통 영어이고, 인자는 소문자로 비교한다. */
const TERMINAL_COMMANDS: Record<
  string,
  {
    usage: string;
    run: (
      args: string[],
      data: CommandData,
      ctx: CommandContext,
    ) => TerminalResult;
  }
> = {
  help: {
    usage: 'help',
    run: (_args, data) => {
      const { help } = data.text.terminal;
      const entries = Object.entries(TERMINAL_COMMANDS);
      // 설명 열은 `theme <light|dark|system>` 뒤에 맞춘다. 더 긴 사용법(open)만 두 칸 띄운다.
      const rows = entries.map(([name, { usage }]) => {
        const description = help[name as keyof typeof help];
        const pad = Math.max(HELP_COLUMN, usage.length + 2);
        return line('output', `  ${usage.padEnd(pad)}${description}`);
      });
      return { lines: [line('output', help.title), ...rows] };
    },
  },
  whoami: {
    usage: 'whoami',
    run: (_args, { profile }) => ({
      lines: [
        line('output', `${profile.name} — ${profile.role}`),
        line('muted', profile.tagline),
      ],
    }),
  },
  skills: {
    usage: 'skills',
    run: (_args, data) => ({
      lines: [
        ...data.skills.map((category) =>
          line(
            'output',
            `${category.name}: ${category.items
              .map((skill) => (skill.primary ? `${skill.name}*` : skill.name))
              .join(', ')}`,
          ),
        ),
        line('muted', data.text.terminal.primary),
      ],
    }),
  },
  projects: {
    usage: 'projects',
    run: (_args, data) => ({
      lines: data.projects.map((project, index) =>
        line('output', `${index + 1}. `, {
          text: project.title,
          href: project.href,
        }),
      ),
    }),
  },
  contact: {
    usage: 'contact',
    run: (_args, { contact }) => ({
      lines: [
        line('output', `${contact.email.label}: `, {
          text: contact.email.address,
          href: `mailto:${contact.email.address}`,
        }),
        ...contact.links.map((link) =>
          line('output', `${link.label}: `, {
            text: link.display,
            href: link.url,
          }),
        ),
      ],
    }),
  },
  open: {
    usage: `open <${PAGE_IDS.join('|')}>`,
    run: ([target], data) => {
      const page = data.pages.find((p) => p.id === target);
      if (!page) return usageError(data, 'open');
      return {
        lines: [navigateLine(data, page.href)],
        effect: { type: 'navigate', href: page.href },
      };
    },
  },
  lang: {
    usage: 'lang <ja|en>',
    run: ([target], data, ctx) => {
      if (target === data.locale) {
        return { lines: [line('muted', data.text.terminal.sameLanguage)] };
      }
      if (target !== data.alternate.locale) return usageError(data, 'lang');
      return {
        lines: [navigateLine(data, ctx.alternateHref)],
        effect: { type: 'navigate', href: ctx.alternateHref },
      };
    },
  },
  theme: {
    usage: `theme <${THEME_CHOICES.join('|')}>`,
    run: ([target], data) => {
      const theme = THEME_CHOICES.find((choice) => choice === target);
      if (!theme) return usageError(data, 'theme');
      return {
        lines: [
          line(
            'muted',
            fill(data.text.terminal.themeDone, {
              theme: data.text.palette.theme[theme],
            }),
          ),
        ],
        effect: { type: 'theme', theme },
      };
    },
  },
  clear: {
    usage: 'clear',
    run: () => ({ lines: [], effect: { type: 'clear' } }),
  },
  exit: {
    usage: 'exit',
    run: () => ({ lines: [], effect: { type: 'close' } }),
  },
};

function usageError(data: CommandData, name: string): TerminalResult {
  const { usage } = TERMINAL_COMMANDS[name];
  return {
    lines: [line('error', fill(data.text.terminal.usage, { usage }))],
  };
}

/** 입력 한 줄을 실행한다. 입력 줄(`$ 명령`)도 결과에 포함한다. 빈 입력이면 null. */
export function runTerminal(
  input: string,
  data: CommandData,
  ctx: CommandContext,
): TerminalResult | null {
  const [name, ...args] = input.trim().toLowerCase().split(/\s+/);
  if (!name) return null;
  const echo = line('input', `$ ${input.trim()}`);
  const command = Object.hasOwn(TERMINAL_COMMANDS, name)
    ? TERMINAL_COMMANDS[name]
    : undefined;
  if (!command) {
    return {
      lines: [
        echo,
        line('error', fill(data.text.terminal.notFound, { command: name })),
      ],
    };
  }
  const result = command.run(args, data, ctx);
  return { ...result, lines: [echo, ...result.lines] };
}
