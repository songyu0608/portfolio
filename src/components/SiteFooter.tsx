// 연락 링크(src/content/contact.yaml)와 저작권 표기. 배치는 docs/DESIGN.md §4 "본문 바로가기·푸터".
// 640px 미만은 연락 링크가 위, 이상은 왼쪽 저작권·오른쪽 연락 링크(DOM 순서는 연락 링크가 먼저).
// 연락처는 BaseLayout이 조회해 넘긴다.
import { ui, type Locale } from '../i18n/ui';
import { cx } from '../lib/cx';
import type { ContactContent } from '../lib/content';
import styles from './SiteFooter.module.css';

interface Props extends Pick<ContactContent, 'email' | 'links'> {
  locale: Locale;
}

export default function SiteFooter({ locale, email, links }: Props) {
  const text = ui[locale];
  const year = new Date().getFullYear();
  const contactLinks = [
    {
      href: `mailto:${email.address}`,
      label: text.contact.method.email,
      placeholder: email.placeholder,
    },
    ...links.map((link) => ({
      href: link.url,
      label: text.contact.method[link.id],
      placeholder: link.placeholder,
    })),
  ];

  return (
    <footer className={styles.root}>
      <div className={cx(styles.inner, 'container')}>
        <ul className={styles.links} aria-label={text.footer.contact}>
          {contactLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href}>
                {link.label}
                {link.placeholder && text.contact.placeholder}
              </a>
            </li>
          ))}
        </ul>
        <p>
          <small>
            &copy; {year} {text.site.name}
          </small>
        </p>
      </div>
    </footer>
  );
}
