// 프로젝트 카드. 카드 전체가 상세 페이지 링크다(docs/DESIGN.md §3 컨셉 2, §5 프로젝트 카드).
// 마우스를 쓰면 기울고(src/scripts/card-tilt.ts, 카드를 data-tilt로 찾는다), 제목은 상세 h1과 같은
// view-transition-name으로 이어진다. 틸트 스크립트는 카드를 쓰는 페이지 레이아웃(Home·Projects)이 넣는다.
// 링크는 제목 안의 <a> 하나이고, ::after를 카드 전체로 늘려 어디를 눌러도 상세로 간다.
// 카드 전체를 <a>로 감싸면 링크 이름이 카드 전문이 되어 길어지기 때문이다.
// 정보는 모두 펼쳐 보인다(정보를 숨기는 효과 금지). 정보 순서는 期間 → 担当工程 → 役割 → 成果 → 技術.
// compact는 Projects의 「その他」 카드로, 成果를 빼고 期間·役割 → 担当工程 → 技術 순서다.
import { localizeProjectPath } from '../i18n/paths';
import { ui, type Locale } from '../i18n/ui';
import { cx } from '../lib/cx';
import type { Project } from '../lib/content';
import PhaseList from './PhaseList';
import Phrases from './Phrases';
import SkillTag from './SkillTag';
import styles from './ProjectCard.module.css';

interface Props {
  locale: Locale;
  project: Project;
  variant?: 'full' | 'compact';
}

export default function ProjectCard({
  locale,
  project,
  variant = 'full',
}: Props) {
  const text = ui[locale].project;
  const href = localizeProjectPath(locale, project.slug);
  return (
    <article
      className={cx(
        styles.root,
        'card',
        variant === 'compact' && styles.compact,
      )}
      data-tilt
    >
      <h3 style={{ viewTransitionName: `project-title-${project.slug}` }}>
        <a className={styles.link} href={href}>
          <Phrases text={project.title} />
        </a>
      </h3>
      <p className={styles.summary}>{project.summary}</p>
      <dl className={styles.facts}>
        <div>
          <dt>{text.period}</dt>
          <dd className={styles.period}>{project.period}</dd>
        </div>
        {variant === 'compact' && (
          <div>
            <dt>{text.role}</dt>
            <dd>{project.role}</dd>
          </div>
        )}
        <div className={styles.wide}>
          <dt>{text.phases}</dt>
          <dd>
            <PhaseList locale={locale} phases={project.phases} />
          </dd>
        </div>
        {variant === 'full' && (
          <>
            <div>
              <dt>{text.role}</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>{text.highlights}</dt>
              <dd>
                <ul className={styles.highlights}>
                  {project.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </>
        )}
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
      <p className={styles.more} aria-hidden="true">
        {text.more} →
      </p>
    </article>
  );
}
