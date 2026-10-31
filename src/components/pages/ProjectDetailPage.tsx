// 프로젝트 상세: 목록으로 돌아가는 링크 → 머리 → 개요 상자 → 課題・設計・結果・技術 → 이전·다음 프로젝트.
// 배치 규칙은 docs/DESIGN.md §7. 콘텐츠 값은 상세 레이아웃(src/layouts/ProjectDetailLayout.astro)이
// getStaticPaths의 props(src/lib/content.ts의 getProjectPages)를 넘기고, UI 문구는 src/i18n/ui.ts에서 가져온다.
import { localizePath, localizeProjectPath } from '../../i18n/paths';
import { ui, type Locale } from '../../i18n/ui';
import { cx } from '../../lib/cx';
import type { ProjectPage } from '../../lib/content';
import PhaseList from '../PhaseList';
import Phrases from '../Phrases';
import SkillTag from '../SkillTag';
import styles from './ProjectDetailPage.module.css';

type Props = ProjectPage & { locale: Locale };

export default function ProjectDetailPage({
  locale,
  project,
  prev,
  next,
}: Props) {
  const text = ui[locale].project;
  const detail = text.detail;
  const sections = [
    { id: 'challenge', title: detail.challenge },
    { id: 'design', title: detail.design },
    { id: 'result', title: detail.result },
    { id: 'tech', title: detail.tech },
  ] as const;
  const pager = [
    { kind: 'prev', label: detail.prev, project: prev },
    { kind: 'next', label: detail.next, project: next },
  ] as const;

  return (
    <div className={cx(styles.root, 'container')}>
      <a className={styles.back} href={localizePath(locale, 'projects')}>
        <span aria-hidden="true">←</span>
        {detail.back}
      </a>

      <header className={styles.head}>
        {project.featuredOrder !== undefined && (
          <p className={styles.badge}>{text.featured}</p>
        )}
        <h1 style={{ viewTransitionName: `project-title-${project.slug}` }}>
          <Phrases text={project.title} />
        </h1>
        <p className={styles.summary}>{project.summary}</p>
      </header>

      <dl className={styles.facts}>
        <div>
          <dt>{text.period}</dt>
          <dd className={styles.period}>{project.period}</dd>
        </div>
        <div>
          <dt>{text.role}</dt>
          <dd>{project.role}</dd>
        </div>
        {project.team && (
          <div>
            <dt>{text.team}</dt>
            <dd>{project.team}</dd>
          </div>
        )}
        <div className={styles.wide}>
          <dt>{text.phases}</dt>
          <dd>
            <PhaseList locale={locale} phases={project.phases} size="detail" />
          </dd>
        </div>
        <div className={styles.wide}>
          <dt>{text.tech}</dt>
          <dd>
            <ul className="tag-list">
              {project.tech.map((name) => (
                <li key={name}>
                  <SkillTag locale={locale} name={name} />
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      <div className={styles.body}>
        {sections.map((section, index) => (
          <section
            key={section.id}
            className={styles.section}
            aria-labelledby={`project-${section.id}-title`}
          >
            <span className={styles.number} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className={styles.content}>
              <h2 id={`project-${section.id}-title`}>{section.title}</h2>
              {(section.id === 'challenge' || section.id === 'design') && (
                <>
                  <p>{project[section.id].body}</p>
                  {project[section.id].points && (
                    <ul className={styles.points}>
                      {project[section.id].points?.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              {section.id === 'result' && (
                <>
                  {project.result.metrics && (
                    <ul className={styles.metrics}>
                      {project.result.metrics.map((metric) => (
                        <li key={metric.label} className={styles.metric}>
                          <span className={styles.metricLabel}>
                            {metric.label}
                          </span>
                          <span className={styles.metricValue}>
                            {metric.value}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {project.result.body && <p>{project.result.body}</p>}
                </>
              )}
              {section.id === 'tech' && (
                <dl className={styles.techDetails}>
                  {project.techDetails.map((item) => (
                    <div key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </section>
        ))}
      </div>

      <nav className={styles.pager} aria-label={detail.pager}>
        {pager.map(
          (item) =>
            item.project && (
              <a
                key={item.kind}
                className={cx(
                  styles.pagerLink,
                  item.kind === 'next' && styles.pagerNext,
                )}
                href={localizeProjectPath(locale, item.project.slug)}
              >
                <span className={styles.pagerLabel}>
                  {item.kind === 'prev' && <span aria-hidden="true">← </span>}
                  {item.label}
                  {item.kind === 'next' && <span aria-hidden="true"> →</span>}
                </span>
                <span className={styles.pagerTitle}>
                  <Phrases text={item.project.title} />
                </span>
              </a>
            ),
        )}
      </nav>
    </div>
  );
}
