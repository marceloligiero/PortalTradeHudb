import { motion } from 'framer-motion';
import { LucideIcon, Sparkles } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface AnimatedStatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string; // e.g., 'from-red-500 to-orange-500'
  delay?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  showSparkle?: boolean;
  onClick?: () => void;
}

export default function AnimatedStatCard({
  icon: Icon,
  label,
  value,
  color,
  delay = 0,
  suffix = '',
  prefix = '',
  decimals = 0,
  showSparkle = true,
  onClick
}: AnimatedStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onClick}
      className={`relative group ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
      
      {/* Card content */}
      <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {showSparkle && (
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center"
            >
              <Sparkles className="w-4 h-4 text-white/30" />
            </motion.div>
          )}
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          <AnimatedCounter 
            value={value} 
            suffix={suffix} 
            prefix={prefix}
            decimals={decimals}
          />
        </div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
    </motion.div>
  );
}
