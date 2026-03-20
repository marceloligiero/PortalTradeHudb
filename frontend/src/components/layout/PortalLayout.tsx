import { useEffect, type ReactNode, createContext, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import Header from './Header';
import ChatBot from '../ChatBot';
import { SidebarShell, MobileSidebarOverlay, LAYOUT_SHELL, MAIN_CONTENT } from './sidebar/index';
import { useSidebarStore } from '../../stores/sidebarStore';
import { useAuthStore } from '../../stores/authStore';

/* ── Context so SidebarLink/SidebarSection auto-read collapsed ── */

const SidebarCollapsedCtx = createContext(false);
export const useSidebarCollapsed = () => useContext(SidebarCollapsedCtx);

/* ── PortalLayout ── */

interface PortalLayoutProps {
  title: string;
  fallbackTitle?: string;
  sidebarContent: ReactNode;
  guard?: () => boolean;
  animateOnRouteChange?: boolean;
  showPendingBanner?: boolean;
}

export default function PortalLayout({
  title,
  fallbackTitle = 'Portal Formações',
  sidebarContent,
  guard,
  animateOnRouteChange,
  showPendingBanner,
}: PortalLayoutProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const location = useLocation();
  const { collapsed, closeMobile } = useSidebarStore();

  useEffect(() => {
    document.title = title;
    return () => { document.title = fallbackTitle; };
  }, [title, fallbackTitle]);

  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  if (guard && !guard()) return null;

  return (
    <div className={LAYOUT_SHELL}>
      <Header />

      <div className="relative flex pt-16">
        {/* Desktop */}
        <SidebarCollapsedCtx.Provider value={collapsed}>
          <SidebarShell>
            {sidebarContent}
          </SidebarShell>
        </SidebarCollapsedCtx.Provider>

        {/* Mobile — always expanded */}
        <SidebarCollapsedCtx.Provider value={false}>
          <MobileSidebarOverlay>
            {sidebarContent}
          </MobileSidebarOverlay>
        </SidebarCollapsedCtx.Provider>

        <main className={MAIN_CONTENT}>
          {showPendingBanner && user?.is_pending && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm font-body text-amber-600 dark:text-amber-400">
                {t('auth.pendingApprovalBanner')}
              </p>
            </div>
          )}
          <div
            key={animateOnRouteChange ? location.pathname : undefined}
            className={animateOnRouteChange ? 'animate-in fade-in duration-300' : undefined}
          >
            <Outlet />
          </div>
        </main>
      </div>

      <ChatBot />
    </div>
  );
}
