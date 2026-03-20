import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { TOOLTIP_CLS } from './sidebar.tokens';

interface SidebarTooltipProps {
  label: string;
  anchorRef: RefObject<HTMLElement | null>;
  visible: boolean;
}

export default function SidebarTooltip({ label, anchorRef, visible }: SidebarTooltipProps) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (visible && anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({
        top:  Math.round(r.top + r.height / 2),
        left: Math.round(r.right + 10),
      });
    }
  }, [visible, anchorRef]);

  if (!visible) return null;

  return createPortal(
    <span
      role="tooltip"
      style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translateY(-50%)' }}
      className={`z-[9999] ${TOOLTIP_CLS}`}
    >
      {label}
    </span>,
    document.body,
  );
}
