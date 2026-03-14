import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Target,
  ArrowLeft,
  BookOpen,
  Edit3,
  Trash2,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Play,
  Trophy,
  Timer,
  BarChart3,
  Zap
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

interface Challenge {
  id: number;
  course_id: number;
  course_title: string;
  title: string;
  description: string;
  challenge_type: string;
  operations_required: number;
  time_limit_minutes: number;
  target_mpu: number;
  max_errors: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_submissions: number;
  avg_score: number;
  completion_rate: number;
}

export default function ChallengeDetail() {
  const { courseId, challengeId } = useParams<{ courseId: string; challengeId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use different API based on user role
      const apiPath = isAdmin 
        ? `/api/admin/courses/${courseId}/challenges/${challengeId}` 
        : `/api/trainer/courses/${courseId}/challenges/${challengeId}`;
      const response = await api.get(apiPath);
      setChallenge(response.data);
    } catch (err: any) {
      console.error('Error fetching challenge:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar desafio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && challengeId && user) {
      fetchChallenge();
    }
  }, [courseId, challengeId, user]);

  const handleDeleteChallenge = async () => {
    if (!challenge || !window.confirm(t('admin.confirmDeleteChallenge'))) return;

    try {
      await api.delete(`/api/admin/courses/${courseId}/challenges/${challenge.id}`);
      navigate(`/courses/${courseId}`);
    } catch (err) {
      console.error('Error deleting challenge:', err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getChallengeTypeLabel = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'COMPLETE': return t('admin.completeChallenge');
      case 'SUMMARY': return t('admin.summaryChallenge');
      default: return type || '-';
    }
  };

  const getChallengeTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'COMPLETE': return 'bg-purple-100 text-purple-700';
      case 'SUMMARY': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('common.error')}</h2>
          <p className="text-gray-500 mb-4">{error || 'Desafio não encontrado'}</p>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('common.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 rounded-2xl"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(168, 85, 247, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(168, 85, 247, 0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl" />
        
        <div className="relative p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('common.backToCourse')}</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Target className="w-10 h-10 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getChallengeTypeColor(challenge.challenge_type)}`}>
                    {getChallengeTypeLabel(challenge.challenge_type)}
                  </span>
                  {challenge.is_active ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                      {t('admin.active')}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm">
                      {t('admin.inactive')}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">{challenge.title}</h1>
                <p className="text-gray-300 max-w-2xl">{challenge.description}</p>
              </div>
            </div>
            
            {isAdmin && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/courses/${courseId}/challenges/${challenge.id}/edit`)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  {t('common.edit')}
                </button>
                <button
                  onClick={handleDeleteChallenge}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete')}
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{challenge.operations_required}</p>
                  <p className="text-sm text-gray-400">{t('admin.operationsRequired')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Timer className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{challenge.time_limit_minutes}</p>
                  <p className="text-sm text-gray-400">{t('admin.minutesLimit')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{challenge.target_mpu?.toFixed(1)}</p>
                  <p className="text-sm text-gray-400">{t('admin.targetMPU')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{challenge.max_errors}</p>
                  <p className="text-sm text-gray-400">{t('admin.maxErrors')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Challenge Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.challengeDetails')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">{t('admin.course')}</p>
                    <p className="font-medium text-gray-900">{challenge.course_title}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">{t('admin.type')}</p>
                    <p className="font-medium text-gray-900">{getChallengeTypeLabel(challenge.challenge_type)}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">{t('admin.createdAt')}</p>
                    <p className="font-medium text-gray-900">{formatDate(challenge.created_at)}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">{t('admin.submissions')}</p>
                    <p className="font-medium text-gray-900">{challenge.total_submissions || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.description')}</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {challenge.description || t('admin.noDescription')}
            </p>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card - Catálogo */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">{t('admin.catalogInfo', 'Informação do Catálogo')}</h3>
            </div>
            <p className="text-sm text-gray-600">
              {t('admin.catalogDescription', 'Este desafio faz parte do catálogo de cursos. Para executar ou ver resultados, acesse através de um Plano de Formação.')}
            </p>
          </motion.div>

          {/* Performance Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-900">{t('admin.performance')}</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('admin.totalSubmissions')}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {challenge.total_submissions || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('admin.avgScore')}</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {challenge.avg_score?.toFixed(1) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('admin.completionRate')}</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {challenge.completion_rate?.toFixed(0) || 0}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Requirements */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.requirements')}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">
                  {t('admin.minOperations')}: <strong>{challenge.operations_required}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">
                  {t('admin.targetMPU')}: <strong>{challenge.target_mpu?.toFixed(1)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">
                  {t('admin.maxTime')}: <strong>{challenge.time_limit_minutes} min</strong>
                </span>
              </div>
              {challenge.max_errors > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-gray-700">
                    {t('admin.maxErrorsAllowed')}: <strong>{challenge.max_errors}</strong>
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
