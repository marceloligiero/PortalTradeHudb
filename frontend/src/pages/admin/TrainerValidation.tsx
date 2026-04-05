import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShieldCheck, Mail, Calendar, CheckCircle, XCircle,
  Clock, UserCheck, UserX, Users, Shield, AlertCircle,
  BookOpen, Award, KeyRound, Crown, Eye
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore, canWrite } from '../../stores/authStore';

interface PendingTrainer {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_pending: boolean;
  is_formador?: boolean;
  is_tutor?: boolean;
  is_liberador?: boolean;
  is_chefe_equipe?: boolean;
  is_referente?: boolean;
  is_diretor?: boolean;
  is_gerente?: boolean;
  created_at?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.2 } },
};

const TrainerValidation = () => {
  const { t } = useTranslation();
  const { user: authUser } = useAuthStore();
  const writable = canWrite(authUser);
  const [pendingTrainers, setPendingTrainers] = useState<PendingTrainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [approvedThisMonth, setApprovedThisMonth] = useState<number>(0);
  const [totalActiveTrainers, setTotalActiveTrainers] = useState<number>(0);

  useEffect(() => {
    fetchPendingTrainers();
    fetchTrainerStats();
  }, []);

  const fetchTrainerStats = async () => {
    try {
      const response = await api.get('/api/admin/reports/stats');
      setApprovedThisMonth(response.data.approved_this_month ?? 0);
      setTotalActiveTrainers(response.data.total_trainers ?? 0);
    } catch {
      // Stats are non-critical, silently fail
    }
  };

  const fetchPendingTrainers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/pending-trainers');
      setPendingTrainers(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('messages.error'));
      setPendingTrainers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (trainerId: number, trainerName: string) => {
    if (!window.confirm(`${t('admin.confirmApproveTrainer')} ${trainerName}?`)) return;
    try {
      setProcessingId(trainerId);
      await api.post(`/api/admin/validate-trainer/${trainerId}`);
      setSuccessMessage(`${trainerName} ${t('admin.approvedTrainer')}`);
      setTimeout(() => setPendingTrainers(prev => prev.filter(t => t.id !== trainerId)), 300);
      fetchTrainerStats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('messages.error'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (trainerId: number, trainerName: string) => {
    if (!window.confirm(`${t('admin.confirmRejectTrainer')} ${trainerName}?`)) return;
    try {
      setProcessingId(trainerId);
      await api.post(`/api/admin/reject-trainer/${trainerId}`);
      setSuccessMessage(`${trainerName} ${t('admin.rejectedTrainer')}`);
      setTimeout(() => setPendingTrainers(prev => prev.filter(t => t.id !== trainerId)), 300);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('messages.error'));
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('admin.dateNotAvailable') || 'Data não disponível';
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadges = (trainer: PendingTrainer) => {
    const badges: { label: string; icon: typeof BookOpen; color: string }[] = [];
    if (trainer.is_formador) badges.push({ label: t('auth.roles.trainer', 'Formador'), icon: BookOpen, color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' });
    if (trainer.is_tutor) badges.push({ label: t('auth.roles.tutor', 'Tutor'), icon: Award, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' });
    if (trainer.is_liberador) badges.push({ label: t('auth.roles.releaser', 'Liberador'), icon: KeyRound, color: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20' });
    if (trainer.is_gerente || trainer.is_chefe_equipe) badges.push({ label: t('auth.roles.teamLead', 'Chefe de Equipa'), icon: Crown, color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' });
    if (trainer.is_referente) badges.push({ label: t('auth.roles.referente', 'Referente'), icon: UserCheck, color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' });
    if (trainer.is_diretor) badges.push({ label: t('auth.roles.gestor', 'Diretor'), icon: Eye, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700' });
    return badges;
  };

  /* ── Loading ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 mt-4 font-body text-sm">{t('messages.loading')}</p>
        </div>
      </div>
    );
  }

  /* ── Main ──────────────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#EC0000]" />
            </div>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
                {t('admin.trainerManagement') || 'Gestão de Utilizadores'}
              </p>
              <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {t('admin.pendingTrainerValidations')}
              </h1>
              <p className="font-body text-gray-500 dark:text-gray-400 mt-1 max-w-xl text-sm">
                {t('admin.trainerValidationDescription') || 'Revise e aprove os registos de novos utilizadores com roles especiais para que possam aceder às funcionalidades da plataforma.'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {[
            { icon: Clock, value: pendingTrainers.length, label: t('admin.pendingValidations') || 'Validações Pendentes', accent: pendingTrainers.length > 0 ? 'text-amber-500' : 'text-gray-400' },
            { icon: UserCheck, value: approvedThisMonth, label: t('admin.approvedThisMonth') || 'Aprovados este mês', accent: 'text-emerald-500' },
            { icon: Users, value: totalActiveTrainers, label: t('admin.totalActiveTrainers') || 'Utilizadores Ativos', accent: 'text-blue-500' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.accent} shrink-0`} />
              <div>
                <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="font-body text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-4 rounded-2xl border border-l-4 border-l-red-500 border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="font-body text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
          </motion.div>
        )}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-4 rounded-2xl border border-l-4 border-l-emerald-500 border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5"
          >
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="font-body text-sm text-emerald-700 dark:text-emerald-400 font-medium">{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ─────────────────────────────────────── */}
      {pendingTrainers.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="font-headline text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">
            {t('admin.noTrainersPending')}
          </h3>
          <p className="font-body text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto">
            {t('admin.allTrainersValidated') || 'Todos os utilizadores foram validados. Volte mais tarde para verificar novos registos.'}
          </p>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
          <AnimatePresence mode="popLayout">
            {pendingTrainers.map((trainer) => {
              const badges = getRoleBadges(trainer);
              return (
                <motion.div
                  key={trainer.id}
                  variants={cardVariants}
                  layout
                  exit="exit"
                  className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-[#EC0000]/30 transition-colors duration-200 ${
                    processingId === trainer.id ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                      {/* Trainer info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-xl bg-[#EC0000] flex items-center justify-center shrink-0">
                          <span className="text-lg font-bold text-white font-headline">
                            {trainer.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-headline text-base font-bold text-gray-900 dark:text-white truncate">
                              {trainer.full_name}
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                              <Clock className="w-3 h-3" />
                              {t('admin.awaitingValidation')}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" />
                              <span className="truncate">{trainer.email}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(trainer.created_at)}
                            </span>
                          </div>

                          {/* Role badges */}
                          {badges.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {badges.map((badge, i) => (
                                <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border ${badge.color}`}>
                                  <badge.icon className="w-3 h-3" />
                                  {badge.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {writable && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApprove(trainer.id, trainer.full_name)}
                            disabled={processingId === trainer.id}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                          >
                            <UserCheck className="w-4 h-4" />
                            {t('admin.approve')}
                          </button>
                          <button
                            onClick={() => handleReject(trainer.id, trainer.full_name)}
                            disabled={processingId === trainer.id}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-500/30 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                          >
                            <UserX className="w-4 h-4" />
                            {t('admin.reject')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        {t('admin.requiresAdminApproval') || 'Requer aprovação do administrador para aceder à plataforma'}
                      </span>
                      <span className="font-mono">#{trainer.id}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default TrainerValidation;
