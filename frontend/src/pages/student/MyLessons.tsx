import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Play,
  FileText,
  Video,
  Check,
  AlertCircle,
  Eye
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { PremiumHeader, FloatingOrbs } from '../../components/premium';

// Função para limpar HTML e extrair apenas texto
const stripHtml = (html: string): string => {
  if (!html) return '';
  // Criar elemento temporário para extrair texto
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

interface MyLesson {
  id: number;
  lesson_id: number;
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
}

export default function MyLessons() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<MyLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

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
      alert(error.response?.data?.detail || 'Erro ao confirmar aula');
    } finally {
      setConfirmingId(null);
    }
  };

  const getStatusBadge = (lesson: MyLesson) => {
    if (lesson.status === 'COMPLETED') {
      if (lesson.student_confirmed) {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Confirmada
          </span>
        );
      }
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
          <Check className="w-3 h-3 inline mr-1" />
          Concluída
        </span>
      );
    }
    if (lesson.status === 'PAUSED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          <Clock className="w-3 h-3 inline mr-1" />
          Pausada
        </span>
      );
    }
    if (lesson.status === 'IN_PROGRESS') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
          <Play className="w-3 h-3 inline mr-1" />
          Em Progresso
        </span>
      );
    }
    return null;
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

  const completedLessons = lessons.filter(l => l.status === 'COMPLETED');
  const inProgressLessons = lessons.filter(l => l.status !== 'COMPLETED');
  const pendingConfirmation = completedLessons.filter(l => !l.student_confirmed);

  return (
    <div className="space-y-6">
      <PremiumHeader
        icon={BookOpen}
        title="Minhas Aulas"
        subtitle="Acompanhe suas aulas teóricas realizadas"
        badge="Aulas"
        iconColor="from-blue-500 to-purple-500"
      />

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{lessons.length}</p>
              <p className="text-xs text-gray-400">Aulas Realizadas</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{completedLessons.filter(l => l.student_confirmed).length}</p>
              <p className="text-xs text-gray-400">Confirmadas</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{pendingConfirmation.length}</p>
              <p className="text-xs text-gray-400">Aguardam Confirmação</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aulas pendentes de confirmação */}
      {pendingConfirmation.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            Aguardando sua confirmação
          </h2>
          <div className="grid gap-4">
            {pendingConfirmation.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden bg-yellow-500/10 backdrop-blur-xl rounded-2xl border border-yellow-500/30"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">
                          {lesson.lesson_title}
                        </h3>
                        {getStatusBadge(lesson)}
                      </div>
                      {lesson.lesson_description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{stripHtml(lesson.lesson_description)}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lesson.actual_time_minutes || lesson.estimated_minutes} min
                        </span>
                        {lesson.completed_at && (
                          <span>
                            Concluída: {new Date(lesson.completed_at).toLocaleDateString()}
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
                              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              Material
                            </a>
                          )}
                          {lesson.video_url && (
                            <a
                              href={lesson.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                            >
                              <Video className="w-4 h-4" />
                              Vídeo
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate(`/lessons/${lesson.lesson_id}/view`)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-medium transition-colors flex items-center gap-2 border border-blue-500/30"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Aula
                      </button>
                      <button
                        onClick={() => handleConfirmLesson(lesson.lesson_id)}
                        disabled={confirmingId === lesson.lesson_id}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                      {confirmingId === lesson.lesson_id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          A confirmar...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Confirmar
                        </>
                      )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Aulas em progresso */}
      {inProgressLessons.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-400" />
            Em Andamento
          </h2>
          <div className="grid gap-4">
            {inProgressLessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/lessons/${lesson.lesson_id}/view`)}
                className="relative overflow-hidden bg-blue-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/30 cursor-pointer hover:bg-blue-500/20 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">
                          {lesson.lesson_title}
                        </h3>
                        {getStatusBadge(lesson)}
                      </div>
                      {lesson.lesson_description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{stripHtml(lesson.lesson_description)}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Estimado: {lesson.estimated_minutes} min
                        </span>
                        {lesson.started_at && (
                          <span>
                            Iniciada: {new Date(lesson.started_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-blue-400">
                      <Eye className="w-5 h-5" />
                      <span className="text-sm font-medium">Continuar</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Aulas confirmadas */}
      {completedLessons.filter(l => l.student_confirmed).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Histórico de Aulas Confirmadas
          </h2>
          <div className="grid gap-4">
            {completedLessons.filter(l => l.student_confirmed).map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">
                          {lesson.lesson_title}
                        </h3>
                        {getStatusBadge(lesson)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lesson.actual_time_minutes || lesson.estimated_minutes} min
                        </span>
                        {lesson.completed_at && (
                          <span>
                            Concluída: {new Date(lesson.completed_at).toLocaleDateString()}
                          </span>
                        )}
                        {lesson.student_confirmed_at && (
                          <span className="text-green-400">
                            Confirmada: {new Date(lesson.student_confirmed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Materiais */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/lessons/${lesson.lesson_id}/view`)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors"
                        title="Ver Aula"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {lesson.materials_url && (
                        <a
                          href={lesson.materials_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
                          title="Material"
                        >
                          <FileText className="w-5 h-5" />
                        </a>
                      )}
                      {lesson.video_url && (
                        <a
                          href={lesson.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
                          title="Vídeo"
                        >
                          <Video className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {lessons.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center"
        >
          <FloatingOrbs variant="subtle" />
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhuma aula realizada ainda
          </h3>
          <p className="text-gray-400">
            As aulas aparecerão aqui assim que o formador as iniciar
          </p>
        </motion.div>
      )}
    </div>
  );
}
