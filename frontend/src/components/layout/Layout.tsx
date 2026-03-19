import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';
import ChatBot from '../ChatBot';
import { useAuthStore } from '../../stores/authStore';

export default function Layout() {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    document.title = 'Portal Formações';
  }, []);

  return (
    <div className="min-h-screen transition-colors duration-300 print:bg-white bg-gray-50 dark:bg-[#09090B] text-gray-900 dark:text-white">
      <Header />

      <div className="relative z-10 flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full print:p-0 print:max-w-none">
          {user?.is_pending && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm font-body text-amber-600 dark:text-amber-400">
                {t('auth.pendingApprovalBanner')}
              </p>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      <ChatBot />
    </div>
  );
}
