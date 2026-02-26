import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PremiumCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  delay?: number;
  hover?: boolean;
  glow?: boolean;
  glowColor?: string;
}

export default function PremiumCard({
  children,
  onClick,
  className = '',
  delay = 0,
  hover = true,
  glow = false,
  glowColor = 'red-600'
}: PremiumCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      onClick={onClick}
      className={`relative group ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Optional glow effect */}
      {glow && (
        <div className={`absolute inset-0 bg-${glowColor}/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      )}
      
      {/* Card content */}
      <div className="relative bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-6 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 h-full shadow-sm dark:shadow-none">
        {children}
      </div>
    </motion.div>
  );
}
