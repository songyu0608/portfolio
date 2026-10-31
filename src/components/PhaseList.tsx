// 担当工程. 다섯 공정을 고정 순서(PHASES)로 모두 보여 주고, 맡은 공정은 채운 칸 + 체크,
// 맡지 않은 공정은 점선 칸으로 구분한다. 색·모양에 더해 칸마다 시각적으로 숨긴 상태 텍스트를 둔다.
// 프로젝트 카드(size="card")와 상세 개요(size="detail")가 쓴다. 배치 규칙은 docs/DESIGN.md §7.
import { PHASES } from '../content.config';
import { ui, type Locale } from '../i18n/ui';
import { cx } from '../lib/cx';
import type { Phase } from '../lib/content';
import styles from './PhaseList.module.css';

interface Props {
  locale: Locale;
  /** 맡은 공정 */
  phases: Phase[];
  size?: 'card' | 'detail';
}

export default function PhaseList({ locale, phases, size = 'card' }: Props) {
  const text = ui[locale].project;
  return (
    <ol className={cx(styles.list, size === 'detail' && styles.detail)}>
      {PHASES.map((phase) => {
        const handled = phases.includes(phase);
        return (
          <li
            key={phase}
            className={cx(styles.phase, handled && styles.handled)}
          >
            {handled && (
              <svg
                className={styles.check}
                viewBox="0 0 12 12"
                width="12"
                height="12"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M2 6.5l2.5 2.5L10 3.5" />
              </svg>
            )}
            {text.phase[phase]}
            <span className="sr-only">
              {handled ? text.phaseState.on : text.phaseState.off}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
