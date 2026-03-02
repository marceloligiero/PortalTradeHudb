import { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import ChatBot from '../../components/ChatBot';
import Header from '../../components/layout/Header';
import {
  LayoutDashboard, GraduationCap, Shield, Users, UserCircle,
  BarChart3,
} from 'lucide-react';
import { motion } from 'framer-motion';

function navClass(isActive: boolean, isDark: boolean) {
  return `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group text-sm font-medium tracking-wide ${
    isActive
      ? 'bg-emerald-600 text-white font-bold shadow-xl shadow-emerald-600/20'
      : isDark
      ? 'text-gray-400 hover:bg-white/5 hover:text-white'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;
}

export default function RelatoriosLayout() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();

  useEffect(() => { document.title = 'Portal de Relatórios · Trade Data Hub'; }, []);
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] animate-blob bg-emerald-600/8 dark:bg-emerald-600/4" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] animate-blob animation-delay-2000 bg-blue-600/8 dark:bg-blue-600/4" />
      </div>

      {/* ── Floating pill Header (shared) ─── */}
      <Header />

      {/* ── Below header: Sidebar + Content ─────────────────────── */}
      <div className="relative z-10 flex pt-[72px]">
        {/* Sidebar */}
        <aside className={`w-72 backdrop-blur-2xl border-r transition-colors duration-300 min-h-[calc(100vh-72px)] sticky top-0 ${isDark ? 'bg-[#0a0a0a]/50 border-white/5' : 'bg-white/80 border-gray-200'}`}>
          <nav className="p-6 space-y-1">
            {/* User info */}
            <div className={`flex items-center gap-3 p-4 rounded-2xl mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.full_name}</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{user?.role}</p>
              </div>
            </div>

            {/* Overview — all roles */}
            <NavLink to="/relatorios" end className={({ isActive }) => navClass(isActive, isDark)}>
              <LayoutDashboard className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span>Overview</span>
            </NavLink>

            {/* Formações — all roles */}
            <NavLink to="/relatorios/formacoes" className={({ isActive }) => navClass(isActive, isDark)}>
              <GraduationCap className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span>Portal de Formações</span>
            </NavLink>

            {/* Tutoria — all roles */}
            <NavLink to="/relatorios/tutoria" className={({ isActive }) => navClass(isActive, isDark)}>
              <Shield className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span>Portal de Tutoria</span>
            </NavLink>

            {/* Equipas — ADMIN only */}
            {isAdmin && (
              <NavLink to="/relatorios/teams" className={({ isActive }) => navClass(isActive, isDark)}>
                <Users className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <span>Equipas</span>
              </NavLink>
            )}

            {/* Minha Equipa — MANAGER */}
            {isManager && (
              <NavLink to="/relatorios/members" className={({ isActive }) => navClass(isActive, isDark)}>
                <UserCircle className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <span>Minha Equipa</span>
              </NavLink>
            )}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-8 min-h-[calc(100vh-72px)]">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <ChatBot />
    </div>
  );
}
