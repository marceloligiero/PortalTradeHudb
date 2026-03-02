import { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import ChatBot from '../../components/ChatBot';
import Header from '../../components/layout/Header';
import {
  LayoutDashboard,
  AlertTriangle,
  ClipboardList,
  BarChart3,
  Settings,
  BookOpen,
  Bot,
} from 'lucide-react';
import { motion } from 'framer-motion';

function navClass(isActive: boolean, isDark: boolean) {
  return `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group text-sm font-medium tracking-wide ${
    isActive
      ? 'bg-red-600 text-white font-bold shadow-xl shadow-red-600/20'
      : isDark
      ? 'text-gray-400 hover:bg-white/5 hover:text-white'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;
}

export default function TutoriaLayout() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();

  const isManager = user?.role === 'ADMIN' || user?.role === 'TRAINER';

  useEffect(() => {
    document.title = 'Portal de Gestão de Erros';
    return () => { document.title = 'Portal Formações'; };
  }, []);

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] ${isDark ? 'bg-red-600/5' : 'bg-red-600/10'}`} />
        <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] ${isDark ? 'bg-blue-600/5' : 'bg-blue-600/10'}`} />
      </div>

      {/* ── Floating pill Header (shared) ─── */}
      <Header />

      {/* ── Below header: Sidebar + Content ──────────────────── */}
      <div className="relative z-10 flex pt-[72px]">

        {/* Sidebar */}
        <aside className={`w-72 backdrop-blur-2xl border-r transition-colors duration-300 min-h-[calc(100vh-72px)] sticky top-0 ${isDark ? 'bg-[#0a0a0a]/50 border-white/5' : 'bg-white/80 border-gray-200'}`}>
          <nav className="p-6 space-y-1">
            {/* ── Dashboard (todos) ─── */}
            <NavLink to="/tutoria" end className={({ isActive }) => navClass(isActive, isDark)}>
              <LayoutDashboard className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">Dashboard</span>
            </NavLink>

            {/* ── ADMIN + TRAINER ─── */}
            {isManager && (
              <>
                <NavLink to="/tutoria/errors" className={({ isActive }) => navClass(isActive, isDark)}>
                  <AlertTriangle className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">Erros</span>
                </NavLink>
                <NavLink to="/tutoria/plans" className={({ isActive }) => navClass(isActive, isDark)}>
                  <ClipboardList className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">Planos de Ação</span>
                </NavLink>
                <NavLink to="/tutoria/report" className={({ isActive }) => navClass(isActive, isDark)}>
                  <BarChart3 className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">Relatório</span>
                </NavLink>
              </>
            )}

            {/* ── ADMIN only ─── */}
            {user?.role === 'ADMIN' && (
              <>
                <NavLink to="/tutoria/categories" className={({ isActive }) => navClass(isActive, isDark)}>
                  <Settings className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">Categorias</span>
                </NavLink>
                <NavLink to="/tutoria/chat-faqs" className={({ isActive }) => navClass(isActive, isDark)}>
                  <Bot className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">FAQ Chatbot</span>
                </NavLink>
              </>
            )}

            {/* ── STUDENT / TRAINEE ─── */}
            {!isManager && (
              <>
                <NavLink to="/tutoria/my-errors" className={({ isActive }) => navClass(isActive, isDark)}>
                  <BookOpen className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">Meus Erros</span>
                </NavLink>
                <NavLink to="/tutoria/my-plans" className={({ isActive }) => navClass(isActive, isDark)}>
                  <ClipboardList className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">Meus Planos</span>
                </NavLink>
                <NavLink to="/tutoria/report" className={({ isActive }) => navClass(isActive, isDark)}>
                  <BarChart3 className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">Minha Evolução</span>
                </NavLink>
              </>
            )}
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

      {/* Chatbot widget */}
      <ChatBot />
    </div>
  );
}
