import { LogOut, User, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import LanguageSwitcher from '../LanguageSwitcher';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className={`backdrop-blur-2xl border-b px-2 py-3 sticky top-0 z-50 transition-colors duration-300 print:hidden ${
      isDark 
        ? 'bg-[#0a0a0a]/80 border-white/5' 
        : 'bg-white/80 border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/logo-sds.png"
            alt="Santander Digital Services"
            className={`h-10 w-auto object-contain transition-all ${
              isDark ? '' : 'brightness-0'
            }`}
          />
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          {/* Theme Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-300 relative group ${
              isDark 
                ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-yellow-400/50' 
                : 'bg-gray-100 hover:bg-gray-200 border-gray-200 hover:border-blue-400/50'
            }`}
            title={isDark ? 'Modo Claro' : 'Modo Escuro'}
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-5 h-5 text-yellow-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-5 h-5 text-blue-500" />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 blur transition-opacity ${
                isDark ? 'bg-yellow-400/20' : 'bg-blue-400/20'
              }`}
            />
          </motion.button>

          <LanguageSwitcher />
          
          <div className={`h-8 w-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className={`text-sm font-black leading-none mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user?.full_name}
              </p>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                {t(`roles.${user?.role}`)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center group hover:border-red-500/50 transition-colors cursor-pointer ${
              isDark 
                ? 'bg-white/5 border-white/10' 
                : 'bg-gray-100 border-gray-200'
            }`}>
              <User className={`w-6 h-6 transition-colors ${
                isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-900'
              }`} />
            </div>
          </div>
          
          <button
            onClick={logout}
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all group ${
              isDark 
                ? 'bg-white/5 border-white/10 text-gray-400' 
                : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}
            title={t('common.logout')}
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
}
