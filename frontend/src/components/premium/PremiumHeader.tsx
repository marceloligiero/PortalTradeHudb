import { motion } from 'framer-motion';
import { LucideIcon, Sparkles } from 'lucide-react';
import { ReactNode } from 'react';
import FloatingOrbs from './FloatingOrbs';
import { GridBackground } from './GridBackground';

interface PremiumHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  actions?: ReactNode;
  children?: ReactNode;
  variant?: 'default' | 'compact';
  iconColor?: string; // e.g., 'from-red-500 to-red-700'
}

export default function PremiumHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeColor = 'text-red-400',
  actions,
  children,
  variant = 'default',
  iconColor = 'from-red-500 to-red-700'
}: PremiumHeaderProps) {
  const isCompact = variant === 'compact';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-transparent"
    >
      {/* Background elements */}
      <GridBackground />
      <FloatingOrbs variant="subtle" />

      {/* Content */}
      <div className={`relative ${isCompact ? 'px-6 py-6' : 'px-8 py-10'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`p-3 bg-gradient-to-br ${iconColor} rounded-xl shadow-lg shadow-red-600/30`}
            >
              <Icon className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
            </motion.div>
            <div>
              {badge && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mb-1"
                >
                  <Sparkles className="w-4 h-4 text-red-500 dark:text-red-400" />
                  <span className={`text-xs font-semibold ${badgeColor} uppercase tracking-wider`}>
                    {badge}
                  </span>
                </motion.div>
              )}
              <h1 className={`${isCompact ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 dark:text-white`}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex flex-wrap gap-3">
              {actions}
            </div>
          )}
        </div>

        {children && (
          <div className="mt-6">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
}
