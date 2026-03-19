import { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import ChatBot from '../../components/ChatBot';
import Header from '../../components/layout/Header';
import {
  Building2, Package, Users, FolderTree, MessageCircle,
  Zap, Globe, Eye, Building, Activity, AlertTriangle, UserCog,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

function navClass(isActive: boolean) {
  return `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium ${
    isActive
      ? 'bg-[#EC0000] text-white'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
  }`;
}

export default function MasterDataLayout() {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('masterData.portalTitle');
    return () => { document.title = t('masterData.portalTitleFallback'); };
  }, []);

  // Only ADMIN, MANAGER and GESTOR can access
  if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER' && user?.role !== 'GESTOR') {
    return null;
  }

  const sectionLabel = 'mt-6 mb-2 px-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090B] text-gray-900 dark:text-white transition-colors duration-300">
      <Header />

      <div className="relative flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-[calc(100vh-64px)] sticky top-16">
          <nav className="p-4 space-y-1">
            <NavLink to="/master-data" end className={({ isActive }) => navClass(isActive)}>
              <Building2 className="w-4 h-4" />
              <span>{t('masterData.banks')}</span>
            </NavLink>

            <NavLink to="/master-data/products" className={({ isActive }) => navClass(isActive)}>
              <Package className="w-4 h-4" />
              <span>{t('masterData.products')}</span>
            </NavLink>

            <NavLink to="/master-data/teams" className={({ isActive }) => navClass(isActive)}>
              <Users className="w-4 h-4" />
              <span>{t('masterData.teams')}</span>
            </NavLink>

            <NavLink to="/master-data/categories" className={({ isActive }) => navClass(isActive)}>
              <FolderTree className="w-4 h-4" />
              <span>{t('masterData.categories')}</span>
            </NavLink>

            {/* ── Error Master Data ── */}
            <div className={sectionLabel}>
              {t('masterData.errorMasterData')}
            </div>

            <NavLink to="/master-data/impacts" className={({ isActive }) => navClass(isActive)}>
              <Zap className="w-4 h-4" />
              <span>{t('masterData.impacts')}</span>
            </NavLink>

            <NavLink to="/master-data/origins" className={({ isActive }) => navClass(isActive)}>
              <Globe className="w-4 h-4" />
              <span>{t('masterData.origins')}</span>
            </NavLink>

            <NavLink to="/master-data/detected-by" className={({ isActive }) => navClass(isActive)}>
              <Eye className="w-4 h-4" />
              <span>{t('masterData.detectedBy')}</span>
            </NavLink>

            <NavLink to="/master-data/departments" className={({ isActive }) => navClass(isActive)}>
              <Building className="w-4 h-4" />
              <span>{t('masterData.departments')}</span>
            </NavLink>

            <NavLink to="/master-data/activities" className={({ isActive }) => navClass(isActive)}>
              <Activity className="w-4 h-4" />
              <span>{t('masterData.events')}</span>
            </NavLink>

            <NavLink to="/master-data/error-types" className={({ isActive }) => navClass(isActive)}>
              <AlertTriangle className="w-4 h-4" />
              <span>{t('masterData.errorTypes')}</span>
            </NavLink>

            <NavLink to="/master-data/faqs" className={({ isActive }) => navClass(isActive)}>
              <MessageCircle className="w-4 h-4" />
              <span>{t('masterData.faqs')}</span>
            </NavLink>

            {/* ── Management ── */}
            <div className={sectionLabel}>
              {t('masterData.management')}
            </div>

            <NavLink to="/master-data/users" className={({ isActive }) => navClass(isActive)}>
              <UserCog className="w-4 h-4" />
              <span>{t('masterData.users')}</span>
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
