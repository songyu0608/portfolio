// 404 본문(T13). 일본어 안내 뒤에 영어 안내를 함께 보여준다. 배치 규칙은 docs/DESIGN.md §10.
// 페이지는 dist/404.html 하나이며 없는 경로마다 그대로 나가므로 링크는 절대 경로만 쓴다.
// 언어별 404를 두지 않는 이유는 docs/tasks/T13-seo.md 메모.
import { localizePath } from '../../i18n/paths';
import { locales, ui } from '../../i18n/ui';
import { cx } from '../../lib/cx';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <div className="container">
      {locales.map((locale, index) => {
        const text = ui[locale].notFound;
        const titleId = `not-found-title-${locale}`;
        // 페이지 언어(ja) 안내가 h1, 다른 언어 안내는 h2다.
        const Heading = index === 0 ? 'h1' : 'h2';
        return (
          <section
            key={locale}
            lang={locale}
            className={styles.section}
            aria-labelledby={titleId}
          >
            <Heading id={titleId} className={styles.title}>
              {text.title}
            </Heading>
            <p className={styles.description}>{text.description}</p>
            <p className={styles.action}>
              <a
                className={cx('button', index === 0 && 'button--primary')}
                href={localizePath(locale, 'home')}
              >
                {text.home}
              </a>
            </p>
          </section>
        );
      })}
    </div>
  );
}
