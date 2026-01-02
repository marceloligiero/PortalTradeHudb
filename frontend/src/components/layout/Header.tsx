import { LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import LanguageSwitcher from '../LanguageSwitcher';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  return (
    <header className="bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5 px-2 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/logo-sds.png"
            alt="Santander Digital Services"
            className="h-10 w-auto object-contain"
          />
        </div>
        
        <div className="flex items-center gap-8">
          <LanguageSwitcher />
          
          <div className="h-8 w-px bg-white/10" />
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-white leading-none mb-1">{user?.full_name}</p>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{t(`roles.${user?.role}`)}</p>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center group hover:border-red-500/50 transition-colors cursor-pointer">
              <User className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all group"
            title={t('common.logout')}
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
}
