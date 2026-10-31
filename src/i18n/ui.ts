// 화면 UI 문구(내비게이션, 버튼, 접근성 문구, 페이지 제목·설명).
// 일본어(ja)가 기준 타입이다. 영어(en)에 키가 빠지거나 남으면 `pnpm check`가 실패한다.
// 페이지 본문 콘텐츠(경력, 프로젝트 등)는 여기가 아니라 src/content/에 둔다.

const ja = {
  site: {
    // 헤더·푸터·<title>에 쓰는 사이트 이름. Home 히어로의 이름은 프로필 콘텐츠
    // (src/content/profile/*.yaml의 name)이며 별개 값이다(docs/ARCHITECTURE.md §2).
    name: 'choi',
  },
  skipLink: '本文へ移動',
  nav: {
    label: 'メイン',
  },
  language: {
    label: '言語',
  },
  theme: {
    // 테마 버튼의 접근 가능한 이름. 눌림 상태(aria-pressed)가 다크 모드 여부를 나타낸다.
    label: 'ダークモード',
  },
  pages: {
    about: {
      name: '経歴',
      description: '経歴、技術スタック、資格を掲載しています。',
    },
    projects: {
      name: 'プロジェクト',
      description:
        '担当したプロジェクトの課題・設計・結果と、担当工程をまとめています。',
    },
    contact: {
      name: '連絡先',
      description: 'メール、GitHub などの連絡方法を掲載しています。',
    },
  },
  home: {
    actions: {
      projects: 'プロジェクトを見る',
      contact: '連絡する',
    },
    skills: {
      title: '主な技術',
    },
    projects: {
      all: 'すべてのプロジェクト',
    },
  },
  projects: {
    intro:
      '課題・設計・結果を、担当した工程とあわせてまとめています。カードを選ぶと詳細を表示します。',
    others: 'その他のプロジェクト',
  },
  contact: {
    // 연락 수단 목록의 시각적으로 숨긴 제목
    methods: '連絡方法',
    // 서비스 이름. Contact의 라벨과 푸터 링크가 함께 쓴다. id는 src/content.config.ts의 CONTACT_LINKS.
    method: {
      email: 'メール',
      github: 'GitHub',
      linkedin: 'LinkedIn',
    },
    // 임시 값(placeholder: true) 뒤에 붙는 표식(docs/CONTENT.md "임시 문구 규칙")
    placeholder: '（仮）',
    copy: {
      label: 'コピー',
      // 버튼의 접근 가능한 이름. 보이는 문구(label)를 포함해야 한다.
      name: 'メールアドレスをコピー',
      done: 'コピーしました',
      failed: 'コピーできませんでした',
    },
  },
  footer: {
    // 푸터 연락 링크 목록의 접근 가능한 이름
    contact: '連絡先',
  },
  about: {
    career: {
      title: '職歴',
    },
    skills: {
      title: '技術スタック',
    },
    certifications: {
      title: '資格',
      // 학습 중 행의 왼쪽 라벨과 이름 문형. {name}에 자격증 이름(콘텐츠)이 들어간다.
      studying: '学習中',
      studyingName: '{name} 取得に向けて学習中',
    },
  },
  skill: {
    // 주력 기술 태그 앞에 붙는 시각적으로 숨긴 텍스트. 색만으로 의미를 전하지 않기 위함.
    primary: '主軸：',
    // 주력 기술 범례. Home 핵심 기술과 About 기술 스택이 함께 쓴다.
    legend: '塗りつぶしたタグは主軸の技術です。',
  },
  project: {
    // 대표 프로젝트. Home·Projects의 섹션 제목과 상세의 표시가 함께 쓴다.
    featured: '代表プロジェクト',
    period: '期間',
    role: '役割',
    highlights: '成果',
    tech: '技術',
    phases: '担当工程',
    team: 'チーム',
    // 카드 아래 끝의 시각적 안내. 제목 링크와 같은 곳이므로 스크린 리더에는 읽히지 않는다.
    more: '詳細を見る',
    // 担当工程 이름. 표시 순서는 src/content.config.ts의 PHASES.
    phase: {
      requirements: '要件定義',
      design: '設計',
      development: '開発',
      testing: 'テスト',
      operation: '運用',
    },
    // 担当工程 칸마다 붙는 시각적으로 숨긴 상태 텍스트. 색·모양만으로 의미를 전하지 않기 위함.
    phaseState: {
      on: '（担当）',
      off: '（担当外）',
    },
    detail: {
      back: 'プロジェクト一覧',
      // 상세 본문 4절 제목. 「設計」는 担当工程 이름과 같은 낱말이지만 따로 바꿀 수 있게 다른 키로 둔다.
      challenge: '課題',
      design: '設計',
      result: '結果',
      tech: '技術',
      pager: 'ほかのプロジェクト',
      prev: '前のプロジェクト',
      next: '次のプロジェクト',
    },
  },
  // 명령 팔레트·터미널(T10). 터미널 명령 이름(help 등)은 두 언어 공통 영어이므로 여기에 두지 않는다.
  // {name} 형식의 자리는 src/components/interactive/commands.ts의 fill이 채운다.
  command: {
    // 헤더 버튼의 접근 가능한 이름
    open: 'コマンドパレットを開く',
    palette: {
      label: 'コマンドパレット',
      input: 'ページや操作を検索',
      placeholder: 'ページや操作を検索…',
      results: '候補',
      group: {
        pages: 'ページ',
        projects: 'プロジェクト',
        actions: '操作',
      },
      // 내비게이션에 없는 Home의 이름
      home: 'ホーム',
      empty: '「{query}」に一致する項目はありません',
      count: '{count} 件',
      // 적용 중인 테마 항목의 힌트에 붙는다
      current: '適用中',
      lang: '{language} に切り替え',
      theme: {
        light: 'ライトモード',
        dark: 'ダークモード',
        system: 'システム設定に合わせる',
      },
      terminal: 'ターミナルを開く',
      keys: {
        move: '↑↓ 選択',
        run: 'Enter 実行',
        close: 'Esc 閉じる',
      },
      close: '閉じる',
    },
    terminal: {
      label: 'ターミナル',
      close: 'ターミナルを閉じる',
      input: 'コマンド',
      output: '出力',
      suggest: '試す:',
      welcome: '{name} のポートフォリオへようこそ。',
      hint: '「help」と入力するか、下のボタンを押してください。',
      notFound: 'command not found: {command}（「help」で一覧）',
      usage: '使い方: {usage}',
      navigate: '移動します: {href}',
      sameLanguage: 'すでにこの言語のページです。',
      themeDone: 'テーマを変更しました: {theme}',
      primary: '* 主軸の技術',
      help: {
        title: '使えるコマンド:',
        help: 'コマンド一覧',
        whoami: '自己紹介',
        skills: '技術スタック',
        projects: 'プロジェクト一覧',
        contact: '連絡先',
        open: 'ページへ移動',
        lang: '言語を切り替え',
        theme: 'テーマを切り替え',
        clear: '画面をクリア',
        exit: 'ターミナルを閉じる',
      },
    },
  },
};

