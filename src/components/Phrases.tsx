// 한 줄을 넘을 수 있는 제목·소개 문구를 출력한다. 배열이면 일본어를 문절 단위로 나눈 것이다.
// word-break: auto-phrase를 지원하지 않는 Firefox·Safari를 위해 keep-all로 문절 안의 줄바꿈을 막고,
// 문절 끝에 CSS 생성 콘텐츠로 폭 없는 공백(U+200B)을 넣어 문절 사이에서만 줄이 바뀌게 한다.
// inline-block span이나 <wbr>은 Chromium 접근성 트리에서 문절 사이에 공백이 생기고, 본문에 U+200B를
// 직접 넣으면 복사한 글자에 섞이므로 쓰지 않는다(docs/DESIGN.md §2 타이포그래피).
import styles from './Phrases.module.css';

interface Props {
  text: string | string[];
}

export default function Phrases({ text }: Props) {
  if (typeof text === 'string') return <>{text}</>;
  return (
    <span className={styles.phrases}>
      {text.map((phrase, index) => (
        // 같은 문절이 두 번 나올 수 있어 내용은 key가 될 수 없다. 빌드 때 한 번만 그리고 순서가 바뀌지 않으므로 위치를 쓴다.
        // eslint-disable-next-line @eslint-react/no-array-index-key
        <span key={index} className={styles.phrase}>
          {phrase}
        </span>
      ))}
    </span>
  );
}
