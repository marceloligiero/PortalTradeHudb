import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  BookOpen, Calendar, ArrowLeft, Clock, Target, AlertCircle, PlayCircle, 
  CheckCircle2, Pause, Play, Eye, Settings2, TrendingUp, Timer, Award, Download
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { PremiumHeader } from '../../components/premium';

interface LessonItem {
  id: number;
  title: string;
  description?: string;
  order_index?: number;
  estimated_minutes?: number;
  lesson_type?: string;
  video_url?: string;
  materials_url?: string;
}

interface LessonProgressData {
  id: number;
  lesson_id: number;
  status: string;
  is_released: boolean;
  released_at?: string;
  released_by?: string;
  started_at?: string;
  completed_at?: string;
  elapsed_seconds: number;
  remaining_seconds: number;
  estimated_minutes: number;
  is_paused: boolean;
  is_delayed: boolean;
  is_approved: boolean;
  student_confirmed: boolean;
  student_confirmed_at?: string;
}

interface ChallengeItem {
  id: number;
  title: string;
  description?: string;
  challenge_type?: string;
  time_limit_minutes?: number;
  target_mpu?: number;
  max_errors?: number;
}

interface SubmissionData {
  id: number;
  challenge_id: number;
  status: string;
  is_approved: boolean;
  calculated_mpu?: number;
  completed_at?: string;
}

interface CourseItem {
  id: number;
  title: string;
  description?: string;
  order_index?: number;
  lessons?: LessonItem[];
  challenges?: ChallengeItem[];
}

interface CourseCompletionStatus {
  course_id: number;
  course_title: string;
  is_complete: boolean;
  total_lessons: number;
  confirmed_lessons: number;
  lessons_complete: boolean;
  total_challenges: number;
  approved_challenges: number;
  challenges_complete: boolean;
}

interface PlanCompletionStatus {
  can_finalize: boolean;
  reason: string | null;
  total_courses: number;
  completed_courses: number;
  courses_status: CourseCompletionStatus[];
  is_finalized: boolean;
  finalized_at?: string;
  certificate_id?: number;
  certificate_number?: string;
}

interface PlanDetail {
  id: number;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  days_total?: number | null;
  days_remaining?: number | null;
  status?: string | null;
  courses?: CourseItem[];
  student?: { id: number; full_name: string; email: string };
  student_id?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function TrainingPlanDetail() {
  useTranslation(); // for future translations
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { isDark } = useTheme();

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lessonProgress, setLessonProgress] = useState<Record<number, LessonProgressData>>({});
  const [submissions, setSubmissions] = useState<Record<number, SubmissionData>>({});
  const [challengeReleases, setChallengeReleases] = useState<Record<number, boolean>>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [completionStatus, setCompletionStatus] = useState<PlanCompletionStatus | null>(null);
  const [finalizingPlan, setFinalizingPlan] = useState(false);

