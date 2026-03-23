import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../../components/layout/Header';
import ChatBot from '../../components/ChatBot';
import { useSidebarStore } from '../../stores/sidebarStore';

export default function ChamadosLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { closeMobile } = useSidebarStore();

  useEffect(() => {
    document.title = t('chamados.pageTitle');
  }, [t]);

  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090B] text-gray-900 dark:text-white transition-colors duration-300">
      <Header />
      <main className="pt-16 px-6 py-6">
        <Outlet />
      </main>
      <ChatBot />
    </div>
  );
}
