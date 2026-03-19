import { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
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
import { useTranslation } from 'react-i18next';
import axios from '../../lib/axios';

function navClass(isActive: boolean) {
  return `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium ${
    isActive
      ? 'bg-[#EC0000] text-white'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
  }`;
}

export default function TutoriaLayout() {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'GESTOR';
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

  const sectionLabel = 'mt-6 mb-2 px-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090B] text-gray-900 dark:text-white transition-colors duration-300">
      <Header />

      <div className="relative flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-[calc(100vh-64px)] sticky top-16">
          <nav className="p-4 space-y-1">
            <NavLink to="/tutoria" end className={({ isActive }) => navClass(isActive)}>
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('tutoriaSidebar.dashboard')}</span>
            </NavLink>

            <NavLink to="/tutoria/errors" className={({ isActive }) => navClass(isActive)}>
              <AlertTriangle className="w-4 h-4" />
              <span>{t('tutoriaSidebar.errors')}</span>
            </NavLink>

            {canAnalyze && (
              <NavLink to="/tutoria/analysis" className={({ isActive }) => navClass(isActive)}>
                <SearchIcon className="w-4 h-4" />
                <span>{t('tutoriaSidebar.analysis', 'Análise')}</span>
              </NavLink>
            )}

            {isTutor && (
              <NavLink to="/tutoria/tutor-review" className={({ isActive }) => navClass(isActive)}>
                <CheckCircle className="w-4 h-4" />
                <span>{t('tutoriaSidebar.tutorReview', 'Revisão Tutor')}</span>
              </NavLink>
            )}

            {(isTutor || isChefe || isManager) && (
              <NavLink to="/tutoria/plans" className={({ isActive }) => navClass(isActive)}>
                <ClipboardList className="w-4 h-4" />
                <span>{t('tutoriaSidebar.actionPlans')}</span>
              </NavLink>
            )}

            {!isManager && !isChefe && !isReferente && (
              <>
                <NavLink to="/tutoria/my-errors" className={({ isActive }) => navClass(isActive)}>
                  <BookOpen className="w-4 h-4" />
                  <span>{t('tutoriaSidebar.myErrors')}</span>
                </NavLink>
                <NavLink to="/tutoria/my-plans" className={({ isActive }) => navClass(isActive)}>
                  <ClipboardList className="w-4 h-4" />
                  <span>{t('tutoriaSidebar.myPlans')}</span>
                </NavLink>
              </>
            )}

            {(isManager || isChefe) ? (
              <NavLink to="/tutoria/report" className={({ isActive }) => navClass(isActive)}>
                <BarChart3 className="w-4 h-4" />
                <span>{t('tutoriaSidebar.report')}</span>
              </NavLink>
            ) : (
              <NavLink to="/tutoria/report" className={({ isActive }) => navClass(isActive)}>
                <BarChart3 className="w-4 h-4" />
                <span>{t('tutoriaSidebar.myProgress')}</span>
              </NavLink>
            )}

            {canSeeInternalErrors && (
              <>
                <div className={sectionLabel}>
                  {t('tutoriaSidebar.internalErrors', 'Erros Internos')}
                </div>
                <NavLink to="/tutoria/internal-errors" className={({ isActive }) => navClass(isActive)}>
                  <ShieldAlert className="w-4 h-4" />
                  <span>{t('tutoriaSidebar.internalErrorsList', 'Erros Internos')}</span>
                </NavLink>
                <NavLink to="/tutoria/censos" className={({ isActive }) => navClass(isActive)}>
                  <Calendar className="w-4 h-4" />
                  <span>{t('tutoriaSidebar.censos', 'Censos')}</span>
                </NavLink>
              </>
            )}

            {(isManager || isChefe || isReferente) && (
              <NavLink to="/tutoria/learning-sheets" className={({ isActive }) => navClass(isActive)}>
                <FileText className="w-4 h-4" />
                <span>{t('tutoriaSidebar.learningSheets', 'Fichas de Aprendizagem')}</span>
              </NavLink>
            )}

            {!isManager && !isChefe && !isReferente && (
              <NavLink to="/tutoria/my-learning-sheets" className={({ isActive }) => navClass(isActive)}>
                <FileText className="w-4 h-4" />
                <span>{t('tutoriaSidebar.myLearningSheets', 'Minhas Fichas')}</span>
              </NavLink>
            )}

            {isAdmin && (
              <>
                <div className={sectionLabel}>
                  {t('tutoriaSidebar.adminSection', 'Administração')}
                </div>
                <NavLink to="/tutoria/categories" className={({ isActive }) => navClass(isActive)}>
                  <PenTool className="w-4 h-4" />
                  <span>{t('tutoriaSidebar.categories', 'Categorias')}</span>
                </NavLink>
                <NavLink to="/tutoria/chat-faqs" className={({ isActive }) => navClass(isActive)}>
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('tutoriaSidebar.chatFaqs', 'Chat FAQs')}</span>
                </NavLink>
              </>
            )}

            <div className="mt-4" />
            <NavLink to="/tutoria/notifications" className={({ isActive }) => navClass(isActive)}>
              <div className="relative">
                <Bell className="w-4 h-4" />
                {notifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#EC0000] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </div>
              <span>{t('tutoriaSidebar.notifications', 'Notificações')}</span>
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
