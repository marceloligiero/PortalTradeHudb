import { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import ChatBot from '../../components/ChatBot';
import Header from '../../components/layout/Header';
import {
  LayoutDashboard,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

function navClass(isActive: boolean) {
  return `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium ${
    isActive
      ? 'bg-[#EC0000] text-white'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
  }`;
}

export default function ChamadosLayout() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('chamados.pageTitle');
    return () => { document.title = 'Portal Formações'; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090B] text-gray-900 dark:text-white transition-colors duration-300">
      <Header />

      <div className="relative flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-[calc(100vh-64px)] sticky top-16">
          <nav className="p-4 space-y-1">
            <NavLink to="/chamados" end className={({ isActive }) => navClass(isActive)}>
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('chamadosSidebar.kanban')}</span>
            </NavLink>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <div className="animate-in fade-in duration-300">
            <Outlet />
          </div>
        </main>
      </div>

      <ChatBot />
    </div>
  );
}
