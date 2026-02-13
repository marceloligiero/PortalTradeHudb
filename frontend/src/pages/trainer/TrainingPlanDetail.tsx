import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  BookOpen, Calendar, ArrowLeft, Clock, Target, AlertCircle, PlayCircle, 
  CheckCircle2, Pause, Play, Eye, Settings2, TrendingUp, Timer, Award, Download, Star, User, ChevronDown, Users, UserPlus, UserMinus, Edit3, Search, Trash2
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { PremiumHeader } from '../../components/premium';
import RatingModal from '../../components/RatingModal';

interface LessonItem {
  id: number;
  title: string;
  description?: string;
  order_index?: number;
  estimated_minutes?: number;
  lesson_type?: string;
  video_url?: string;
  materials_url?: string;
  started_by?: string;  // TRAINER ou TRAINEE - quem pode iniciar a aula
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
  finished_by?: string;
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

interface TrainerInfo {
  id: number;
  full_name: string;
  email?: string;
  is_primary: boolean;
  assigned_at?: string;
}

interface EnrolledStudent {
  id: number;
  full_name: string;
  email: string;
  enrollment_id: number;
  status: string;
  progress_percentage: number;
  start_date?: string;
  end_date?: string;
  assigned_at?: string;
  completed_at?: string;
  notes?: string;
  days_remaining?: number;
  is_delayed?: boolean;
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
  trainers?: TrainerInfo[];
  enrolled_students?: EnrolledStudent[];
  enrolled_count?: number;
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
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { isDark } = useTheme();

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lessonProgress, setLessonProgress] = useState<Record<number, LessonProgressData>>({});
  const [progressFetchTime, setProgressFetchTime] = useState<Record<number, number>>({});
  const [submissions, setSubmissions] = useState<Record<number, SubmissionData>>({});
  const [challengeReleases, setChallengeReleases] = useState<Record<number, boolean>>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [completionStatus, setCompletionStatus] = useState<PlanCompletionStatus | null>(null);
  const [finalizingPlan, setFinalizingPlan] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Enrollment management state
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [showEnrollmentPanel, setShowEnrollmentPanel] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [enrollingStudents, setEnrollingStudents] = useState(false);

  // Trainer management state
  const [showTrainerPanel, setShowTrainerPanel] = useState(false);
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [addingTrainer, setAddingTrainer] = useState(false);

  // Filter state
  const [studentFilter, setStudentFilter] = useState('');
  const [trainerFilter, setTrainerFilter] = useState('');

