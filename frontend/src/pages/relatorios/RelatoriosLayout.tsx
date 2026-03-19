import { useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import ChatBot from '../../components/ChatBot';
import Header from '../../components/layout/Header';
import {
  LayoutDashboard, GraduationCap, Shield, Users, UserCircle, AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

function navClass(isActive: boolean) {
  return `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium ${
    isActive
      ? 'bg-[#EC0000] text-white'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
  }`;
}

export default function RelatoriosLayout() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const location = useLocation();

  const isAdmin   = user?.role === 'ADMIN' || user?.role === 'GESTOR';
  const isManager = user?.role === 'MANAGER';

  useEffect(() => {
    document.title = 'Portal de Relatórios · Trade Data Hub';
    return () => { document.title = 'Portal Formações'; };
  }, []);

  return (
    <div className="min-h-screen relative transition-colors duration-300 bg-gray-50 dark:bg-[#09090B] text-gray-900 dark:text-white">
      <Header />

      <div className="relative z-10 flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 border-r transition-colors duration-200 min-h-[calc(100vh-64px)] sticky top-16 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <nav className="p-4 space-y-1">
            <NavLink to="/relatorios" end className={({ isActive }) => navClass(isActive)}>
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('relatoriosSidebar.overview')}</span>
            </NavLink>

            <NavLink to="/relatorios/formacoes" className={({ isActive }) => navClass(isActive)}>
              <GraduationCap className="w-4 h-4" />
              <span>{t('relatoriosSidebar.formacoes')}</span>
            </NavLink>

            <NavLink to="/relatorios/tutoria" className={({ isActive }) => navClass(isActive)}>
              <Shield className="w-4 h-4" />
              <span>{t('relatoriosSidebar.tutoria')}</span>
            </NavLink>

            {isAdmin && (
              <NavLink to="/relatorios/teams" className={({ isActive }) => navClass(isActive)}>
                <Users className="w-4 h-4" />
                <span>{t('relatoriosSidebar.teams')}</span>
              </NavLink>
            )}

            {isManager && (
              <NavLink to="/relatorios/members" className={({ isActive }) => navClass(isActive)}>
                <UserCircle className="w-4 h-4" />
                <span>{t('relatoriosSidebar.myTeam')}</span>
              </NavLink>
            )}

            {(isAdmin || isManager) && (
              <div className="mt-6 mb-2 px-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {t('relatoriosSidebar.exports')}
              </div>
            )}

            {(isAdmin || isManager) && (
              <NavLink to="/relatorios/incidents" className={({ isActive }) => navClass(isActive)}>
                <AlertTriangle className="w-4 h-4" />
                <span>{t('relatoriosSidebar.incidents')}</span>
              </NavLink>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <div key={location.pathname} className="animate-in fade-in duration-300">
            <Outlet />
          </div>
        </main>
      </div>

      <ChatBot />
    </div>
  );
}
