import { useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import ChatBot from '../../components/ChatBot';
import Header from '../../components/layout/Header';
import {
  LayoutDashboard, GraduationCap, Shield, Users, UserCircle, AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

function navClass(isActive: boolean, isDark: boolean) {
  return `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group text-sm font-medium tracking-wide ${
    isActive
      ? 'bg-red-600 text-white font-bold shadow-xl shadow-red-600/20'
      : isDark
      ? 'text-gray-400 hover:bg-white/5 hover:text-white'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;
}

export default function RelatoriosLayout() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();

  const isAdmin   = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';

  useEffect(() => {
    document.title = 'Portal de Relatórios · Trade Data Hub';
    return () => { document.title = 'Portal Formações'; };
  }, []);

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] ${isDark ? 'bg-red-600/5' : 'bg-red-600/10'}`} />
        <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] ${isDark ? 'bg-blue-600/5' : 'bg-blue-600/10'}`} />
      </div>

      {/* Floating pill Header */}
      <Header />

      {/* Sidebar + Content */}
      <div className="relative z-10 flex pt-[72px]">

        {/* Sidebar */}
        <aside className={`w-72 backdrop-blur-2xl border-r transition-colors duration-300 min-h-[calc(100vh-72px)] sticky top-0 ${isDark ? 'bg-[#0a0a0a]/50 border-white/5' : 'bg-white/80 border-gray-200'}`}>
          <nav className="p-6 space-y-1">

            {/* Overview — todos os roles */}
            <NavLink to="/relatorios" end className={({ isActive }) => navClass(isActive, isDark)}>
              <LayoutDashboard className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('relatoriosSidebar.overview')}</span>
            </NavLink>

            {/* Portal de Formações — todos os roles */}
            <NavLink to="/relatorios/formacoes" className={({ isActive }) => navClass(isActive, isDark)}>
              <GraduationCap className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('relatoriosSidebar.formacoes')}</span>
            </NavLink>

            {/* Portal de Tutoria — todos os roles */}
            <NavLink to="/relatorios/tutoria" className={({ isActive }) => navClass(isActive, isDark)}>
              <Shield className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('relatoriosSidebar.tutoria')}</span>
            </NavLink>

            {/* Equipas — ADMIN only */}
            {isAdmin && (
              <NavLink to="/relatorios/teams" className={({ isActive }) => navClass(isActive, isDark)}>
                <Users className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <span className="tracking-wide">{t('relatoriosSidebar.teams')}</span>
              </NavLink>
            )}

            {/* Minha Equipa — MANAGER only */}
            {isManager && (
              <NavLink to="/relatorios/members" className={({ isActive }) => navClass(isActive, isDark)}>
                <UserCircle className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <span className="tracking-wide">{t('relatoriosSidebar.myTeam')}</span>
              </NavLink>
            )}

            {/* Separador */}
            {(isAdmin || isManager) && (
              <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-3 px-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('relatoriosSidebar.exports')}</p>
              </div>
            )}

            {/* Relatório de Incidências — ADMIN + MANAGER */}
            {(isAdmin || isManager) && (
              <NavLink to="/relatorios/incidents" className={({ isActive }) => navClass(isActive, isDark)}>
                <AlertTriangle className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <span className="tracking-wide">{t('relatoriosSidebar.incidents')}</span>
              </NavLink>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <ChatBot />
    </div>
  );
}
