// 버튼은 JS가 없으면 동작하지 않으므로 html.js일 때만 보인다(BaseLayout 인라인 스크립트가 붙임).
// 아이콘은 적용 중인 테마를 CSS로 따라가고, 클릭 처리와 aria-pressed는 헤더 스크립트
// (src/scripts/site-header.ts, 버튼을 data-theme-toggle로 찾는다)가 맡는다.
import { ui, type Locale } from '../i18n/ui';
import { cx } from '../lib/cx';
import styles from './ThemeToggle.module.css';

interface Props {
  locale: Locale;
}

export default function ThemeToggle({ locale }: Props) {
  return (
    <button
      type="button"
      className={styles.root}
      aria-pressed="false"
      data-theme-toggle
    >
      <svg
        className={cx(styles.icon, styles.iconLight)}
        viewBox="0 0 24 24"
        width="20"
        height="20"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"></path>
      </svg>
      <svg
        className={cx(styles.icon, styles.iconDark)}
        viewBox="0 0 24 24"
        width="20"
        height="20"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"></path>
      </svg>
      <span className="sr-only">{ui[locale].theme.label}</span>
    </button>
  );
}
