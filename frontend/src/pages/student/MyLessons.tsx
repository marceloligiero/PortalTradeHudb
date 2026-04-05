import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

// Função para limpar HTML e extrair apenas texto
const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
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
      alert(error.response?.data?.detail || t('myLessons.confirmError'));
    } finally {
      setConfirmingId(null);
    }
  };

  const getStatusBadge = (lesson: MyLesson) => {
    if (lesson.status === 'COMPLETED') {
      if (lesson.student_confirmed) {
        return (
          <span className="px-3 py-1 rounded-full font-body text-xs font-bold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
            <CheckCircle className="w-3 h-3 inline mr-1" />
            {t('myLessons.confirmed')}
          </span>
        );
      }
      return (
        <span className="px-3 py-1 rounded-full font-body text-xs font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          <Check className="w-3 h-3 inline mr-1" />
          {t('myLessons.completed')}
        </span>
      );
    }
    if (lesson.status === 'PAUSED') {
      return (
        <span className="px-3 py-1 rounded-full font-body text-xs font-bold bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
          <Clock className="w-3 h-3 inline mr-1" />
          {t('myLessons.paused')}
        </span>
      );
    }
    if (lesson.status === 'IN_PROGRESS') {
      return (
        <span className="px-3 py-1 rounded-full font-body text-xs font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          <Play className="w-3 h-3 inline mr-1" />
          {t('myLessons.inProgress')}
        </span>
      );
    }
    if (lesson.status === 'RELEASED') {
      return (
        <span className="px-3 py-1 rounded-full font-body text-xs font-bold bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <Play className="w-3 h-3 inline mr-1" />
          {t('myLessons.available')}
        </span>
      );
    }
    if (lesson.status === 'NOT_STARTED') {
      return (
        <span className="px-3 py-1 rounded-full font-body text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
          <Clock className="w-3 h-3 inline mr-1" />
          {t('myLessons.pendingStatus')}
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const completedLessons = lessons.filter(l => l.status === 'COMPLETED');
  const activeLessons = lessons.filter(l => l.status === 'IN_PROGRESS' || l.status === 'PAUSED');
  const pendingLessons = lessons.filter(l => l.status === 'NOT_STARTED' || l.status === 'RELEASED');
  const pendingConfirmation = completedLessons.filter(l => !l.student_confirmed);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-[#EC0000]" />
          </div>
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
              {t('navigation.courses')}
            </p>
            <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {t('myLessons.title')}
            </h1>
            <p className="font-body text-gray-500 dark:text-gray-400 mt-1 max-w-xl text-sm">
              {t('myLessons.subtitle')}
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {[
            { icon: BookOpen, value: lessons.length, label: t('myLessons.totalLessons') },
            { icon: Clock, value: pendingLessons.length, label: t('myLessons.pendingCount') },
            { icon: CheckCircle, value: completedLessons.length, label: t('myLessons.lessonsCompleted') },
            { icon: AlertCircle, value: pendingConfirmation.length, label: t('myLessons.awaitingConfirmation') },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <stat.icon className="w-5 h-5 text-[#EC0000] shrink-0" />
              <div>
                <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="font-body text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aulas pendentes de confirmação */}
      {pendingConfirmation.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-headline text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            {t('myLessons.awaitingConfirmation')}
          </h2>
          <div className="grid gap-4">
            {pendingConfirmation.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-300 dark:border-yellow-800"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white">
                          {lesson.lesson_title}
                        </h3>
                        {getStatusBadge(lesson)}
                      </div>
                      {lesson.lesson_description && (
                        <p className="font-body text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">{stripHtml(lesson.lesson_description)}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 font-body text-sm text-gray-500 dark:text-gray-400">
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
                          <span className="flex items-center gap-1 font-body text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
                            <User className="w-3 h-3" />
                            {t('myLessons.confirmedByStudent')}
                          </span>
                        )}
                        {lesson.is_approved && lesson.finished_by_name && (
                          <span className="flex items-center gap-1 font-body text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                            <Shield className="w-3 h-3" />
                            {t('myLessons.approvedBy')} {lesson.finished_by_name}
                          </span>
                        )}
                        {lesson.started_by === 'TRAINER' && (
                          <span className="flex items-center gap-1 font-body text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
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
                              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-body text-sm text-gray-700 dark:text-gray-300 transition-colors"
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
                              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-body text-sm text-gray-700 dark:text-gray-300 transition-colors"
                            >
                              <Video className="w-4 h-4" />
                              {t('myLessons.video')}
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <button
                        onClick={() => navigate(`/lessons/${lesson.lesson_id}/view`)}
                        className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-body font-medium text-sm transition-colors flex items-center gap-2 border border-gray-200 dark:border-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                        {t('myLessons.viewLesson')}
                      </button>
                      <button
                        onClick={() => handleConfirmLesson(lesson.lesson_id)}
                        disabled={confirmingId === lesson.lesson_id}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-body font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aulas pendentes (NOT_STARTED / RELEASED) */}
      {pendingLessons.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-headline text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            {t('myLessons.waitingLessons')}
          </h2>
          <div className="grid gap-4">
            {pendingLessons.map((lesson) => (
              <div
                key={`pending-${lesson.lesson_id}`}
                onClick={() => {
                  const params = lesson.training_plan_id ? `?plan_id=${lesson.training_plan_id}` : '';
                  navigate(`/lessons/${lesson.lesson_id}/view${params}`);
                }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-[#EC0000]/30 transition-colors cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white">
                          {lesson.lesson_title}
                        </h3>
                        {getStatusBadge(lesson)}
                      </div>
                      {lesson.lesson_description && (
                        <p className="font-body text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">{stripHtml(lesson.lesson_description)}</p>
                      )}
                      <div className="flex items-center gap-4 font-body text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {t('myLessons.estimatedTime')}: {lesson.estimated_minutes} min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 ml-4">
                      <Eye className="w-5 h-5" />
                      <span className="font-body text-sm font-medium">{t('myLessons.open')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aulas em progresso */}
      {activeLessons.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-headline text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-500" />
            {t('myLessons.pendingLessons')}
          </h2>
          <div className="grid gap-4">
            {activeLessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => {
                  const params = lesson.training_plan_id ? `?plan_id=${lesson.training_plan_id}` : '';
                  navigate(`/lessons/${lesson.lesson_id}/view${params}`);
                }}
                className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-300 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-700 transition-colors cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white">
                          {lesson.lesson_title}
                        </h3>
                        {getStatusBadge(lesson)}
                      </div>
                      {lesson.lesson_description && (
                        <p className="font-body text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">{stripHtml(lesson.lesson_description)}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 font-body text-sm text-gray-500 dark:text-gray-400">
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
                          <span className="flex items-center gap-1 font-body text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                            <User className="w-3 h-3" />
                            {t('myLessons.startedByTrainer')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 ml-4">
                      <Eye className="w-5 h-5" />
                      <span className="font-body text-sm font-medium">{t('myLessons.continue')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aulas confirmadas */}
      {completedLessons.filter(l => l.student_confirmed).length > 0 && (
        <div className="space-y-4">
          <h2 className="font-headline text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            {t('myLessons.history')}
          </h2>
          <div className="grid gap-4">
            {completedLessons.filter(l => l.student_confirmed).map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white">
                          {lesson.lesson_title}
                        </h3>
                        {getStatusBadge(lesson)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 font-body text-sm text-gray-500 dark:text-gray-400">
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
                          <span className="flex items-center gap-1 font-body text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
                            <User className="w-3 h-3" />
                            {t('myLessons.confirmedByStudent')}
                          </span>
                        )}
                        {lesson.is_approved && lesson.finished_by_name && (
                          <span className="flex items-center gap-1 font-body text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                            <Shield className="w-3 h-3" />
                            {t('myLessons.approvedBy')} {lesson.finished_by_name}
                          </span>
                        )}
                        {lesson.started_by === 'TRAINER' && (
                          <span className="flex items-center gap-1 font-body text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                            <User className="w-3 h-3" />
                            {t('myLessons.startedByTrainer')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Materiais */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => navigate(`/lessons/${lesson.lesson_id}/view`)}
                        className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-400 transition-colors"
                        title={t('myLessons.viewLesson')}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {lesson.materials_url && (
                        <a
                          href={lesson.materials_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-400 transition-colors"
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
                          className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-400 transition-colors"
                          title={t('myLessons.video')}
                        >
                          <Video className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lessons.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('myLessons.noLessons')}
          </h3>
          <p className="font-body text-gray-500 dark:text-gray-400">
            {t('myLessons.noLessonsDesc')}
          </p>
        </div>
      )}
    </div>
  );
}
