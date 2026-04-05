import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Play,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import api from '../../lib/axios';
import DOMPurify from 'dompurify';
import { useAuthStore } from '../../stores/authStore';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { CHARS_PER_PAGE } from '../../constants/pagination';

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
  const location = useLocation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isTrainer = user?.is_formador;
  const isStudent = !(user?.is_formador || user?.is_admin || user?.is_tutor);
  const isTutoriaContext = location.pathname.startsWith('/tutoria');
  const coursePrefix = isTutoriaContext ? `/tutoria/capsulas/${courseId}` : `/courses/${courseId}`;
  const showProgress = isStudent;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]));

  // Split content into pages
  const contentPages = useMemo(() => {
    if (!lesson?.content) return [];
    const content = lesson.content;
    const pages: string[] = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = DOMPurify.sanitize(content);
    const blocks = Array.from(tempDiv.children);
    let currentPageContent = '';
    let currentLength = 0;
    blocks.forEach((block) => {
      const blockHtml = block.outerHTML;
      const blockText = block.textContent || '';
      if (currentLength + blockText.length > CHARS_PER_PAGE && currentPageContent) {
        pages.push(currentPageContent);
        currentPageContent = blockHtml;
        currentLength = blockText.length;
      } else {
        currentPageContent += blockHtml;
        currentLength += blockText.length;
      }
    });
    if (currentPageContent) pages.push(currentPageContent);
    if (pages.length === 0 && content.length > 0) {
      for (let i = 0; i < content.length; i += CHARS_PER_PAGE) {
        pages.push(content.slice(i, i + CHARS_PER_PAGE));
      }
    }
    return pages.length > 0 ? pages : [content];
  }, [lesson?.content]);

  const totalPages = contentPages.length;
  const allPagesVisited = visitedPages.size >= totalPages;

  useEffect(() => {
    if (lessonId) {
      const saved = localStorage.getItem(STORAGE_KEYS.lesson.visited(lessonId));
      if (saved) {
        try { setVisitedPages(new Set(JSON.parse(saved))); } catch {}
      }
    }
  }, [lessonId]);

  const markPageVisited = useCallback((page: number) => {
    setVisitedPages(prev => {
      const newSet = new Set(prev);
      newSet.add(page);
      if (lessonId) localStorage.setItem(STORAGE_KEYS.lesson.visited(lessonId), JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }, [lessonId]);

  useEffect(() => { markPageVisited(currentPage); }, [currentPage, markPageVisited]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiPath = isAdmin
        ? `/api/admin/courses/${courseId}/lessons/${lessonId}`
        : `/api/trainer/courses/${courseId}/lessons/${lessonId}`;
      const response = await api.get(apiPath);
      setLesson(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('admin.errorLoadingLesson', 'Erro ao carregar aula'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && lessonId && user) fetchLesson();
  }, [courseId, lessonId, user]);

  const handleDeleteLesson = async () => {
    if (!lesson || !window.confirm(t('admin.confirmDeleteLesson'))) return;
    try {
      await api.delete(`/api/admin/courses/${courseId}/lessons/${lesson.id}`);
      navigate(coursePrefix);
    } catch (err) {
      console.error('Error deleting lesson:', err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getLessonTypeLabel = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'THEORETICAL': return t('admin.theoretical');
      case 'PRACTICAL': return t('admin.practical');
      default: return type || '-';
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Error ── */
  if (error || !lesson) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[#EC0000] mx-auto mb-4" />
          <h2 className="font-headline text-xl font-bold text-gray-900 dark:text-white mb-2">{t('messages.error')}</h2>
          <p className="font-body text-sm text-gray-500 dark:text-gray-400 mb-4">{error || t('admin.lessonNotFound', 'Aula não encontrada')}</p>
          <button
            onClick={() => navigate(coursePrefix)}
            className="px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-sm transition-colors"
          >
            {t('common.goBack')}
          </button>
        </div>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="space-y-6">
      {/* ═══ Header Card ═══ */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        {/* Back + Actions */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate(coursePrefix)}
            className="flex items-center gap-2 font-body text-sm text-gray-500 dark:text-gray-400 hover:text-[#EC0000] dark:hover:text-[#EC0000] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.backToCourse')}
          </button>

          {!isStudent && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`${coursePrefix}/lessons/${lesson.id}/edit`)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-[#EC0000]/30 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {t('common.edit')}
              </button>
              {isAdmin && (
                <button
                  onClick={handleDeleteLesson}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('common.delete')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title row */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-[#EC0000]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                lesson.lesson_type?.toUpperCase() === 'THEORETICAL'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              }`}>
                {getLessonTypeLabel(lesson.lesson_type)}
              </span>
              <span className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000]">
                {t('admin.lesson')} #{lesson.order_index + 1}
              </span>
            </div>
            <h1 className="font-headline text-2xl font-bold text-gray-900 dark:text-white">{lesson.title}</h1>
            {lesson.description && (
              <p className="font-body text-sm text-gray-500 dark:text-gray-400 mt-1">{lesson.description}</p>
            )}
          </div>
        </div>

        {/* KPI stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-[#EC0000]" />
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">{lesson.estimated_minutes || 0}</p>
              <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('admin.estimatedMinutes')}</p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5 text-[#EC0000]" />
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-gray-900 dark:text-white truncate">{lesson.course_title}</p>
              <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('admin.course')}</p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5 text-[#EC0000]" />
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-gray-900 dark:text-white">{formatDate(lesson.created_at)}</p>
              <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('admin.createdAt')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Content Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Content header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-headline text-base font-semibold text-gray-900 dark:text-white">{t('admin.lessonContent')}</h3>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm text-gray-500 dark:text-gray-400">
                      {t('admin.pageOf', 'Página {{current}} de {{total}}', { current: currentPage, total: totalPages })}
                    </span>
                    {showProgress && allPagesVisited && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        {t('admin.complete')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Page indicators */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                        currentPage === page
                          ? 'bg-[#EC0000] text-white shadow-lg shadow-red-200 dark:shadow-red-900/30'
                          : showProgress && visitedPages.has(page)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {showProgress && visitedPages.has(page) && currentPage !== page
                        ? <Check className="w-4 h-4" /> : page}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content body */}
            <div className="p-6">
              {lesson.content ? (
                <div
                  className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-headline prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:font-body prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-[#EC0000] prose-a:underline prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 min-h-[200px]"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentPages[currentPage - 1] || '') }}
                />
              ) : (
                <p className="font-body text-sm text-gray-500 dark:text-gray-400 italic">{t('admin.noContentYet')}</p>
              )}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-medium transition-all ${
                      currentPage === 1
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#EC0000]/30'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t('common.previous', 'Anterior')}
                  </button>

                  {showProgress ? (
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#EC0000] to-[#CC0000] rounded-full transition-all"
                          style={{ width: `${(visitedPages.size / totalPages) * 100}%` }}
                        />
                      </div>
                      <p className="text-center font-body text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {visitedPages.size} {t('common.of', 'de')} {totalPages} {t('admin.pagesVisited', 'páginas visitadas')} ({Math.round((visitedPages.size / totalPages) * 100)}%)
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 mx-4 text-center">
                      <span className="font-body text-sm text-gray-500 dark:text-gray-400">
                        {t('admin.pageOf', 'Página {{current}} de {{total}}', { current: currentPage, total: totalPages })}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-bold transition-all ${
                      currentPage === totalPages
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'bg-[#EC0000] hover:bg-[#CC0000] text-white'
                    }`}
                  >
                    {t('common.next', 'Próxima')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Sidebar ═══ */}
        <div className="space-y-6">
          {/* Reading Progress — students only */}
          {showProgress && totalPages > 1 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#EC0000]" />
                </div>
                <div>
                  <h3 className="font-headline font-semibold text-sm text-gray-900 dark:text-white">{t('admin.readingProgress', 'Progresso de Leitura')}</h3>
                  <p className="font-body text-xs text-gray-500 dark:text-gray-400">{visitedPages.size} {t('common.of', 'de')} {totalPages} {t('admin.pages', 'páginas')}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <div
                    key={page}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-colors cursor-pointer ${
                      currentPage === page
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => goToPage(page)}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      visitedPages.has(page)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {visitedPages.has(page) ? <Check className="w-3 h-3" /> : page}
                    </div>
                    <span className={`font-body text-sm ${
                      currentPage === page
                        ? 'font-medium text-[#EC0000]'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {t('admin.page', 'Página')} {page}
                    </span>
                    {currentPage === page && (
                      <span className="ml-auto text-xs bg-[#EC0000] text-white px-2 py-0.5 rounded-full font-bold">
                        {t('admin.current', 'Atual')}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {allPagesVisited && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-body font-medium text-sm">{t('admin.readingComplete', 'Leitura completa!')}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resources */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-headline font-semibold text-sm text-gray-900 dark:text-white mb-4">{t('admin.resources')}</h3>
            <div className="space-y-3">
              {lesson.video_url ? (
                <a
                  href={lesson.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-[#EC0000] rounded-xl flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-body text-sm font-medium text-gray-900 dark:text-white">{t('admin.videoLesson')}</p>
                    <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('admin.clickToWatch')}</p>
                  </div>
                  <Play className="w-4 h-4 text-[#EC0000]" />
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl opacity-60">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                    <Video className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="font-body text-sm text-gray-500 dark:text-gray-400">{t('admin.noVideo')}</p>
                </div>
              )}

              {lesson.materials_url ? (
                <a
                  href={lesson.materials_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-700 dark:bg-gray-600 rounded-xl flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-body text-sm font-medium text-gray-900 dark:text-white">{t('admin.materials')}</p>
                    <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('admin.clickToAccess')}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl opacity-60">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="font-body text-sm text-gray-500 dark:text-gray-400">{t('admin.noMaterials')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Lesson Status */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#EC0000]" />
              <h3 className="font-headline font-semibold text-sm text-gray-900 dark:text-white">{t('admin.lessonStatus')}</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: t('admin.content'), ok: !!lesson.content },
                { label: t('admin.video'), ok: !!lesson.video_url },
                { label: t('admin.materials'), ok: !!lesson.materials_url },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="font-body text-sm text-gray-600 dark:text-gray-400">{label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    ok
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    {ok ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 inline mr-0.5" />{t('admin.complete')}</>
                    ) : (
                      t('admin.notAdded')
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
