import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface AuthSubmitButtonProps {
  loading: boolean;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: 'submit' | 'button';
  disabled?: boolean;
}

/**
 * AuthSubmitButton — Unified submit button with #EC0000, shine sweep, hover glow.
 */
export default function AuthSubmitButton({ loading, label, icon, onClick, type = 'submit', disabled }: AuthSubmitButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      whileHover={{ scale: 1.015, y: -1 }}
      whileTap={{ scale: 0.985 }}
      className="relative w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-body font-bold text-[15px] overflow-hidden disabled:opacity-50 group cursor-pointer transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(236,0,0,0.35)]"
      style={{ background: '#EC0000' }}
    >
      {/* Shine sweep */}
      <span className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" aria-hidden="true">
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[shine_3s_ease-in-out_infinite]" />
      </span>
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: '0 12px 40px rgba(236,0,0,0.4), 0 4px 12px rgba(236,0,0,0.3)' }}
      />
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
        />
      ) : (
        <span className="relative flex items-center gap-2.5">
          {icon}
          <span>{label}</span>
          <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-0.5 transition-transform" />
        </span>
      )}
    </motion.button>
  );
}
