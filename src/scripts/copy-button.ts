// 메일 주소 복사(Contact, docs/DESIGN.md §8). 클립보드 API를 쓸 수 있을 때만 버튼을 보인다(점진적 향상).
// 버튼은 data-copy(복사할 값)·data-label·data-done·data-failed(문구), 안의 글자는 data-copy-text,
// 결과를 읽어 주는 영역은 같은 부모의 data-copy-status로 찾는다(src/components/pages/ContactPage.tsx).
const RESET_MS = 2000;
const buttons = document.querySelectorAll<HTMLButtonElement>('[data-copy]');

if (navigator.clipboard && window.isSecureContext) {
  buttons.forEach((button) => {
    const text = button.querySelector('[data-copy-text]');
    const status = button.parentElement?.querySelector('[data-copy-status]');
    let timer: number | undefined;

    const show = (state: 'idle' | 'done' | 'failed') => {
      const message =
        state === 'idle' ? button.dataset.label : button.dataset[state];
      button.dataset.state = state;
      if (text) text.textContent = message ?? '';
      // 같은 문구를 연달아 알릴 수 있게 비운 뒤 넣는다.
      if (status) status.textContent = state === 'idle' ? '' : (message ?? '');
    };

    button.hidden = false;
    button.addEventListener('click', async () => {
      window.clearTimeout(timer);
      if (status) status.textContent = '';
      try {
        await navigator.clipboard.writeText(button.dataset.copy ?? '');
        show('done');
      } catch {
        show('failed');
      }
      timer = window.setTimeout(() => show('idle'), RESET_MS);
    });
  });
}
