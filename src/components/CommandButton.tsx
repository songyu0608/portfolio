// 명령 팔레트(T10)를 여는 헤더 버튼. ⌘K / Ctrl+K도 같은 동작이다(src/scripts/command-launcher.ts,
// 헤더 스크립트 src/scripts/site-header.ts가 불러온다. 버튼은 data-command-palette로 찾는다).
// JS가 없으면 동작하지 않으므로 테마 버튼처럼 html.js일 때만 보인다.
// 데이터 URL과 같은 페이지의 다른 언어 URL은 빌드 때 계산해 data-*로 넘긴다(클라이언트는 경로 규칙을 모른다).
import { localizePath, switchLocalePath } from '../i18n/paths';
import { locales, ui, type Locale } from '../i18n/ui';
import styles from './CommandButton.module.css';

interface Props {
  locale: Locale;
  /** 지금 페이지의 경로(Astro.url.pathname). 다른 언어 URL을 만드는 데 쓴다. */
  pathname: string;
}

export default function CommandButton({ locale, pathname }: Props) {
  const alternate = locales.find((code) => code !== locale) ?? locale;
  const dataSrc = `${localizePath(locale, 'home')}commands.json`;
  const alternateHref = switchLocalePath(pathname, alternate);
  return (
    <button
      type="button"
      className={styles.root}
      aria-label={ui[locale].command.open}
      aria-keyshortcuts="Meta+K Control+K"
      data-command-palette
      data-src={dataSrc}
      data-alternate={alternateHref}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="11" cy="11" r="7"></circle>
        <path d="M20 20l-3.5-3.5"></path>
      </svg>
    </button>
  );
}
