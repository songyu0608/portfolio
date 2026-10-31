// 경력 타임라인. 최신이 위이고, 모든 항목을 펼쳐 보인다(정보를 숨기는 효과 금지).
// 왼쪽 세로선과 점은 CSS 장식이라 접근성 트리에 나오지 않는다. 현재 재직 항목은 점을 채운다.
// 스크롤 강조(컨셉 5, T09)는 CSS 스크롤 기반 애니메이션으로 선·점 색만 바꾼다. 글자는 바꾸지 않으며,
// 미지원 브라우저·reduced-motion에서는 이 화면이 그대로 최종 상태다.
import { cx } from '../lib/cx';
import type { CareerEntry } from '../lib/content';
import styles from './CareerTimeline.module.css';

interface Props {
  entries: CareerEntry[];
}

export default function CareerTimeline({ entries }: Props) {
  return (
    <ol className={styles.timeline}>
      {entries.map((entry) => (
        <li
          key={entry.slug}
          className={cx(styles.item, entry.current && styles.current)}
        >
          <p className={styles.period}>{entry.period}</p>
          <div>
            <h3>{entry.company}</h3>
            <p className={styles.role}>{entry.role}</p>
            <ul className={styles.highlights}>
              {entry.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}
