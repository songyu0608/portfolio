// 기술 태그. 주력 기술은 채운 태그와 시각적으로 숨긴 「主軸」 텍스트로 구분한다.
// 링크·버튼이 아니므로 클릭 동작이 없다. Home 핵심 기술, 프로젝트 카드, About 기술 스택(T05)이 쓴다.
// 스타일은 전역 클래스 tag·tag--featured(src/styles/global.css)다.
import { ui, type Locale } from '../i18n/ui';
import { cx } from '../lib/cx';

interface Props {
  locale: Locale;
  name: string;
  primary?: boolean;
}

export default function SkillTag({ locale, name, primary = false }: Props) {
  return (
    <span className={cx('tag', primary && 'tag--featured')}>
      {primary && <span className="sr-only">{ui[locale].skill.primary}</span>}
      {name}
    </span>
  );
}
