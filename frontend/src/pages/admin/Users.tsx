import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  Briefcase,
  Crown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  Target,
  KeyRound,
  Loader2
} from 'lucide-react';

const USERS_PAGE_SIZE = 20;
import api from '../../lib/axios';
import { useAuthStore, canWrite } from '../../stores/authStore';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'TRAINEE' | 'TRAINER' | 'ADMIN' | 'MANAGER';
  is_active: boolean;
  is_pending: boolean;
  is_trainer: boolean;
  is_tutor: boolean;
  is_liberador: boolean;
  is_team_lead: boolean;
  is_referente: boolean;
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

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
    <div className="flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  </div>
);

// Modal Base Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-headline font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-73px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

// User Details Modal Content
const UserDetailsContent = ({ user, onClose, t }: { user: UserDetails | null; onClose: () => void; t: any }) => {
  if (!user) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('usersPage.loading')}</div>;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':    return t('usersPage.admin');
      case 'TRAINER':  return t('usersPage.trainer');
      case 'MANAGER':  return t('usersPage.teamLeader');
      case 'TRAINEE':  return t('usersPage.trainee');
      default:         return t('usersPage.student');
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
            {user.role !== 'TRAINEE' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300' :
                user.role === 'TRAINER' ? 'bg-blue-500/20 text-blue-300' :
                'bg-orange-500/20 text-orange-300'
              }`}>
                {getRoleLabel(user.role)}
              </span>
            )}
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
    role: 'TRAINEE' as 'TRAINEE' | 'TRAINER' | 'ADMIN' | 'MANAGER',
    is_active: true,
    is_trainer: false,
    is_tutor: false,
    is_liberador: false,
    is_team_lead: false,
    is_referente: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        is_trainer: user.is_trainer ?? false,
        is_tutor: user.is_tutor ?? false,
        is_liberador: user.is_liberador ?? false,
        is_team_lead: user.is_team_lead ?? false,
        is_referente: user.is_referente ?? false,
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

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('usersPage.role', 'Perfil')}</label>
        {(formData.role === 'ADMIN' || formData.role === 'MANAGER') ? (
          <div className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed">
            {formData.role === 'ADMIN' ? t('usersPage.admin') : t('usersPage.teamLeader')}
            <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({t('usersPage.roleReadOnly', 'não editável')})</span>
          </div>
        ) : (
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all outline-none appearance-none cursor-pointer text-sm"
          >
            <option value="TRAINEE">{t('usersPage.trainee', 'Formando')}</option>
            <option value="TRAINER">{t('usersPage.trainerRole', 'Formador (perfil)')}</option>
          </select>
        )}
      </div>

      {/* Competências adicionais */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('usersPage.additionalCapabilities', 'Competências adicionais')}</label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer hover:border-blue-500/30 transition-all">
            <input
              type="checkbox"
              checked={formData.is_trainer}
              onChange={(e) => setFormData({ ...formData, is_trainer: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Briefcase className="w-4 h-4 text-blue-400" />
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{t('usersPage.trainer', 'Formador')}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('usersPage.trainerDesc', 'Pode criar cursos e avaliar formandos')}</p>
            </div>
          </label>
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer hover:border-emerald-500/30 transition-all">
            <input
              type="checkbox"
              checked={formData.is_tutor}
              onChange={(e) => setFormData({ ...formData, is_tutor: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <Award className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{t('usersPage.tutor', 'Tutor')}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('usersPage.tutorDesc', 'Pode supervisionar e orientar colaboradores')}</p>
            </div>
          </label>
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer hover:border-orange-500/30 transition-all">
            <input
              type="checkbox"
              checked={formData.is_team_lead}
              onChange={(e) => setFormData({ ...formData, is_team_lead: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <Crown className="w-4 h-4 text-orange-400" />
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{t('usersPage.teamLeader', 'Chefe de Equipa')}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('usersPage.teamLeaderDesc', 'Pode gerir equipas e aprovar planos')}</p>
            </div>
          </label>
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer hover:border-purple-500/30 transition-all">
            <input
              type="checkbox"
              checked={formData.is_referente}
              onChange={(e) => setFormData({ ...formData, is_referente: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <Shield className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{t('usersPage.referente', 'Referente')}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('usersPage.referenteDesc', 'Representante do chefe na análise de incidências')}</p>
            </div>
          </label>
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer hover:border-cyan-500/30 transition-all">
            <input
              type="checkbox"
              checked={formData.is_liberador}
              onChange={(e) => setFormData({ ...formData, is_liberador: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{t('usersPage.liberador', 'Liberador')}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('usersPage.liberadorDesc', 'Pode aprovar operações e registar erros internos')}</p>
            </div>
          </label>
        </div>
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
const UserRow = ({ user, onApprove, onReject, onView, onEdit, onDeactivate, onReactivate, writable, t }: any) => {
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

  const statusDot =
    user.is_pending ? 'bg-yellow-400' : user.is_active ? 'bg-emerald-500' : 'bg-gray-400';

  return (
    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Avatar + info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#EC0000] flex items-center justify-center text-white font-bold text-sm">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${statusDot}`} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.full_name}</span>

              {/* Role badges — only for non-TRAINEE roles */}
              {user.role === 'ADMIN' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  <Shield className="w-2.5 h-2.5" />{t('usersPage.admin')}
                </span>
              )}
              {user.role === 'MANAGER' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                  <Crown className="w-2.5 h-2.5" />{t('usersPage.teamLeader')}
                </span>
              )}
              {user.role === 'TRAINER' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <Briefcase className="w-2.5 h-2.5" />{t('usersPage.trainer', 'Formador')}
                </span>
              )}

              {/* Capability badges */}
              {user.is_trainer && user.role !== 'TRAINER' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <Briefcase className="w-2.5 h-2.5" />{t('usersPage.trainer', 'Formador')}
                </span>
              )}
              {user.is_tutor && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <Award className="w-2.5 h-2.5" />{t('usersPage.tutor', 'Tutor')}
                </span>
              )}
              {user.is_liberador && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                  <KeyRound className="w-2.5 h-2.5" />{t('usersPage.liberador', 'Liberador')}
                </span>
              )}
              {user.is_team_lead && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <Crown className="w-2.5 h-2.5" />{t('usersPage.teamLeader', 'Chefe de Equipa')}
                </span>
              )}
              {user.is_referente && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                  <Shield className="w-2.5 h-2.5" />{t('usersPage.referente', 'Referente')}
                </span>
              )}

              {/* Pending badge */}
              {user.is_pending && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                  <Clock className="w-2.5 h-2.5" />{t('usersPage.pending')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user.is_pending && (user.is_trainer || user.is_tutor || user.is_liberador || user.role === 'MANAGER') ? (
            writable && (
              <>
                <button
                  onClick={() => onApprove(user.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('usersPage.approve')}
                </button>
                <button
                  onClick={() => onReject(user.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {t('usersPage.reject')}
                </button>
              </>
            )
          ) : (
            <div className="relative" ref={actionsRef}>
              <button
                onClick={() => setShowActions(!showActions)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>

              {showActions && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden z-50">
                  <button
                    onClick={() => { onView(user.id); setShowActions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {t('usersPage.viewDetails')}
                  </button>
                  {writable && (
                    <>
                      <button
                        onClick={() => { onEdit(user); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        {t('usersPage.edit')}
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-800" />
                      {user.is_active ? (
                        <button
                          onClick={() => { onDeactivate(user); setShowActions(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                        >
                          <UserX className="w-4 h-4" />
                          {t('usersPage.deactivate')}
                        </button>
                      ) : (
                        <button
                          onClick={() => { onReactivate(user); setShowActions(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                          {t('usersPage.reactivate')}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function UsersPage() {
  const { t } = useTranslation();
  const { user: authUser } = useAuthStore();
  const writable = canWrite(authUser);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

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

  const totalPages = Math.ceil(filteredUsers.length / USERS_PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice((page - 1) * USERS_PAGE_SIZE, page * USERS_PAGE_SIZE);

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active && !u.is_pending).length,
    pending: users.filter(u => u.is_pending).length,
    trainers: users.filter(u => u.is_trainer || u.role === 'TRAINER').length
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <UsersIcon className="w-5 h-5 text-[#EC0000]" />
        </div>
        <div>
          <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">{t('admin.users')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.usersDescription')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UsersIcon} label={t('usersPage.totalUsers')} value={stats.total} color="from-[#EC0000] to-red-700" />
        <StatCard icon={UserCheck} label={t('usersPage.activeUsers')} value={stats.active} color="from-emerald-500 to-emerald-700" />
        <StatCard icon={Clock} label={t('usersPage.pendingUsers')} value={stats.pending} color="from-yellow-500 to-amber-600" />
        <StatCard icon={Briefcase} label={t('usersPage.trainers')} value={stats.trainers} color="from-blue-500 to-blue-700" />
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder={t('usersPage.searchUsers')}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#EC0000]/40 focus:ring-2 focus:ring-[#EC0000]/10 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Filter className="w-4 h-4" />
                {t('usersPage.filters')}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden z-50">
                  {[
                    { value: 'all', label: t('usersPage.all'), icon: UsersIcon },
                    { value: 'active', label: t('usersPage.actives'), icon: UserCheck },
                    { value: 'pending', label: t('usersPage.pendingUsers'), icon: Clock },
                    { value: 'inactive', label: t('usersPage.inactives'), icon: UserX },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setFilter(option.value as any); setShowFilters(false); setPage(1); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        filter === option.value
                          ? 'bg-red-50 dark:bg-red-900/20 text-[#EC0000]'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <option.icon className="w-4 h-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] rounded-xl text-sm text-white font-semibold transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {t('usersPage.refresh')}
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#EC0000] mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('messages.loading')}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <AlertCircle className="w-7 h-7 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('admin.noUsers')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('usersPage.tryAdjustFilters')}</p>
          </div>
        ) : (
          paginatedUsers.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onApprove={handleApproveTrainer}
              onReject={handleRejectTrainer}
              onView={handleViewUser}
              onEdit={handleEditUser}
              onDeactivate={handleDeactivateUser}
              onReactivate={handleReactivateUser}
              writable={writable}
              t={t}
            />
          ))
        )}

        {!loading && filteredUsers.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(page - 1) * USERS_PAGE_SIZE + 1}–{Math.min(page * USERS_PAGE_SIZE, filteredUsers.length)} / {filteredUsers.length}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`e-${i}`} className="px-1 text-xs text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                          p === page
                            ? 'bg-[#EC0000] text-white'
                            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
          </div>
        )}
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
