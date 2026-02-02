import { useState, useEffect, useMemo, useCallback } from 'react';
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
  AlertCircle,
  Sparkles,
  Flag,
  Loader2
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
  const planId = searchParams.get('planId');
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

  // Se a aula foi iniciada pelo FORMADOR, o formando pode finalizar após ler todas as páginas
  const isTrainerStarted = lesson?.started_by === 'TRAINER';

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
      
      // Check if already finished
      const finished = localStorage.getItem(`lesson_${lessonId}_finished`);
      if (finished === 'true') {
        setIsFinished(true);
      }
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

  // Handle finish lesson
  const handleFinishLesson = async () => {
    if (!allPagesVisited || isFinished) return;
    
    // Se a aula foi iniciada pelo FORMADOR, verificar se está em progresso
    if (isTrainerStarted && lessonProgress?.status !== 'IN_PROGRESS') {
      alert('O módulo precisa estar em andamento para ser finalizado.');
      return;
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
    if (planId) {
      navigate(`/training-plan/${planId}`);
    }
  };

  // Mark page as visited when changing
  useEffect(() => {
    markPageVisited(currentPage);
  }, [currentPage, markPageVisited]);

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
      
      // Buscar progresso da aula se tiver planId
      if (planId) {
        try {
          const progressResp = await api.get(`/api/lessons/${lessonId}/progress`, {
            params: { training_plan_id: planId }
          });
          setLessonProgress(progressResp.data);
          
          // Verificar se já está concluída
          if (progressResp.data?.status === 'COMPLETED') {
            setIsFinished(true);
          }
        } catch (err) {
          console.log('Progresso não encontrado');
        }
      }
    } catch (err: any) {
      console.error('Error fetching lesson:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar módulo');
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar apenas o progresso (para polling)
  const fetchProgress = async () => {
    if (!planId || !lessonId) return;
    try {
      const progressResp = await api.get(`/api/lessons/${lessonId}/progress`, {
        params: { training_plan_id: planId }
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
    if (!planId || !lessonId) return;
    
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
          <p className="text-gray-500 mb-4">{error || 'Módulo não encontrado'}</p>
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
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            {/* Header with Progress */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{t('admin.lessonContent')}</h3>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Página {currentPage} de {totalPages}
                    </span>
                    {allPagesVisited && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Concluído
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
                          ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                          : visitedPages.has(page)
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
                    className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-a:text-red-600 prose-a:underline prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 min-h-[300px]"
                    dangerouslySetInnerHTML={{ __html: contentPages[currentPage - 1] || '' }}
                  />
                </AnimatePresence>
              ) : (
                <p className="text-gray-500 italic">{t('admin.noContentYet')}</p>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </button>

                  {/* Progress Bar */}
                  <div className="flex-1 mx-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(visitedPages.size / totalPages) * 100}%` }}
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      />
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-1">
                      {visitedPages.size} de {totalPages} páginas visitadas ({Math.round((visitedPages.size / totalPages) * 100)}%)
                    </p>
                  </div>

                  {/* Show Finish button when all pages visited AND lesson is in progress, otherwise show Next button */}
                  {allPagesVisited && currentPage === totalPages && canFinish ? (
                    <button
                      onClick={handleFinishLesson}
                      disabled={finishLoading || isFinished}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                        isFinished
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-200'
                      }`}
                    >
                      {finishLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isFinished ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Flag className="w-4 h-4" />
                      )}
                      {isFinished ? 'Módulo Concluído' : 'Finalizar Módulo'}
                    </button>
                  ) : allPagesVisited && currentPage === totalPages && isFinished ? (
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-green-100 text-green-700 rounded-lg font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Módulo Concluído
                    </div>
                  ) : (
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200'
                      }`}
                    >
                      Próxima
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Botão de finalizar para aulas com 1 página apenas */}
            {totalPages <= 1 && canFinish && !isFinished && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-center">
                  <button
                    onClick={handleFinishLesson}
                    disabled={finishLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
                  >
                    {finishLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Flag className="w-5 h-5" />
                    )}
                    Finalizar Módulo
                  </button>
                </div>
              </div>
            )}
            
            {/* Indicador de aula concluída para aulas com 1 página */}
            {totalPages <= 1 && isFinished && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-lg font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  Módulo Concluído
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
            className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-6"
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
                <h3 className="font-semibold text-gray-900">Status do Módulo</h3>
                <p className={`text-sm font-medium ${
                  lessonProgress?.status === 'COMPLETED' && lessonProgress?.is_approved ? 'text-green-600' :
                  lessonProgress?.status === 'COMPLETED' && lessonProgress?.student_confirmed ? 'text-amber-600' :
                  lessonProgress?.status === 'COMPLETED' ? 'text-blue-600' :
                  lessonProgress?.status === 'IN_PROGRESS' ? 'text-blue-600' :
                  lessonProgress?.status === 'PAUSED' ? 'text-yellow-600' :
                  'text-gray-500'
                }`}>
                  {lessonProgress?.status === 'COMPLETED' && lessonProgress?.is_approved ? 'Aprovado ✓' :
                   lessonProgress?.status === 'COMPLETED' && lessonProgress?.student_confirmed ? 'Aguardando aprovação' :
                   lessonProgress?.status === 'COMPLETED' ? 'Aguardando confirmação' :
                   lessonProgress?.status === 'IN_PROGRESS' ? 'Em Andamento' :
                   lessonProgress?.status === 'PAUSED' ? 'Pausado' :
                   'Aguardando início'}
                </p>
              </div>
            </div>
            
            {/* Botão de finalizar na sidebar quando pode finalizar */}
            {canFinish && !isFinished && (
                <button
                onClick={handleFinishLesson}
                disabled={finishLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
              >
                {finishLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Flag className="w-5 h-5" />
                )}
                Finalizar Módulo
              </button>
            )}
            
            {/* Aula concluída e aprovada */}
            {isFinished && lessonProgress?.is_approved && (
              <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg font-medium border border-green-200">
                <CheckCircle2 className="w-5 h-5" />
                Módulo Aprovado ✓
              </div>
            )}
            
            {/* Aula confirmada pelo formando, aguardando aprovação do formador */}
            {isFinished && lessonProgress?.student_confirmed && !lessonProgress?.is_approved && (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-100 text-amber-700 rounded-lg font-medium border border-amber-200">
                <Clock className="w-5 h-5" />
                Aguardando aprovação do formador
              </div>
            )}
            
            {/* Aula finalizada mas aguardando confirmação do formando - redirecionar para plano */}
            {isFinished && !lessonProgress?.student_confirmed && !lessonProgress?.is_approved && (
                <div className="w-full flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg font-medium border border-blue-200">
                  <CheckCircle2 className="w-5 h-5" />
                  Módulo finalizado - Confirme no plano
                </div>
              </div>
            )}
            
            {!canFinish && !isFinished && lessonProgress?.status !== 'IN_PROGRESS' && (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-100 text-amber-700 rounded-lg font-medium border border-amber-200 text-sm">
                <Clock className="w-5 h-5" />
                {lessonProgress?.status === 'PAUSED' ? 'Módulo pausado pelo formador' : 'Aguardando formador iniciar'}
              </div>
            )}
          </motion.div>
          
          {/* Reading Progress */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Progresso de Leitura</h3>
                  <p className="text-sm text-gray-500">{visitedPages.size} de {totalPages} páginas</p>
                </div>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <div
                    key={page}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                      currentPage === page ? 'bg-blue-100' : 'hover:bg-white/50'
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
                    <span className={`text-sm ${currentPage === page ? 'font-medium text-blue-700' : 'text-gray-600'}`}>
                      Página {page}
                    </span>
                    {currentPage === page && (
                      <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        Atual
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {allPagesVisited && (
                <div className="mt-4">
                  <div className="p-3 bg-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium text-sm">Leitura completa!</span>
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

      {/* Rating Modal */}
      {lesson && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={handleRatingComplete}
          onSuccess={handleRatingComplete}
          ratingType="LESSON"
          itemId={lesson.id}
          itemTitle={lesson.title}
        />
      )}
    </div>
  );
}