  // Rating state
  const [showPlanRatingModal, setShowPlanRatingModal] = useState(false);
  const [showTrainerRatingModal, setShowTrainerRatingModal] = useState(false);
  const [showCourseRatingModal, setShowCourseRatingModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerInfo | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [hasPlanRating, setHasPlanRating] = useState(false);
  const [trainerRatings, setTrainerRatings] = useState<Record<number, boolean>>({});
  const [courseRatings, setCourseRatings] = useState<Record<number, boolean>>({});
  const [pendingRatingsCount, setPendingRatingsCount] = useState(0);

  const isStudent = user?.role === 'STUDENT' || user?.role === 'TRAINEE';
  const isTrainer = user?.role === 'TRAINER' || user?.role === 'ADMIN';

  // Timer para atualizar tempo decorrido das aulas em progresso
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Polling para atualizar progresso automaticamente (para formando ver alterações do formador)
  useEffect(() => {
    if (!plan || !isStudent) return;
    
    const pollInterval = setInterval(async () => {
      try {
        await fetchProgressData(plan);
      } catch (err) {
        console.log('Polling error:', err);
      }
    }, 5000); // Atualiza a cada 5 segundos
    
    return () => clearInterval(pollInterval);
  }, [plan, isStudent]);

  // Polling para formador ver alterações do formando (ex: quando formando finaliza)
  useEffect(() => {
    if (!plan || !isTrainer || !selectedStudentId) return;
    
    const pollInterval = setInterval(async () => {
      try {
        await fetchProgressData(plan);
      } catch (err) {
        console.log('Polling error:', err);
      }
    }, 5000); // Atualiza a cada 5 segundos
    
    return () => clearInterval(pollInterval);
  }, [plan, isTrainer, selectedStudentId]);

  // Refetch progress when selected student changes
  useEffect(() => {
    if (plan && selectedStudentId && isTrainer) {
      fetchProgressData(plan);
      fetchCompletionStatus();
    }
  }, [selectedStudentId]);

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    if (!id) return;
    fetchPlan();
  }, [id, token, user]);

  // Check if user has already rated the plan and trainers
  useEffect(() => {
    const checkRatings = async () => {
      if (!plan || !isStudent) return;
      
      let pendingCount = 0;
      
      // Check plan rating
      let planRated = false;
      try {
        const planResp = await api.get('/api/ratings/check', {
          params: { rating_type: 'TRAINING_PLAN', training_plan_id: plan.id }
        });
        planRated = planResp.data.exists;
        setHasPlanRating(planRated);
        if (!planRated) pendingCount++;
      } catch (err) {
        console.log('Error checking plan rating:', err);
      }
      
      // Check trainer ratings
      if (plan.trainers) {
        const ratingsMap: Record<number, boolean> = {};
        for (const trainer of plan.trainers) {
          try {
            const trainerResp = await api.get('/api/ratings/check', {
              params: { rating_type: 'TRAINER', trainer_id: trainer.id, training_plan_id: plan.id }
            });
            ratingsMap[trainer.id] = trainerResp.data.exists;
            if (!trainerResp.data.exists) pendingCount++;
          } catch (err) {
            console.log('Error checking trainer rating:', err);
          }
        }
        setTrainerRatings(ratingsMap);
      }
      
      // Check course ratings
      if (plan.courses) {
        const courseRatingsMap: Record<number, boolean> = {};
        for (const course of plan.courses) {
          try {
            const courseResp = await api.get('/api/ratings/check', {
              params: { rating_type: 'COURSE', course_id: course.id, training_plan_id: plan.id }
            });
            courseRatingsMap[course.id] = courseResp.data.exists;
            if (!courseResp.data.exists) pendingCount++;
          } catch (err) {
            console.log('Error checking course rating:', err);
          }
        }
        setCourseRatings(courseRatingsMap);
      }
      
      setPendingRatingsCount(pendingCount);
    };
    
    checkRatings();
  }, [plan, isStudent]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const resp = await api.get(`/api/training-plans/${id}`);
      setPlan(resp.data);
      
      // Set selected student for progress viewing
      // Note: setSelectedStudentId triggers useEffect that fetches progress data
      if (isStudent) {
        setSelectedStudentId(user?.id || null);
      } else if (resp.data.enrolled_students?.length > 0) {
        // For trainer: select first enrolled student if none selected
        if (!selectedStudentId) {
          setSelectedStudentId(resp.data.enrolled_students[0].id);
        }
      } else if (resp.data.student_id) {
        setSelectedStudentId(resp.data.student_id);
      }
      
      // Only fetch progress here if selectedStudentId is already set (won't change)
      // Otherwise the useEffect[selectedStudentId] will handle it
      if (resp.data.courses && selectedStudentId) {
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
      const params: any = {};
      if (selectedStudentId && isTrainer) {
        params.student_id = selectedStudentId;
      }
      const resp = await api.get(`/api/training-plans/${id}/completion-status`, { params });
      setCompletionStatus(resp.data);
    } catch (err) {
      console.error('Error fetching completion status:', err);
    }
  };

  const handleFinalizePlan = async () => {
    if (!completionStatus?.can_finalize) {
      alert(t('trainingPlanDetail.cannotFinalizePlan'));
      return;
    }
    
    if (!confirm(t('trainingPlanDetail.confirmFinalizePlan'))) {
      return;
    }
    
    setFinalizingPlan(true);
    try {
      const resp = await api.post(`/api/training-plans/${id}/finalize${selectedStudentId ? `?student_id=${selectedStudentId}` : ''}`);
      alert(`${resp.data.message}\n\nCertificado: ${resp.data.certificate.certificate_number}`);
      await fetchCompletionStatus();
      await fetchPlan();
    } catch (err: any) {
      console.error('Error finalizing plan:', err);
      if (!err._isAuthError) alert(err?.response?.data?.detail || t('trainingPlanDetail.errorFinalizingPlan'));
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
    const targetUserId = isStudent ? user?.id : (selectedStudentId || planData.student_id);
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

    // Guardar timestamp de quando os dados foram buscados para cada lição
    const fetchTime = Date.now();
    const fetchTimeMap: Record<number, number> = {};
    Object.keys(progressMap).forEach(key => {
      fetchTimeMap[Number(key)] = fetchTime;
    });
    
    setLessonProgress(progressMap);
    setProgressFetchTime(prev => ({ ...prev, ...fetchTimeMap }));
    setSubmissions(submissionsMap);
    setChallengeReleases(releasesMap);
  };

  const handleReleaseChallenge = async (challengeId: number) => {
    if (actionLoading) return;
    
    const targetUserId = selectedStudentId || plan?.student_id;
    if (!targetUserId) {
      alert(t('trainingPlanDetail.selectStudentFirst'));
      return;
    }
    
    setActionLoading(challengeId);
    
    try {
      
      await api.post(`/api/challenges/${challengeId}/release/${targetUserId}`, null, {
        params: { training_plan_id: id }
      });
      
      // Atualizar estado local
      setChallengeReleases(prev => ({ ...prev, [challengeId]: true }));
    } catch (err: any) {
      console.error('Erro ao liberar desafio:', err);
      if (!err._isAuthError) alert(err?.response?.data?.detail || t('trainingPlanDetail.errorReleasingChallenge'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleLessonAction = async (lessonId: number, action: 'release' | 'start' | 'pause' | 'resume' | 'finish' | 'confirm' | 'approve') => {
    if (actionLoading) return;
    
    const targetUserId = isStudent ? user?.id : (selectedStudentId || plan?.student_id);
    if (!targetUserId && !isStudent) {
      alert(t('trainingPlanDetail.selectStudentFirst'));
      return;
    }
    
    setActionLoading(lessonId);

    try {
      
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
      } else if (action === 'start' && !isStudent) {
        // Formador inicia a aula (quando started_by = TRAINER)
        await api.post(`/api/lessons/${lessonId}/start`, null, {
          params: { training_plan_id: id, user_id: targetUserId }
        });
      } else if ((action === 'pause' || action === 'resume' || action === 'finish') && !isStudent) {
        // Formador controla aula que ele iniciou (pause/resume/finish)
        await api.post(`/api/lessons/${lessonId}/${action}`, null, {
          params: { training_plan_id: id, user_id: targetUserId }
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
      const fetchTime = Date.now();
      setLessonProgress(prev => ({ ...prev, [lessonId]: resp.data }));
      setProgressFetchTime(prev => ({ ...prev, [lessonId]: fetchTime }));
    } catch (err: any) {
      console.error('Error:', err);
      if (!err._isAuthError) alert(err?.response?.data?.detail || t('trainingPlanDetail.errorExecutingAction'));
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular tempo decorrido em tempo real para aulas em progresso
  const getElapsedSeconds = (progress: LessonProgressData, lessonId?: number) => {
    if (!progress) return 0;
    
    // Se a aula está pausada ou concluída, usar elapsed_seconds do backend diretamente
    if (progress.status === 'PAUSED' || progress.status === 'COMPLETED') {
      return progress.elapsed_seconds || 0;
    }
    
    // Se está em progresso, usar o elapsed_seconds do backend
    // O backend já calcula corretamente considerando pausas e resumed_at
    // Adicionamos os segundos passados desde que recebemos os dados
    if (progress.status === 'IN_PROGRESS') {
      const baseElapsed = progress.elapsed_seconds || 0;
      
      // Se temos o lessonId e o timestamp de quando buscamos os dados
      if (lessonId && progressFetchTime[lessonId]) {
        const secondsSinceFetch = Math.floor((currentTime - progressFetchTime[lessonId]) / 1000);
        return baseElapsed + secondsSinceFetch;
      }
      
      return baseElapsed;
    }
    
    return progress.elapsed_seconds || 0;
  };

  const getLessonStatusBadge = (progress?: LessonProgressData) => {
    if (!progress) return { color: 'bg-gray-500/20 text-gray-400', label: t('trainingPlanDetail.notStarted') };
    switch (progress.status) {
      case 'COMPLETED': 
        if (progress.is_approved) {
          return { color: 'bg-green-500/20 text-green-400', label: `✓ ${t('trainingPlanDetail.approved')}` };
        }
        if (progress.student_confirmed) {
          return { color: 'bg-amber-500/20 text-amber-400', label: `⚠️ ${t('trainingPlanDetail.awaitingApproval')}` };
        }
        return { color: 'bg-blue-500/20 text-blue-400', label: t('trainingPlanDetail.awaitingConfirmation') };
      case 'IN_PROGRESS': return { color: 'bg-blue-500/20 text-blue-400', label: t('trainingPlanDetail.inProgress') };
      case 'PAUSED': return { color: 'bg-yellow-500/20 text-yellow-400', label: t('trainingPlanDetail.paused') };
      case 'RELEASED': return { color: 'bg-purple-500/20 text-purple-400', label: `🔓 ${t('trainingPlanDetail.released')}` };
      default: return { color: 'bg-gray-500/20 text-gray-400', label: t('trainingPlanDetail.notStarted') };
    }
  };

  const getSubmissionStatusBadge = (submission?: SubmissionData) => {
    if (!submission) return null;
    if (submission.is_approved) return { color: 'bg-green-500/20 text-green-400', label: t('trainingPlanDetail.approved') };
    if (submission.status === 'PENDING_REVIEW') return { color: 'bg-yellow-500/20 text-yellow-400', label: t('trainingPlanDetail.pendingReview') };
    return { color: 'bg-red-500/20 text-red-400', label: t('trainingPlanDetail.rejected') };
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
      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('trainingPlanDetail.planNotFound')}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <PremiumHeader
        icon={BookOpen}
        title={plan.title}
        subtitle={plan.description}
        badge={isStudent ? t('trainingPlanDetail.myPlan') : t('trainingPlanDetail.trainingPlan')}
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
                {finalizingPlan ? t('trainingPlanDetail.finalizing') : t('trainingPlanDetail.finalizePlan')}
              </button>
            )}
            
            {/* Botão Ver Certificado - quando já finalizado */}
            {completionStatus?.is_finalized && completionStatus?.certificate_id && (
              <button
                onClick={() => navigate(`/certificates/${completionStatus.certificate_id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Award className="w-5 h-5" />
                {t('trainingPlanDetail.viewCertificate')}
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
              {t('trainingPlanDetail.back')}
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
            <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>{t('trainingPlanDetail.courses')}</p>
          </div>

          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 border`}>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.days_total ?? '-'}</span>
            </div>
            <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>{t('trainingPlanDetail.totalDays')}</p>
          </div>

          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 border`}>
            <div className="flex items-center gap-3 mb-2">
              <Clock className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.days_remaining ?? '-'}</span>
            </div>
            <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>{t('trainingPlanDetail.remainingDays')}</p>
          </div>

          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 border`}>
            <div className={`px-3 py-1 rounded-lg text-sm font-bold inline-block ${
              plan.status === 'COMPLETED' ? 'bg-amber-500/20 text-amber-400' :
              plan.status === 'ONGOING' || plan.status === 'IN_PROGRESS' ? 'bg-green-500/20 text-green-400' : 
              plan.status === 'UPCOMING' || plan.status === 'PENDING' || plan.status === 'NOT_STARTED' ? 'bg-blue-500/20 text-blue-400' : 
              plan.status === 'DELAYED' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {plan.status === 'COMPLETED' ? `✅ ${t('trainingPlanDetail.completed')}` : 
               plan.status === 'IN_PROGRESS' || plan.status === 'ONGOING' ? `🔄 ${t('trainingPlanDetail.inProgress')}` :
               plan.status === 'NOT_STARTED' ? `📋 ${t('planStatus.notStarted')}` :
               plan.status === 'PENDING' || plan.status === 'UPCOMING' ? `⏳ ${t('trainingPlanDetail.pending')}` :
               plan.status === 'DELAYED' ? `⚠️ ${t('trainingPlanDetail.delayed')}` :
               plan.status || t('trainingPlanDetail.active')}
            </div>
            <p className={`${isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'} mt-2`}>{t('trainingPlanDetail.status')}</p>
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
                  ? `✓ ${t('trainingPlanDetail.planFinalized')}`
                  : completionStatus.can_finalize
                    ? `✓ ${t('trainingPlanDetail.readyToFinalize')}`
                    : t('trainingPlanDetail.awaitingCoursesCompletion')
                }
              </h3>
              <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
                {completionStatus.is_finalized
                  ? `${t('trainingPlanDetail.certificate')}: ${completionStatus.certificate_number}`
                  : completionStatus.can_finalize
                    ? t('trainingPlanDetail.allCoursesCompleted', { count: completionStatus.total_courses })
                    : t('trainingPlanDetail.coursesCompletedProgress', { completed: completionStatus.completed_courses, total: completionStatus.total_courses })
                }
              </p>
            </div>
            
            {/* Rating button for finalized plan - students only */}
            {isStudent && completionStatus.is_finalized && (
              <div className="flex items-center">
                {hasPlanRating ? (
                  <span className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-sm font-medium">
                    <Star className="w-4 h-4 fill-green-400" />
                    {t('trainingPlanDetail.planRated', 'Plano Classificado')} ✓
                  </span>
                ) : (
                  <button
                    onClick={() => setShowPlanRatingModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Star className="w-4 h-4" />
                    {t('trainingPlanDetail.ratePlan', 'Classificar Plano')}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Pending Ratings Alert - Only for students when plan is finalized */}
      {isStudent && completionStatus?.is_finalized && pendingRatingsCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-orange-500/20 border-2 border-amber-500/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                <Star className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                  🎉 {t('trainingPlanDetail.pendingRatings', 'Avaliações Pendentes')}
                  <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-bold animate-bounce">
                    {pendingRatingsCount}
                  </span>
                </h3>
                <p className="text-amber-300/80 mt-1">
                  {t('trainingPlanDetail.pendingRatingsDesc', 'Parabéns pela conclusão! Avalie o plano, formadores e cursos para nos ajudar a melhorar.')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center border-2 border-amber-600">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-yellow-600">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center border-2 border-orange-600">
                  <Award className="w-4 h-4 text-white" />
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Trainers Section */}
      {(plan.trainers && plan.trainers.length > 0 || isTrainer) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-6 ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('trainingPlanDetail.trainers', 'Formadores')} ({plan.trainers?.length || 0})
            </h3>
            {isTrainer && (
              <button
                onClick={async () => {
                  setShowTrainerPanel(!showTrainerPanel);
                  if (!showTrainerPanel && availableTrainers.length === 0) {
                    try {
                      const resp = await api.get('/api/admin/trainers');
                      setAvailableTrainers(resp.data);
                    } catch (err) {
                      console.error('Error loading trainers:', err);
                    }
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                {t('trainingPlanDetail.addTrainer', 'Adicionar Formador')}
              </button>
            )}
          </div>

          {/* Add Trainer Panel */}
          {showTrainerPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`mb-4 p-4 rounded-xl border ${
                isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'
              }`}
            >
              <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                {t('trainingPlanDetail.selectTrainerToAdd', 'Selecionar formador para adicionar')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {availableTrainers
                  .filter(t => !plan.trainers?.some(tr => tr.id === t.id))
                  .map(trainer => (
                    <button
                      key={trainer.id}
                      disabled={addingTrainer}
                      onClick={async () => {
                        setAddingTrainer(true);
                        try {
                          await api.post(`/api/training-plans/${id}/add-trainer`, {
                            trainer_id: trainer.id
                          });
                          await fetchPlan();
                          setShowTrainerPanel(false);
                        } catch (err: any) {
                          if (!err._isAuthError) alert(err?.response?.data?.detail || 'Error adding trainer');
                        } finally {
                          setAddingTrainer(false);
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                        isDark 
                          ? 'bg-white/5 hover:bg-white/10 border border-white/10' 
                          : 'bg-white hover:bg-purple-50 border border-gray-200'
                      } disabled:opacity-50`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {trainer.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {trainer.full_name}
                        </div>
                        <div className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {trainer.email}
                        </div>
                      </div>
                      <UserPlus className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    </button>
                  ))}
              </div>
              {availableTrainers.filter(t => !plan.trainers?.some(tr => tr.id === t.id)).length === 0 && (
                <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('trainingPlanDetail.allTrainersAdded', 'Todos os formadores já estão adicionados')}
                </p>
              )}
            </motion.div>
          )}

          {/* Trainer filter */}
          {plan.trainers && plan.trainers.length > 2 && (
            <div className="mb-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
              }`}>
                <Search className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder={t('trainingPlanDetail.filterTrainers', 'Filtrar formadores...')}
                  value={trainerFilter}
                  onChange={(e) => setTrainerFilter(e.target.value)}
                  className={`flex-1 bg-transparent border-none outline-none text-sm ${
                    isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {(plan.trainers || [])
              .filter(trainer => !trainerFilter || trainer.full_name.toLowerCase().includes(trainerFilter.toLowerCase()) || trainer.email?.toLowerCase().includes(trainerFilter.toLowerCase()))
              .map((trainer) => (
              <div
                key={trainer.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                  isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  trainer.is_primary
                    ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                    : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  {trainer.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className={`font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {trainer.full_name}
                    {trainer.is_primary && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                        {t('trainingPlanDetail.primaryTrainer', 'Principal')}
                      </span>
                    )}
                  </div>
                  {trainer.email && (
                    <div className={isDark ? 'text-gray-400 text-sm' : 'text-gray-500 text-sm'}>
                      {trainer.email}
                    </div>
                  )}
                </div>
                
                {/* Rating button for trainer - students only, when plan is finalized */}
                {isStudent && completionStatus?.is_finalized && (
                  <div className="ml-2">
                    {trainerRatings[trainer.id] ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">
                        <Star className="w-3 h-3 fill-green-400" />
                        {t('trainingPlanDetail.rated', 'Classificado')} ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedTrainer(trainer);
                          setShowTrainerRatingModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-lg text-xs font-medium hover:from-amber-600 hover:to-yellow-700 transition-all"
                      >
                        <Star className="w-3 h-3" />
                        {t('trainingPlanDetail.rateTrainer', 'Classificar')}
                      </button>
                    )}
                  </div>
                )}

                {/* Remove trainer button - for admins/trainers, not for primary */}
                {isTrainer && !trainer.is_primary && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm(t('trainingPlanDetail.confirmRemoveTrainer', 'Tem certeza que deseja remover este formador?'))) return;
                      try {
                        await api.delete(`/api/training-plans/${id}/remove-trainer/${trainer.id}`);
                        await fetchPlan();
                      } catch (err: any) {
                        if (!err._isAuthError) alert(err?.response?.data?.detail || 'Error removing trainer');
                      }
                    }}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                    title={t('trainingPlanDetail.removeTrainer', 'Remover formador')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Enrolled Students Section - for trainers/admins */}
      {isTrainer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-6 ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Users className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              {t('trainingPlanDetail.enrolledStudents', 'Formandos Inscritos')} ({plan.enrolled_students?.length || 0})
            </h3>
            <button
              onClick={async () => {
                setShowEnrollmentPanel(!showEnrollmentPanel);
                if (!showEnrollmentPanel && availableStudents.length === 0) {
                  try {
                    const resp = await api.get('/api/trainer/students/list');
                    setAvailableStudents(resp.data);
                  } catch (err) {
                    console.error('Error loading students:', err);
                  }
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              {t('trainingPlanDetail.addStudent', 'Inscrever Formando')}
            </button>
          </div>

          {/* Add Student Panel */}
          {showEnrollmentPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`mb-4 p-4 rounded-xl border ${
                isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                {t('trainingPlanDetail.selectStudentsToEnroll', 'Selecionar formandos para inscrever')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {availableStudents
                  .filter(s => !plan.enrolled_students?.some(es => es.id === s.id))
                  .filter(s => !plan.trainers?.some(tr => tr.id === s.id))
                  .map(student => (
                    <button
                      key={student.id}
                      disabled={enrollingStudents}
                      onClick={async () => {
                        setEnrollingStudents(true);
                        try {
                          await api.post(`/api/training-plans/${id}/assign`, {
                            student_id: student.id
                          });
                          await fetchPlan();
                          setShowEnrollmentPanel(false);
                        } catch (err: any) {
                          if (!err._isAuthError) alert(err?.response?.data?.detail || 'Error enrolling student');
                        } finally {
                          setEnrollingStudents(false);
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                        isDark 
                          ? 'bg-white/5 hover:bg-white/10 border border-white/10' 
                          : 'bg-white hover:bg-blue-50 border border-gray-200'
                      } disabled:opacity-50`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {student.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {student.full_name}
                        </div>
                        <div className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {student.email}
                        </div>
                      </div>
                      <UserPlus className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    </button>
                  ))}
              </div>
              {availableStudents.filter(s => !plan.enrolled_students?.some(es => es.id === s.id)).length === 0 && (
                <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('trainingPlanDetail.allStudentsEnrolled', 'Todos os formandos já estão inscritos')}
                </p>
              )}
            </motion.div>
          )}

          {/* Student filter */}
          {plan.enrolled_students && plan.enrolled_students.length > 2 && (
            <div className="mb-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
              }`}>
                <Search className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder={t('trainingPlanDetail.filterStudents', 'Filtrar formandos...')}
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className={`flex-1 bg-transparent border-none outline-none text-sm ${
                    isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Enrolled Students List */}
          {plan.enrolled_students && plan.enrolled_students.length > 0 ? (
            <div className="space-y-3">
              {plan.enrolled_students
                .filter(student => !studentFilter || student.full_name?.toLowerCase().includes(studentFilter.toLowerCase()) || student.email?.toLowerCase().includes(studentFilter.toLowerCase()))
                .map((student) => (
                <div
                  key={student.id}
                  onClick={() => {
                    setSelectedStudentId(student.id);
                    // useEffect[selectedStudentId] handles fetchProgressData + fetchCompletionStatus
                  }}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                    selectedStudentId === student.id
                      ? isDark ? 'bg-blue-500/20 border-2 border-blue-500/50' : 'bg-blue-50 border-2 border-blue-300'
                      : isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    selectedStudentId === student.id
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                      : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {student.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {student.full_name}
                      </span>
                      {selectedStudentId === student.id && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                          {t('trainingPlanDetail.viewing', 'A ver')}
                        </span>
                      )}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {student.email}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {student.start_date && (
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          📅 {new Date(student.start_date).toLocaleDateString('pt-PT')}
                          {student.end_date && ` → ${new Date(student.end_date).toLocaleDateString('pt-PT')}`}
                        </span>
                      )}
                      {student.days_remaining !== null && student.days_remaining !== undefined && (
                        <span className={`text-xs ${student.is_delayed ? 'text-red-400' : 'text-green-400'}`}>
                          {student.is_delayed ? `⚠️ ${t('trainingPlanDetail.delayed')}` : `${student.days_remaining} ${t('trainingPlanDetail.remainingDays')}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Progress */}
                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        student.progress_percentage >= 100 ? 'text-green-400' :
                        student.progress_percentage > 0 ? 'text-blue-400' : 
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {Math.round(student.progress_percentage || 0)}%
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {t('trainingPlanDetail.progress', 'Progresso')}
                      </div>
                    </div>
                    {/* Status badge */}
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      student.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                      student.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                      student.status === 'DELAYED' ? 'bg-red-500/20 text-red-400' :
                      isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {student.status === 'COMPLETED' ? `✅ ${t('trainingPlanDetail.completed')}` :
                       student.status === 'IN_PROGRESS' ? `🔄 ${t('trainingPlanDetail.inProgress')}` :
                       student.status === 'DELAYED' ? `⚠️ ${t('trainingPlanDetail.delayed')}` :
                       student.status === 'NOT_STARTED' ? `📋 ${t('planStatus.notStarted')}` :
                       `⏳ ${t('trainingPlanDetail.pending')}`}
                    </span>
                    {/* Remove button */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(t('trainingPlanDetail.confirmRemoveStudent', 'Tem certeza que deseja remover este formando?'))) return;
                        try {
                          await api.delete(`/api/training-plans/${id}/unassign/${student.id}`);
                          await fetchPlan();
                        } catch (err: any) {
                          if (!err._isAuthError) alert(err?.response?.data?.detail || 'Error removing student');
                        }
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                      title={t('trainingPlanDetail.removeStudent', 'Remover formando')}
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('trainingPlanDetail.noStudentsEnrolled', 'Nenhum formando inscrito')}</p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                {t('trainingPlanDetail.clickAddStudentToEnroll', 'Clique em "Inscrever Formando" para adicionar')}
              </p>
            </div>
          )}
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
          {t('trainingPlanDetail.planContent')}
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
                                {t('trainingPlanDetail.courseComplete')}
                              </span>
                            );
                          } else if (courseStatus) {
                                return (
                              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                {courseStatus.confirmed_lessons}/{courseStatus.total_lessons} módulos • {courseStatus.approved_challenges}/{courseStatus.total_challenges} desafios
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{course.description}</p>
                    </div>
                    
                    {/* Course Rating Button - students only, when plan is finalized */}
                    {isStudent && completionStatus?.is_finalized && getCourseCompletionStatus(course.id)?.is_complete && (
                      <div className="flex items-center ml-4">
                        {courseRatings[course.id] ? (
                          <span className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-sm font-medium">
                            <Star className="w-4 h-4 fill-green-400" />
                            {t('trainingPlanDetail.courseRated', 'Curso Classificado')} ✓
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedCourse(course);
                              setShowCourseRatingModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl"
                          >
                            <Star className="w-4 h-4" />
                            {t('trainingPlanDetail.rateCourse', 'Classificar Curso')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Lessons */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <BookOpen className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                        <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('trainingPlanDetail.lessons')}</h4>
                        <span className={`ml-auto text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {t('trainingPlanDetail.lessonsCount', { count: course.lessons?.length ?? 0 })}
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
                                      🔒 {t('trainingPlanDetail.awaitingReleaseByTrainer')}
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
                                          ✓ {t('trainingPlanDetail.releasedBy', { name: progress.released_by || 'formador' })}
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                          {t('trainingPlanDetail.awaitingStudentToStart')}
                                        </p>
                                      </div>
                                    )}

                                    {/* Info de tempo para aulas controladas pelo FORMANDO (evita duplicação com botões do formador) */}
                                    {progress && (progress.status === 'IN_PROGRESS' || progress.status === 'PAUSED' || progress.status === 'COMPLETED') && (lesson.started_by || 'TRAINER') === 'TRAINEE' && (
                                      <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                        <div className="flex items-center justify-between text-sm">
                                          {(() => {
                                            const elapsed = getElapsedSeconds(progress, lesson.id);
                                            const estimated = (lesson.estimated_minutes || 30) * 60;
                                            const isOverTime = elapsed > estimated;
                                            const timeColor = isOverTime ? 'text-red-400' : 'text-green-400';
                                            return (
                                              <span className={`flex items-center gap-1 ${timeColor}`}>
                                                <Timer className="w-4 h-4" />
                                                <span className="font-mono font-bold">{formatTime(elapsed)}</span>
                                                <span className="text-xs opacity-70">/ {lesson.estimated_minutes} min</span>
                                              </span>
                                            );
                                          })()}
                                          {progress.is_delayed && (
                                            <span className="text-red-400 font-medium">{t('trainingPlanDetail.delayed')}</span>
                                          )}
                                        </div>
                                        {progress.student_confirmed && (
                                          <div className="flex items-center gap-1 mt-2 text-green-400 text-xs">
                                            <CheckCircle2 className="w-3 h-3" />
                                            {t('trainingPlanDetail.confirmedByStudent')}
                                          </div>
                                        )}
                                        {progress.is_approved && (
                                          <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs">
                                            <CheckCircle2 className="w-3 h-3" />
                                            {progress.finished_by 
                                              ? t('trainingPlanDetail.approvedByTrainerName', { name: progress.finished_by })
                                              : t('trainingPlanDetail.approvedByTrainer')}
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
                                        {/* ===== AULAS CONTROLADAS PELO FORMANDO (started_by = TRAINEE) ===== */}
                                        {lesson.started_by === 'TRAINEE' && (
                                          <>
                                            {/* Aula liberada mas não iniciada - mostrar botão Iniciar */}
                                            {progress?.is_released && progress.status === 'RELEASED' && (
                                              <button
                                                onClick={() => handleLessonAction(lesson.id, 'start')}
                                                disabled={actionLoading === lesson.id}
                                                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                                              >
                                                <Play className="w-4 h-4" />
                                                {t('trainingPlanDetail.start')}
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
                                                  {t('trainingPlanDetail.pause')}
                                                </button>
                                                <button
                                                  onClick={() => handleLessonAction(lesson.id, 'finish')}
                                                  disabled={actionLoading === lesson.id}
                                                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                                                >
                                                  <CheckCircle2 className="w-4 h-4" />
                                                  {t('trainingPlanDetail.finish')}
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
                                                  {t('trainingPlanDetail.resume')}
                                                </button>
                                                <button
                                                  onClick={() => handleLessonAction(lesson.id, 'finish')}
                                                  disabled={actionLoading === lesson.id}
                                                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                                                >
                                                  <CheckCircle2 className="w-4 h-4" />
                                                  {t('trainingPlanDetail.finish')}
                                                </button>
                                              </>
                                            )}
                                          </>
                                        )}

                                        {/* ===== AULAS CONTROLADAS PELO FORMADOR (started_by = TRAINER) ===== */}
                                        {lesson.started_by === 'TRAINER' && progress?.status === 'IN_PROGRESS' && (
                                          <span className="text-sm text-blue-400 italic flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {t('trainingPlanDetail.lessonInProgress')}
                                          </span>
                                        )}

                                        {/* Aula concluída mas não confirmada - mostrar Confirmar (para ambos tipos) */}
                                        {progress?.status === 'COMPLETED' && !progress.student_confirmed && (
                                          <button
                                            onClick={() => handleLessonAction(lesson.id, 'confirm')}
                                            disabled={actionLoading === lesson.id}
                                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                                          >
                                            <CheckCircle2 className="w-4 h-4" />
                                            {t('trainingPlanDetail.confirm')}
                                          </button>
                                        )}

                                        {/* Ver aula - sempre disponível para estudante quando em andamento ou liberada */}
                                        {(progress?.status === 'IN_PROGRESS' || progress?.status === 'RELEASED' || progress?.status === 'PAUSED' || progress?.status === 'COMPLETED') && (
                                          <button
                                            onClick={() => navigate(`/lessons/${lesson.id}/view?planId=${id}`)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                              isDark 
                                                ? 'bg-white/10 text-white hover:bg-white/20' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                          >
                                            <Eye className="w-4 h-4" />
                                            {t('trainingPlanDetail.viewLesson')}
                                          </button>
                                        )}
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
                                            {t('trainingPlanDetail.release')}
                                          </button>
                                        )}

                                        {/* Aula liberada e iniciada pelo FORMADOR - mostrar Iniciar Aula */}
                                        {progress?.status === 'RELEASED' && lesson.started_by === 'TRAINER' && (
                                          <button
                                            onClick={() => handleLessonAction(lesson.id, 'start')}
                                            disabled={actionLoading === lesson.id}
                                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                                          >
                                            <Play className="w-4 h-4" />
                                            {t('trainingPlanDetail.startLesson')}
                                          </button>
                                        )}

                                        {/* Aula liberada mas iniciada pelo FORMANDO - aguardar */}
                                        {progress?.status === 'RELEASED' && lesson.started_by === 'TRAINEE' && (
                                          <span className="text-sm text-amber-500 italic">{t('trainingPlanDetail.awaitingStudentStart')}</span>
                                        )}

                                        {/* Aula em progresso iniciada pelo FORMADOR - mostrar Pausar/Finalizar */}
                                        {progress?.status === 'IN_PROGRESS' && lesson.started_by === 'TRAINER' && !progress.is_paused && (
                                          <>
                                            {(() => {
                                              const elapsed = getElapsedSeconds(progress, lesson.id);
                                              const estimated = (lesson.estimated_minutes || 30) * 60;
                                              const isOverTime = elapsed > estimated;
                                              const timeColor = isOverTime ? 'text-red-400' : 'text-green-400';
                                              return (
                                                <div className={`flex items-center gap-2 text-sm ${timeColor}`}>
                                                  <Timer className="w-4 h-4" />
                                                  <span className="font-mono font-bold">{formatTime(elapsed)}</span>
                                                  <span className="text-xs opacity-70">/ {lesson.estimated_minutes}m</span>
                                                </div>
                                              );
                                            })()}
                                            <button
                                              onClick={() => handleLessonAction(lesson.id, 'pause')}
                                              disabled={actionLoading === lesson.id}
                                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg text-sm font-medium hover:from-yellow-700 hover:to-orange-700 transition-all disabled:opacity-50"
                                            >
                                              <Pause className="w-4 h-4" />
                                              {t('trainingPlanDetail.pause')}
                                            </button>
                                            <button
                                              onClick={() => handleLessonAction(lesson.id, 'finish')}
                                              disabled={actionLoading === lesson.id}
                                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                                            >
                                              <CheckCircle2 className="w-4 h-4" />
                                              {t('trainingPlanDetail.finish')}
                                            </button>
                                          </>
                                        )}

                                        {/* Aula pausada iniciada pelo FORMADOR - mostrar Retomar/Finalizar */}
                                        {progress?.status === 'PAUSED' && lesson.started_by === 'TRAINER' && (
                                          <>
                                            {(() => {
                                              const elapsed = progress.elapsed_seconds || 0;
                                              const estimated = (lesson.estimated_minutes || 30) * 60;
                                              const isOverTime = elapsed > estimated;
                                              const timeColor = isOverTime ? 'text-red-400' : 'text-yellow-400';
                                              return (
                                                <div className={`flex items-center gap-2 text-sm ${timeColor}`}>
                                                  <Timer className="w-4 h-4" />
                                                  <span className="font-mono font-bold">{formatTime(elapsed)}</span>
                                                  <span className="text-xs opacity-70">/ {lesson.estimated_minutes}m ({t('trainingPlanDetail.paused').toLowerCase()})</span>
                                                </div>
                                              );
                                            })()}
                                            <button
                                              onClick={() => handleLessonAction(lesson.id, 'resume')}
                                              disabled={actionLoading === lesson.id}
                                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                                            >
                                              <Play className="w-4 h-4" />
                                              {t('trainingPlanDetail.resume')}
                                            </button>
                                            <button
                                              onClick={() => handleLessonAction(lesson.id, 'finish')}
                                              disabled={actionLoading === lesson.id}
                                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                                            >
                                              <CheckCircle2 className="w-4 h-4" />
                                              {t('trainingPlanDetail.finish')}
                                            </button>
                                          </>
                                        )}

                                        {/* Aula em progresso iniciada pelo FORMANDO - apenas Ver Progresso */}
                                        {progress?.status === 'IN_PROGRESS' && lesson.started_by !== 'TRAINER' && (
                                          <>
                                            {(() => {
                                              const elapsed = getElapsedSeconds(progress, lesson.id);
                                              const estimated = (lesson.estimated_minutes || 30) * 60;
                                              const isOverTime = elapsed > estimated;
                                              const timeColor = isOverTime ? 'text-red-400' : 'text-green-400';
                                              return (
                                                <div className={`flex items-center gap-2 text-sm ${timeColor}`}>
                                                  <Timer className="w-4 h-4" />
                                                  <span className="font-mono font-bold">{formatTime(elapsed)}</span>
                                                  <span className="text-xs opacity-70">/ {lesson.estimated_minutes}m</span>
                                                </div>
                                              );
                                            })()}
                                            <button
                                              onClick={() => navigate(`/lessons/${lesson.id}/manage?planId=${id}&courseId=${course.id}`)}
                                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
                                            >
                                              <Eye className="w-4 h-4" />
                                              {t('trainingPlanDetail.viewProgress')}
                                            </button>
                                          </>
                                        )}

                                        {/* Aula concluída mas aguardando confirmação do formando */}
                                        {progress?.status === 'COMPLETED' && !progress.student_confirmed && !progress.is_approved && (
                                          <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                                            <Clock className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm text-blue-400 font-medium">{t('trainingPlanDetail.awaitingStudentConfirmation')}</span>
                                          </div>
                                        )}

                                        {/* Aula confirmada pelo formando - mostrar destaque e Aprovar */}
                                        {progress?.status === 'COMPLETED' && progress.student_confirmed && !progress.is_approved && (
                                          <>
                                            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                                              <AlertCircle className="w-4 h-4 text-amber-400" />
                                              <span className="text-sm text-amber-400 font-medium">{t('trainingPlanDetail.studentConfirmedAwaitingApproval')}</span>
                                            </div>
                                            <button
                                              onClick={() => handleLessonAction(lesson.id, 'approve')}
                                              disabled={actionLoading === lesson.id}
                                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-green-500/25"
                                            >
                                              <CheckCircle2 className="w-4 h-4" />
                                              {t('trainingPlanDetail.approveLesson')}
                                            </button>
                                          </>
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
                                            {t('trainingPlanDetail.manage')}
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
                          <p>{t('trainingPlanDetail.noLessons')}</p>
                        </div>
                      )}
                    </div>

                    {/* Challenges */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Target className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('trainingPlanDetail.challenges')}</h4>
                        <span className={`ml-auto text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {t('trainingPlanDetail.challengesCount', { count: course.challenges?.length ?? 0 })}
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
                                        {t('trainingPlanDetail.awaitingRelease')}
                                      </span>
                                    )}

                                    {isStudent && !submission && challengeReleases[challenge.id] && (
                                      challenge.challenge_type?.toUpperCase() === 'COMPLETE' ? (
                                        <button
                                          onClick={() => navigate(`/challenges/${challenge.id}/execute/complete?planId=${id}`)}
                                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
                                        >
                                          <Play className="w-4 h-4" />
                                          {t('trainingPlanDetail.startChallenge')}
                                        </button>
                                      ) : (
                                        <span className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                                          isDark 
                                            ? 'bg-purple-500/20 text-purple-400' 
                                            : 'bg-purple-100 text-purple-600'
                                        }`}>
                                          <Clock className="w-4 h-4" />
                                          {t('trainingPlanDetail.awaitingTrainerApply')}
                                        </span>
                                      )
                                    )}

                                    {isStudent && submission && (
                                      submission.status === 'APPROVED' || submission.status === 'REJECTED' ? (
                                        <button
                                          onClick={() => navigate(`/challenges/result/${submission.id}`)}
                                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                            isDark 
                                              ? 'bg-white/10 text-white hover:bg-white/20' 
                                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                          }`}
                                        >
                                          <Eye className="w-4 h-4" />
                                          {t('trainingPlanDetail.viewResult')}
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => navigate(`/challenges/${challenge.id}/execute/complete?planId=${id}&submissionId=${submission.id}`)}
                                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                            isDark 
                                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600' 
                                              : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600'
                                          }`}
                                        >
                                          <Play className="w-4 h-4" />
                                          {t('trainingPlanDetail.continueChallenge')}
                                        </button>
                                      )
                                    )}

                                    {/* ===== BOTÕES PARA FORMADOR ===== */}
                                    {isTrainer && !submission && !challengeReleases[challenge.id] && (
                                      <button
                                        onClick={() => handleReleaseChallenge(challenge.id)}
                                        disabled={actionLoading === challenge.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                                      >
                                        <PlayCircle className="w-4 h-4" />
                                        {t('trainingPlanDetail.release')}
                                      </button>
                                    )}

                                    {isTrainer && !submission && challengeReleases[challenge.id] && (
                                      challenge.challenge_type?.toUpperCase() === 'SUMMARY' ? (
                                        <button
                                          onClick={() => navigate(`/challenges/${challenge.id}/execute/summary?planId=${id}${selectedStudentId ? `&studentId=${selectedStudentId}` : ''}`)}
                                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
                                        >
                                          <Play className="w-4 h-4" />
                                          {t('trainingPlanDetail.applyChallenge')}
                                        </button>
                                      ) : (
                                        <span className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                                          isDark 
                                            ? 'bg-purple-500/20 text-purple-400' 
                                            : 'bg-purple-100 text-purple-600'
                                        }`}>
                                          <Clock className="w-4 h-4" />
                                          {t('trainingPlanDetail.awaitingStudent')}
                                        </span>
                                      )
                                    )}

                                    {isTrainer && submission && (
                                      <>
                                        {/* Em andamento */}
                                        {submission.status === 'IN_PROGRESS' && (
                                          <span className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium">
                                            <Clock className="w-4 h-4" />
                                            {t('trainingPlanDetail.inProgressStatus')}
                                          </span>
                                        )}
                                        
                                        {/* Submetido para revisão - botão Corrigir */}
                                        {(submission.status === 'PENDING_REVIEW' || submission.status === 'SUBMITTED') && !submission.is_approved && (
                                          <button
                                            onClick={() => navigate(`/submissions/${submission.id}/review?planId=${id}`)}
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
                                          >
                                            <Settings2 className="w-4 h-4" />
                                            {t('trainingPlanDetail.correct')}
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
                                            {t('trainingPlanDetail.viewResult')}
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
                          <p>{t('trainingPlanDetail.noChallenges')}</p>
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
              <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>{t('trainingPlanDetail.noCourses')}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Rating Modal for Training Plan */}
      {plan && (
        <RatingModal
          isOpen={showPlanRatingModal}
          onClose={() => setShowPlanRatingModal(false)}
          ratingType="TRAINING_PLAN"
          itemId={plan.id}
          itemTitle={plan.title}
          onSuccess={() => {
            setHasPlanRating(true);
            setPendingRatingsCount(prev => Math.max(0, prev - 1));
            setShowPlanRatingModal(false);
          }}
        />
      )}

      {/* Rating Modal for Trainer */}
      {selectedTrainer && plan && (
        <RatingModal
          isOpen={showTrainerRatingModal}
          onClose={() => {
            setShowTrainerRatingModal(false);
            setSelectedTrainer(null);
          }}
          ratingType="TRAINER"
          itemId={selectedTrainer.id}
          itemTitle={selectedTrainer.full_name}
          trainingPlanId={plan.id}
          onSuccess={() => {
            setTrainerRatings(prev => ({ ...prev, [selectedTrainer.id]: true }));
            setPendingRatingsCount(prev => Math.max(0, prev - 1));
            setShowTrainerRatingModal(false);
            setSelectedTrainer(null);
          }}
        />
      )}

      {/* Rating Modal for Course */}
      {selectedCourse && plan && (
        <RatingModal
          isOpen={showCourseRatingModal}
          onClose={() => {
            setShowCourseRatingModal(false);
            setSelectedCourse(null);
          }}
          ratingType="COURSE"
          itemId={selectedCourse.id}
          itemTitle={selectedCourse.title}
          trainingPlanId={plan.id}
          onSuccess={() => {
            setCourseRatings(prev => ({ ...prev, [selectedCourse.id]: true }));
            setPendingRatingsCount(prev => Math.max(0, prev - 1));
            setShowCourseRatingModal(false);
            setSelectedCourse(null);
          }}
        />
      )}
    </div>
  );
}
