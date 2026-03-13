import { useEffect, useState } from 'react';
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
  BookOpen,
  ShieldAlert,
  Calendar,
  FileText,
  Bell,
  Search as SearchIcon,
  PenTool,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import axios from '../../lib/axios';

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
  const { t } = useTranslation();

  const isAdmin = user?.role === 'ADMIN';
  const isTutor = user?.is_tutor;
  const isManager = isAdmin || user?.role === 'TRAINER' || isTutor;
  const isChefe = (user as any)?.is_team_lead;
  const isReferente = (user as any)?.is_referente;
  const isLiberador = user?.is_liberador || isAdmin;
  const canAnalyze = isManager || isChefe || isReferente;
  const canSeeInternalErrors = isManager || isLiberador;

  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    document.title = t('tutoriaLayout.pageTitle');
    return () => { document.title = t('tutoriaLayout.defaultTitle'); };
  }, []);

  // Poll notifications every 30s
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await axios.get('/tutoria/notifications');
        setNotifCount(Array.isArray(data) ? data.length : 0);
      } catch { /* ignore */ }
    };
    fetchCount();
    const iv = setInterval(fetchCount, 30000);
    return () => clearInterval(iv);
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
              <span className="tracking-wide">{t('tutoriaSidebar.dashboard')}</span>
            </NavLink>

            {/* ── Incidências (todos) ─── */}
            <NavLink to="/tutoria/errors" className={({ isActive }) => navClass(isActive, isDark)}>
              <AlertTriangle className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('tutoriaSidebar.errors')}</span>
            </NavLink>

            {/* ── Análise (Chefe/Manager/Referente) ─── */}
            {canAnalyze && (
              <NavLink to="/tutoria/analysis" className={({ isActive }) => navClass(isActive, isDark)}>
                <SearchIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <span className="tracking-wide">{t('tutoriaSidebar.analysis', 'Análise')}</span>
              </NavLink>
            )}

            {/* ── Revisão Tutor ─── */}
            {isTutor && (
              <NavLink to="/tutoria/tutor-review" className={({ isActive }) => navClass(isActive, isDark)}>
                <CheckCircle className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <span className="tracking-wide">{t('tutoriaSidebar.tutorReview', 'Revisão Tutor')}</span>
              </NavLink>
            )}

            {/* ── Planos de Ação (Tutor + Chefe + Manager) ─── */}
            {(isTutor || isChefe || isManager) && (
              <NavLink to="/tutoria/plans" className={({ isActive }) => navClass(isActive, isDark)}>
                <ClipboardList className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <span className="tracking-wide">{t('tutoriaSidebar.actionPlans')}</span>
              </NavLink>
            )}

            {/* ── Básico (não manager/chefe/referente) ─── */}
            {!isManager && !isChefe && !isReferente && (
              <>
                <NavLink to="/tutoria/my-errors" className={({ isActive }) => navClass(isActive, isDark)}>
                  <BookOpen className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">{t('tutoriaSidebar.myErrors')}</span>
                </NavLink>
                <NavLink to="/tutoria/my-plans" className={({ isActive }) => navClass(isActive, isDark)}>
                  <ClipboardList className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">{t('tutoriaSidebar.myPlans')}</span>
                </NavLink>
              </>
            )}

            {/* ── Relatório ─── */}
            {(isManager || isChefe) ? (
              <NavLink to="/tutoria/report" className={({ isActive }) => navClass(isActive, isDark)}>
                <BarChart3 className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <span className="tracking-wide">{t('tutoriaSidebar.report')}</span>
              </NavLink>
            ) : (
              <NavLink to="/tutoria/report" className={({ isActive }) => navClass(isActive, isDark)}>
                <BarChart3 className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <span className="tracking-wide">{t('tutoriaSidebar.myProgress')}</span>
              </NavLink>
            )}

            {/* ── ERROS INTERNOS (tutor/admin/liberador) ─── */}
            {canSeeInternalErrors && (
              <>
                <div className={`mt-6 mb-2 px-5 text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {t('tutoriaSidebar.internalErrors', 'Erros Internos')}
                </div>
                <NavLink to="/tutoria/internal-errors" className={({ isActive }) => navClass(isActive, isDark)}>
                  <ShieldAlert className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">{t('tutoriaSidebar.internalErrorsList', 'Erros Internos')}</span>
                </NavLink>
                <NavLink to="/tutoria/censos" className={({ isActive }) => navClass(isActive, isDark)}>
                  <Calendar className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">{t('tutoriaSidebar.censos', 'Censos')}</span>
                </NavLink>
              </>
            )}

            {/* ── FICHAS DE APRENDIZAGEM (tutor/chefe/admin) ─── */}
            {(isManager || isChefe || isReferente) && (
              <NavLink to="/tutoria/learning-sheets" className={({ isActive }) => navClass(isActive, isDark)}>
                <FileText className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <span className="tracking-wide">{t('tutoriaSidebar.learningSheets', 'Fichas de Aprendizagem')}</span>
              </NavLink>
            )}

            {/* ── MY LEARNING SHEETS (básico) ─── */}
            {!isManager && !isChefe && !isReferente && (
              <NavLink to="/tutoria/my-learning-sheets" className={({ isActive }) => navClass(isActive, isDark)}>
                <FileText className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <span className="tracking-wide">{t('tutoriaSidebar.myLearningSheets', 'Minhas Fichas')}</span>
              </NavLink>
            )}

            {/* ── ADMIN (Categorias, Chat FAQs) ─── */}
            {isAdmin && (
              <>
                <div className={`mt-6 mb-2 px-5 text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {t('tutoriaSidebar.adminSection', 'Administração')}
                </div>
                <NavLink to="/tutoria/categories" className={({ isActive }) => navClass(isActive, isDark)}>
                  <PenTool className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">{t('tutoriaSidebar.categories', 'Categorias')}</span>
                </NavLink>
                <NavLink to="/tutoria/chat-faqs" className={({ isActive }) => navClass(isActive, isDark)}>
                  <MessageSquare className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">{t('tutoriaSidebar.chatFaqs', 'Chat FAQs')}</span>
                </NavLink>
              </>
            )}

            {/* ── NOTIFICAÇÕES (todos) ─── */}
            <div className={`mt-4 mb-1`} />
            <NavLink to="/tutoria/notifications" className={({ isActive }) => navClass(isActive, isDark)}>
              <div className="relative">
                <Bell className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                {notifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </div>
              <span className="tracking-wide">{t('tutoriaSidebar.notifications', 'Notificações')}</span>
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

      {/* Chatbot widget */}
      <ChatBot />
    </div>
  );
}
