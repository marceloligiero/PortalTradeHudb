import { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { useSidebarCollapsed } from '../PortalLayout';
import {
  NAV_LINK_BASE, NAV_LINK_ACTIVE, NAV_LINK_INACTIVE,
  NAV_LINK_COLLAPSED_BASE, ICON_CLS,
} from './sidebar.tokens';
import SidebarTooltip from './SidebarTooltip';
import SidebarBadge from './SidebarBadge';

interface SidebarLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
  badge?: number;
  onClick?: () => void;
}

export default function SidebarLink({
  to, icon: Icon, label, end, badge, onClick,
}: SidebarLinkProps) {
  const collapsed = useSidebarCollapsed();
  const [hovered, setHovered] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* ── Collapsed: icon-only with portal tooltip ── */
  if (collapsed) {
    return (
      <div
        ref={wrapperRef}
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <NavLink
          to={to}
          end={end}
          onClick={onClick}
          aria-label={label}
          className={({ isActive }) =>
            cn(NAV_LINK_COLLAPSED_BASE, isActive ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE)
          }
        >
          <Icon className={ICON_CLS} aria-hidden="true" />
          {/* Dot badge in collapsed mode */}
          {badge != null && badge > 0 && (
            <span
              aria-label={`${badge} notificações`}
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#EC0000] ring-2 ring-white dark:ring-[#0D0D0F] animate-pulse"
            />
          )}
        </NavLink>
        <SidebarTooltip label={label} anchorRef={wrapperRef} visible={hovered} />
      </div>
    );
  }

  /* ── Expanded: icon + label + optional badge ── */
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(NAV_LINK_BASE, isActive ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE)
      }
    >
      <Icon className={ICON_CLS} aria-hidden="true" />
      <span className="flex-1 truncate">{label}</span>
      {badge != null && badge > 0 && <SidebarBadge count={badge} />}
    </NavLink>
  );
}
