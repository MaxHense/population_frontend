import { useEffect, useRef } from 'react';

export type MenuItem = { label: string; onSelect: () => void };

type ContextMenuProps = {
  at: { x: number; y: number } | null;
  items: MenuItem[];
  onClose: () => void;
};

/** Win95 context menu. Native popover: closes on outside click and Esc. */
export function ContextMenu({ at, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    if (at && !menu.matches(':popover-open')) {
      menu.showPopover();
      menu.querySelector<HTMLElement>('button')?.focus();
    }
    if (!at && menu.matches(':popover-open')) menu.hidePopover();
  }, [at]);

  return (
    <div
      ref={ref}
      popover="auto"
      role="menu"
      className="w95-menu"
      style={{ left: at?.x ?? 0, top: at?.y ?? 0 }}
      onToggle={(e) => (e as unknown as ToggleEvent).newState === 'closed' && onClose()}
    >
      {items.map((item) => (
        <button key={item.label} type="button" role="menuitem" className="w95-menu-item" onClick={() => { item.onSelect(); onClose(); }}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
