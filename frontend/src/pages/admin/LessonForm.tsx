import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  FileText,
  Clock,
  CheckCircle2,
  Target,
  BookOpen,
  Video,
  Link as LinkIcon,
  Layers,
  Eye,
  Play,
  Settings,
  Zap
} from 'lucide-react';
import api from '../../lib/axios';
import RichTextEditor from '../../components/RichTextEditor';

interface LessonFormData {
  title: string;
  description: string;
  content: string;
  lesson_type: 'THEORETICAL' | 'PRACTICAL';
  started_by: 'TRAINER' | 'TRAINEE';
  estimated_minutes: number;
  order_index: number;
  video_url: string;
  materials_url: string;
}

const LessonForm: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const { t } = useTranslation();
  const isEditing = !!lessonId;

  const [loading, setLoading] = useState(false);
  const [loadingLesson, setLoadingLesson] = useState(isEditing);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    content: '',
    lesson_type: 'THEORETICAL',
    started_by: 'TRAINER',
    estimated_minutes: 30,
    order_index: 1,
    video_url: '',
    materials_url: ''
  });

  const steps = [
    { number: 1, title: t('lessons.basicInfo') || 'Informações', icon: Target, description: 'Título e tipo da aula' },
    { number: 2, title: t('lessons.content') || 'Conteúdo', icon: FileText, description: 'Conteúdo da aula' },
    { number: 3, title: t('lessons.resources') || 'Recursos', icon: Video, description: 'Vídeo e materiais' },
    { number: 4, title: t('lessons.settings') || 'Configurações', icon: Settings, description: 'Duração e ordem' },
    { number: 5, title: t('lessons.review') || 'Revisão', icon: Eye, description: 'Conferir e criar' }
  ];

  useEffect(() => {
    const fetchNextOrderIndex = async () => {
      if (!courseId) return;
      try {
        // Buscar o curso que inclui as lições
        const response = await api.get(`/api/admin/courses/${courseId}`);
        const lessons = response.data?.lessons || [];
        const nextOrder = lessons.length + 1;
        console.log('Lessons count:', lessons.length, 'Next order:', nextOrder);
        setFormData(prev => ({ ...prev, order_index: nextOrder }));
      } catch (err) {
        console.error('Error fetching lessons count:', err);
        // Manter ordem 1 como padrão em caso de erro
      }
    };

    if (isEditing) {
      fetchLesson();
    } else if (courseId) {
      // Para nova aula, calcular automaticamente a próxima ordem
      fetchNextOrderIndex();
    }
  }, [lessonId, courseId, isEditing]);

  const fetchLesson = async () => {
    try {
      setLoadingLesson(true);
      const response = await api.get(`/api/admin/courses/${courseId}/lessons/${lessonId}`);
      const lesson = response.data;
      setFormData({
        title: lesson.title || '',
        description: lesson.description || '',
        content: lesson.content || '',
        lesson_type: lesson.lesson_type || 'THEORETICAL',
        started_by: lesson.started_by || 'TRAINER',
        estimated_minutes: lesson.estimated_minutes || 30,
        order_index: lesson.order_index || 1,
        video_url: lesson.video_url || '',
        materials_url: lesson.materials_url || ''
      });
    } catch (err: any) {
      console.error('Error fetching lesson:', err);
      setError('Erro ao carregar aula');
    } finally {
      setLoadingLesson(false);
    }
  };

  const validateStep = (step: number): boolean => {
    setError('');
    
    if (step === 1) {
      if (!formData.title.trim()) {
        setError('Título é obrigatório');
        return false;
      }
    }
    
    if (step === 3) {
      if (formData.video_url && !formData.video_url.startsWith('http')) {
        setError('URL do vídeo inválida');
        return false;
      }
      if (formData.materials_url && !formData.materials_url.startsWith('http')) {
        setError('URL dos materiais inválida');
        return false;
      }
    }

    if (step === 4) {
      if (formData.estimated_minutes < 1) {
        setError('Duração deve ser pelo menos 1 minuto');
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        course_id: parseInt(courseId || '0', 10),
        order_index: formData.order_index - 1 // Backend uses 0-indexed
      };

      if (isEditing) {
        await api.put(`/api/admin/courses/${courseId}/lessons/${lessonId}`, payload);
      } else {
        await api.post('/api/trainer/lessons', payload);
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/courses/${courseId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error saving lesson:', err);
      setError(err.response?.data?.detail || 'Erro ao salvar aula');
    } finally {
      setLoading(false);
    }
  };

  if (loadingLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Carregando aula...</span>
        </div>
      </div>
    );
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {isEditing ? 'Aula Atualizada!' : 'Aula Criada!'}
          </h2>
          <p className="text-gray-400">Redirecionando para o curso...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] py-8 px-4">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Curso
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/50">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {isEditing ? 'Editar Aula' : 'Criar Nova Aula'}
              </h1>
              <p className="text-gray-400 mt-1">
                {steps[currentStep - 1].description}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-white/10" />
            <div 
              className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step) => (
              <div key={step.number} className="relative flex flex-col items-center z-10">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    currentStep > step.number
                      ? 'bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg shadow-purple-900/50'
                      : currentStep === step.number
                      ? 'bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg shadow-purple-900/50 ring-4 ring-purple-600/30'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <step.icon className={`w-5 h-5 ${currentStep >= step.number ? 'text-white' : 'text-gray-500'}`} />
                  )}
                </motion.div>
                <span className={`mt-2 text-xs font-medium ${currentStep >= step.number ? 'text-white' : 'text-gray-500'}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Informações Básicas</h2>
                </div>

                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Título da Aula *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="Ex: Introdução aos Processos de Trade Finance"
                    />
                  </div>



                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Descrição Breve
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                      placeholder="Uma breve descrição do que será abordado nesta aula..."
                    />
                  </div>

                  {/* Quem Inicia a Aula */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Quem Inicia a Aula
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, started_by: 'TRAINER' })}
                        className={`p-4 rounded-xl border transition-all ${
                          formData.started_by === 'TRAINER'
                            ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/30'
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            formData.started_by === 'TRAINER' ? 'bg-purple-600' : 'bg-white/10'
                          }`}>
                            <Settings className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-white">Formador</h3>
                            <p className="text-xs text-gray-400">O formador inicia a aula</p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, started_by: 'TRAINEE' })}
                        className={`p-4 rounded-xl border transition-all ${
                          formData.started_by === 'TRAINEE'
                            ? 'bg-green-600/20 border-green-500 ring-2 ring-green-500/30'
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            formData.started_by === 'TRAINEE' ? 'bg-green-600' : 'bg-white/10'
                          }`}>
                            <Play className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-white">Formando</h3>
                            <p className="text-xs text-gray-400">O formando inicia sozinho</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Content */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Conteúdo da Aula</h2>
                    <p className="text-sm text-gray-400">Use o editor para formatar o conteúdo</p>
                  </div>
                </div>

                <RichTextEditor
                  content={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                  placeholder="Comece a escrever o conteúdo da aula aqui..."
                  isDark={true}
                />
              </motion.div>
            )}

            {/* Step 3: Resources */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-pink-600/20 flex items-center justify-center">
                    <Video className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Recursos</h2>
                    <p className="text-sm text-gray-400">Adicione vídeo e materiais de apoio</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Video URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      URL do Vídeo (opcional)
                    </label>
                    <div className="relative">
                      <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="url"
                        value={formData.video_url}
                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Suporta YouTube, Vimeo e links diretos de vídeo
                    </p>
                  </div>

                  {/* Materials URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Link para Materiais (opcional)
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="url"
                        value={formData.materials_url}
                        onChange={(e) => setFormData({ ...formData, materials_url: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      PDFs, apresentações ou documentos de apoio
                    </p>
                  </div>

                  {/* Preview Box */}
                  {(formData.video_url || formData.materials_url) && (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Recursos Adicionados</h4>
                      <div className="space-y-2">
                        {formData.video_url && (
                          <div className="flex items-center gap-3 text-sm">
                            <Video className="w-4 h-4 text-pink-400" />
                            <span className="text-gray-300 truncate">{formData.video_url}</span>
                          </div>
                        )}
                        {formData.materials_url && (
                          <div className="flex items-center gap-3 text-sm">
                            <LinkIcon className="w-4 h-4 text-blue-400" />
                            <span className="text-gray-300 truncate">{formData.materials_url}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 4: Settings */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-yellow-600/20 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Configurações</h2>
                    <p className="text-sm text-gray-400">Duração e ordenação da aula</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Duration */}
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Duração</h3>
                        <p className="text-xs text-gray-500">Tempo estimado</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={formData.estimated_minutes}
                        onChange={(e) => setFormData({ ...formData, estimated_minutes: parseInt(e.target.value) || 1 })}
                        min={1}
                        className="w-24 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-center focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                      <span className="text-gray-400">minutos</span>
                    </div>
                  </div>

                  {/* Order */}
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Ordem</h3>
                        <p className="text-xs text-gray-500">Posição no curso (automático)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-center">
                        {formData.order_index}
                      </div>
                      <span className="text-gray-400">ª aula</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Revisão Final</h2>
                    <p className="text-sm text-gray-400">Confirme os dados antes de salvar</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Title & Type */}
                  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-white">{formData.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        formData.lesson_type === 'THEORETICAL' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {formData.lesson_type === 'THEORETICAL' ? 'Teórica' : 'Prática'}
                      </span>
                    </div>
                    {formData.description && (
                      <p className="text-gray-400 text-sm">{formData.description}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                      <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{formData.estimated_minutes}</div>
                      <div className="text-xs text-gray-500">minutos</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                      <Layers className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{formData.order_index}ª</div>
                      <div className="text-xs text-gray-500">aula</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                      <Video className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{formData.video_url ? '1' : '0'}</div>
                      <div className="text-xs text-gray-500">vídeo</div>
                    </div>
                  </div>

                  {/* Content Preview */}
                  {formData.content && (
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Prévia do Conteúdo</h4>
                      <div 
                        className="prose prose-invert prose-sm max-w-none max-h-40 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: formData.content }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between px-8 py-6 border-t border-white/10 bg-white/5">
            <div>
              {currentStep > 1 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBack}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </motion.button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Step indicator */}
              <span className="text-sm text-gray-500">
                Passo {currentStep} de {steps.length}
              </span>

              {currentStep < steps.length ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 transition-all"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium shadow-lg shadow-green-900/30 hover:shadow-green-900/50 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isEditing ? 'Salvar Alterações' : 'Criar Aula'}
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LessonForm;
