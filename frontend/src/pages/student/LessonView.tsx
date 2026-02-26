import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ArrowLeft,
  Clock,
  BookOpen,
  Video,
  Link as LinkIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Check,
  Play,
  Pause,
  AlertCircle,
  Sparkles,
  Flag,
  Loader2,
  Star,
  Timer,
  AlertTriangle,
  Square
} from 'lucide-react';
import api from '../../lib/axios';
import { RatingModal } from '../../components';

interface Lesson {
  id: number;
  course_id: number;
  course_title?: string;
  title: string;
  description: string;
  content: string;
  lesson_type: string;
  order_index: number;
  estimated_minutes: number;
  video_url: string;
  materials_url: string;
  started_by?: 'TRAINER' | 'TRAINEE';
}

interface LessonProgress {
  id: number;
  status: string;
  is_paused: boolean;
  is_approved?: boolean;
  student_confirmed?: boolean;
  started_at?: string;
  elapsed_seconds: number;
}

// Characters per page for pagination
const CHARS_PER_PAGE = 2500;

export default function LessonView() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId') || searchParams.get('plan_id');
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]));
  const [isFinished, setIsFinished] = useState(false);
  const [finishLoading, setFinishLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [isPlanFinalized, setIsPlanFinalized] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Se a aula foi iniciada pelo FORMADOR, o formando pode finalizar após ler todas as páginas
  const isTrainerStarted = lesson?.started_by === 'TRAINER';
  const isTraineeStarted = lesson?.started_by === 'TRAINEE';

  // Split content into pages
  const contentPages = useMemo(() => {
    if (!lesson?.content) return [];
    
    const content = lesson.content;
    const pages: string[] = [];
    
    // Split by paragraphs or block elements to avoid cutting mid-sentence
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
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
    
    if (currentPageContent) {
      pages.push(currentPageContent);
    }
    
    // If no blocks were found (plain text), split by character count
    if (pages.length === 0 && content.length > 0) {
      for (let i = 0; i < content.length; i += CHARS_PER_PAGE) {
        pages.push(content.slice(i, i + CHARS_PER_PAGE));
      }
    }
    
    return pages.length > 0 ? pages : [content];
  }, [lesson?.content]);

  const totalPages = contentPages.length;
  const allPagesVisited = visitedPages.size >= totalPages;
  
  // Se a aula está em progresso e todas as páginas foram lidas, pode finalizar
  const canFinish = allPagesVisited && lessonProgress?.status === 'IN_PROGRESS' && !lessonProgress?.is_paused;

  // Para aulas TRAINEE: pode iniciar, pausar, retomar
  const canStart = isTraineeStarted && lessonProgress && (lessonProgress.status === 'NOT_STARTED' || lessonProgress.status === 'RELEASED') && !isFinished;
  const canPause = isTraineeStarted && lessonProgress?.status === 'IN_PROGRESS' && !lessonProgress?.is_paused;
  const canResume = isTraineeStarted && (lessonProgress?.status === 'PAUSED' || (lessonProgress?.status === 'IN_PROGRESS' && lessonProgress?.is_paused));
  const canFinishTrainee = isTraineeStarted && allPagesVisited && lessonProgress?.status === 'IN_PROGRESS' && !lessonProgress?.is_paused && !isFinished;

  // Load visited pages and last page from localStorage
  useEffect(() => {
    if (lessonId) {
      // Load visited pages
      const saved = localStorage.getItem(`lesson_${lessonId}_visited`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setVisitedPages(new Set(parsed));
        } catch (e) {
          console.error('Error parsing visited pages:', e);
        }
      }
      
      // Load last page (to resume from where stopped)
      const lastPage = localStorage.getItem(`lesson_${lessonId}_lastPage`);
      if (lastPage) {
        const pageNum = parseInt(lastPage, 10);
        if (!isNaN(pageNum) && pageNum > 0) {
          setCurrentPage(pageNum);
        }
      }
      
      // Note: don't restore isFinished from localStorage alone
      // It will be set by backend progress status check
    }
  }, [lessonId]);

  // Save visited pages and current page to localStorage
  const markPageVisited = useCallback((page: number) => {
    setVisitedPages(prev => {
      const newSet = new Set(prev);
      newSet.add(page);
      if (lessonId) {
        localStorage.setItem(`lesson_${lessonId}_visited`, JSON.stringify(Array.from(newSet)));
        // Save last page for resuming
        localStorage.setItem(`lesson_${lessonId}_lastPage`, page.toString());
      }
      return newSet;
    });
  }, [lessonId]);

  // Handle start lesson (for TRAINEE started_by)
  const handleStartLesson = async () => {
    setStartLoading(true);
    try {
      await api.post(`/api/lessons/${lessonId}/start`, null, {
        params: planId ? { training_plan_id: parseInt(planId) } : undefined
      });
      await fetchProgress();
    } catch (err: any) {
      console.error('Erro ao iniciar aula:', err);
      const detail = err?.response?.data?.detail;
      if (detail) alert(detail);
    } finally {
      setStartLoading(false);
    }
  };

  // Handle pause lesson
  const handlePauseLesson = async () => {
    setPauseLoading(true);
    try {
      await api.post(`/api/lessons/${lessonId}/pause`, null, {
        params: planId ? { training_plan_id: parseInt(planId) } : undefined
      });
      await fetchProgress();
    } catch (err: any) {
      console.error('Erro ao pausar aula:', err);
      const detail = err?.response?.data?.detail;
      if (detail) alert(detail);
    } finally {
      setPauseLoading(false);
    }
  };

  // Handle resume lesson
  const handleResumeLesson = async () => {
    setResumeLoading(true);
    try {
      await api.post(`/api/lessons/${lessonId}/resume`, null, {
        params: planId ? { training_plan_id: parseInt(planId) } : undefined
      });
      await fetchProgress();
    } catch (err: any) {
      console.error('Erro ao retomar aula:', err);
      const detail = err?.response?.data?.detail;
      if (detail) alert(detail);
    } finally {
      setResumeLoading(false);
    }
  };

  // Handle finish lesson
  const handleFinishLesson = async () => {
    if (!allPagesVisited || isFinished) return;
    
    // Se a aula foi iniciada pelo FORMADOR, verificar se está em progresso
    if (isTrainerStarted && lessonProgress?.status !== 'IN_PROGRESS') {
      alert(t('lessonView.moduleNotStartedYet'));
      return;
    }

    // Verificar se tempo real é menor que estimado
    const estimatedSeconds = (lesson?.estimated_minutes || 0) * 60;
    if (liveElapsed > 0 && liveElapsed < estimatedSeconds) {
      const estimatedMin = lesson?.estimated_minutes || 0;
      const actualMin = Math.floor(liveElapsed / 60);
      const actualSec = liveElapsed % 60;
      const confirmed = window.confirm(
        `⚠️ Atenção: O tempo real (${actualMin}m ${actualSec}s) é inferior ao tempo estimado (${estimatedMin}m).\n\nTem a certeza que deseja finalizar o módulo?`
      );
      if (!confirmed) return;
    }
    
    setFinishLoading(true);
    try {
      // Chamar API para finalizar aula
      if (planId) {
        try {
          await api.post(`/api/lessons/${lessonId}/finish`, null, {
            params: { training_plan_id: parseInt(planId) }
          });
        } catch (err: any) {
          console.error('Erro ao finalizar aula:', err);
          const detail = err?.response?.data?.detail;
          if (detail) {
            alert(detail);
            setFinishLoading(false);
            return;
          }
        }
      }
      
      // Save locally
      localStorage.setItem(`lesson_${lessonId}_finished`, 'true');
      setIsFinished(true);
      
      // Show rating modal instead of navigating immediately
      setShowRatingModal(true);
    } catch (err) {
      console.error('Error finishing lesson:', err);
    } finally {
      setFinishLoading(false);
    }
  };

  // Handle rating modal close - navigate back after rating
  const handleRatingComplete = () => {
    setShowRatingModal(false);
    setHasRated(true);
    if (planId) {
      navigate(`/training-plan/${planId}`);
    }
  };

  // Mark page as visited when changing
  useEffect(() => {
    markPageVisited(currentPage);
  }, [currentPage, markPageVisited]);

  // Live timer for lesson in progress
  useEffect(() => {
    if (lessonProgress?.status === 'IN_PROGRESS' && !lessonProgress?.is_paused) {
      // Start live timer
      const baseElapsed = lessonProgress.elapsed_seconds || 0;
      setLiveElapsed(baseElapsed);
      
      const startedCountingAt = Date.now();
      
      timerRef.current = setInterval(() => {
        const additionalSeconds = Math.floor((Date.now() - startedCountingAt) / 1000);
        setLiveElapsed(baseElapsed + additionalSeconds);
      }, 1000);
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else if (lessonProgress?.status === 'PAUSED') {
      setLiveElapsed(lessonProgress.accumulated_seconds || 0);
      if (timerRef.current) clearInterval(timerRef.current);
    } else if (lessonProgress?.status === 'COMPLETED') {
      setLiveElapsed(lessonProgress.accumulated_seconds || 0);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setLiveElapsed(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [lessonProgress?.status, lessonProgress?.is_paused, lessonProgress?.elapsed_seconds, lessonProgress?.accumulated_seconds]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/lessons/${lessonId}/detail`);
      setLesson(response.data);
      
      // Buscar progresso da aula (sempre tentar, mesmo sem planId)
      try {
        const progressResp = await api.get(`/api/lessons/${lessonId}/progress`, {
          params: planId ? { training_plan_id: planId } : undefined
        });
        setLessonProgress(progressResp.data);
        
        // Verificar se já está concluída
        if (progressResp.data?.status === 'COMPLETED') {
          setIsFinished(true);
        }
      } catch (err) {
        console.log('Progresso não encontrado');
      }
      
      // Verificar se o plano de formação está finalizado
      if (planId) {
        try {
          const planResp = await api.get(`/api/training-plans/${planId}/completion-status`);
          setIsPlanFinalized(planResp.data?.is_finalized || false);
        } catch (err) {
          console.log('Erro ao verificar status do plano');
        }
        
        // Verificar se já existe rating para esta lição (no contexto do plano de formação)
        try {
          const ratingResp = await api.get(`/api/ratings/check`, {
            params: { rating_type: 'LESSON', lesson_id: lessonId, training_plan_id: planId }
          });
          setHasRated(ratingResp.data?.exists || false);
        } catch (err) {
          console.log('Erro ao verificar rating');
        }
      }
    } catch (err: any) {
      console.error('Error fetching lesson:', err);
      setError(err.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar apenas o progresso (para polling)
  const fetchProgress = async () => {
    if (!lessonId) return;
    try {
      const progressResp = await api.get(`/api/lessons/${lessonId}/progress`, {
        params: planId ? { training_plan_id: planId } : undefined
      });
      setLessonProgress(progressResp.data);
      
      // Verificar se já está concluída
      if (progressResp.data?.status === 'COMPLETED') {
        setIsFinished(true);
      }
    } catch (err) {
      // Progresso não encontrado - normal se aula ainda não foi iniciada
    }
  };

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  // Polling para atualizar progresso automaticamente (para formando ver alterações do formador)
  useEffect(() => {
    if (!lessonId) return;
    
    const pollInterval = setInterval(() => {
      fetchProgress();
    }, 3000); // Atualiza a cada 3 segundos
    
    return () => clearInterval(pollInterval);
  }, [planId, lessonId]);

  const handleGoBack = () => {
    if (planId) {
      navigate(`/training-plan/${planId}`);
    } else {
      navigate(-1);
    }
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
          <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('common.error')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error || t('lessonView.moduleNotFound')}</p>
          <button
            onClick={handleGoBack}
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
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('common.goBack')}</span>
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
                    {t('admin.lesson')} #{(lesson.order_index || 0) + 1}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">{lesson.title}</h1>
                <p className="text-gray-300 max-w-2xl">{lesson.description}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-8">
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
                  <p className="text-lg font-semibold text-white">{lesson.course_title || 'Curso'}</p>
                  <p className="text-sm text-gray-400">{t('admin.course')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Lesson Content with Pagination */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header with Progress */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin.lessonContent')}</h3>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t('lessonView.pageOf', { current: currentPage, total: totalPages })}
                    </span>
                    {allPagesVisited && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        {t('lessonView.allRead')}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Page Indicators with progress markers */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`relative w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                        currentPage === page
                          ? 'bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/30'
                          : visitedPages.has(page)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {visitedPages.has(page) && currentPage !== page ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        page
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="p-6">
              {lesson.content ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic prose-a:text-red-600 prose-a:underline prose-code:bg-gray-100 dark:prose-code:bg-gray-700 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 min-h-[300px]"
                    dangerouslySetInnerHTML={{ __html: contentPages[currentPage - 1] || '' }}
                  />
                </AnimatePresence>
              ) : (
                <p className="text-gray-500 italic">{t('admin.noContentYet')}</p>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      currentPage === 1
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t('lessonView.previous')}
                  </button>

                  {/* Progress Bar */}
                  <div className="flex-1 mx-4">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(visitedPages.size / totalPages) * 100}%` }}
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      />
                    </div>
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('lessonView.pagesVisited', { visited: visitedPages.size, total: totalPages, percent: Math.round((visitedPages.size / totalPages) * 100) })}
                    </p>
                  </div>

                  {/* Show Finish button when all pages visited AND lesson is in progress, otherwise show Next button */}
                  {allPagesVisited && currentPage === totalPages && (canFinish || canFinishTrainee) ? (
                    <button
                      onClick={handleFinishLesson}
                      disabled={finishLoading || isFinished}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                        isFinished
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-200 dark:shadow-green-900/30'
                      }`}
                    >
                      {finishLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isFinished ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Flag className="w-4 h-4" />
                      )}
                      {isFinished ? t('lessonView.moduleCompleted') : t('lessonView.finishModule')}
                    </button>
                  ) : allPagesVisited && currentPage === totalPages && isFinished ? (
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      {t('lessonView.moduleCompleted')}
                    </div>
                  ) : (
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        currentPage === totalPages
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-red-900/30'
                      }`}
                    >
                      {t('lessonView.next')}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Botão de finalizar para aulas com 1 página apenas */}
            {totalPages <= 1 && (canFinish || canFinishTrainee) && !isFinished && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-center">
                  <button
                    onClick={handleFinishLesson}
                    disabled={finishLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 dark:shadow-green-900/30 disabled:opacity-50"
                  >
                    {finishLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Flag className="w-5 h-5" />
                    )}
                    {t('lessonView.finishModule')}
                  </button>
                </div>
              </div>
            )}
            
            {/* Indicador de aula concluída para aulas com 1 página */}
            {totalPages <= 1 && isFinished && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  {t('lessonView.moduleCompleted')}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status da Aula - sempre visível */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                lessonProgress?.status === 'COMPLETED' ? 'bg-green-500' :
                lessonProgress?.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                lessonProgress?.status === 'PAUSED' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`}>
                {lessonProgress?.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5 text-white" /> :
                 lessonProgress?.status === 'IN_PROGRESS' ? <Play className="w-5 h-5 text-white" /> :
                 lessonProgress?.status === 'PAUSED' ? <Clock className="w-5 h-5 text-white" /> :
                 <Clock className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('lessonView.moduleStatus')}</h3>
                <p className={`text-sm font-medium ${
                  lessonProgress?.status === 'COMPLETED' && lessonProgress?.is_approved ? 'text-green-600 dark:text-green-400' :
                  lessonProgress?.status === 'COMPLETED' && lessonProgress?.student_confirmed ? 'text-amber-600 dark:text-amber-400' :
                  lessonProgress?.status === 'COMPLETED' ? 'text-blue-600 dark:text-blue-400' :
                  lessonProgress?.status === 'IN_PROGRESS' ? 'text-blue-600 dark:text-blue-400' :
                  lessonProgress?.status === 'PAUSED' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {lessonProgress?.status === 'COMPLETED' && lessonProgress?.is_approved ? t('lessonView.approved') :
                   lessonProgress?.status === 'COMPLETED' && lessonProgress?.student_confirmed ? t('lessonView.awaitingApproval') :
                   lessonProgress?.status === 'COMPLETED' ? t('lessonView.awaitingConfirmation') :
                   lessonProgress?.status === 'IN_PROGRESS' ? t('lessonView.inProgress') :
                   lessonProgress?.status === 'PAUSED' ? t('lessonView.paused') :
                   t('lessonView.awaitingStart')}
                </p>
              </div>
            </div>
            
            {/* Timer ao vivo */}
            {(lessonProgress?.status === 'IN_PROGRESS' || lessonProgress?.status === 'PAUSED') && isTraineeStarted && (
              <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border ${
                lessonProgress?.status === 'PAUSED'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30'
              }`}>
                <div className="flex items-center gap-2">
                  <Timer className={`w-5 h-5 ${
                    lessonProgress?.status === 'PAUSED' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'
                  }`} />
                  <div>
                    <p className={`text-lg font-mono font-bold ${
                      lessonProgress?.status === 'PAUSED' ? 'text-yellow-700 dark:text-yellow-300' : 'text-blue-700 dark:text-blue-300'
                    }`}>{formatTime(liveElapsed)}</p>
                    {lesson?.estimated_duration && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Estimado: {formatTime(lesson.estimated_duration * 60)}
                      </p>
                    )}
                  </div>
                </div>
                {lessonProgress?.status === 'PAUSED' && (
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded-full">
                    {t('lessonView.paused')}
                  </span>
                )}
              </div>
            )}

            {/* Botões de controlo: Iniciar / Pausar / Retomar */}
            {canStart && (
              <button
                onClick={handleStartLesson}
                disabled={startLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 dark:shadow-green-900/30 disabled:opacity-50"
              >
                {startLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                Iniciar Aula
              </button>
            )}

            {canPause && (
              <button
                onClick={handlePauseLesson}
                disabled={pauseLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-amber-600 transition-all shadow-lg shadow-yellow-200 dark:shadow-yellow-900/30 disabled:opacity-50"
              >
                {pauseLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Pause className="w-5 h-5" />
                )}
                Pausar Aula
              </button>
            )}

            {canResume && (
              <button
                onClick={handleResumeLesson}
                disabled={resumeLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 dark:shadow-green-900/30 disabled:opacity-50"
              >
                {resumeLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                Retomar Aula
              </button>
            )}

            {/* Botão de finalizar na sidebar quando pode finalizar */}
            {(canFinish || canFinishTrainee) && !isFinished && (
                <button
                onClick={handleFinishLesson}
                disabled={finishLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 dark:shadow-green-900/30 disabled:opacity-50"
              >
                {finishLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Flag className="w-5 h-5" />
                )}
                {t('lessonView.finishModule')}
              </button>
            )}
            
            {/* Aula concluída e aprovada */}
            {isFinished && lessonProgress?.is_approved && (
              <div className="space-y-3">
                <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium border border-green-200 dark:border-green-800/30">
                  <CheckCircle2 className="w-5 h-5" />
                  {t('lessonView.moduleApproved')}
                </div>
                {/* Rating only available when plan is finalized */}
                {planId && isPlanFinalized && (hasRated ? (
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium border border-gray-200 dark:border-gray-600">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {t('lessonView.lessonRated')}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md"
                  >
                    <Star className="w-4 h-4" />
                    {t('lessonView.rateLesson')}
                  </button>
                ))}
              </div>
            )}
            
            {/* Aula confirmada pelo formando, aguardando aprovação do formador */}
            {isFinished && lessonProgress?.student_confirmed && !lessonProgress?.is_approved && (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg font-medium border border-amber-200 dark:border-amber-800/30">
                <Clock className="w-5 h-5" />
                {t('lessonView.awaitingTrainerApproval')}
              </div>
            )}
            
            {/* Aula finalizada mas aguardando confirmação do formando - redirecionar para plano */}
            {isFinished && !lessonProgress?.student_confirmed && !lessonProgress?.is_approved && (
                <div className="w-full flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-medium border border-blue-200 dark:border-blue-800/30">
                  <CheckCircle2 className="w-5 h-5" />
                  {t('lessonView.moduleFinishedConfirmPlan')}
                </div>
              </div>
            )}
            
            {!canFinish && !canFinishTrainee && !isFinished && !canStart && !canPause && !canResume && lessonProgress?.status !== 'IN_PROGRESS' && (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg font-medium border border-amber-200 dark:border-amber-800/30 text-sm">
                <Clock className="w-5 h-5" />
                {lessonProgress?.status === 'PAUSED' ? t('lessonView.modulePausedByTrainer') : t('lessonView.awaitingTrainerStart')}
              </div>
            )}
          </motion.div>
          
          {/* Reading Progress */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('lessonView.readingProgress')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('lessonView.pagesCount', { visited: visitedPages.size, total: totalPages })}</p>
                </div>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <div
                    key={page}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                      currentPage === page ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-white/50 dark:hover:bg-white/5'
                    }`}
                    onClick={() => goToPage(page)}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      visitedPages.has(page)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {visitedPages.has(page) ? <Check className="w-3 h-3" /> : page}
                    </div>
                    <span className={`text-sm ${currentPage === page ? 'font-medium text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {t('lessonView.page', { number: page })}
                    </span>
                    {currentPage === page && (
                      <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        {t('lessonView.current')}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {allPagesVisited && (
                <div className="mt-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800/30">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium text-sm">{t('lessonView.readingComplete')}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin.resources')}</h3>
            <div className="space-y-3">
              {lesson.video_url ? (
                <a
                  href={lesson.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{t('admin.videoLesson')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.clickToWatch')}</p>
                  </div>
                  <Play className="w-5 h-5 text-red-500" />
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg opacity-50">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-600 dark:text-gray-400">{t('admin.noVideo')}</p>
                  </div>
                </div>
              )}

              {lesson.materials_url ? (
                <a
                  href={lesson.materials_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{t('admin.materials')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.clickToAccess')}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg opacity-50">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-600 dark:text-gray-400">{t('admin.noMaterials')}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Status - apenas mostrar se há conteúdo ou recursos */}
          {(lesson.content || lesson.video_url || lesson.materials_url) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800/30 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('admin.lessonStatus')}</h3>
              </div>
              <div className="space-y-3">
                {lesson.content && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('admin.content')}</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />{t('admin.complete')}
                    </span>
                  </div>
                )}
                {lesson.video_url && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('admin.video')}</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />{t('admin.added')}
                    </span>
                  </div>
                )}
                {lesson.materials_url && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('admin.materials')}</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />{t('admin.added')}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {lesson && planId && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={handleRatingComplete}
          onSuccess={handleRatingComplete}
          ratingType="LESSON"
          itemId={lesson.id}
          itemTitle={lesson.title}
          trainingPlanId={parseInt(planId)}
        />
      )}
    </div>
  );
}
