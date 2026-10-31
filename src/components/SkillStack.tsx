// 기술 스택 전체(About). 분류 블록 그리드이며 순서는 skills.yaml 배열 순서다(docs/CONTENT.md "기술 스택 표기 규칙").
// 영어가 아닌 페이지에서는 분류 이름 옆에 영어 이름을 보조로 붙인다(시안 B).
import type { Locale } from '../i18n/ui';
import { cx } from '../lib/cx';
import type { SkillCategory } from '../lib/content';
import SkillTag from './SkillTag';
import styles from './SkillStack.module.css';

interface Props {
  locale: Locale;
  categories: SkillCategory[];
}

export default function SkillStack({ locale, categories }: Props) {
  return (
    <div className={styles.stack}>
      {categories.map((category) => (
        <div key={category.id} className={styles.category}>
          <h3 className={styles.title}>
            <span>{category.name}</span>
            {locale !== 'en' && (
              <>
                {' '}
                <span className={styles.titleEn} lang="en">
                  {category.nameEn}
                </span>
              </>
            )}
          </h3>
          <ul className={cx('tag-list', styles.tags)}>
            {category.skills.map((skill) => (
              <li key={skill.name}>
                <SkillTag
                  locale={locale}
                  name={skill.name}
                  primary={skill.primary}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
