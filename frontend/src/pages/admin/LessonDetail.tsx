import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FileText,
  ArrowLeft,
  Clock,
  BookOpen,
  Edit3,
  Trash2,
  Video,
  Link as LinkIcon,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Play
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

interface Lesson {
  id: number;
  course_id: number;
  course_title: string;
  title: string;
  description: string;
  content: string;
  lesson_type: string;
  order_index: number;
  estimated_minutes: number;
  video_url: string;
  materials_url: string;
  created_at: string;
  updated_at: string;
}

export default function LessonDetail() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use different API based on user role
      const apiPath = isAdmin 
        ? `/api/admin/courses/${courseId}/lessons/${lessonId}` 
        : `/api/trainer/courses/${courseId}/lessons/${lessonId}`;
      const response = await api.get(apiPath);
      setLesson(response.data);
    } catch (err: any) {
      console.error('Error fetching lesson:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar aula');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && lessonId && user) {
      fetchLesson();
    }
  }, [courseId, lessonId, user]);

  const handleDeleteLesson = async () => {
    if (!lesson || !window.confirm(t('admin.confirmDeleteLesson'))) return;

    try {
      await api.delete(`/api/admin/courses/${courseId}/lessons/${lesson.id}`);
      navigate(`/courses/${courseId}`);
    } catch (err) {
      console.error('Error deleting lesson:', err);
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

  const getLessonTypeLabel = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'THEORETICAL': return t('admin.theoretical');
      case 'PRACTICAL': return t('admin.practical');
      default: return type || '-';
    }
  };

  const getLessonTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'THEORETICAL': return 'bg-blue-100 text-blue-700';
      case 'PRACTICAL': return 'bg-green-100 text-green-700';
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

  if (error || !lesson) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('common.error')}</h2>
          <p className="text-gray-500 mb-4">{error || 'Aula não encontrada'}</p>
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
        className="relative overflow-hidden bg-gradient-to-r from-green-900 via-green-800 to-green-900 rounded-2xl"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-2xl" />
        
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
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLessonTypeColor(lesson.lesson_type)}`}>
                    {getLessonTypeLabel(lesson.lesson_type)}
                  </span>
                  <span className="px-3 py-1 bg-white/10 text-white rounded-full text-sm">
                    {t('admin.lesson')} #{lesson.order_index + 1}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">{lesson.title}</h1>
                <p className="text-gray-300 max-w-2xl">{lesson.description}</p>
              </div>
            </div>
            
            {isAdmin && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}/edit`)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  {t('common.edit')}
                </button>
                <button
                  onClick={handleDeleteLesson}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete')}
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{lesson.estimated_minutes || 0}</p>
                  <p className="text-sm text-gray-400">{t('admin.estimatedMinutes')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{lesson.course_title}</p>
                  <p className="text-sm text-gray-400">{t('admin.course')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{formatDate(lesson.created_at)}</p>
                  <p className="text-sm text-gray-400">{t('admin.createdAt')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Lesson Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.lessonContent')}</h3>
            {lesson.content ? (
              <div 
                className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-a:text-red-600 prose-a:underline prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            ) : (
              <p className="text-gray-500 italic">{t('admin.noContentYet')}</p>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.resources')}</h3>
            <div className="space-y-3">
              {lesson.video_url ? (
                <a
                  href={lesson.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{t('admin.videoLesson')}</p>
                    <p className="text-sm text-gray-500">{t('admin.clickToWatch')}</p>
                  </div>
                  <Play className="w-5 h-5 text-red-500" />
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-50">
                  <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-600">{t('admin.noVideo')}</p>
                  </div>
                </div>
              )}

              {lesson.materials_url ? (
                <a
                  href={lesson.materials_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{t('admin.materials')}</p>
                    <p className="text-sm text-gray-500">{t('admin.clickToAccess')}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-50">
                  <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-600">{t('admin.noMaterials')}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-900">{t('admin.lessonStatus')}</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('admin.content')}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  lesson.content ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {lesson.content ? (
                    <><CheckCircle2 className="w-4 h-4 inline mr-1" />{t('admin.complete')}</>
                  ) : (
                    t('admin.pending')
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('admin.video')}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  lesson.video_url ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {lesson.video_url ? (
                    <><CheckCircle2 className="w-4 h-4 inline mr-1" />{t('admin.added')}</>
                  ) : (
                    t('admin.notAdded')
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('admin.materials')}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  lesson.materials_url ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {lesson.materials_url ? (
                    <><CheckCircle2 className="w-4 h-4 inline mr-1" />{t('admin.added')}</>
                  ) : (
                    t('admin.notAdded')
                  )}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
