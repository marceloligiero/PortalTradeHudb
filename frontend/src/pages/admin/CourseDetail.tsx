import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ArrowLeft,
  Users,
  Calendar,
  Building2,
  Package,
  Edit3,
  Trash2,
  Plus,
  Target,
  FileText,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Play,
  Star
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import RatingModal from '../../components/RatingModal';
import { getTranslatedProductName } from '../../utils/productTranslation';

interface Lesson {
  id: number;
  title: string;
  description: string;
  content_type: string;
  duration_minutes: number;
  order_index: number;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  challenge_type: string;
  difficulty: string;
  max_score: number;
  time_limit_minutes: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  bank_code: string;
  bank_name: string;
  product_code: string;
  product_name: string;
  banks?: { id: number; code: string; name: string }[];
  products?: { id: number; code: string; name: string }[];
  trainer_id: number;
  trainer_name: string;
  total_students: number;
  total_lessons: number;
  total_challenges: number;
  created_at: string;
  updated_at: string;
  lessons: Lesson[];
  challenges: Challenge[];
  training_plan?: {
    id: number;
    title: string;
  } | null;
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT' || user?.role === 'TRAINEE';
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'challenges'>('overview');
  
  // Rating state for students
  const [showCourseRatingModal, setShowCourseRatingModal] = useState(false);
  const [hasCourseRating, setHasCourseRating] = useState(false);
  const [isPlanFinalized, setIsPlanFinalized] = useState(false);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use different API based on user role
      let apiPath: string;
      if (isStudent) {
        apiPath = `/api/student/courses/${courseId}`;
      } else if (isAdmin) {
        apiPath = `/api/admin/courses/${courseId}`;
      } else {
        apiPath = `/api/trainer/courses/details/${courseId}`;
      }
      const response = await api.get(apiPath);
      setCourse(response.data);
    } catch (err: any) {
      console.error('Error fetching course:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar curso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && user) {
      fetchCourse();
    }
  }, [courseId, user]);

  // Check if student has rated this course and if plan is finalized
  useEffect(() => {
    const checkRatingAndPlanStatus = async () => {
      if (!course || !isStudent || !course.training_plan) return;
      
      // Check if plan is finalized
      try {
        const planResp = await api.get(`/api/training-plans/${course.training_plan.id}/completion-status`);
        setIsPlanFinalized(planResp.data?.is_finalized || false);
      } catch (err) {
        console.log('Error checking plan status:', err);
      }
      
      // Check if already rated
      try {
        const resp = await api.get('/api/ratings/check', {
          params: { rating_type: 'COURSE', course_id: course.id, training_plan_id: course.training_plan.id }
        });
        setHasCourseRating(resp.data.exists);
      } catch (err) {
        console.log('Error checking course rating:', err);
      }
    };
    checkRatingAndPlanStatus();
  }, [course, isStudent]);

  const handleDeleteCourse = async () => {
    if (!course || !window.confirm(t('admin.confirmDeleteCourse'))) return;

    try {
      await api.delete(`/api/admin/courses/${course.id}`);
      navigate('/courses');
    } catch (err) {
      console.error('Error deleting course:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return t('challenges.difficultyEasy');
      case 'medium': return t('challenges.difficultyMedium');
      case 'hard': return t('challenges.difficultyHard');
      default: return difficulty || t('challenges.difficultyMedium');
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

  if (error || !course) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('common.error')}</h2>
          <p className="text-gray-500 mb-4">{error || 'Curso não encontrado'}</p>
          <button
            onClick={() => navigate('/courses')}
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
        className="relative overflow-hidden bg-white dark:bg-gradient-to-r dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-transparent shadow-lg dark:shadow-none"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 hidden dark:block">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(220, 38, 38, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(220, 38, 38, 0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/20 rounded-full blur-3xl hidden dark:block" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/10 rounded-full blur-2xl hidden dark:block" />
        
        <div className="relative p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('common.back')}</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {course.banks && course.banks.length > 0 ? (
                    course.banks.map(bank => (
                      <span key={bank.id} className="px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                        {bank.code}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full text-sm font-medium">
                      {course.bank_code}
                    </span>
                  )}
                  {course.products && course.products.length > 0 ? (
                    course.products.map(product => (
                      <span key={product.id} className="px-3 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium">
                        {getTranslatedProductName(t, product.code, product.name)}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">
                      {getTranslatedProductName(t, course.product_code, course.product_name)}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl">{course.description}</p>
              </div>
            </div>
            
            {isAdmin && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/courses/${course.id}/edit`)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  {t('common.edit')}
                </button>
                <button
                  onClick={handleDeleteCourse}
                  className="px-4 py-2 bg-red-100 dark:bg-red-600/20 hover:bg-red-200 dark:hover:bg-red-600/30 text-red-600 dark:text-red-400 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete')}
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{course.total_students || 0}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.enrolledStudents')}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{course.lessons?.length || 0}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.lessons')}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{course.challenges?.length || 0}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.challenges')}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(course.created_at)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.createdAt')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('admin.overview')}
        </button>
        <button
          onClick={() => setActiveTab('lessons')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeTab === 'lessons'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          {t('admin.lessons')}
          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-xs">
            {course.lessons?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeTab === 'challenges'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          {t('admin.challenges')}
          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-xs">
            {course.challenges?.length || 0}
          </span>
        </button>
      </div>

      {/* Content based on active tab */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin.courseDetails')}</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.banks') || t('admin.bank')}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {course.banks && course.banks.length > 0 ? (
                        course.banks.map(bank => (
                          <span key={bank.id} className="px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                            {bank.code} - {bank.name}
                          </span>
                        ))
                      ) : (
                        <span className="font-medium text-gray-900 dark:text-white">{course.bank_name || course.bank_code || '-'}</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.products') || t('admin.product')}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {course.products && course.products.length > 0 ? (
                        course.products.map(product => (
                          <span key={product.id} className="px-3 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium">
                            {getTranslatedProductName(t, product.code, product.name)}
                          </span>
                        ))
                      ) : (
                        <span className="font-medium text-gray-900 dark:text-white">{getTranslatedProductName(t, course.product_code, course.product_name) || '-'}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.createdBy') || 'Criado por'}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{course.trainer_name || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Only for trainers/admins */}
              {!isStudent && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin.quickActions')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate(`/courses/${course.id}/lessons/new`)}
                    className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-colors group"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{t('admin.addLesson')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.addLessonDesc')}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => navigate(`/courses/${course.id}/challenges/new`)}
                    className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-colors group"
                  >
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{t('admin.addChallenge')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.addChallengeDesc')}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-100 dark:border-red-800/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('admin.courseStatus')}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('admin.lessons')}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (course.lessons?.length || 0) > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {(course.lessons?.length || 0) > 0 ? <CheckCircle2 className="w-4 h-4 inline mr-1" /> : null}
                      {course.lessons?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('admin.challenges')}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (course.challenges?.length || 0) > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {(course.challenges?.length || 0) > 0 ? <CheckCircle2 className="w-4 h-4 inline mr-1" /> : null}
                      {course.challenges?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('admin.students')}</span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                      {course.total_students || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin.courseLessons')}</h3>
              {isAdmin && (
                <button
                  onClick={() => navigate(`/courses/${course.id}/lessons/new`)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('admin.addLesson')}
                </button>
              )}
            </div>

            {course.lessons?.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('admin.noLessonsYet')}</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{t('admin.noLessonsDesc')}</p>
                {isAdmin && (
                  <button
                    onClick={() => navigate(`/courses/${course.id}/lessons/new`)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t('admin.createFirstLesson')}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {course.lessons.map((lesson, index) => (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => !isStudent && navigate(`/courses/${course.id}/lessons/${lesson.id}`)}
                    className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-shadow ${!isStudent ? 'hover:shadow-md cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{lesson.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{lesson.description}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lesson.duration_minutes || 0} min
                        </span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                          {lesson.content_type}
                        </span>
                      </div>
                      {!isStudent && <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin.courseChallenges')}</h3>
              {isAdmin && (
                <button
                  onClick={() => navigate(`/courses/${course.id}/challenges/new`)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('admin.addChallenge')}
                </button>
              )}
            </div>

            {course.challenges?.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('admin.noChallengesYet')}</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{t('admin.noChallengesDesc')}</p>
                {isAdmin && (
                  <button
                    onClick={() => navigate(`/courses/${course.id}/challenges/new`)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t('admin.createFirstChallenge')}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.challenges.map((challenge, index) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => !isStudent && navigate(`/courses/${course.id}/challenges/${challenge.id}`)}
                    className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 transition-shadow ${!isStudent ? 'hover:shadow-md cursor-pointer' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                        {getDifficultyLabel(challenge.difficulty)}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">{challenge.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{challenge.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {challenge.time_limit_minutes || 0} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {challenge.max_score} pts
                        </span>
                      </div>
                      {!isStudent && (
                        <span className="text-red-600 font-medium flex items-center gap-1">
                          <Play className="w-4 h-4" />
                          {t('common.view')}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Student Enrollment & Rating Section */}
      {isStudent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('courses.myEnrollment', 'A Minha Inscrição')}</h3>
          
          <div className="space-y-4">
            {/* Enrollment Status */}
            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-700 dark:text-green-400">{t('courses.enrolled', 'Inscrito neste Curso')}</p>
                <p className="text-sm text-green-600 dark:text-green-500">{t('courses.enrolledDescription', 'Você tem acesso a todas as aulas e desafios deste curso')}</p>
              </div>
            </div>

            {/* Training Plan Link */}
            {course.training_plan && (
              <div 
                onClick={() => navigate(`/training-plan/${course.training_plan?.id}`)}
                className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-200 dark:border-purple-500/20 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-purple-700 dark:text-purple-400">{t('courses.trainingPlan', 'Plano de Formação')}</p>
                  <p className="text-sm text-purple-600 dark:text-purple-500">{course.training_plan.title}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-500" />
              </div>
            )}

            {/* Rating Section - Only show if plan is finalized */}
            {course.training_plan && isPlanFinalized && (
            <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Star className={`w-6 h-6 ${hasCourseRating ? 'text-amber-500 fill-amber-500' : 'text-amber-600 dark:text-amber-400'}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  {hasCourseRating ? t('courses.courseRated', 'Curso Classificado') : t('courses.rateCourse', 'Classificar Curso')}
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  {hasCourseRating 
                    ? t('courses.thankYouRating', 'Obrigado pela sua avaliação!') 
                    : t('courses.helpImprove', 'Ajude-nos a melhorar com a sua avaliação')
                  }
                </p>
              </div>
              {hasCourseRating ? (
                <span className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-xl text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('courses.rated', 'Classificado')} ✓
                </span>
              ) : (
                <button
                  onClick={() => setShowCourseRatingModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-yellow-700 transition-all shadow-lg"
                >
                  <Star className="w-4 h-4" />
                  {t('courses.rate', 'Classificar')}
                </button>
              )}
            </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Rating Modal - Only available when plan is finalized */}
      {course && course.training_plan && isPlanFinalized && (
        <RatingModal
          isOpen={showCourseRatingModal}
          onClose={() => setShowCourseRatingModal(false)}
          ratingType="COURSE"
          itemId={course.id}
          itemTitle={course.title}
          trainingPlanId={course.training_plan.id}
          onSuccess={() => {
            setHasCourseRating(true);
            setShowCourseRatingModal(false);
          }}
        />
      )}
    </div>
  );
}
