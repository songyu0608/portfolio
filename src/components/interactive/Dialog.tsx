// 팔레트·터미널이 쓰는 모달. <dialog>.showModal()로 포커스 가두기·배경 비활성을 브라우저에 맡긴다.
// 마운트되면 열리고, 언마운트되면 닫힌다. Esc(cancel)와 배경 클릭은 onClose로 알린다.
import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';

interface Props {
  label: string;
  className: string;
  onClose: () => void;
  /** 열린 직후 포커스를 줄 요소 */
  initialFocus: RefObject<HTMLElement | null>;
  children: ReactNode;
}

export default function Dialog({
  label,
  className,
  onClose,
  initialFocus,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    initialFocus.current?.focus();
    return () => dialog.close();
  }, [initialFocus]);

  return (
    <dialog
      ref={ref}
      className={`command-dialog ${className}`}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // 배경(::backdrop)을 누르면 대상이 dialog 자신이다. 안쪽 내용은 .command-dialog__body가 받는다.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="command-dialog__body">{children}</div>
    </dialog>
  );
}
