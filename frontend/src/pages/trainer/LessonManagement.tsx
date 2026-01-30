import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Play, 
  Pause, 
  Square, 
  User, 
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Timer,
  Users
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

interface Student {
  id: number;
  user_id: number;
  name: string;
  email: string;
}

interface LessonProgress {
  id: number;
  lesson_id: number;
  user_id: number;
  user_name?: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  paused_at?: string;
  is_paused: boolean;
  accumulated_seconds: number;
  elapsed_seconds: number;
  remaining_seconds: number;
  estimated_minutes: number;
  is_delayed: boolean;
  is_approved: boolean;
}

interface Lesson {
  id: number;
  title: string;
  description?: string;
  estimated_minutes: number;
  lesson_type: string;
  materials_url?: string;
  video_url?: string;
}

export default function LessonManagement() {
  const { lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { t } = useTranslation();
  
  const trainingPlanId = searchParams.get('planId');
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, LessonProgress>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  const loadData = useCallback(async () => {
    if (!token || !lessonId) return;
    
    try {
      setLoading(true);
      
      // Buscar dados da lição
      const lessonResp = await api.get(`/api/lessons/${lessonId}/detail`);
      setLesson(lessonResp.data);
      
      // Buscar alunos do plano de formação
      if (trainingPlanId) {
        const studentsResp = await api.get(`/api/training-plans/${trainingPlanId}/students`);
        setStudents(studentsResp.data || []);
        
        // Buscar progresso de cada aluno
        const progressData: Record<number, LessonProgress> = {};
        for (const student of studentsResp.data || []) {
          try {
            const progResp = await api.get(`/api/lessons/${lessonId}/progress`, {
              params: { user_id: student.user_id, training_plan_id: trainingPlanId }
            });
            progressData[student.user_id] = progResp.data;
          } catch (e) {
            // Sem progresso ainda
          }
        }
        setProgressMap(progressData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [token, lessonId, trainingPlanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Atualizar tempos a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressMap(prev => {
        const updated = { ...prev };
        for (const [userId, prog] of Object.entries(updated)) {
          if (prog.status === 'IN_PROGRESS' && !prog.is_paused) {
            updated[Number(userId)] = {
              ...prog,
              elapsed_seconds: prog.elapsed_seconds + 1,
              remaining_seconds: Math.max(0, prog.remaining_seconds - 1),
              is_delayed: (prog.elapsed_seconds + 1) > (prog.estimated_minutes * 60)
            };
          }
        }
        return updated;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleStartLesson = async (studentId: number) => {
    try {
      setActionLoading(studentId);
      await api.post(`/api/lessons/${lessonId}/start`, null, {
        params: { user_id: studentId, training_plan_id: trainingPlanId }
      });
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Erro ao iniciar módulo');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseLesson = async (studentId: number) => {
    try {
      setActionLoading(studentId);
      await api.post(`/api/lessons/${lessonId}/pause`, null, {
        params: { user_id: studentId, training_plan_id: trainingPlanId }
      });
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Erro ao pausar módulo');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeLesson = async (studentId: number) => {
    try {
      setActionLoading(studentId);
      await api.post(`/api/lessons/${lessonId}/resume`, null, {
        params: { user_id: studentId, training_plan_id: trainingPlanId }
      });
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Erro ao retomar módulo');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFinishLesson = async (studentId: number) => {
    try {
      setActionLoading(studentId);
      await api.post(`/api/lessons/${lessonId}/finish`, null, {
        params: { user_id: studentId, training_plan_id: trainingPlanId }
      });
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Erro ao terminar módulo');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkStart = async () => {
    if (selectedStudents.length === 0) {
      alert('Selecione pelo menos um aluno');
      return;
    }
    
    for (const studentId of selectedStudents) {
      await handleStartLesson(studentId);
    }
    setSelectedStudents([]);
  };

  const handleBulkFinish = async () => {
    if (selectedStudents.length === 0) {
      alert('Selecione pelo menos um aluno');
      return;
    }
    
    for (const studentId of selectedStudents) {
      const prog = progressMap[studentId];
      if (prog && prog.status === 'IN_PROGRESS') {
        await handleFinishLesson(studentId);
      }
    }
    setSelectedStudents([]);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (progress?: LessonProgress) => {
    if (!progress || progress.status === 'NOT_STARTED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-500 dark:text-gray-400 border border-gray-500/30">
          {t('lessonManagement.notStarted')}
        </span>
      );
    }
    if (progress.status === 'COMPLETED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30">
          <CheckCircle className="w-3 h-3 inline mr-1" />
          {t('lessonManagement.completed')}
        </span>
      );
    }
    if (progress.is_paused) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30">
          <Pause className="w-3 h-3 inline mr-1" />
          {t('lessonManagement.paused')}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
        <Play className="w-3 h-3 inline mr-1" />
        {t('lessonManagement.inProgress')}
      </span>
    );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('lessonManagement.title')}: {lesson?.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {lesson?.lesson_type} • {t('lessonManagement.estimatedMinutes', { minutes: lesson?.estimated_minutes })}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={loadData}
          className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Ações em massa */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={selectedStudents.length === students.length && students.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedStudents(students.map(s => s.user_id));
                  } else {
                    setSelectedStudents([]);
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-red-600"
              />
              {t('lessonManagement.selectAll')} ({selectedStudents.length}/{students.length})
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkStart}
              disabled={selectedStudents.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              {t('lessonManagement.startSelected')}
            </button>
            <button
              onClick={handleBulkFinish}
              disabled={selectedStudents.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              <Square className="w-4 h-4" />
              {t('lessonManagement.finishSelected')}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de alunos */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          {t('lessonManagement.students')} ({students.length})
        </h2>

        {students.length === 0 ? (
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('lessonManagement.noStudentsAssigned')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t('lessonManagement.planHasNoStudents')}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {students.map((student, index) => {
              const progress = progressMap[student.user_id];
              const isSelected = selectedStudents.includes(student.user_id);
              
              return (
                <motion.div
                  key={student.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative overflow-hidden bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border transition-all shadow-sm dark:shadow-none ${
                    isSelected ? 'border-red-500/50 bg-red-50 dark:bg-red-500/10' : 'border-gray-200 dark:border-white/10'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      {/* Checkbox + Info do aluno */}
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.user_id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.user_id));
                            }
                          }}
                          className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-red-600"
                        />
                        <div className="p-2 bg-gray-100 dark:bg-white/10 rounded-lg">
                          <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{student.name}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">{student.email}</p>
                        </div>
                        {getStatusBadge(progress)}
                      </div>

                      {/* Cronómetro e ações */}
                      <div className="flex items-center gap-6">
                        {/* Timer */}
                        {progress && progress.status !== 'NOT_STARTED' && (
                          <div className="text-right">
                            <div className={`text-2xl font-mono font-bold ${
                              progress.is_delayed ? 'text-red-500 dark:text-red-400' : 
                              progress.status === 'COMPLETED' ? 'text-green-500 dark:text-green-400' : 
                              'text-gray-900 dark:text-white'
                            }`}>
                              <Timer className="w-5 h-5 inline mr-2" />
                              {formatTime(progress.elapsed_seconds)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Estimado: {lesson?.estimated_minutes} min
                              {progress.is_delayed && (
                                <span className="ml-2 text-red-500 dark:text-red-400">
                                  <AlertCircle className="w-3 h-3 inline" /> {t('lessonManagement.delayed')}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Botões de ação */}
                        <div className="flex gap-2">
                          {(!progress || progress.status === 'NOT_STARTED') && (
                            <button
                              onClick={() => handleStartLesson(student.user_id)}
                              disabled={actionLoading === student.user_id}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              {actionLoading === student.user_id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                              {t('lessonManagement.start')}
                            </button>
                          )}

                          {progress?.status === 'IN_PROGRESS' && !progress.is_paused && (
                            <>
                              <button
                                onClick={() => handlePauseLesson(student.user_id)}
                                disabled={actionLoading === student.user_id}
                                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                              >
                                {actionLoading === student.user_id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Pause className="w-4 h-4" />
                                )}
                                {t('lessonManagement.pause')}
                              </button>
                              <button
                                onClick={() => handleFinishLesson(student.user_id)}
                                disabled={actionLoading === student.user_id}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                              >
                                {actionLoading === student.user_id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                                {t('lessonManagement.finish')}
                              </button>
                            </>
                          )}

                          {progress?.status === 'IN_PROGRESS' && progress.is_paused && (
                            <>
                              <button
                                onClick={() => handleResumeLesson(student.user_id)}
                                disabled={actionLoading === student.user_id}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                              >
                                {actionLoading === student.user_id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                                {t('lessonManagement.resume')}
                              </button>
                              <button
                                onClick={() => handleFinishLesson(student.user_id)}
                                disabled={actionLoading === student.user_id}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                              >
                                {actionLoading === student.user_id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                                {t('lessonManagement.finish')}
                              </button>
                            </>
                          )}

                          {progress?.status === 'COMPLETED' && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                              <CheckCircle className="w-4 h-4" />
                              {t('lessonManagement.time')}: {formatTime(progress.elapsed_seconds)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Barra de progresso do tempo */}
                    {progress && progress.status !== 'NOT_STARTED' && progress.status !== 'COMPLETED' && (
                      <div className="mt-4">
                        <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              progress.is_delayed ? 'bg-red-500' : 'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, (progress.elapsed_seconds / (lesson?.estimated_minutes || 1) / 60) * 100)}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>0 min</span>
                          <span>{lesson?.estimated_minutes} min ({t('lessonManagement.estimated')})</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
