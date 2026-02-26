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
    <header className="backdrop-blur-2xl border-b px-2 py-3 sticky top-0 z-50 transition-colors duration-300 print:hidden bg-white/80 dark:bg-[#0a0a0a]/80 border-gray-200 dark:border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/logo-sds.png"
            alt="Santander Digital Services"
            className="h-10 w-auto object-contain transition-all dark:brightness-100 brightness-0"
          />
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          {/* Theme Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-300 relative group bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border-gray-200 dark:border-white/10 hover:border-blue-400/50 dark:hover:border-yellow-400/50"
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
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 blur transition-opacity bg-blue-400/20 dark:bg-yellow-400/20"
            />
          </motion.button>

          <LanguageSwitcher />
          
          <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black leading-none mb-1 text-gray-900 dark:text-white">
                {user?.full_name}
              </p>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                {t(`roles.${user?.role}`)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl border flex items-center justify-center group hover:border-red-500/50 transition-colors cursor-pointer bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <User className="w-6 h-6 transition-colors text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-12 h-12 rounded-2xl border flex items-center justify-center hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all group bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400"
            title={t('common.logout')}
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
}
