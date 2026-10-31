// Contact: 페이지 머리 → 연락 수단 목록. 배치 규칙은 docs/DESIGN.md §8.
// 연락처 값은 Contact 레이아웃(src/layouts/ContactLayout.astro)이 조회해 넘기고, UI 문구는 src/i18n/ui.ts에서 가져온다.
// 메일 복사 버튼은 src/scripts/copy-button.ts가 data-copy·data-copy-text·data-copy-status로 찾는다.
// 연락 폼은 단계 8에서 이 목록 아래에 섹션으로 더한다(docs/PLAN.md §4).
import { ui, type Locale } from '../../i18n/ui';
import { cx } from '../../lib/cx';
import type { ContactContent } from '../../lib/content';
import styles from './ContactPage.module.css';

interface Props extends ContactContent {
  locale: Locale;
}

export default function ContactPage({ locale, intro, email, links }: Props) {
  const text = ui[locale].contact;
  return (
    <div className="container">
      <section className={styles.intro} aria-labelledby="contact-title">
        <h1 id="contact-title">{ui[locale].pages.contact.name}</h1>
        <p className={styles.introText}>{intro}</p>
      </section>

      <section
        className={styles.methods}
        aria-labelledby="contact-methods-title"
      >
        <h2 id="contact-methods-title" className="sr-only">
          {text.methods}
        </h2>
        <ul className={styles.list}>
          <li className={styles.item}>
            <span className={styles.label}>{text.method.email}</span>
            <p className={styles.value}>
              <a href={`mailto:${email.address}`}>{email.address}</a>
              {email.placeholder && (
                <span className={styles.placeholder}>{text.placeholder}</span>
              )}
            </p>
            {/*
              JS가 없거나 클립보드를 쓸 수 없으면 hidden 그대로 둔다(스크립트가 켬).
              상태(data-state)에 따라 아이콘이 바뀌고, 결과는 role="status" 영역으로도 알린다.
            */}
            <button
              type="button"
              className={styles.copy}
              hidden
              aria-label={text.copy.name}
              data-copy={email.address}
              data-label={text.copy.label}
              data-done={text.copy.done}
              data-failed={text.copy.failed}
            >
              <svg
                className={cx(styles.icon, styles.iconCopy)}
                viewBox="0 0 24 24"
                width="16"
                height="16"
                aria-hidden="true"
                focusable="false"
              >
                <rect x="9" y="9" width="12" height="12" rx="2"></rect>
                <path d="M5 15V5a2 2 0 0 1 2-2h10"></path>
              </svg>
              <svg
                className={cx(styles.icon, styles.iconDone)}
                viewBox="0 0 24 24"
                width="16"
                height="16"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M5 12.5 10 17.5 19 7"></path>
              </svg>
              <span data-copy-text>{text.copy.label}</span>
            </button>
            <span className="sr-only" role="status" data-copy-status></span>
          </li>
          {links.map((link) => (
            <li key={link.id} className={styles.item}>
              <span className={styles.label}>{text.method[link.id]}</span>
              <p className={styles.value}>
                <a href={link.url}>{link.display}</a>
                {link.placeholder && (
                  <span className={styles.placeholder}>{text.placeholder}</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
