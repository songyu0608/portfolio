// 헤더 스크립트(모든 페이지, BaseLayout.astro가 넣는다). 헤더 도구의 스크립트를 한 모듈로 둔다.
// 명령 팔레트 UI(열 때 동적 import)가 theme.ts를 이 모듈에서 함께 가져다 쓰므로, 페이지가 받는 JS 파일이
// 이 모듈 하나로 끝난다(docs/ARCHITECTURE.md §2).
import { getTheme, onThemeChange, toggleTheme } from './theme';
import './command-launcher';

// 테마 버튼(src/components/ThemeToggle.tsx): 클릭으로 전환하고 aria-pressed를 적용 테마에 맞춘다.
const buttons = document.querySelectorAll<HTMLButtonElement>(
  '[data-theme-toggle]',
);
const sync = () => {
  const pressed = String(getTheme() === 'dark');
  buttons.forEach((button) => button.setAttribute('aria-pressed', pressed));
};

buttons.forEach((button) => button.addEventListener('click', toggleTheme));
onThemeChange(sync);
sync();
