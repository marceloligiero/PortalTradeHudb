import { LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PortalLayout from '../../components/layout/PortalLayout';
import { SidebarLink } from '../../components/layout/sidebar/index';

function ChamadosSidebar() {
  const { t } = useTranslation();
  return (
    <SidebarLink to="/chamados" icon={LayoutDashboard} label={t('chamadosSidebar.kanban')} end />
  );
}

export default function ChamadosLayout() {
  const { t } = useTranslation();
  return (
    <PortalLayout
      title={t('chamados.pageTitle')}
      sidebarContent={<ChamadosSidebar />}
      animateOnRouteChange
    />
  );
}