  const isStudent = user?.role === 'STUDENT' || user?.role === 'TRAINEE';
  const isTrainer = user?.role === 'TRAINER' || user?.role === 'ADMIN';

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    if (!id) return;
    fetchPlan();
  }, [id, token, user]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const resp = await api.get(`/api/training-plans/${id}`);
      setPlan(resp.data);
      if (resp.data.courses) {
        await fetchProgressData(resp.data);
      }
      // Buscar status de conclusão do plano
      await fetchCompletionStatus();
    } catch (err: any) {
      console.error('Error fetching plan details:', err);
      setError(err?.response?.data?.detail || 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletionStatus = async () => {
    try {
      const resp = await api.get(`/api/training-plans/${id}/completion-status`);
      setCompletionStatus(resp.data);
    } catch (err) {
      console.error('Error fetching completion status:', err);
    }
  };

  const handleFinalizePlan = async () => {
    if (!completionStatus?.can_finalize) {
      alert('Não é possível finalizar o plano. Verifique se todos os cursos estão completos.');
      return;
    }
    
    if (!confirm('Tem certeza que deseja finalizar este plano de formação? Esta ação irá gerar o certificado para o formando.')) {
      return;
    }
    
    setFinalizingPlan(true);
    try {
      const resp = await api.post(`/api/training-plans/${id}/finalize`);
      alert(`${resp.data.message}\n\nCertificado: ${resp.data.certificate.certificate_number}`);
      await fetchCompletionStatus();
      await fetchPlan();
    } catch (err: any) {
      console.error('Error finalizing plan:', err);
      alert(err?.response?.data?.detail || 'Erro ao finalizar plano');
    } finally {
      setFinalizingPlan(false);
    }
  };

  const getCourseCompletionStatus = (courseId: number): CourseCompletionStatus | null => {
    if (!completionStatus?.courses_status) return null;
    return completionStatus.courses_status.find(c => c.course_id === courseId) || null;
  };

  const fetchProgressData = async (planData: PlanDetail) => {
    const progressMap: Record<number, LessonProgressData> = {};
    const submissionsMap: Record<number, SubmissionData> = {};
    const releasesMap: Record<number, boolean> = {};
    const targetUserId = isStudent ? user?.id : planData.student_id;
    if (!targetUserId) return;

    for (const course of planData.courses || []) {
      for (const lesson of course.lessons || []) {
        try {
          const resp = await api.get(`/api/lessons/${lesson.id}/progress`, {
            params: { user_id: targetUserId, training_plan_id: id }
          });
          progressMap[lesson.id] = resp.data;
        } catch (err) { /* Aula ainda não iniciada */ }
      }

      for (const challenge of course.challenges || []) {
        try {
          const resp = await api.get(`/api/challenges/${challenge.id}/submissions`, {
            params: { user_id: targetUserId, training_plan_id: id }
          });
          if (resp.data && resp.data.length > 0) {
            submissionsMap[challenge.id] = resp.data[0];
          }
        } catch (err) { /* Sem submissões */ }
        
        // Verificar se desafio está liberado
        try {
          const releaseResp = await api.get(`/api/challenges/${challenge.id}/is-released/${targetUserId}`);
          releasesMap[challenge.id] = releaseResp.data.released;
        } catch (err) {
          releasesMap[challenge.id] = false;
        }
      }
    }

    setLessonProgress(progressMap);
    setSubmissions(submissionsMap);
    setChallengeReleases(releasesMap);
  };

  const handleReleaseChallenge = async (challengeId: number) => {
    if (actionLoading) return;
    setActionLoading(challengeId);
    
    try {
      const targetUserId = plan?.student_id;
      if (!targetUserId) {
        alert('Estudante não encontrado no plano');
        return;
      }
      
      await api.post(`/api/challenges/${challengeId}/release/${targetUserId}`, null, {
        params: { training_plan_id: id }
      });
      
      // Atualizar estado local
      setChallengeReleases(prev => ({ ...prev, [challengeId]: true }));
    } catch (err: any) {
      console.error('Erro ao liberar desafio:', err);
      alert(err?.response?.data?.detail || 'Erro ao liberar desafio');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLessonAction = async (lessonId: number, action: 'release' | 'start' | 'pause' | 'resume' | 'finish' | 'confirm' | 'approve') => {
    if (actionLoading) return;
    setActionLoading(lessonId);

    try {
      const targetUserId = isStudent ? user?.id : plan?.student_id;
      
      if (action === 'confirm') {
        // Formando confirma que fez a aula
        await api.post(`/api/lessons/${lessonId}/confirm`, null, {
          params: { training_plan_id: id }
        });
      } else if (action === 'release') {
        // Formador libera a aula para o formando
        await api.post(`/api/lessons/${lessonId}/release`, null, {
          params: { user_id: targetUserId, training_plan_id: id }
        });
      } else if (action === 'approve') {
        // Formador aprova a aula finalizada
        await api.post(`/api/lessons/${lessonId}/approve`, null, {
          params: { user_id: targetUserId, training_plan_id: id, is_approved: true }
        });
      } else if (isStudent) {
        // Formando controla sua própria aula (start/pause/resume/finish)
        await api.post(`/api/lessons/${lessonId}/${action}`, null, {
          params: { training_plan_id: id }
        });
      } else {
        // Fallback para ações antigas (não deve ser usado)
        await api.post(`/api/lessons/${lessonId}/${action}`, null, {
          params: { user_id: targetUserId, training_plan_id: id }
        });
      }

      const resp = await api.get(`/api/lessons/${lessonId}/progress`, {
        params: { user_id: targetUserId, training_plan_id: id }
      });
      setLessonProgress(prev => ({ ...prev, [lessonId]: resp.data }));
    } catch (err: any) {
      console.error('Error:', err);
      alert(err?.response?.data?.detail || 'Erro ao executar ação');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLessonStatusBadge = (progress?: LessonProgressData) => {
    if (!progress) return { color: 'bg-gray-500/20 text-gray-400', label: 'Não iniciada' };
    switch (progress.status) {
      case 'COMPLETED': return { color: 'bg-green-500/20 text-green-400', label: progress.is_approved ? '✓ Aprovada' : 'Concluída' };
      case 'IN_PROGRESS': return { color: 'bg-blue-500/20 text-blue-400', label: 'Em andamento' };
      case 'PAUSED': return { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pausada' };
      case 'RELEASED': return { color: 'bg-purple-500/20 text-purple-400', label: '🔓 Liberada' };
      default: return { color: 'bg-gray-500/20 text-gray-400', label: 'Não iniciada' };
    }
  };

  const getSubmissionStatusBadge = (submission?: SubmissionData) => {
    if (!submission) return null;
    if (submission.is_approved) return { color: 'bg-green-500/20 text-green-400', label: 'Aprovado' };
    if (submission.status === 'PENDING_REVIEW') return { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pendente' };
    return { color: 'bg-red-500/20 text-red-400', label: 'Reprovado' };
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full"
      />
    </div>
  );

  if (error) return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'} border rounded-xl p-6 max-w-md`}>
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-red-500">{error}</p>
      </div>
    </div>
  );

  if (!plan) return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Plano não encontrado</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <PremiumHeader
        icon={BookOpen}
        title={plan.title}
        subtitle={plan.description}
        badge={isStudent ? 'Meu Plano' : 'Plano de Formação'}
        iconColor="from-red-500 to-red-700"
        actions={
          <div className="flex items-center gap-3">
            {/* Botão Finalizar Plano - só para formador quando pode finalizar */}
            {isTrainer && completionStatus && !completionStatus.is_finalized && completionStatus.can_finalize && (
              <button
                onClick={handleFinalizePlan}
                disabled={finalizingPlan}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <Award className="w-5 h-5" />
                {finalizingPlan ? 'Finalizando...' : 'Finalizar Plano'}
              </button>
            )}
            
            {/* Botão Ver Certificado - quando já finalizado */}
            {completionStatus?.is_finalized && completionStatus?.certificate_id && (
              <button
                onClick={() => navigate(`/certificates/${completionStatus.certificate_id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Award className="w-5 h-5" />
                Ver Certificado
              </button>
            )}
            
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                isDark 
                  ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' 
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        }
      >
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 border`}>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.courses?.length ?? 0}</span>
            </div>
            <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>Cursos</p>
          </div>

          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 border`}>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.days_total ?? '-'}</span>
            </div>
            <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>Dias totais</p>
          </div>

          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 border`}>
            <div className="flex items-center gap-3 mb-2">
              <Clock className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.days_remaining ?? '-'}</span>
            </div>
            <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>Dias restantes</p>
          </div>

          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 border`}>
            <div className={`px-3 py-1 rounded-lg text-sm font-bold inline-block ${
              plan.status === 'COMPLETED' ? 'bg-amber-500/20 text-amber-400' :
              plan.status === 'ONGOING' || plan.status === 'IN_PROGRESS' ? 'bg-green-500/20 text-green-400' : 
              plan.status === 'UPCOMING' || plan.status === 'PENDING' ? 'bg-blue-500/20 text-blue-400' : 
              plan.status === 'DELAYED' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {plan.status === 'COMPLETED' ? '✅ Concluído' : 
               plan.status === 'IN_PROGRESS' || plan.status === 'ONGOING' ? '🔄 Em Progresso' :
               plan.status === 'PENDING' || plan.status === 'UPCOMING' ? '⏳ Pendente' :
               plan.status === 'DELAYED' ? '⚠️ Atrasado' :
               plan.status || 'Ativo'}
            </div>
            <p className={`${isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'} mt-2`}>Estado</p>
          </div>
        </div>
      </PremiumHeader>

      {/* Status de Conclusão do Plano - Painel Informativo */}
      {completionStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-6 ${
            completionStatus.is_finalized
              ? isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
              : completionStatus.can_finalize
                ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                : isDark ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              completionStatus.is_finalized
                ? 'bg-green-500/20'
                : completionStatus.can_finalize
                  ? 'bg-emerald-500/20'
                  : 'bg-yellow-500/20'
            }`}>
              {completionStatus.is_finalized ? (
                <Award className="w-6 h-6 text-green-400" />
              ) : completionStatus.can_finalize ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : (
                <Clock className="w-6 h-6 text-yellow-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold ${
                completionStatus.is_finalized
                  ? 'text-green-400'
                  : completionStatus.can_finalize
                    ? 'text-emerald-400'
                    : 'text-yellow-400'
              }`}>
                {completionStatus.is_finalized
                  ? '✓ Plano Finalizado'
                  : completionStatus.can_finalize
                    ? '✓ Pronto para Finalizar!'
                    : 'Aguardando Conclusão dos Cursos'
                }
              </h3>
              <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
                {completionStatus.is_finalized
                  ? `Certificado: ${completionStatus.certificate_number}`
                  : completionStatus.can_finalize
                    ? `Todos os ${completionStatus.total_courses} cursos foram concluídos. Clique em "Finalizar Plano" para gerar o certificado.`
                    : `${completionStatus.completed_courses}/${completionStatus.total_courses} cursos completos. Todos os cursos precisam ter as aulas confirmadas e desafios aprovados.`
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Conteúdo do Plano
        </h2>

        <div className="space-y-6">
          {plan.courses && plan.courses.length > 0 ? (
            plan.courses.map((course, idx) => (
              <motion.div 
                key={course.id} 
                variants={cardVariants}
                className={`rounded-2xl border overflow-hidden ${
                  isDark 
                    ? 'bg-white/5 border-white/10 backdrop-blur-xl' 
                    : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                {/* Course Header */}
                <div className={`p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-red-600/30">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{course.title}</h3>
                        {/* Badge de status do curso */}
                        {(() => {
                          const courseStatus = getCourseCompletionStatus(course.id);
                          if (courseStatus?.is_complete) {
                            return (
                              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Curso Completo
                              </span>
                            );
                          } else if (courseStatus) {
                            return (
                              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                {courseStatus.confirmed_lessons}/{courseStatus.total_lessons} aulas • {courseStatus.approved_challenges}/{courseStatus.total_challenges} desafios
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{course.description}</p>
                    </div>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Lessons */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <BookOpen className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                        <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Aulas</h4>
                        <span className={`ml-auto text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {course.lessons?.length ?? 0} aulas
                        </span>
                      </div>

                      {course.lessons && course.lessons.length > 0 ? (
                        <ul className="space-y-3">
                          {course.lessons.map((lesson) => {
                            const progress = lessonProgress[lesson.id];
                            const statusBadge = getLessonStatusBadge(progress);
                            
                            // Para formando: mostrar apenas aulas liberadas ou em progresso
                            if (isStudent) {
                              const canView = progress?.is_released || progress?.status === 'IN_PROGRESS' || progress?.status === 'PAUSED' || progress?.status === 'COMPLETED';
                              
                              if (!canView) {
                                return (
                                  <li key={lesson.id} className={`rounded-xl p-4 border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'} opacity-50`}>
                                    <div className="flex items-center gap-3">
                                      <span className={`text-xs font-bold px-2 py-1 rounded ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                                        #{lesson.order_index}
                                      </span>
                                      <h5 className={isDark ? 'text-gray-500' : 'text-gray-400'}>{lesson.title}</h5>
                                    </div>
                                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                      🔒 Aguardando liberação pelo formador
                                    </p>
                                  </li>
                                );
                              }
                            }

                            return (
                              <li 
                                key={lesson.id} 
                                className={`rounded-xl p-4 border transition-all ${
                                  isDark 
                                    ? 'bg-white/5 border-white/10 hover:border-red-500/30' 
                                    : 'bg-white border-gray-100 hover:border-red-300 shadow-sm'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-xs font-bold px-2 py-1 rounded ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                        #{lesson.order_index}
                                      </span>
                                      <h5 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{lesson.title}</h5>
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge.color}`}>
                                        {statusBadge.label}
                                      </span>
                                    </div>

                                    <div className={`flex items-center gap-3 mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {lesson.estimated_minutes} min
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                        {lesson.lesson_type}
                                      </span>
                                    </div>

                                    {/* Info de liberação para formador */}
                                    {isTrainer && progress?.is_released && progress.status === 'RELEASED' && (
                                      <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                                        <p className="text-sm text-blue-400">
                                          ✓ Liberada por {progress.released_by || 'formador'}
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                          Aguardando o formando iniciar
                                        </p>
                                      </div>
                                    )}

                                    {progress && (progress.status === 'IN_PROGRESS' || progress.status === 'PAUSED' || progress.status === 'COMPLETED') && (
                                      <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                        <div className="flex items-center justify-between text-sm">
                                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                            <Timer className="w-4 h-4 inline mr-1" />
                                            Tempo: {formatTime(progress.elapsed_seconds)}
                                          </span>
                                          {progress.is_delayed && (
                                            <span className="text-red-400 font-medium">Atrasado</span>
                                          )}
                                        </div>
                                        {progress.student_confirmed && (
                                          <div className="flex items-center gap-1 mt-2 text-green-400 text-xs">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Confirmado pelo formando
                                          </div>
                                        )}
                                        {progress.is_approved && (
                                          <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Aprovada pelo formador
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Botões de Ação */}
                                  <div className="flex flex-col gap-2">
                                    {/* ===== BOTÕES PARA FORMANDO ===== */}
                                    {isStudent && (
                                      <>
                                        {/* Aula liberada mas não iniciada - mostrar botão Iniciar */}
                                        {progress?.is_released && progress.status === 'RELEASED' && (
                                          <button
                                            onClick={() => handleLessonAction(lesson.id, 'start')}
                                            disabled={actionLoading === lesson.id}
                                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                                          >
                                            <Play className="w-4 h-4" />
                                            Iniciar
                                          </button>
                                        )}

                                        {/* Aula em progresso - mostrar Pausar e Finalizar */}
                                        {progress?.status === 'IN_PROGRESS' && !progress.is_paused && (
                                          <>
                                            <button
                                              onClick={() => handleLessonAction(lesson.id, 'pause')}
                                              disabled={actionLoading === lesson.id}
                                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg text-sm font-medium hover:from-yellow-700 hover:to-orange-700 transition-all disabled:opacity-50"
                                            >
                                              <Pause className="w-4 h-4" />
                                              Pausar
                                            </button>
                                            <button
                                              onClick={() => handleLessonAction(lesson.id, 'finish')}
                                              disabled={actionLoading === lesson.id}
                                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                                            >
                                              <CheckCircle2 className="w-4 h-4" />
                                              Finalizar
                                            </button>
                                          </>
                                        )}

                                        {/* Aula pausada - mostrar Retomar */}
                                        {progress?.status === 'PAUSED' && (
                                          <>
                                            <button
                                              onClick={() => handleLessonAction(lesson.id, 'resume')}
                                              disabled={actionLoading === lesson.id}
                                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                                            >
                                              <Play className="w-4 h-4" />
                                              Retomar
                                            </button>
                                            <button
                                              onClick={() => handleLessonAction(lesson.id, 'finish')}
                                              disabled={actionLoading === lesson.id}
                                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                                            >
                                              <CheckCircle2 className="w-4 h-4" />
                                              Finalizar
                                            </button>
                                          </>
                                        )}

                                        {/* Aula concluída mas não confirmada - mostrar Confirmar */}
                                        {progress?.status === 'COMPLETED' && !progress.student_confirmed && (
                                          <button
                                            onClick={() => handleLessonAction(lesson.id, 'confirm')}
                                            disabled={actionLoading === lesson.id}
                                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                                          >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Confirmar
                                          </button>
                                        )}

                                        {/* Ver aula - sempre disponível para estudante */}
                                        <button
                                          onClick={() => navigate(`/lessons/${lesson.id}/view?planId=${id}`)}
                                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                            isDark 
                                              ? 'bg-white/10 text-white hover:bg-white/20' 
                                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                          }`}
                                        >
                                          <Eye className="w-4 h-4" />
                                          Ver Aula
                                        </button>
                                      </>
                                    )}

                                    {/* ===== BOTÕES PARA FORMADOR/ADMIN ===== */}
                                    {isTrainer && (
                                      <>
                                        {/* Aula não liberada - mostrar Liberar */}
                                        {(!progress || progress.status === 'NOT_STARTED') && !progress?.is_released && (
                                          <button
                                            onClick={() => handleLessonAction(lesson.id, 'release')}
                                            disabled={actionLoading === lesson.id}
                                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                                          >
                                            <PlayCircle className="w-4 h-4" />
                                            Liberar
                                          </button>
                                        )}

                                        {/* Aula concluída mas não aprovada - mostrar Aprovar */}
                                        {progress?.status === 'COMPLETED' && !progress.is_approved && (
                                          <button
                                            onClick={() => handleLessonAction(lesson.id, 'approve')}
                                            disabled={actionLoading === lesson.id}
                                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                                          >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Aprovar
                                          </button>
                                        )}

                                        {/* Aula concluída - botão Gerir */}
                                        {progress?.status === 'COMPLETED' && (
                                          <button
                                            onClick={() => navigate(`/lessons/${lesson.id}/manage?planId=${id}&courseId=${course.id}`)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                              isDark 
                                                ? 'bg-white/10 text-white hover:bg-white/20' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                          >
                                            <Settings2 className="w-4 h-4" />
                                            Gerir
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Sem aulas cadastradas</p>
                        </div>
                      )}
                    </div>

                    {/* Challenges */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Target className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Desafios</h4>
                        <span className={`ml-auto text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {course.challenges?.length ?? 0} desafios
                        </span>
                      </div>

                      {course.challenges && course.challenges.length > 0 ? (
                        <ul className="space-y-3">
                          {course.challenges.map((challenge) => {
                            const submission = submissions[challenge.id];
                            const submissionBadge = getSubmissionStatusBadge(submission);

                            // Para formando: mostrar desafio sempre (pode iniciar a qualquer momento)
                            return (
                              <li 
                                key={challenge.id} 
                                className={`rounded-xl p-4 border transition-all ${
                                  isDark 
                                    ? 'bg-white/5 border-white/10 hover:border-green-500/30' 
                                    : 'bg-white border-gray-100 hover:border-green-300 shadow-sm'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h5 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{challenge.title}</h5>
                                      {submissionBadge && (
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${submissionBadge.color}`}>
                                          {submissionBadge.label}
                                        </span>
                                      )}
                                    </div>

                                    <div className={`flex flex-wrap gap-2 mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                        <Clock className="w-3 h-3" />
                                        {challenge.time_limit_minutes} min
                                      </span>
                                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                        <Target className="w-3 h-3" />
                                        MPU: {challenge.target_mpu}
                                      </span>
                                      <span className={`px-2 py-1 rounded-lg font-medium ${
                                        challenge.challenge_type === 'COMPLETE' 
                                          ? 'bg-blue-500/20 text-blue-400' 
                                          : 'bg-purple-500/20 text-purple-400'
                                      }`}>
                                        {challenge.challenge_type}
                                      </span>
                                    </div>

                                    {submission && (
                                      <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                        <div className="flex items-center gap-4 text-sm">
                                          {submission.calculated_mpu && (
                                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                              <TrendingUp className="w-4 h-4 inline mr-1" />
                                              MPU: {submission.calculated_mpu.toFixed(2)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-2">
                                    {/* ===== BOTÕES PARA FORMANDO ===== */}
                                    {isStudent && !submission && !challengeReleases[challenge.id] && (
                                      <span className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                                        isDark 
                                          ? 'bg-gray-500/20 text-gray-400' 
                                          : 'bg-gray-100 text-gray-500'
                                      }`}>
                                        <Clock className="w-4 h-4" />
                                        Aguardando liberação
                                      </span>
                                    )}

                                    {isStudent && !submission && challengeReleases[challenge.id] && (
                                      <button
                                        onClick={() => {
                                          const route = challenge.challenge_type === 'COMPLETE'
                                            ? `/challenges/${challenge.id}/execute?planId=${id}`
                                            : `/challenges/${challenge.id}/execute/summary?planId=${id}`;
                                          navigate(route);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
                                      >
                                        <Play className="w-4 h-4" />
                                        Iniciar Desafio
                                      </button>
                                    )}

                                    {isStudent && submission && (
                                      <button
                                        onClick={() => navigate(`/challenges/result/${submission.id}`)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                          isDark 
                                            ? 'bg-white/10 text-white hover:bg-white/20' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                      >
                                        <Eye className="w-4 h-4" />
                                        Ver Resultado
                                      </button>
                                    )}

                                    {/* ===== BOTÕES PARA FORMADOR ===== */}
                                    {isTrainer && !submission && !challengeReleases[challenge.id] && (
                                      <button
                                        onClick={() => handleReleaseChallenge(challenge.id)}
                                        disabled={actionLoading === challenge.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                                      >
                                        <PlayCircle className="w-4 h-4" />
                                        Liberar
                                      </button>
                                    )}

                                    {isTrainer && !submission && challengeReleases[challenge.id] && (
                                      <span className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                                        isDark 
                                          ? 'bg-purple-500/20 text-purple-400' 
                                          : 'bg-purple-100 text-purple-600'
                                      }`}>
                                        <Clock className="w-4 h-4" />
                                        Aguardando formando
                                      </span>
                                    )}

                                    {isTrainer && submission && (
                                      <>
                                        {/* Em andamento */}
                                        {submission.status === 'IN_PROGRESS' && (
                                          <span className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium">
                                            <Clock className="w-4 h-4" />
                                            Em Andamento
                                          </span>
                                        )}
                                        
                                        {/* Submetido para revisão - botão Corrigir */}
                                        {(submission.status === 'PENDING_REVIEW' || submission.status === 'SUBMITTED') && !submission.is_approved && (
                                          <button
                                            onClick={() => navigate(`/submissions/${submission.id}/review?planId=${id}`)}
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
                                          >
                                            <Settings2 className="w-4 h-4" />
                                            Corrigir
                                          </button>
                                        )}
                                        
                                        {/* Já corrigido - Ver Resultado */}
                                        {(submission.status === 'COMPLETED' || submission.is_approved) && (
                                          <button
                                            onClick={() => navigate(`/challenges/result/${submission.id}`)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                              isDark 
                                                ? 'bg-white/10 text-white hover:bg-white/20' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                          >
                                            <Eye className="w-4 h-4" />
                                            Ver Resultado
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Sem desafios cadastrados</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-16">
              <BookOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
              <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>Sem cursos neste plano</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
