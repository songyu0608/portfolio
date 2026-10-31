// Home: 히어로 → 핵심 기술 → 대표 프로젝트. 배치 규칙은 docs/DESIGN.md §5.
// 콘텐츠 값은 Home 레이아웃(src/layouts/HomeLayout.astro)이 조회해 넘기고, UI 문구는 src/i18n/ui.ts에서 가져온다.
// 한 줄 소개의 디코딩(src/scripts/hero-decode.ts)은 data-decode로 대상을 찾는다.
import { localizePath } from '../../i18n/paths';
import { ui, type Locale } from '../../i18n/ui';
import { cx } from '../../lib/cx';
import type { HomeContent } from '../../lib/content';
import Phrases from '../Phrases';
import ProjectCard from '../ProjectCard';
import SkillTag from '../SkillTag';
import styles from './HomePage.module.css';

interface Props extends HomeContent {
  locale: Locale;
}

export default function HomePage({ locale, profile, skills, projects }: Props) {
  const text = ui[locale].home;
  const projectsHref = localizePath(locale, 'projects');
  const contactHref = localizePath(locale, 'contact');
  return (
    <div className="container">
      <section className={styles.hero} aria-labelledby="home-title">
        <h1 id="home-title">{profile.name}</h1>
        <p className={styles.role}>{profile.role}</p>
        <p className={styles.tagline} data-decode>
          <Phrases text={profile.tagline} />
        </p>
        <div className={styles.actions}>
          <a className="button button--primary" href={projectsHref}>
            {text.actions.projects}
          </a>
          <a className="button" href={contactHref}>
            {text.actions.contact}
          </a>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="home-skills-title">
        <h2 id="home-skills-title">{text.skills.title}</h2>
        <p className={styles.description}>{ui[locale].skill.legend}</p>
        <ul className={cx('tag-list', styles.body)}>
          {skills.map((skill) => (
            <li key={skill.name}>
              <SkillTag
                locale={locale}
                name={skill.name}
                primary={skill.primary}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="home-projects-title">
        <h2 id="home-projects-title">{ui[locale].project.featured}</h2>
        <ul
          className={cx('project-grid', styles.body)}
          data-count={projects.length}
        >
          {projects.map((project) => (
            <li key={project.slug}>
              <ProjectCard locale={locale} project={project} />
            </li>
          ))}
        </ul>
        <a className={styles.more} href={projectsHref}>
          {text.projects.all}
          <span aria-hidden="true">→</span>
        </a>
      </section>
    </div>
  );
}
