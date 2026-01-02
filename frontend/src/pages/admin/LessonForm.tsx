import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, FileText, Clock, List, CheckCircle2, Target } from 'lucide-react';
import api from '../../lib/axios';

interface LessonFormData {
  title: string;
  description: string;
  estimated_minutes: number;
  order: number;
  materials_url?: string;
}

const LessonForm: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    estimated_minutes: 30,
    order: 1,
    materials_url: ''
  });

  const steps = [
    { number: 1, title: 'Dados Básicos', icon: Target },
    { number: 2, title: 'Conteúdo', icon: FileText },
    { number: 3, title: 'Materiais', icon: Clock },
    { number: 4, title: 'Revisão', icon: CheckCircle2 }
  ];

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.title || formData.title.trim().length === 0) {
        setError('Título é obrigatório');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!formData.estimated_minutes || formData.estimated_minutes <= 0) {
        setError('Duração deve ser maior que zero');
        return false;
      }
      return true;
    }
    if (step === 3) {
      // materials_url optional but if present, basic check
      if (formData.materials_url && !formData.materials_url.startsWith('http')) {
        setError('Link de materiais inválido');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep(currentStep)) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const handleFinalSubmit = async () => {
    console.log('handleFinalSubmit start', { currentStep, formData });
    setError('');
    if (!validateStep(currentStep)) return;
    try {
      setLoading(true);
      console.log('Sending POST /api/trainer/lessons', formData);
      const resp = await api.post('/api/trainer/lessons', {
        ...formData,
        course_id: parseInt(courseId || '0', 10),
        lesson_type: 'THEORETICAL'
      });
      console.log('Create lesson response', resp.data);
      // show basic feedback then navigate
      navigate(`/courses/${courseId}`);
    } catch (err: any) {
      console.error('Erro ao criar aula:', err);
      setError(err.response?.data?.detail || err.message || t('lessons.createError'));
      // fallback debug alert
      try { alert('Erro ao criar aula: ' + (err.response?.data?.detail || err.message)); } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Curso
          </button>

          <h1 className="text-3xl font-bold text-white">Criar Nova Aula (Wizard)</h1>
          <p className="text-gray-400 mt-2">Preencha os passos para cadastrar a aula.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${currentStep >= step.number ? 'bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg shadow-purple-900/50' : 'bg-white/5 border border-white/10'}`}>
                    {currentStep > step.number ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <step.icon className={`w-5 h-5 ${currentStep >= step.number ? 'text-white' : 'text-gray-500'}`} />
                    )}
                  </div>
                  <span className={`text-xs md:text-sm font-medium truncate ${currentStep >= step.number ? 'text-white' : 'text-gray-500'}`}>{step.title}</span>
                </div>
                {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.number ? 'bg-purple-600' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl border border-white/10 p-8">
          {currentStep === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">Título *</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-white/5 border rounded-xl text-white" placeholder="Título da aula" />
              <label className="block text-sm font-medium text-gray-300">Ordem</label>
              <input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value || '1', 10) })} min={1} className="w-40 px-3 py-2 bg-white/5 border rounded-xl text-white" />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">Descrição</label>
              <div contentEditable suppressContentEditableWarning onInput={(e: any) => setFormData({ ...formData, description: e.currentTarget.innerHTML })} className="w-full min-h-[140px] px-4 py-3 bg-white/5 border rounded-xl text-white prose max-w-none" dangerouslySetInnerHTML={{ __html: formData.description }} />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">Duração (minutos)</label>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <input type="number" value={formData.estimated_minutes} onChange={(e) => setFormData({ ...formData, estimated_minutes: parseInt(e.target.value || '0', 10) })} min={1} className="w-40 px-3 py-2 bg-white/5 border rounded-xl text-white" />
              </div>

              <label className="block text-sm font-medium text-gray-300">Link de Materiais (opcional)</label>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-300" />
                <input type="url" value={formData.materials_url} onChange={(e) => setFormData({ ...formData, materials_url: e.target.value })} className="w-full px-3 py-2 bg-white/5 border rounded-xl text-white" placeholder="https://..." />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Revisão</h3>
              <div className="bg-white/5 p-4 rounded-xl text-sm text-slate-300">
                <p><strong>Título:</strong> <span className="text-white">{formData.title}</span></p>
                <p><strong>Ordem:</strong> <span className="text-white">{formData.order}</span></p>
                <p><strong>Duração:</strong> <span className="text-white">{formData.estimated_minutes} minutos</span></p>
                <p><strong>Materiais:</strong> <span className="text-white">{formData.materials_url || '—'}</span></p>
                <div className="mt-3">
                  <strong className="text-white">Descrição:</strong>
                  <div className="mt-2 prose text-slate-200" dangerouslySetInnerHTML={{ __html: formData.description || '<i>Sem descrição</i>' }} />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <div>
              {currentStep > 1 && (
                <button onClick={handleBack} className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10">Voltar</button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {currentStep < steps.length && (
                <button onClick={handleNext} className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white">Próximo</button>
              )}
              {currentStep === steps.length && (
                <button type="button" onClick={handleFinalSubmit} disabled={loading} className="px-5 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center gap-2">
                  <Save className="w-4 h-4" /> {loading ? 'Salvando...' : 'Criar Aula'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonForm;
