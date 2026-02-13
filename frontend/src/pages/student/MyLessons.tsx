import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Play,
  FileText,
  Video,
  Check,
  AlertCircle,
  Eye,
  User,
  Shield
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { PremiumHeader, FloatingOrbs } from '../../components/premium';

// Função para limpar HTML e extrair apenas texto
const stripHtml = (html: string): string => {
  if (!html) return '';
  // Criar elemento temporário para extrair texto
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

interface MyLesson {
  id: number;
  lesson_id: number;
  training_plan_id?: number;
  lesson_title: string;
  lesson_description?: string;
  materials_url?: string;
  video_url?: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  estimated_minutes: number;
  actual_time_minutes?: number;
  student_confirmed: boolean;
  student_confirmed_at?: string;
  accumulated_seconds?: number;
  is_approved?: boolean;
  finished_by_name?: string;
  started_by?: string;
}

export default function MyLessons() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [lessons, setLessons] = useState<MyLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!token || !user) return;
    loadLessons();
  }, [token, user]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/lessons/student/my-lessons');
      setLessons(response.data || []);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLesson = async (lessonId: number) => {
    try {
      setConfirmingId(lessonId);
      await api.post(`/api/lessons/${lessonId}/confirm`);
      await loadLessons();
    } catch (error: any) {
      console.error('Error confirming lesson:', error);
      alert(error.response?.data?.detail || 'Erro ao confirmar módulo');
    } finally {
      setConfirmingId(null);
    }
  };

  const getStatusBadge = (lesson: MyLesson) => {
    if (lesson.status === 'COMPLETED') {
      if (lesson.student_confirmed) {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30">
            <CheckCircle className="w-3 h-3 inline mr-1" />
            {t('myLessons.confirmed')}
          </span>
        );
      }
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
          <Check className="w-3 h-3 inline mr-1" />
          {t('myLessons.completed')}
        </span>
      );
    }
    if (lesson.status === 'PAUSED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30">
          <Clock className="w-3 h-3 inline mr-1" />
          {t('myLessons.paused')}
        </span>
      );
    }
    if (lesson.status === 'IN_PROGRESS') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
          <Play className="w-3 h-3 inline mr-1" />
          {t('myLessons.inProgress')}
        </span>
      );
    }
    if (lesson.status === 'RELEASED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <Play className="w-3 h-3 inline mr-1" />
          Disponível
        </span>
      );
    }
    if (lesson.status === 'NOT_STARTED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30">
          <Clock className="w-3 h-3 inline mr-1" />
          Pendente
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const completedLessons = lessons.filter(l => l.status === 'COMPLETED');
  const activeLessons = lessons.filter(l => l.status === 'IN_PROGRESS' || l.status === 'PAUSED');
  const pendingLessons = lessons.filter(l => l.status === 'NOT_STARTED' || l.status === 'RELEASED');
  const pendingConfirmation = completedLessons.filter(l => !l.student_confirmed);

  return (
    <div className="space-y-6">
      <PremiumHeader
        icon={BookOpen}
        title={t('myLessons.title')}
        subtitle={t('myLessons.subtitle')}
        badge={t('navigation.courses')}
        iconColor="from-blue-500 to-purple-500"
      />

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{lessons.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total de Aulas</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingLessons.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pendentes</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedLessons.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('myLessons.lessonsCompleted')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingConfirmation.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('myLessons.awaitingConfirmation')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aulas pendentes de confirmação */}
      {pendingConfirmation.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            {t('myLessons.awaitingConfirmation')}
          </h2>
          <div className="grid gap-4">
            {pendingConfirmation.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden bg-yellow-500/10 backdrop-blur-xl rounded-2xl border border-yellow-500/30"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {lesson.lesson_title}
                        </h3>
                        {getStatusBadge(lesson)}
                      </div>
                      {lesson.lesson_description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{stripHtml(lesson.lesson_description)}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lesson.accumulated_seconds ? formatTime(lesson.accumulated_seconds) : (lesson.actual_time_minutes || lesson.estimated_minutes) + ' min'} / {lesson.estimated_minutes} min
                        </span>
                        {lesson.completed_at && (
                          <span>
                            {t('myLessons.completed')}: {new Date(lesson.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {/* Info: confirmação e aprovação */}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {lesson.student_confirmed && (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                            <User className="w-3 h-3" />
                            {t('myLessons.confirmedByStudent')}
                          </span>
                        )}
                        {lesson.is_approved && lesson.finished_by_name && (
                          <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                            <Shield className="w-3 h-3" />
                            {t('myLessons.approvedBy')} {lesson.finished_by_name}
                          </span>
                        )}
                        {lesson.started_by === 'TRAINER' && (
                          <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                            <User className="w-3 h-3" />
                            {t('myLessons.startedByTrainer')}
                          </span>
                        )}
                      </div>
                      
                      {/* Materiais */}
                      {(lesson.materials_url || lesson.video_url) && (
                        <div className="flex gap-3 mt-4">
                          {lesson.materials_url && (
                            <a
                              href={lesson.materials_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              {t('myLessons.material')}
                            </a>
                          )}
                          {lesson.video_url && (
                            <a
                              href={lesson.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                            >
                              <Video className="w-4 h-4" />
                              {t('myLessons.video')}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate(`/lessons/${lesson.lesson_id}/view`)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 rounded-lg font-medium transition-colors flex items-center gap-2 border border-blue-500/30"
                      >
                        <Eye className="w-4 h-4" />
                        {t('myLessons.viewLesson')}
                      </button>
                      <button
                        onClick={() => handleConfirmLesson(lesson.lesson_id)}
                        disabled={confirmingId === lesson.lesson_id}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                      {confirmingId === lesson.lesson_id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t('myLessons.confirming')}
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          {t('myLessons.confirm')}
                        </>
                      )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Aulas pendentes (NOT_STARTED / RELEASED) */}
      {pendingLessons.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Aulas Pendentes
          </h2>
          <div className="grid gap-4">
            {pendingLessons.map((lesson, index) => (
              <motion.div
                key={`pending-${lesson.lesson_id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  const params = lesson.training_plan_id ? `?plan_id=${lesson.training_plan_id}` : '';
                  navigate(`/lessons/${lesson.lesson_id}/view${params}`);
                }}
                className="relative overflow-hidden bg-gray-500/10 backdrop-blur-xl rounded-2xl border border-gray-500/30 cursor-pointer hover:bg-gray-500/20 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {lesson.lesson_title}
                        </h3>
                        {getStatusBadge(lesson)}
                      </div>
                      {lesson.lesson_description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{stripHtml(lesson.lesson_description)}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {t('myLessons.estimatedTime')}: {lesson.estimated_minutes} min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Eye className="w-5 h-5" />
                      <span className="text-sm font-medium">Abrir</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Aulas em progresso */}
      {activeLessons.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-400" />
            {t('myLessons.pendingLessons')}
          </h2>
          <div className="grid gap-4">
            {activeLessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  const params = lesson.training_plan_id ? `?plan_id=${lesson.training_plan_id}` : '';
                  navigate(`/lessons/${lesson.lesson_id}/view${params}`);
                }}
                className="relative overflow-hidden bg-blue-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/30 cursor-pointer hover:bg-blue-500/20 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {lesson.lesson_title}
                        </h3>
                        {getStatusBadge(lesson)}
                      </div>
                      {lesson.lesson_description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{stripHtml(lesson.lesson_description)}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lesson.accumulated_seconds ? formatTime(lesson.accumulated_seconds) : '0:00'} / {lesson.estimated_minutes} min
                        </span>
                        {lesson.started_at && (
                          <span>
                            {new Date(lesson.started_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {lesson.started_by === 'TRAINER' && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                            <User className="w-3 h-3" />
                            {t('myLessons.startedByTrainer')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Eye className="w-5 h-5" />
                      <span className="text-sm font-medium">{t('myLessons.continue')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Aulas confirmadas */}
      {completedLessons.filter(l => l.student_confirmed).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            {t('myLessons.history')}
          </h2>
          <div className="grid gap-4">
            {completedLessons.filter(l => l.student_confirmed).map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {lesson.lesson_title}
                        </h3>
                        {getStatusBadge(lesson)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lesson.accumulated_seconds ? formatTime(lesson.accumulated_seconds) : (lesson.actual_time_minutes || lesson.estimated_minutes) + ' min'} / {lesson.estimated_minutes} min
                        </span>
                        {lesson.completed_at && (
                          <span>
                            {t('myLessons.completed')}: {new Date(lesson.completed_at).toLocaleDateString()}
                          </span>
                        )}
                        {lesson.student_confirmed_at && (
                          <span className="text-green-600 dark:text-green-400">
                            {t('myLessons.confirmed')}: {new Date(lesson.student_confirmed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {/* Info: confirmação e aprovação */}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {lesson.student_confirmed && (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                            <User className="w-3 h-3" />
                            {t('myLessons.confirmedByStudent')}
                          </span>
                        )}
                        {lesson.is_approved && lesson.finished_by_name && (
                          <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                            <Shield className="w-3 h-3" />
                            {t('myLessons.approvedBy')} {lesson.finished_by_name}
                          </span>
                        )}
                        {lesson.started_by === 'TRAINER' && (
                          <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                            <User className="w-3 h-3" />
                            {t('myLessons.startedByTrainer')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Materiais */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/lessons/${lesson.lesson_id}/view`)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-600 dark:text-blue-400 transition-colors"
                        title={t('myLessons.viewLesson')}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {lesson.materials_url && (
                        <a
                          href={lesson.materials_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                          title={t('myLessons.material')}
                        >
                          <FileText className="w-5 h-5" />
                        </a>
                      )}
                      {lesson.video_url && (
                        <a
                          href={lesson.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                          title={t('myLessons.video')}
                        >
                          <Video className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {lessons.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center shadow-sm dark:shadow-none"
        >
          <FloatingOrbs variant="subtle" />
          <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('myLessons.noLessons')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('myLessons.noLessonsDesc')}
          </p>
        </motion.div>
      )}
    </div>
  );
}
