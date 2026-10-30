// 테마 읽기·쓰기를 한 곳에 모은다. 헤더의 테마 버튼과 단계 5의 명령 팔레트가 함께 쓴다.
// 첫 렌더 전에 저장 값을 적용하는 일은 BaseLayout.astro의 인라인 스크립트가 맡는다.

export type Theme = 'light' | 'dark';

/**
 * localStorage 저장 키. BaseLayout.astro의 인라인 스크립트도 define:vars로 이 값을 받아 쓴다.
 * 이름을 바꾸면 기존 방문자의 선택이 사라지므로 유지한다.
 */
export const THEME_STORAGE_KEY = 'theme';

const THEME_CHANGE_EVENT = 'themechange';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/** 화면에 적용된 테마. `<html data-theme>`이 없으면 시스템 설정을 따른다. */
export function getTheme(): Theme {
  const value = document.documentElement.dataset.theme;
  if (isTheme(value)) return value;
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // 저장소 접근이 막히면 지금 페이지에만 적용한다.
  }
  document.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
}

export function toggleTheme(): Theme {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

/**
 * setTheme 호출이나 시스템 설정 변경으로 적용 테마가 바뀔 수 있을 때 listener를 부른다.
 * 해제 함수를 돌려준다.
 */
export function onThemeChange(listener: (theme: Theme) => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  const handle = () => listener(getTheme());
  media.addEventListener('change', handle);
  document.addEventListener(THEME_CHANGE_EVENT, handle);
  return () => {
    media.removeEventListener('change', handle);
    document.removeEventListener(THEME_CHANGE_EVENT, handle);
  };
}
