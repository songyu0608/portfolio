// 사이트 헤더: 사이트 이름(Home 링크) → 주 내비게이션 → 도구(명령 팔레트·언어 전환·테마). docs/DESIGN.md §4.
// 테마 버튼 처리와 명령 팔레트 런처는 BaseLayout이 넣는 헤더 스크립트(src/scripts/site-header.ts)가 맡는다.
import { localizePath, type PageKey } from '../i18n/paths';
import { ui, type Locale } from '../i18n/ui';
import { cx } from '../lib/cx';
import CommandButton from './CommandButton';
import LanguageSwitch from './LanguageSwitch';
import ThemeToggle from './ThemeToggle';
import styles from './SiteHeader.module.css';

interface Props {
  locale: Locale;
  /** 지금 페이지의 경로(Astro.url.pathname). 현재 위치 표시와 언어 전환 URL에 쓴다. */
  pathname: string;
}

const navPages = ['about', 'projects', 'contact'] as const satisfies PageKey[];

export default function SiteHeader({ locale, pathname }: Props) {
  const text = ui[locale];
  const homeHref = localizePath(locale, 'home');

  // 그 페이지 자체면 'page', 하위 경로(예: 프로젝트 상세)면 'true'로 현재 위치를 표시한다.
  // Home은 내비게이션 항목이 없으므로 사이트 이름 링크에 'page'를 붙인다.
  const navItems = navPages.map((page) => {
    const href = localizePath(locale, page);
    const current: 'page' | 'true' | undefined =
      pathname === href
        ? 'page'
        : pathname.startsWith(href)
          ? 'true'
          : undefined;
    return { href, label: text.pages[page].name, current };
  });

  return (
    <header className={styles.root}>
      <div className={cx(styles.inner, 'container')}>
        <a
          className={styles.name}
          href={homeHref}
          aria-current={pathname === homeHref ? 'page' : undefined}
        >
          {text.site.name}
        </a>
        <nav className={styles.nav} aria-label={text.nav.label}>
          <ul>
            {navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href} aria-current={item.current}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.tools}>
          <CommandButton locale={locale} pathname={pathname} />
          <LanguageSwitch locale={locale} pathname={pathname} />
          <ThemeToggle locale={locale} />
        </div>
      </div>
    </header>
  );
}
