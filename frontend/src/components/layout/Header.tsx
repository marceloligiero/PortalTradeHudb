import { LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import LanguageSwitcher from '../LanguageSwitcher';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
            {t('common.appName')}
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
            <User className="w-5 h-5 text-gray-400" />
            <div className="text-sm">
              <p className="font-medium text-white">{user?.full_name}</p>
              <p className="text-gray-400 text-xs">{t(`roles.${user?.role}`)}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:text-red-400 hover:bg-white/5 rounded-lg transition-all border border-white/10 hover:border-red-600/50"
          >
            <LogOut className="w-4 h-4" />
            {t('common.logout')}
          </button>
        </div>
      </div>
    </header>
  );
}
