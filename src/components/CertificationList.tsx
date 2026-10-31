// 자격증 목록. 시안 A「シンプルリスト」(docs/CONTENT.md "자격증 표기 규칙"): 왼쪽 취득 연월, 오른쪽 이름.
// 학습 중 행은 왼쪽에 「学習中」 라벨, 오른쪽에 UI 문구 템플릿으로 만든 「〇〇 取得に向けて学習中」을 둔다.
import { ui, type Locale } from '../i18n/ui';
import type { LocalizedCertification } from '../lib/content';
import styles from './CertificationList.module.css';

interface Props {
  locale: Locale;
  certifications: LocalizedCertification[];
}

export default function CertificationList({ locale, certifications }: Props) {
  const text = ui[locale].about.certifications;
  return (
    <dl className={styles.certifications}>
      {certifications.map((certification) =>
        certification.status === 'studying' ? (
          <div key={certification.name} className={styles.row}>
            <dt className={styles.studying}>{text.studying}</dt>
            <dd>{text.studyingName.replace('{name}', certification.name)}</dd>
          </div>
        ) : (
          <div key={certification.name} className={styles.row}>
            <dt className={styles.date}>{certification.acquired}</dt>
            <dd>{certification.name}</dd>
          </div>
        ),
      )}
    </dl>
  );
}
