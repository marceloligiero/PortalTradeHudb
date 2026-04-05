import {
  LayoutDashboard, GraduationCap, Shield, Users, UserCircle, AlertTriangle,
  BarChart3, Brain, Star, BookMarked,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import PortalLayout from '../../components/layout/PortalLayout';
import { SidebarLink, SidebarSection } from '../../components/layout/sidebar/index';

function RelatoriosSidebar() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const isAdmin   = user?.is_admin || user?.is_diretor;
  const isManager = user?.is_gerente || user?.is_chefe_equipe;
  const isTutor   = user?.is_tutor;
  const isChefe   = user?.is_chefe_equipe;

  return (
    <>
      <SidebarLink to="/relatorios" icon={LayoutDashboard} label={t('relatoriosSidebar.overview')} end />
      <SidebarLink to="/relatorios/formacoes" icon={GraduationCap} label={t('relatoriosSidebar.formacoes')} />
      <SidebarLink to="/relatorios/tutoria" icon={Shield} label={t('relatoriosSidebar.tutoria')} />

      {isAdmin && (
        <SidebarLink to="/relatorios/teams" icon={Users} label={t('relatoriosSidebar.teams')} />
      )}

      {isManager && (
        <SidebarLink to="/relatorios/members" icon={UserCircle} label={t('relatoriosSidebar.myTeam')} />
      )}

      {(isAdmin || isManager) && (
        <>
          <SidebarSection label={t('navigation.analyticsSection', 'Análise')} />
          <SidebarLink to="/relatorios/advanced-reports" icon={BarChart3} label={t('navigation.advancedReports')} />
          <SidebarLink to="/relatorios/knowledge-matrix" icon={Brain} label={t('navigation.knowledgeMatrix')} />
          <SidebarLink to="/relatorios/ratings" icon={Star} label={t('navigation.ratings')} />

          <SidebarSection label={t('relatoriosSidebar.exports')} />
          <SidebarLink to="/relatorios/incidents" icon={AlertTriangle} label={t('relatoriosSidebar.incidents')} />
        </>
      )}

      {(isAdmin || isManager || isTutor || isChefe) && (
        <>
          <SidebarSection label={t('tutoriaLayout.pageTitle', 'Tutoria')} />
          <SidebarLink to="/relatorios/tutoria-report" icon={BarChart3} label={t('tutoriaSidebar.report')} />
          {(isAdmin || isTutor) && (
            <SidebarLink to="/relatorios/feedback-dashboard" icon={BookMarked} label={t('tutoriaSidebar.feedbackDashboard', 'Dashboard Feedback')} />
          )}
        </>
      )}
    </>
  );
}

export default function RelatoriosLayout() {
  return (
    <PortalLayout
      title="Portal de Relatórios · Trade Data Hub"
      sidebarContent={<RelatoriosSidebar />}
      animateOnRouteChange
    />
  );
}
