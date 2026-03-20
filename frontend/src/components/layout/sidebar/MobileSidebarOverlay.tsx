import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../lib/cn';
import { useSidebarStore } from '../../../stores/sidebarStore';
import { useTheme } from '../../../contexts/ThemeContext';
import { MOBILE_BACKDROP, MOBILE_DRAWER } from './sidebar.tokens';

interface MobileSidebarOverlayProps {
  children: ReactNode;
}

export default function MobileSidebarOverlay({ children }: MobileSidebarOverlayProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { mobileOpen, closeMobile } = useSidebarStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  /* Body scroll lock */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  /* Escape to close */
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen, closeMobile]);

  /* Focus first interactive element when opened */
  useEffect(() => {
    if (mobileOpen && drawerRef.current) {
      const first = drawerRef.current.querySelector<HTMLElement>('a, button');
      first?.focus();
    }
  }, [mobileOpen]);

  return (
    <div className="lg:hidden" aria-hidden={!mobileOpen}>

      {/* ── Backdrop ── */}
      <div
        className={cn(MOBILE_BACKDROP, mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* ── Drawer ── */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal={mobileOpen}
        aria-label={t('sidebar.navigation', 'Navegação')}
        className={cn(MOBILE_DRAWER, mobileOpen ? 'translate-x-0' : '-translate-x-full')}
      >
        {/* Header with logo */}
        <div className="shrink-0 flex items-center justify-between h-14 px-4 border-b border-gray-100 dark:border-white/[0.05]">
          <div className="flex items-center gap-2">
            <img
              src="/logo-sds.png"
              alt="TradeDataHub"
              className="h-6 w-auto"
              style={{ filter: theme === 'dark' ? 'none' : 'brightness(0)' }}
            />
            <span className="font-logo font-bold text-[14px] text-gray-900 dark:text-white tracking-tight">
              TradeDataHub
            </span>
          </div>
          <button
            onClick={closeMobile}
            aria-label={t('sidebar.close', 'Fechar menu')}
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.04] hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav content */}
        <nav
          aria-label={t('sidebar.navigation', 'Navegação')}
          className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5"
        >
          {children}
        </nav>
      </div>
    </div>
  );
}
