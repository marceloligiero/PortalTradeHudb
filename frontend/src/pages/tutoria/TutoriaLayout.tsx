import {
  LayoutDashboard, AlertTriangle, ClipboardList,
  BookOpen, Calendar, FileText,
  Search as SearchIcon, CheckCircle, Star, BookMarked, GraduationCap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import PortalLayout from '../../components/layout/PortalLayout';
import { SidebarLink, SidebarSection } from '../../components/layout/sidebar/index';

function TutoriaSidebar() {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const isAdmin = user?.is_admin || user?.is_diretor;
  const isTutor = user?.is_tutor;
  const isManager = isAdmin || user?.is_gerente || isTutor;
  const isChefe = user?.is_chefe_equipe;
  const isReferente = user?.is_referente;
  const isLiberador = user?.is_liberador || isAdmin;
  const canAnalyze = isManager || isChefe || isReferente;
  const canSeeInternalErrors = isManager || isLiberador;

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

      {isTutor && (
        <SidebarLink to="/tutoria/side-by-side" icon={Calendar} label={t('tutoriaSidebar.sideBySide', 'Side by Side')} />
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

      {(isManager || isChefe || isReferente) && (
        <SidebarLink to="/tutoria/learning-sheets" icon={FileText} label={t('tutoriaSidebar.learningSheets', 'Fichas de Aprendizagem')} />
      )}

      {!isManager && !isChefe && !isReferente && (
        <SidebarLink to="/tutoria/my-learning-sheets" icon={FileText} label={t('tutoriaSidebar.myLearningSheets', 'Minhas Fichas')} />
      )}

      {/* Feedback dos Liberadores */}
      {(isTutor || isAdmin || user?.is_liberador) && (
        <>
          <SidebarSection label={t('tutoriaSidebar.feedbackSection', 'Feedback')} />
          {(isTutor || isAdmin) && (
            <SidebarLink to="/tutoria/feedback" icon={Star} label={t('tutoriaSidebar.feedbackSurveys', 'Surveys Liberadores')} />
          )}
          {user?.is_liberador && (
            <SidebarLink to="/tutoria/feedback/respond" icon={BookMarked} label={t('tutoriaSidebar.feedbackRespond', 'Responder Feedback')} />
          )}
        </>
      )}

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
