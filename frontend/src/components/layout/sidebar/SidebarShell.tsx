import { useEffect, type ReactNode } from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../lib/cn';
import { useSidebarStore } from '../../../stores/sidebarStore';
import {
  SIDEBAR_SHELL, SIDEBAR_TRANSITION,
  SIDEBAR_W_EXPANDED, SIDEBAR_W_COLLAPSED,
  SIDEBAR_NAV, SIDEBAR_FOOTER,
} from './sidebar.tokens';

interface SidebarShellProps {
  children: ReactNode;
}

export default function SidebarShell({ children }: SidebarShellProps) {
  const { t } = useTranslation();
  const { collapsed, toggleCollapsed } = useSidebarStore();

  /* Keyboard shortcut: Ctrl+B / Cmd+B */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleCollapsed]);

  return (
    <aside
      aria-expanded={!collapsed}
      aria-label={t('sidebar.navigation', 'Navegação')}
      className={cn(
        SIDEBAR_SHELL,
        SIDEBAR_TRANSITION,
        collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED,
        'hidden lg:flex',
      )}
    >
      {/* ── Scrollable nav area ── */}
      <nav className={SIDEBAR_NAV}>
        {children}
      </nav>

      {/* ── Footer: collapse/expand toggle ── */}
      <div className={SIDEBAR_FOOTER}>
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed
            ? t('sidebar.expand',   'Expandir menu')
            : t('sidebar.collapse', 'Recolher menu')
          }
          aria-keyshortcuts="Control+B"
          title={collapsed ? '⌃B — Expandir' : '⌃B — Recolher'}
          className={cn(
            'flex items-center w-full rounded-lg px-2.5 py-2',
            'text-[11px] font-medium text-gray-400 dark:text-gray-600',
            'hover:bg-gray-100 dark:hover:bg-white/[0.04]',
            'hover:text-gray-600 dark:hover:text-gray-400',
            'transition-colors duration-150',
            collapsed ? 'justify-center' : 'gap-2',
          )}
        >
          {collapsed
            ? <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
            : (
              <>
                <ChevronsLeft className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('sidebar.collapse', 'Recolher')}</span>
              </>
            )
          }
        </button>
      </div>
    </aside>
  );
}
