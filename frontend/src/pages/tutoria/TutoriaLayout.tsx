import { useEffect, useState } from 'react';
import {
  LayoutDashboard, AlertTriangle, ClipboardList, BarChart3,
  BookOpen, ShieldAlert, Calendar, FileText, Bell,
  Search as SearchIcon, PenTool, CheckCircle, MessageSquare,
  Star, BookMarked, GraduationCap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import PortalLayout from '../../components/layout/PortalLayout';
import { SidebarLink, SidebarSection } from '../../components/layout/sidebar/index';
import axios from '../../lib/axios';

function TutoriaSidebar() {
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
    <>
      {/* Core navigation */}
      <SidebarLink to="/tutoria" icon={LayoutDashboard} label={t('tutoriaSidebar.dashboard')} end />
      <SidebarLink to="/tutoria/errors" icon={AlertTriangle} label={t('tutoriaSidebar.errors')} />

      {canAnalyze && (
        <SidebarLink to="/tutoria/analysis" icon={SearchIcon} label={t('tutoriaSidebar.analysis', 'Análise')} />
      )}

      {isTutor && (
        <SidebarLink to="/tutoria/tutor-review" icon={CheckCircle} label={t('tutoriaSidebar.tutorReview', 'Revisão Tutor')} />
      )}

      {(isTutor || isAdmin) && (
        <SidebarLink to="/tutoria/capsulas" icon={GraduationCap} label={t('tutoriaSidebar.capsulas', 'Cápsulas Formativas')} />
      )}

      {(isTutor || isChefe || isManager) && (
        <SidebarLink to="/tutoria/plans" icon={ClipboardList} label={t('tutoriaSidebar.actionPlans')} />
      )}

      {!isManager && !isChefe && !isReferente && (
        <>
          <SidebarLink to="/tutoria/my-errors" icon={BookOpen} label={t('tutoriaSidebar.myErrors')} />
          <SidebarLink to="/tutoria/my-plans" icon={ClipboardList} label={t('tutoriaSidebar.myPlans')} />
        </>
      )}

      <SidebarLink
        to="/tutoria/report"
        icon={BarChart3}
        label={(isManager || isChefe) ? t('tutoriaSidebar.report') : t('tutoriaSidebar.myProgress')}
      />

      {(isManager || isChefe || isReferente) && (
        <SidebarLink to="/tutoria/learning-sheets" icon={FileText} label={t('tutoriaSidebar.learningSheets', 'Fichas de Aprendizagem')} />
      )}

      {!isManager && !isChefe && !isReferente && (
        <SidebarLink to="/tutoria/my-learning-sheets" icon={FileText} label={t('tutoriaSidebar.myLearningSheets', 'Minhas Fichas')} />
      )}

      {/* Quality section */}
      {canSeeInternalErrors && (
        <>
          <SidebarSection label={t('tutoriaSidebar.qualitySection', 'Qualidade')} />
          <SidebarLink to="/tutoria/internal-errors" icon={ShieldAlert} label={t('tutoriaSidebar.internalErrorsList', 'Erros Internos')} />
          {/* Censos — oculto por enquanto, descomentar quando necessário */}
          {/* <SidebarLink to="/tutoria/censos" icon={Calendar} label={t('tutoriaSidebar.censos', 'Censos')} /> */}
        </>
      )}

      {/* Feedback dos Liberadores */}
      {(isTutor || isAdmin || (user as any)?.is_liberador) && (
        <>
          <SidebarSection label={t('tutoriaSidebar.feedbackSection', 'Feedback')} />
          {(isTutor || isAdmin) && (
            <>
              <SidebarLink to="/tutoria/feedback" icon={Star} label={t('tutoriaSidebar.feedbackSurveys', 'Surveys Liberadores')} />
              <SidebarLink to="/tutoria/feedback/dashboard" icon={BarChart3} label={t('tutoriaSidebar.feedbackDashboard', 'Dashboard Feedback')} />
            </>
          )}
          {(user as any)?.is_liberador && (
            <SidebarLink to="/tutoria/feedback/respond" icon={BookMarked} label={t('tutoriaSidebar.feedbackRespond', 'Responder Feedback')} />
          )}
        </>
      )}

      {/* Config section — admin only */}
      {isAdmin && (
        <>
          <SidebarSection label={t('tutoriaSidebar.configSection', 'Configuração')} />
          <SidebarLink to="/tutoria/categories" icon={PenTool} label={t('tutoriaSidebar.categories', 'Categorias')} />
          <SidebarLink to="/tutoria/chat-faqs" icon={MessageSquare} label={t('tutoriaSidebar.chatFaqs', 'Chat FAQs')} />
        </>
      )}

      {/* Notifications */}
      <SidebarLink to="/tutoria/notifications" icon={Bell} label={t('tutoriaSidebar.notifications', 'Notificações')} badge={notifCount} />
    </>
  );
}

export default function TutoriaLayout() {
  const { t } = useTranslation();
  return (
    <PortalLayout
      title={t('tutoriaLayout.pageTitle')}
      fallbackTitle={t('tutoriaLayout.defaultTitle')}
      sidebarContent={<TutoriaSidebar />}
      animateOnRouteChange
    />
  );
}
