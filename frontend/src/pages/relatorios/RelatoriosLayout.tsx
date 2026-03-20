import {
  LayoutDashboard, GraduationCap, Shield, Users, UserCircle, AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import PortalLayout from '../../components/layout/PortalLayout';
import { SidebarLink, SidebarSection } from '../../components/layout/sidebar/index';

function RelatoriosSidebar() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const isAdmin   = user?.role === 'ADMIN' || user?.role === 'GESTOR';
  const isManager = user?.role === 'MANAGER';

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
          <SidebarSection label={t('relatoriosSidebar.exports')} />
          <SidebarLink to="/relatorios/incidents" icon={AlertTriangle} label={t('relatoriosSidebar.incidents')} />
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