export type UiText = typeof ja;

const en: UiText = {
  site: {
    name: 'choi',
  },
  skipLink: 'Skip to main content',
  nav: {
    label: 'Main',
  },
  language: {
    label: 'Language',
  },
  theme: {
    label: 'Dark mode',
  },
  pages: {
    about: {
      name: 'About',
      description: 'Career history, tech stack, and certifications.',
    },
    projects: {
      name: 'Projects',
      description:
        'Projects I have worked on: the challenge, design, results, and the phases I handled.',
    },
    contact: {
      name: 'Contact',
      description: 'Ways to get in touch, including email and GitHub.',
    },
  },
  home: {
    actions: {
      projects: 'View projects',
      contact: 'Get in touch',
    },
    skills: {
      title: 'Core skills',
    },
    projects: {
      all: 'All projects',
    },
  },
  projects: {
    intro:
      'Each project covers the challenge, design, and results, along with the phases I handled. Select a card for details.',
    others: 'Other projects',
  },
  contact: {
    methods: 'Contact methods',
    method: {
      email: 'Email',
      github: 'GitHub',
      linkedin: 'LinkedIn',
    },
    placeholder: ' (placeholder)',
    copy: {
      label: 'Copy',
      name: 'Copy email address',
      done: 'Copied',
      failed: "Couldn't copy",
    },
  },
  footer: {
    contact: 'Contact',
  },
  about: {
    career: {
      title: 'Experience',
    },
    skills: {
      title: 'Tech stack',
    },
    certifications: {
      title: 'Certifications',
      studying: 'Studying',
      studyingName: 'Studying for {name}',
    },
  },
  skill: {
    primary: 'Core: ',
    legend: 'Filled tags mark core technologies.',
  },
  project: {
    featured: 'Featured projects',
    period: 'Period',
    role: 'Role',
    highlights: 'Results',
    tech: 'Tech',
    phases: 'Phases',
    team: 'Team',
    more: 'View details',
    phase: {
      requirements: 'Requirements',
      design: 'Design',
      development: 'Development',
      testing: 'Testing',
      operation: 'Operations',
    },
    phaseState: {
      on: ' (handled)',
      off: ' (not handled)',
    },
    detail: {
      back: 'All projects',
      challenge: 'Challenge',
      design: 'Design',
      result: 'Results',
      tech: 'Tech',
      pager: 'More projects',
      prev: 'Previous project',
      next: 'Next project',
    },
  },
  command: {
    open: 'Open command palette',
    palette: {
      label: 'Command palette',
      input: 'Search pages and actions',
      placeholder: 'Search pages and actions…',
      results: 'Results',
      group: {
        pages: 'Pages',
        projects: 'Projects',
        actions: 'Actions',
      },
      home: 'Home',
      empty: 'No results for "{query}"',
      count: '{count} results',
      current: 'current',
      lang: 'Switch to {language}',
      theme: {
        light: 'Light mode',
        dark: 'Dark mode',
        system: 'Match system setting',
      },
      terminal: 'Open terminal',
      keys: {
        move: '↑↓ Select',
        run: 'Enter Run',
        close: 'Esc Close',
      },
      close: 'Close',
    },
    terminal: {
      label: 'Terminal',
      close: 'Close terminal',
      input: 'Command',
      output: 'Output',
      suggest: 'Try:',
      welcome: "Welcome to {name}'s portfolio.",
      hint: 'Type "help" or press a button below.',
      notFound: 'command not found: {command} (type "help" for a list)',
      usage: 'usage: {usage}',
      navigate: 'Opening {href}',
      sameLanguage: 'You are already on this language.',
      themeDone: 'Theme changed: {theme}',
      primary: '* core technology',
      help: {
        title: 'Available commands:',
        help: 'List commands',
        whoami: 'About me',
        skills: 'Tech stack',
        projects: 'Projects',
        contact: 'Contact',
        open: 'Go to a page',
        lang: 'Switch language',
        theme: 'Change theme',
        clear: 'Clear the screen',
        exit: 'Close the terminal',
      },
    },
  },
};

export const ui = { ja, en };

export type Locale = keyof typeof ui;

export const locales = Object.keys(ui) as Locale[];

// 언어 이름은 어느 언어 페이지에서든 그 언어 자신의 표기로 보여준다.
export const localeNames: Record<Locale, string> = {
  ja: '日本語',
  en: 'English',
};
