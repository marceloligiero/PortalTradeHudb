import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users as UsersIcon, 
  UserCheck, 
  UserX, 
  Clock, 
  Search, 
  Filter,
  MoreVertical,
  Mail,
  Shield,
  GraduationCap,
  Briefcase,
  ChevronDown,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  RefreshCw,
  X,
  Save,
  Award,
  BookOpen,
  Timer,
  Target
} from 'lucide-react';
import api from '../../lib/axios';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'TRAINEE' | 'TRAINER' | 'ADMIN';
  is_active: boolean;
  is_pending: boolean;
  created_at: string;
}

interface UserDetails extends User {
  stats: {
    enrollments_count: number;
    certificates_count: number;
    completed_lessons: number;
    total_lessons: number;
    total_study_time_minutes: number;
    completion_rate: number;
  };
}

// Animated Counter Component
const AnimatedCounter = ({ value, className = '' }: { value: number; className?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span className={className}>{displayValue}</span>;
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="relative group"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
    <div className="relative bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-6 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 shadow-lg dark:shadow-none">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center"
        >
          <Sparkles className="w-4 h-4 text-gray-400 dark:text-white/30" />
        </motion.div>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        <AnimatedCounter value={value} />
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  </motion.div>
);

// Modal Base Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {children}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// User Details Modal Content
const UserDetailsContent = ({ user, onClose, t }: { user: UserDetails | null; onClose: () => void; t: any }) => {
  if (!user) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('usersPage.loading')}</div>;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return t('usersPage.admin');
      case 'TRAINER': return t('usersPage.trainer');
      default: return t('usersPage.student');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
          {user.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{user.full_name}</h3>
          <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300' :
              user.role === 'TRAINER' ? 'bg-blue-500/20 text-blue-300' :
              'bg-green-500/20 text-green-300'
            }`}>
              {getRoleLabel(user.role)}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              user.is_pending ? 'bg-yellow-500/20 text-yellow-300' :
              user.is_active ? 'bg-emerald-500/20 text-emerald-300' :
              'bg-red-500/20 text-red-300'
            }`}>
              {user.is_pending ? t('usersPage.pending') : user.is_active ? t('usersPage.active') : t('usersPage.inactive')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('usersPage.enrollments')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.stats.enrollments_count}</p>
        </div>
        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('usersPage.certificates')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.stats.certificates_count}</p>
        </div>
        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-500 dark:text-green-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('usersPage.progress')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.stats.completion_rate}%</p>
          <p className="text-xs text-gray-500">{user.stats.completed_lessons}/{user.stats.total_lessons} {t('usersPage.lessonsProgress')}</p>
        </div>
        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('usersPage.studyTime')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatTime(user.stats.total_study_time_minutes)}</p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('usersPage.additionalInfo')}</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('usersPage.userId')}</span>
            <span className="text-gray-900 dark:text-white font-mono">#{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('usersPage.registrationDate')}</span>
            <span className="text-gray-900 dark:text-white">{formatDate(user.created_at)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/10"
      >
        {t('usersPage.close')}
      </button>
    </div>
  );
};

