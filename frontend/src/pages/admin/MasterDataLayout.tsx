import {
  Building2, Package, Users, FolderTree, MessageCircle,
  Zap, Globe, Eye, Building, Activity, AlertTriangle, UserCog,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import PortalLayout from '../../components/layout/PortalLayout';
import { SidebarLink, SidebarSection } from '../../components/layout/sidebar/index';

function MasterDataSidebar() {
  const { t } = useTranslation();
  return (
    <>
      <SidebarLink to="/master-data" icon={Building2} label={t('masterData.banks')} end />
      <SidebarLink to="/master-data/products" icon={Package} label={t('masterData.products')} />
      <SidebarLink to="/master-data/teams" icon={Users} label={t('masterData.teams')} />
      <SidebarLink to="/master-data/categories" icon={FolderTree} label={t('masterData.categories')} />

      <SidebarSection label={t('masterData.errorMasterData')} />
      <SidebarLink to="/master-data/impacts" icon={Zap} label={t('masterData.impacts')} />
      <SidebarLink to="/master-data/origins" icon={Globe} label={t('masterData.origins')} />
      <SidebarLink to="/master-data/detected-by" icon={Eye} label={t('masterData.detectedBy')} />
      <SidebarLink to="/master-data/departments" icon={Building} label={t('masterData.departments')} />
      <SidebarLink to="/master-data/activities" icon={Activity} label={t('masterData.events')} />
      <SidebarLink to="/master-data/error-types" icon={AlertTriangle} label={t('masterData.errorTypes')} />
      <SidebarLink to="/master-data/faqs" icon={MessageCircle} label={t('masterData.faqs')} />

      <SidebarSection label={t('masterData.management')} />
      <SidebarLink to="/master-data/users" icon={UserCog} label={t('masterData.users')} />
    </>
  );
}

export default function MasterDataLayout() {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  return (
    <PortalLayout
      title={t('masterData.portalTitle')}
      fallbackTitle={t('masterData.portalTitleFallback')}
      sidebarContent={<MasterDataSidebar />}
      guard={() => user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'GESTOR'}
      animateOnRouteChange
    />
  );
}
