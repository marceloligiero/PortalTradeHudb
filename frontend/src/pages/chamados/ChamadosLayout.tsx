import { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import ChatBot from '../../components/ChatBot';
import Header from '../../components/layout/Header';
import {
  LayoutDashboard,
  Plus,
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

export default function ChamadosLayout() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('chamados.pageTitle');
    return () => { document.title = 'Portal Formações'; };
  }, []);

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] ${isDark ? 'bg-orange-600/5' : 'bg-orange-600/10'}`} />
        <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] ${isDark ? 'bg-cyan-600/5' : 'bg-cyan-600/10'}`} />
      </div>

      <Header />

      <div className="relative z-10 flex pt-[72px]">
        {/* Sidebar */}
        <aside className={`w-72 backdrop-blur-2xl border-r transition-colors duration-300 min-h-[calc(100vh-72px)] sticky top-0 ${isDark ? 'bg-[#0a0a0a]/50 border-white/5' : 'bg-white/80 border-gray-200'}`}>
          <nav className="p-6 space-y-1">
            <NavLink to="/chamados" end className={({ isActive }) => navClass(isActive, isDark)}>
              <LayoutDashboard className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('chamadosSidebar.kanban')}</span>
            </NavLink>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <motion.div
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
