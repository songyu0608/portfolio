// About(経歴): 페이지 머리 → 職歴 → 技術スタック → 資格. 배치 규칙은 docs/DESIGN.md §6.
// 콘텐츠 값은 About 레이아웃(src/layouts/AboutLayout.astro)이 조회해 넘기고, UI 문구는 src/i18n/ui.ts에서 가져온다.
import { ui, type Locale } from '../../i18n/ui';
import { cx } from '../../lib/cx';
import type { AboutContent } from '../../lib/content';
import CareerTimeline from '../CareerTimeline';
import CertificationList from '../CertificationList';
import SkillStack from '../SkillStack';
import styles from './AboutPage.module.css';

interface Props extends AboutContent {
  locale: Locale;
}

export default function AboutPage({
  locale,
  profile,
  career,
  skillCategories,
  certifications,
}: Props) {
  const text = ui[locale].about;
  // 이력서 PDF는 파일이 있을 때만 콘텐츠에 쓴다. 없으면 링크 영역을 출력하지 않는다.
  const resumes = profile.resumes ?? [];
  return (
    <div className="container">
      <section className={styles.intro} aria-labelledby="about-title">
        <h1 id="about-title">{ui[locale].pages.about.name}</h1>
        <p className={styles.profile}>
          <span className={styles.name}>{profile.name}</span>{' '}
          <span className={styles.role}>{profile.role}</span>
        </p>
        {resumes.length > 0 && (
          <ul className={styles.resumes}>
            {resumes.map((resume, index) => (
              <li key={resume.file}>
                <a
                  className={cx('button', index === 0 && 'button--primary')}
                  href={resume.file}
                  type="application/pdf"
                >
                  <svg
                    className={styles.icon}
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
                  </svg>
                  {resume.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section} aria-labelledby="about-career-title">
        <h2 id="about-career-title">{text.career.title}</h2>
        <div className={styles.body}>
          <CareerTimeline entries={career} />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="about-skills-title">
        <h2 id="about-skills-title">{text.skills.title}</h2>
        <p className={styles.description}>{ui[locale].skill.legend}</p>
        <div className={styles.body}>
          <SkillStack locale={locale} categories={skillCategories} />
        </div>
      </section>

      {certifications.length > 0 && (
        <section className={styles.section} aria-labelledby="about-certs-title">
          <h2 id="about-certs-title">{text.certifications.title}</h2>
          <div className={styles.body}>
            <CertificationList
              locale={locale}
              certifications={certifications}
            />
          </div>
        </section>
      )}
    </div>
  );
}
