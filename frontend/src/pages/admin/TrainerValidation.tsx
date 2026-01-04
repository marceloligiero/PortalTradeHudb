import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  Mail, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserCheck, 
  UserX,
  Users,
  Shield,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import api from '../../lib/axios';

interface PendingTrainer {
  id: number;
  email: string;
  full_name: string;
  is_pending: boolean;
  created_at?: string;
}

const TrainerValidation = () => {
  const { t } = useTranslation();
  const [pendingTrainers, setPendingTrainers] = useState<PendingTrainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingTrainers();
  }, []);

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
    if (!window.confirm(`${t('admin.confirmApproveTrainer')} ${trainerName}?`)) {
      return;
    }

    try {
      setProcessingId(trainerId);
      await api.post(`/api/admin/validate-trainer/${trainerId}`);
      setSuccessMessage(`${trainerName} ${t('admin.approvedTrainer')}`);
      
      // Remove trainer from list with animation delay
      setTimeout(() => {
        setPendingTrainers(prev => prev.filter(t => t.id !== trainerId));
      }, 300);
      
      // Clear message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('messages.error'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (trainerId: number, trainerName: string) => {
    if (!window.confirm(`${t('admin.confirmRejectTrainer')} ${trainerName}?`)) {
      return;
    }

    try {
      setProcessingId(trainerId);
      await api.post(`/api/admin/reject-trainer/${trainerId}`);
      setSuccessMessage(`${trainerName} ${t('admin.rejectedTrainer')}`);
      
      // Remove trainer from list with animation delay
      setTimeout(() => {
        setPendingTrainers(prev => prev.filter(t => t.id !== trainerId));
      }, 300);
      
      // Clear message after 3 seconds
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
      minute: '2-digit'
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1 
      } 
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.4, 
        ease: [0.22, 1, 0.36, 1] 
      } 
    },
    exit: { 
      opacity: 0, 
      x: -100, 
      scale: 0.9,
      transition: { duration: 0.3 }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-red-600/20 border-t-red-600 rounded-full mx-auto"
            />
            <GraduationCap className="w-6 h-6 text-red-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-500 mt-4 font-medium">{t('messages.loading')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(220, 38, 38, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(220, 38, 38, 0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Floating orbs */}
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"
        />

        <div className="relative px-8 py-10">
          <div className="flex items-center gap-4 mb-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="p-3 bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-lg shadow-red-600/30"
            >
              <GraduationCap className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-1"
              >
                <Sparkles className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                  {t('admin.trainerManagement') || 'Gestão de Formadores'}
                </span>
              </motion.div>
              <h1 className="text-3xl font-bold text-white">
                {t('admin.pendingTrainerValidations')}
              </h1>
            </div>
          </div>
          
          <p className="text-gray-400 mt-2 max-w-2xl">
            {t('admin.trainerValidationDescription') || 'Revise e aprove os registos de novos formadores para que possam começar a criar cursos na plataforma.'}
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{pendingTrainers.length}</p>
                  <p className="text-xs text-gray-400">{t('admin.pendingValidations') || 'Validações Pendentes'}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">—</p>
                  <p className="text-xs text-gray-400">{t('admin.approvedThisMonth') || 'Aprovados este mês'}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">—</p>
                  <p className="text-xs text-gray-400">{t('admin.totalActiveTrainers') || 'Formadores Ativos'}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
          >
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-red-700 font-medium">{error}</p>
          </motion.div>
        )}

        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
          >
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-green-700 font-medium">{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div>
        {pendingTrainers.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6"
            >
              <Shield className="w-10 h-10 text-gray-400" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {t('admin.noTrainersPending')}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {t('admin.allTrainersValidated') || 'Todos os formadores foram validados. Volte mais tarde para verificar novos registos.'}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4"
          >
            <AnimatePresence mode="popLayout">
              {pendingTrainers.map((trainer) => (
                <motion.div
                  key={trainer.id}
                  variants={cardVariants}
                  layout
                  exit="exit"
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300 ${
                    processingId === trainer.id ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Trainer Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="relative"
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                            <span className="text-2xl font-bold text-white">
                              {trainer.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white"
                          />
                        </motion.div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {trainer.full_name}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="truncate">{trainer.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{formatDate(trainer.created_at)}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full border border-yellow-200">
                              <Clock className="w-3.5 h-3.5" />
                              {t('admin.awaitingValidation')}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                              <GraduationCap className="w-3.5 h-3.5" />
                              {t('roles.TRAINER')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 lg:flex-shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleApprove(trainer.id, trainer.full_name)}
                          disabled={processingId === trainer.id}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 font-semibold disabled:opacity-50"
                        >
                          <UserCheck className="w-5 h-5" />
                          <span>{t('admin.approve')}</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleReject(trainer.id, trainer.full_name)}
                          disabled={processingId === trainer.id}
                          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-300 hover:shadow-lg transition-all duration-300 font-semibold disabled:opacity-50"
                        >
                          <UserX className="w-5 h-5" />
                          <span>{t('admin.reject')}</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer with additional info */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Shield className="w-4 h-4" />
                        <span>{t('admin.requiresAdminApproval') || 'Requer aprovação do administrador para criar cursos'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <span>ID: #{trainer.id}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TrainerValidation;
