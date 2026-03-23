import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  ChevronRight,
  Star,
  Shield,
  TrendingUp,
  Play,
  Layers,
  Video,
  Loader2
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
  level?: string;
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

  const [showCourseRatingModal, setShowCourseRatingModal] = useState(false);
  const [hasCourseRating, setHasCourseRating] = useState(false);
  const [isPlanFinalized, setIsPlanFinalized] = useState(false);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      let apiPath: string;
      if (isStudent) apiPath = `/api/student/courses/${courseId}`;
      else if (isAdmin) apiPath = `/api/admin/courses/${courseId}`;
      else apiPath = `/api/trainer/courses/details/${courseId}`;
      const response = await api.get(apiPath);
      setCourse(response.data);
    } catch (err: any) {
      console.error('Error fetching course:', err);
      setError(err.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && user) fetchCourse();
  }, [courseId, user]);

  useEffect(() => {
    const check = async () => {
      if (!course || !isStudent || !course.training_plan) return;
      try {
        const planResp = await api.get(`/api/training-plans/${course.training_plan.id}/completion-status`);
        setIsPlanFinalized(planResp.data?.is_finalized || false);
      } catch { /* silent */ }
      try {
        const resp = await api.get('/api/ratings/check', {
          params: { rating_type: 'COURSE', course_id: course.id, training_plan_id: course.training_plan.id }
        });
        setHasCourseRating(resp.data.exists);
      } catch { /* silent */ }
    };
    check();
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });

  const contentTypeLabel = (ct: string) => {
    switch (ct?.toUpperCase()) {
      case 'THEORETICAL': return t('admin.theoretical');
      case 'PRACTICAL':   return t('admin.practical');
      default:            return ct || '-';
    }
  };

  const contentTypeStyle = (ct: string) => {
    switch (ct?.toUpperCase()) {
      case 'THEORETICAL': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'PRACTICAL':   return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      default:            return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
    }
  };

  const contentTypeIcon = (ct: string) => {
    switch (ct?.toUpperCase()) {
      case 'THEORETICAL': return <FileText className="w-3 h-3" />;
      case 'PRACTICAL':   return <Play className="w-3 h-3" />;
      default:            return <Layers className="w-3 h-3" />;
    }
  };

  const difficultyStyle = (d: string) => {
    switch (d?.toLowerCase()) {
      case 'easy':   return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'hard':   return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:       return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    }
  };

  const difficultyLabel = (d: string) => {
    switch (d?.toLowerCase()) {
      case 'easy':   return t('challenges.difficultyEasy');
      case 'medium': return t('challenges.difficultyMedium');
      case 'hard':   return t('challenges.difficultyHard');
      default:       return d || t('challenges.difficultyMedium');
    }
  };

  const levelConfig = (level?: string) => {
    switch (level) {
      case 'EXPERT':
        return {
          label: t('admin.levelExpert'),
          icon: <Star className="w-3 h-3" />,
          cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        };
      case 'INTERMEDIATE':
        return {
          label: t('admin.levelIntermediate'),
          icon: <Shield className="w-3 h-3" />,
          cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
        };
      default:
        return {
          label: t('admin.levelBeginner'),
          icon: <TrendingUp className="w-3 h-3" />,
          cls: 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400',
        };
    }
  };

  /* ── Loading ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#EC0000] animate-spin" />
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────── */
  if (error || !course) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-[#EC0000] mx-auto mb-3" />
          <p className="text-gray-900 dark:text-white font-medium mb-1">{t('common.error')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error || t('common.notFound', 'Não encontrado')}</p>
          <button onClick={() => navigate('/courses')} className="text-sm text-[#EC0000] hover:underline">
            {t('common.goBack')}
          </button>
        </div>
      </div>
    );
  }

  const lessonCount = course.lessons?.length || 0;
  const challengeCount = course.challenges?.length || 0;
  const banks = course.banks?.length ? course.banks : (course.bank_name ? [{ id: 0, name: course.bank_name }] : []);
  const products = course.products?.length ? course.products : [{ id: 0, code: course.product_code, name: course.product_name }];
  const lvl = levelConfig(course.level);

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════════════════
          COURSE HEADER
         ══════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="p-5 sm:p-6">

          {/* Top bar: back + actions */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => navigate('/courses')}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </button>
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate(`/courses/${course.id}/edit`)}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={t('common.edit')}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteCourse}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Identity block */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#EC0000] rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              {/* Tag row */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {banks.map(b => (
                  <span key={b.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[11px] font-medium">
                    <Building2 className="w-3 h-3" />
                    {b.name}
                  </span>
                ))}
                {products.map(p => (
                  <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded text-[11px] font-medium">
                    <Package className="w-3 h-3" />
                    {getTranslatedProductName(t, p.code, p.name)}
                  </span>
                ))}
                {course.level && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${lvl.cls}`}>
                    {lvl.icon}
                    {lvl.label}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {course.title}
              </h1>
              {course.description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-2xl line-clamp-2">
                  {course.description}
                </p>
              )}

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-400 dark:text-gray-500">
                {course.trainer_name && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {course.trainer_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(course.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {course.total_students || 0} {t('admin.students')}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {lessonCount} {t('admin.lessons')}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  {challengeCount} {t('admin.challenges')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          STUDENT CONTEXT BAR (students only)
         ══════════════════════════════════════════════════ */}
      {isStudent && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Enrolled */}
          <div className="flex items-center gap-3 flex-1 p-3.5 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-green-500/20">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('courses.enrolled', 'Inscrito')}</p>
              <p className="text-[11px] text-green-600 dark:text-green-500 truncate">{t('courses.enrolledDescription', 'Acesso a aulas e desafios')}</p>
            </div>
          </div>

          {/* Training plan */}
          {course.training_plan && (
            <button
              onClick={() => navigate(`/training-plan/${course.training_plan?.id}`)}
              className="flex items-center gap-3 flex-1 p-3.5 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors text-left"
            >
              <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-400">{t('courses.trainingPlan', 'Plano de Formação')}</p>
                <p className="text-[11px] text-purple-600 dark:text-purple-500 truncate">{course.training_plan.title}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400 flex-shrink-0" />
            </button>
          )}

          {/* Rating */}
          {course.training_plan && isPlanFinalized && (
            <div className="flex items-center gap-3 flex-1 p-3.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
              <Star className={`w-5 h-5 flex-shrink-0 ${hasCourseRating ? 'text-amber-500 fill-amber-500' : 'text-amber-600 dark:text-amber-400'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {hasCourseRating ? t('courses.courseRated', 'Classificado') : t('courses.rateCourse', 'Classificar Curso')}
                </p>
              </div>
              {hasCourseRating ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <button
                  onClick={() => setShowCourseRatingModal(true)}
                  className="px-3 py-1.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                >
                  {t('courses.rate', 'Classificar')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          CONTENT: LESSONS + CHALLENGES (side-by-side on lg+)
         ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── LESSONS (left, 3/5) ─────────────────────── */}
        <section className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#EC0000]" />
              {t('admin.lessons')}
              <span className="text-gray-400 dark:text-gray-500 font-normal normal-case">({lessonCount})</span>
            </h2>
            {!isStudent && (
              <button
                onClick={() => navigate(`/courses/${course.id}/lessons/new`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#EC0000] hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('admin.addLesson')}
              </button>
            )}
          </div>

          {lessonCount === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
              <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.noLessonsYet')}</p>
              {!isStudent && (
                <button
                  onClick={() => navigate(`/courses/${course.id}/lessons/new`)}
                  className="mt-3 text-xs text-[#EC0000] hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {t('admin.createFirstLesson')}
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/50">
              {course.lessons.map((lesson, i) => (
                <div
                  key={lesson.id}
                  onClick={() => !isStudent && navigate(`/courses/${course.id}/lessons/${lesson.id}`)}
                  className={`flex items-center gap-3 px-4 py-3.5 ${!isStudent ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer' : ''} transition-colors`}
                >
                  {/* Index bubble */}
                  <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {i + 1}
                  </span>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{lesson.title}</p>
                    {lesson.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{lesson.description}</p>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {lesson.duration_minutes > 0 && (
                      <span className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                        <Clock className="w-3 h-3" />
                        {lesson.duration_minutes}m
                      </span>
                    )}
                    {lesson.content_type && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${contentTypeStyle(lesson.content_type)}`}>
                        {contentTypeIcon(lesson.content_type)}
                        {contentTypeLabel(lesson.content_type)}
                      </span>
                    )}
                    {!isStudent && <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── CHALLENGES (right, 2/5) ──────────────────── */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" />
              {t('admin.challenges')}
              <span className="text-gray-400 dark:text-gray-500 font-normal normal-case">({challengeCount})</span>
            </h2>
            {!isStudent && (
              <button
                onClick={() => navigate(`/courses/${course.id}/challenges/new`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#EC0000] hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('admin.addChallenge')}
              </button>
            )}
          </div>

          {challengeCount === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
              <Target className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.noChallengesYet')}</p>
              {!isStudent && (
                <button
                  onClick={() => navigate(`/courses/${course.id}/challenges/new`)}
                  className="mt-3 text-xs text-[#EC0000] hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {t('admin.createFirstChallenge')}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {course.challenges.map(ch => (
                <div
                  key={ch.id}
                  onClick={() => !isStudent && navigate(`/courses/${course.id}/challenges/${ch.id}`)}
                  className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all ${!isStudent ? 'hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm cursor-pointer' : ''}`}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Target className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{ch.title}</h4>
                    </div>
                    <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase flex-shrink-0 ${difficultyStyle(ch.difficulty)}`}>
                      {difficultyLabel(ch.difficulty)}
                    </span>
                  </div>

                  {ch.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mb-3">{ch.description}</p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                    <div className="flex items-center gap-3">
                      {ch.time_limit_minutes > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ch.time_limit_minutes}m
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {ch.max_score} pts
                      </span>
                    </div>
                    {!isStudent && <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Rating Modal */}
      {course.training_plan && isPlanFinalized && (
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