// Edit User Modal Content
const EditUserContent = ({ user, onSave, onClose, saving, t }: { user: User | null; onSave: (data: any) => void; onClose: () => void; saving: boolean; t: any }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'TRAINEE' as 'TRAINEE' | 'TRAINER' | 'ADMIN',
    is_active: true
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      });
    }
  }, [user]);

  if (!user) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">A carregar...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('usersPage.fullName')}</label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
          placeholder={t('usersPage.userNamePlaceholder')}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('usersPage.email')}</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
          placeholder="email@exemplo.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('usersPage.role')}</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all outline-none appearance-none cursor-pointer"
        >
          <option value="TRAINEE" className="bg-white dark:bg-gray-900">{t('usersPage.student')}</option>
          <option value="TRAINER" className="bg-white dark:bg-gray-900">{t('usersPage.trainer')}</option>
          <option value="ADMIN" className="bg-white dark:bg-gray-900">{t('usersPage.admin')}</option>
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/10"
          disabled={saving}
        >
          {t('usersPage.cancel')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              {t('usersPage.saving')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {t('usersPage.save')}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// Deactivate Confirmation Modal Content
const DeactivateConfirmContent = ({ user, onConfirm, onClose, processing, t }: { user: User | null; onConfirm: () => void; onClose: () => void; processing: boolean; t: any }) => {
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
          <UserX className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('usersPage.deactivateUser')}</h3>
        <p className="text-gray-500 dark:text-gray-400">
          {t('usersPage.deactivateConfirmText')} <span className="text-gray-900 dark:text-white font-medium">{user.full_name}</span>?
        </p>
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">{t('usersPage.userCannotAccess')}</p>
      </div>

      <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-gray-900 dark:text-white font-medium">{user.full_name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/10"
          disabled={processing}
        >
          {t('usersPage.cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={processing}
          className="flex-1 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {processing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              {t('usersPage.deactivating')}
            </>
          ) : (
            <>
              <UserX className="w-4 h-4" />
              {t('usersPage.deactivate')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Reactivate Confirmation Modal Content
const ReactivateConfirmContent = ({ user, onConfirm, onClose, processing, t }: { user: User | null; onConfirm: () => void; onClose: () => void; processing: boolean; t: any }) => {
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
          <UserCheck className="w-8 h-8 text-green-500 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('usersPage.reactivateUser')}</h3>
        <p className="text-gray-500 dark:text-gray-400">
          {t('usersPage.reactivateConfirmText')} <span className="text-gray-900 dark:text-white font-medium">{user.full_name}</span>?
        </p>
        <p className="text-sm text-green-600 dark:text-green-400 mt-2">{t('usersPage.userCanAccess')}</p>
      </div>

      <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-gray-900 dark:text-white font-medium">{user.full_name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/10"
          disabled={processing}
        >
          {t('usersPage.cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={processing}
          className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {processing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              {t('usersPage.reactivating')}
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4" />
              {t('usersPage.reactivate')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// User Row Component
const UserRow = ({ user, index, onApprove, onReject, onView, onEdit, onDeactivate, onReactivate, t }: any) => {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return Shield;
      case 'TRAINER': return Briefcase;
      default: return GraduationCap;
    }
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'ADMIN': return { 
        bg: 'from-purple-500/20 to-purple-600/20', 
        border: 'border-purple-500/30',
        text: 'text-purple-300'
      };
      case 'TRAINER': return { 
        bg: 'from-blue-500/20 to-blue-600/20', 
        border: 'border-blue-500/30',
        text: 'text-blue-300'
      };
      default: return { 
        bg: 'from-green-500/20 to-green-600/20', 
        border: 'border-green-500/30',
        text: 'text-green-300'
      };
    }
  };

  const RoleIcon = getRoleIcon(user.role);
  const roleConfig = getRoleConfig(user.role);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      className="px-6 py-4 border-b border-white/5 last:border-b-0"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
              user.is_pending ? 'bg-yellow-500' : user.is_active ? 'bg-green-500' : 'bg-red-500'
            }`} />
          </motion.div>
          
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-gray-900 dark:text-white font-medium">{user.full_name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${roleConfig.bg} ${roleConfig.border} border ${roleConfig.text}`}>
                <RoleIcon className="w-3 h-3 inline mr-1" />
                {user.role === 'ADMIN' ? t('usersPage.admin') : user.role === 'TRAINER' ? t('usersPage.trainer') : t('usersPage.student')}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user.is_pending && user.role === 'TRAINER' ? (
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onApprove(user.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium shadow-lg shadow-green-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('usersPage.approve')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onReject(user.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
              >
                <XCircle className="w-4 h-4" />
                {t('usersPage.reject')}
              </motion.button>
            </div>
          ) : (
            <div className="relative" ref={actionsRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowActions(!showActions)}
                className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center transition-all"
              >
                <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </motion.button>
              
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden z-50"
                  >
                    <button 
                      onClick={() => { onView(user.id); setShowActions(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      {t('usersPage.viewDetails')}
                    </button>
                    <button 
                      onClick={() => { onEdit(user); setShowActions(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                      {t('usersPage.edit')}
                    </button>
                    {user.is_active ? (
                      <button 
                        onClick={() => { onDeactivate(user); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 transition-all"
                      >
                        <UserX className="w-4 h-4" />
                        {t('usersPage.deactivate')}
                      </button>
                    ) : (
                      <button 
                        onClick={() => { onReactivate(user); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-green-400 hover:bg-green-500/10 hover:text-green-300 transition-all"
                      >
                        <UserCheck className="w-4 h-4" />
                        {t('usersPage.reactivate')}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/users');
      setUsers(response.data?.items ?? response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTrainer = async (userId: number) => {
    try {
      await api.post(`/api/admin/validate-trainer/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error('Error approving trainer:', error);
    }
  };

  const handleRejectTrainer = async (userId: number) => {
    try {
      await api.delete(`/api/admin/reject-trainer/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting trainer:', error);
    }
  };

  const handleViewUser = async (userId: number) => {
    setViewModalOpen(true);
    setUserDetails(null);
    try {
      const response = await api.get(`/api/admin/users/${userId}`);
      setUserDetails(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleSaveUser = async (formData: any) => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api.put(`/api/admin/users/${selectedUser.id}`, formData);
      setEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateUser = (user: User) => {
    setSelectedUser(user);
    setDeactivateModalOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      await api.put(`/api/admin/users/${selectedUser.id}`, { is_active: false });
      setDeactivateModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivateUser = (user: User) => {
    setSelectedUser(user);
    setReactivateModalOpen(true);
  };

  const handleConfirmReactivate = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      await api.put(`/api/admin/users/${selectedUser.id}`, { is_active: true });
      setReactivateModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error reactivating user:', error);
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'pending' ? user.is_pending :
      filter === 'active' ? user.is_active && !user.is_pending :
      filter === 'inactive' ? !user.is_active : true;
    
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active && !u.is_pending).length,
    pending: users.filter(u => u.is_pending).length,
    trainers: users.filter(u => u.role === 'TRAINER').length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none dark:block hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('admin.users')}</h1>
                <p className="text-gray-500 dark:text-gray-400">{t('admin.usersDescription')}</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={UsersIcon} label={t('usersPage.totalUsers')} value={stats.total} color="from-blue-500 to-cyan-500" delay={0} />
            <StatCard icon={UserCheck} label={t('usersPage.activeUsers')} value={stats.active} color="from-green-500 to-emerald-500" delay={0.1} />
            <StatCard icon={Clock} label={t('usersPage.pendingUsers')} value={stats.pending} color="from-yellow-500 to-orange-500" delay={0.2} />
            <StatCard icon={Briefcase} label={t('usersPage.trainers')} value={stats.trainers} color="from-purple-500 to-pink-500" delay={0.3} />
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-none">
              <div className="p-6 border-b border-gray-200 dark:border-white/10">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('usersPage.searchUsers')}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                      >
                        <Filter className="w-4 h-4" />
                        <span>{t('usersPage.filters')}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {showFilters && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden z-50"
                          >
                            {[
                              { value: 'all', label: t('usersPage.all'), icon: UsersIcon },
                              { value: 'active', label: t('usersPage.actives'), icon: UserCheck },
                              { value: 'pending', label: t('usersPage.pendingUsers'), icon: Clock },
                              { value: 'inactive', label: t('usersPage.inactives'), icon: UserX }
                            ].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => { setFilter(option.value as any); setShowFilters(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                                  filter === option.value ? 'bg-red-500/20 text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                }`}
                              >
                                <option.icon className="w-4 h-4" />
                                {option.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={fetchUsers}
                      className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white font-medium shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-shadow"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      {t('usersPage.refresh')}
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-2 border-red-500/30 border-t-red-500 rounded-full mb-4"
                    />
                    <p className="text-gray-500 dark:text-gray-400">{t('messages.loading')}</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                      <AlertCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">{t('admin.noUsers')}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t('usersPage.tryAdjustFilters')}</p>
                  </div>
                ) : (
                  filteredUsers.map((user, index) => (
                    <UserRow 
                      key={user.id} 
                      user={user} 
                      index={index}
                      onApprove={handleApproveTrainer}
                      onReject={handleRejectTrainer}
                      onView={handleViewUser}
                      onEdit={handleEditUser}
                      onDeactivate={handleDeactivateUser}
                      onReactivate={handleReactivateUser}
                      t={t}
                    />
                  ))
                )}
              </div>

              {!loading && filteredUsers.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10 flex items-center justify-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('usersPage.showingOf', { showing: filteredUsers.length, total: users.length }).split('{{showing}}')[0]}
                    <span className="text-gray-900 dark:text-white font-medium">{filteredUsers.length}</span>
                    {t('usersPage.showingOf').split('{{showing}}')[1]?.split('{{total}}')[0]}
                    <span className="text-gray-900 dark:text-white font-medium">{users.length}</span>
                    {t('usersPage.showingOf').split('{{total}}')[1]}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={t('usersPage.userDetails')}>
        <UserDetailsContent user={userDetails} onClose={() => setViewModalOpen(false)} t={t} />
      </Modal>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={t('usersPage.editUser')}>
        <EditUserContent user={selectedUser} onSave={handleSaveUser} onClose={() => setEditModalOpen(false)} saving={saving} t={t} />
      </Modal>

      <Modal isOpen={deactivateModalOpen} onClose={() => setDeactivateModalOpen(false)} title={t('usersPage.confirmDeactivation')}>
        <DeactivateConfirmContent user={selectedUser} onConfirm={handleConfirmDeactivate} onClose={() => setDeactivateModalOpen(false)} processing={processing} t={t} />
      </Modal>

      <Modal isOpen={reactivateModalOpen} onClose={() => setReactivateModalOpen(false)} title={t('usersPage.confirmReactivation')}>
        <ReactivateConfirmContent user={selectedUser} onConfirm={handleConfirmReactivate} onClose={() => setReactivateModalOpen(false)} processing={processing} t={t} />
      </Modal>
    </div>
  );
}
