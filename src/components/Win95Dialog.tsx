import { useEffect, useRef, type ReactNode } from 'react';
import { closeSvg } from '../icons';

const CLOSE_ICON = { __html: closeSvg() };

type Win95DialogProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** Native <dialog> (focus trap, Esc to close) in a Windows 95 window frame. */
export function Win95Dialog({ title, open, onClose, children }: Win95DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // like Win95: focus the first action, not the caption's close button
      dialog.querySelector<HTMLElement>('.w95-dialog-body button')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="w95-dialog" aria-label={title} onClose={onClose}>
      <div className="w95-titlebar">
        <span>{title}</span>
        {/* not a tab stop, like Win95 caption buttons */}
        <button type="button" className="w95-button w95-titlebar-close" aria-label="Close" tabIndex={-1} onClick={onClose}>
          <span className="w95-close-icon" dangerouslySetInnerHTML={CLOSE_ICON} />
        </button>
      </div>
      <div className="w95-dialog-body">{children}</div>
    </dialog>
  );
}
