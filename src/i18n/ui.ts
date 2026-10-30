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
      description: '担当したプロジェクトを紹介するページです。現在準備中です。',
    },
    contact: {
      name: '連絡先',
      description: '連絡方法を掲載するページです。現在準備中です。',
    },
    comingSoon: 'このページは準備中です。',
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
      title: '代表プロジェクト',
      all: 'すべてのプロジェクト',
    },
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
    period: '期間',
    role: '役割',
    highlights: '成果',
    tech: '技術',
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
      description: 'Projects I have worked on. Coming soon.',
    },
    contact: {
      name: 'Contact',
      description: 'How to get in touch. Coming soon.',
    },
    comingSoon: 'This page is coming soon.',
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
      title: 'Featured projects',
      all: 'All projects',
    },
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
    period: 'Period',
    role: 'Role',
    highlights: 'Results',
    tech: 'Tech',
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
