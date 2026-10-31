// Projects 목록: 페이지 머리 → 代表プロジェクト → その他のプロジェクト. 배치 규칙은 docs/DESIGN.md §7.
// 콘텐츠 값은 Projects 레이아웃(src/layouts/ProjectsLayout.astro)이 조회해 넘기고, UI 문구는 src/i18n/ui.ts에서 가져온다.
import { ui, type Locale } from '../../i18n/ui';
import { cx } from '../../lib/cx';
import type { ProjectsContent } from '../../lib/content';
import ProjectCard from '../ProjectCard';
import styles from './ProjectsPage.module.css';

interface Props extends ProjectsContent {
  locale: Locale;
}

export default function ProjectsPage({ locale, featured, others }: Props) {
  const text = ui[locale];
  return (
    <div className="container">
      <section className={styles.intro} aria-labelledby="projects-title">
        <h1 id="projects-title">{text.pages.projects.name}</h1>
        <p className={styles.introText}>{text.projects.intro}</p>
      </section>

      <section
        className={styles.section}
        aria-labelledby="projects-featured-title"
      >
        <h2 id="projects-featured-title">{text.project.featured}</h2>
        <ul
          className={cx('project-grid', styles.body)}
          data-count={featured.length}
        >
          {featured.map((project) => (
            <li key={project.slug}>
              <ProjectCard locale={locale} project={project} />
            </li>
          ))}
        </ul>
      </section>

      {others.length > 0 && (
        <section
          className={styles.section}
          aria-labelledby="projects-others-title"
        >
          <h2 id="projects-others-title">{text.projects.others}</h2>
          <ul className={cx('project-grid', styles.body)}>
            {others.map((project) => (
              <li key={project.slug}>
                <ProjectCard
                  locale={locale}
                  project={project}
                  variant="compact"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
