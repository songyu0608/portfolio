// 언어 전환. 지금 언어는 링크가 아닌 글자(aria-current), 다른 언어는 같은 페이지의 그 언어 URL로 간다.
import { switchLocalePath } from '../i18n/paths';
import { localeNames, locales, ui, type Locale } from '../i18n/ui';
import styles from './LanguageSwitch.module.css';

interface Props {
  locale: Locale;
  /** 지금 페이지의 경로(Astro.url.pathname) */
  pathname: string;
}

export default function LanguageSwitch({ locale, pathname }: Props) {
  return (
    <nav className={styles.root} aria-label={ui[locale].language.label}>
      <ul>
        {locales.map((code) => (
          <li key={code}>
            {code === locale ? (
              <span aria-current="true" lang={code}>
                {localeNames[code]}
              </span>
            ) : (
              <a
                href={switchLocalePath(pathname, code)}
                lang={code}
                hrefLang={code}
              >
                {localeNames[code]}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
