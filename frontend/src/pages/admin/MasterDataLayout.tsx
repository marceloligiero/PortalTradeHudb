import { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import ChatBot from '../../components/ChatBot';
import Header from '../../components/layout/Header';
import {
  Building2, Package, Users, FolderTree, MessageCircle,
  Zap, Globe, Eye, Building, Activity, AlertTriangle, UserCog,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

function navClass(isActive: boolean, isDark: boolean) {
  return `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group text-sm font-medium tracking-wide ${
    isActive
      ? 'bg-red-600 text-white font-bold shadow-xl shadow-red-600/20'
      : isDark
      ? 'text-gray-400 hover:bg-white/5 hover:text-white'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;
}

export default function MasterDataLayout() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('masterData.portalTitle');
    return () => { document.title = t('masterData.portalTitleFallback'); };
  }, []);

  // Only ADMIN and MANAGER can access
  if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
    return null;
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] ${isDark ? 'bg-red-600/5' : 'bg-red-600/10'}`} />
        <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] ${isDark ? 'bg-blue-600/5' : 'bg-blue-600/10'}`} />
      </div>

      {/* Floating pill Header (shared) */}
      <Header />

      {/* Below header: Sidebar + Content */}
      <div className="relative z-10 flex pt-[72px]">

        {/* Sidebar */}
        <aside className={`w-72 backdrop-blur-2xl border-r transition-colors duration-300 min-h-[calc(100vh-72px)] sticky top-0 ${isDark ? 'bg-[#0a0a0a]/50 border-white/5' : 'bg-white/80 border-gray-200'}`}>
          <nav className="p-6 space-y-1">
            <NavLink to="/master-data" end className={({ isActive }) => navClass(isActive, isDark)}>
              <Building2 className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('masterData.banks')}</span>
            </NavLink>

            <NavLink to="/master-data/products" className={({ isActive }) => navClass(isActive, isDark)}>
              <Package className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('masterData.products')}</span>
            </NavLink>

            <NavLink to="/master-data/teams" className={({ isActive }) => navClass(isActive, isDark)}>
              <Users className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('masterData.teams')}</span>
            </NavLink>

            <NavLink to="/master-data/categories" className={({ isActive }) => navClass(isActive, isDark)}>
              <FolderTree className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('masterData.categories')}</span>
            </NavLink>

            {/* ── Subheader: Dados Mestres de Erros ── */}
            <div className={`mt-4 mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {t('masterData.errorMasterData')}
            </div>

            <NavLink to="/master-data/impacts" className={({ isActive }) => navClass(isActive, isDark)}>
              <Zap className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('masterData.impacts')}</span>
            </NavLink>

            <NavLink to="/master-data/origins" className={({ isActive }) => navClass(isActive, isDark)}>
              <Globe className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('masterData.origins')}</span>
            </NavLink>

            <NavLink to="/master-data/detected-by" className={({ isActive }) => navClass(isActive, isDark)}>
              <Eye className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('masterData.detectedBy')}</span>
            </NavLink>

            <NavLink to="/master-data/departments" className={({ isActive }) => navClass(isActive, isDark)}>
              <Building className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('masterData.departments')}</span>
            </NavLink>

            <NavLink to="/master-data/activities" className={({ isActive }) => navClass(isActive, isDark)}>
              <Activity className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('masterData.events')}</span>
            </NavLink>

            <NavLink to="/master-data/error-types" className={({ isActive }) => navClass(isActive, isDark)}>
              <AlertTriangle className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('masterData.errorTypes')}</span>
            </NavLink>

            <NavLink to="/master-data/faqs" className={({ isActive }) => navClass(isActive, isDark)}>
              <MessageCircle className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('masterData.faqs')}</span>
            </NavLink>

            {/* ── Subheader: Gestão ── */}
            <div className={`mt-4 mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {t('masterData.management')}
            </div>

            <NavLink to="/master-data/users" className={({ isActive }) => navClass(isActive, isDark)}>
              <UserCog className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="tracking-wide">{t('masterData.users')}</span>
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

      <ChatBot />
    </div>
  );
}
