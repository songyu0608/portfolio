// 화면 UI 문구(내비게이션, 버튼, 접근성 문구, 페이지 제목·설명).
// 일본어(ja)가 기준 타입이다. 영어(en)에 키가 빠지거나 남으면 `pnpm check`가 실패한다.
// 페이지 본문 콘텐츠(경력, 프로젝트 등)는 여기가 아니라 src/content/에 둔다.

const ja = {
  site: {
    // 사이트 이름 표기는 원고 미수집(docs/CONTENT.md). 원고를 받으면 이 값만 바꾼다.
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
    home: {
      description:
        'バックエンドエンジニアのポートフォリオサイトです。現在準備中です。',
    },
    about: {
      name: '経歴',
      description:
        '経歴、技術スタック、資格を掲載するページです。現在準備中です。',
    },
    projects: {
      name: 'プロジェクト',
      description: '担当したプロジェクトを紹介するページです。現在準備中です。',
    },
    contact: {
      name: '連絡先',
      description: '連絡方法を掲載するページです。現在準備中です。',
    },
    comingSoon: 'このページは準備中です。',
  },
  design: {
    eyebrow: 'DESIGN SYSTEM / 02',
    label: '選択した色と書体の確認画面',
    heading: '読みやすさを、設計する。',
    introduction:
      '日本語と英語の情報を、落ち着いた余白と明確なコントラストで届けるためのデザイン見本です。完成したポートフォリオではありません。',
    primaryAction: '文字を見る',
    secondaryAction: '色を見る',
    paletteTitle: 'カラートークン',
    paletteDescription: '背景、情報面、文字、アクセントの関係を確認します。',
    swatchBackground: '背景',
    swatchSurface: '情報面',
    swatchAccent: 'アクセント',
    swatchText: '本文',
    swatchMuted: '補助文字',
    typographyTitle: 'タイポグラフィ',
    typographyDescription:
      '本文は IBM Plex Sans JP、補助ラベルは IBM Plex Mono。',
    typographySample: '大切な情報を、ひと目で。',
    bodySample:
      '余白、文字の大きさ、行間を整え、長い文章でも読み進めやすくします。',
    monoSample: '01 / SYSTEM / SAMPLE',
    componentsTitle: 'コンポーネントの状態',
    componentsDescription:
      'リンク、ボタン、タグ、状態色、カードの基本表現です。',
    textLink: 'テキストリンクを見る',
    defaultTag: '通常のタグ',
    featuredTag: '主軸のタグ',
    featuredExplanation: '塗りつぶしたタグは主軸を示します。',
    featuredA11y: '主軸:',
    success: '成功',
    warning: '注意',
    error: 'エラー',
    cardTitle: 'カードの見本',
    cardBody: '情報は最初から読める状態に保ち、装飾は内容より控えめにします。',
    note: 'これはデザイン確認用の画面です。実際の内容は次の段階でこのページに実装します。',
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
    home: {
      description:
        'Portfolio of a backend engineer. Currently under construction.',
    },
    about: {
      name: 'About',
      description:
        'Career history, tech stack, and certifications. Coming soon.',
    },
    projects: {
      name: 'Projects',
      description: 'Projects I have worked on. Coming soon.',
    },
    contact: {
      name: 'Contact',
      description: 'How to get in touch. Coming soon.',
    },
    comingSoon: 'This page is coming soon.',
  },
  design: {
    eyebrow: 'DESIGN SYSTEM / 02',
    label: 'A preview of the selected colors and type',
    heading: 'Designed for clarity.',
    introduction:
      'This preview explores how Japanese and English content can stay readable through calm spacing and clear contrast. It is not the finished portfolio.',
    primaryAction: 'View type',
    secondaryAction: 'View colors',
    paletteTitle: 'Color tokens',
    paletteDescription:
      'See how the background, surfaces, text, and accent work together.',
    swatchBackground: 'Background',
    swatchSurface: 'Surface',
    swatchAccent: 'Accent',
    swatchText: 'Body text',
    swatchMuted: 'Muted text',
    typographyTitle: 'Typography',
    typographyDescription:
      'IBM Plex Sans JP for body text, IBM Plex Mono for supporting labels.',
    typographySample: 'The important things, at a glance.',
    bodySample:
      'Spacing, type size, and line height make longer passages easy to follow.',
    monoSample: '01 / SYSTEM / SAMPLE',
    componentsTitle: 'Component states',
    componentsDescription:
      'Basic treatments for links, buttons, tags, status colors, and cards.',
    textLink: 'View a text link',
    defaultTag: 'Standard tag',
    featuredTag: 'Core skill tag',
    featuredExplanation: 'A filled tag indicates a core skill.',
    featuredA11y: 'Core skill:',
    success: 'Success',
    warning: 'Caution',
    error: 'Error',
    cardTitle: 'Sample card',
    cardBody:
      'Keep information visible from the start and let decoration stay in the background.',
    note: 'This is a design preview. Real content will replace it on this page in a later stage.',
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
