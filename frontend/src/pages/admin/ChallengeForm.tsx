import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Target, Clock, TrendingUp, AlertCircle, CheckSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';

interface ChallengeFormData {
  title: string;
  description: string;
  challenge_type: string;
  operations_required: number;
  time_limit_minutes: number;
  target_mpu: number;
  max_errors: number;
  is_active: boolean;
  // KPIs selecionáveis
  use_volume_kpi: boolean;
  use_mpu_kpi: boolean;
  use_errors_kpi: boolean;
}

const ChallengeForm: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, challengeId } = useParams<{ courseId: string; challengeId: string }>();
  const { t } = useTranslation();
  const isEditing = !!challengeId;
  
  const [loading, setLoading] = useState(false);
  const [loadingChallenge, setLoadingChallenge] = useState(isEditing);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<ChallengeFormData>({
    title: '',
    description: '',
    challenge_type: 'COMPLETE',
    operations_required: 100,
    time_limit_minutes: 60,
    target_mpu: 1.67, // 100 operações / 60 minutos
    max_errors: 0,
    is_active: true,
    use_volume_kpi: true,
    use_mpu_kpi: true,
    use_errors_kpi: true,
  });

  // Fetch challenge data if editing
  useEffect(() => {
    if (isEditing && courseId && challengeId) {
      fetchChallenge();
    }
  }, [isEditing, courseId, challengeId]);

  const fetchChallenge = async () => {
    try {
      setLoadingChallenge(true);
      const response = await api.get(`/api/admin/courses/${courseId}/challenges/${challengeId}`);
      const challenge = response.data;
      setFormData({
        title: challenge.title || '',
        description: challenge.description || '',
        challenge_type: challenge.challenge_type || 'COMPLETE',
        operations_required: challenge.operations_required || 100,
        time_limit_minutes: challenge.time_limit_minutes || 60,
        target_mpu: challenge.target_mpu || 1.67,
        max_errors: challenge.max_errors || 0,
        is_active: challenge.is_active !== undefined ? challenge.is_active : true,
        use_volume_kpi: challenge.use_volume_kpi !== undefined ? challenge.use_volume_kpi : true,
        use_mpu_kpi: challenge.use_mpu_kpi !== undefined ? challenge.use_mpu_kpi : true,
        use_errors_kpi: challenge.use_errors_kpi !== undefined ? challenge.use_errors_kpi : true,
      });
    } catch (err: any) {
      console.error('Erro ao carregar desafio:', err);
      setError(err.response?.data?.detail || t('challenges.loadError'));
    } finally {
      setLoadingChallenge(false);
    }
  };

  // Calcular MPU automaticamente quando operações ou tempo mudam
  const handleOperationsOrTimeChange = (field: 'operations_required' | 'time_limit_minutes', value: number) => {
    const newFormData = { ...formData, [field]: value };
    
    // Recalcular target_mpu
    if (newFormData.time_limit_minutes > 0) {
      newFormData.target_mpu = parseFloat(
        (newFormData.operations_required / newFormData.time_limit_minutes).toFixed(2)
      );
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEditing) {
        await api.put(`/api/admin/courses/${courseId}/challenges/${challengeId}`, formData);
      } else {
        await api.post('/api/challenges/', {
          ...formData,
          course_id: parseInt(courseId || '0'),
        });
      }

      navigate(`/courses/${courseId}`);
    } catch (err: any) {
      console.error('Erro ao salvar desafio:', err);
      setError(err.response?.data?.detail || (isEditing ? t('challenges.updateError') : t('challenges.createError')));
    } finally {
      setLoading(false);
    }
  };

  if (loadingChallenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.backToCourse')}
          </button>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
            {isEditing ? t('challenges.editChallenge') : t('challenges.createChallenge')}
          </h1>
          <p className="text-gray-400 mt-2">
            {t('challenges.formDescription')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium">Erro</p>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Principal */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 space-y-6">
            
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Título do Desafio *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ex: Desafio de Produtividade - Cartões"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="Descreva o objetivo e contexto do desafio..."
              />
            </div>

            {/* Tipo de Desafio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Tipo de Desafio *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* COMPLETE */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, challenge_type: 'COMPLETE' })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.challenge_type === 'COMPLETE'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      formData.challenge_type === 'COMPLETE' ? 'bg-red-500' : 'bg-white/10'
                    }`}>
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Completo</h3>
                      <p className="text-sm text-gray-400">
                        Registar cada parte individualmente com início e fim
                      </p>
                    </div>
                  </div>
                </button>

                {/* SUMMARY */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, challenge_type: 'SUMMARY' })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.challenge_type === 'SUMMARY'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      formData.challenge_type === 'SUMMARY' ? 'bg-red-500' : 'bg-white/10'
                    }`}>
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Resumido</h3>
                      <p className="text-sm text-gray-400">
                        Apenas inserir total de operações e tempo total
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Metas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Operações Necessárias */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-red-500" />
                    Operações Necessárias *
                  </div>
                </label>
                <input
                  type="number"
                  value={formData.operations_required}
                  onChange={(e) => handleOperationsOrTimeChange('operations_required', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Quantidade mínima de operações</p>
              </div>

              {/* Tempo Limite */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    Tempo Limite (minutos) *
                  </div>
                </label>
                <input
                  type="number"
                  value={formData.time_limit_minutes}
                  onChange={(e) => handleOperationsOrTimeChange('time_limit_minutes', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Tempo máximo em minutos</p>
              </div>
            </div>

            {/* Max Errors */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-pink-500" />
                  Máximo de Operações com Erro
                </div>
              </label>
              <input
                type="number"
                value={formData.max_errors}
                onChange={(e) => setFormData({ ...formData, max_errors: parseInt(e.target.value || '0') })}
                min="0"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Número máximo de OPERAÇÕES com erro (não erros totais)</p>
            </div>

            {/* KPIs de Aprovação */}
            <div className="bg-white/5 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckSquare className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-medium text-white">KPIs para Aprovação</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Selecione quais critérios são decisivos para aprovação do formando neste desafio:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Volume KPI */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, use_volume_kpi: !formData.use_volume_kpi })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.use_volume_kpi
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                      formData.use_volume_kpi ? 'bg-green-500 border-green-500' : 'border-gray-500'
                    }`}>
                      {formData.use_volume_kpi && <span className="text-white text-sm">✓</span>}
                    </div>
                    <div>
                      <p className="font-medium text-white">Volume</p>
                      <p className="text-xs text-gray-400">Nr de Operações</p>
                    </div>
                  </div>
                </button>

                {/* MPU KPI */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, use_mpu_kpi: !formData.use_mpu_kpi })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.use_mpu_kpi
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                      formData.use_mpu_kpi ? 'bg-green-500 border-green-500' : 'border-gray-500'
                    }`}>
                      {formData.use_mpu_kpi && <span className="text-white text-sm">✓</span>}
                    </div>
                    <div>
                      <p className="font-medium text-white">MPU</p>
                      <p className="text-xs text-gray-400">Op por Minuto</p>
                    </div>
                  </div>
                </button>

                {/* Errors KPI */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, use_errors_kpi: !formData.use_errors_kpi })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.use_errors_kpi
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                      formData.use_errors_kpi ? 'bg-green-500 border-green-500' : 'border-gray-500'
                    }`}>
                      {formData.use_errors_kpi && <span className="text-white text-sm">✓</span>}
                    </div>
                    <div>
                      <p className="font-medium text-white">Erros</p>
                      <p className="text-xs text-gray-400">Op. com Erro</p>
                    </div>
                  </div>
                </button>
              </div>
              {!formData.use_volume_kpi && !formData.use_mpu_kpi && !formData.use_errors_kpi && (
                <p className="text-yellow-500 text-sm mt-3">
                  ⚠️ Selecione pelo menos um KPI para aprovação
                </p>
              )}
            </div>

            {/* MPU Meta (calculado automaticamente) */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-red-500/10 border border-yellow-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-300">Meta de MPU (calculada automaticamente)</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {formData.target_mpu.toFixed(2)} <span className="text-lg text-gray-400">op/min</span>
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    = {formData.operations_required} operações ÷ {formData.time_limit_minutes} minutos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Aprovação</p>
                  <p className="text-sm text-yellow-500 font-medium">
                    MPU alcançado ≥ {formData.target_mpu.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status (only in edit mode) */}
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  {t('admin.status')}
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: true })}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      formData.is_active
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className={formData.is_active ? 'text-green-400' : 'text-gray-400'}>
                      {t('admin.active')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: false })}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      !formData.is_active
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className={!formData.is_active ? 'text-red-400' : 'text-gray-400'}>
                      {t('admin.inactive')}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(`/courses/${courseId}`)}
              className="px-6 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEditing ? t('common.saving') : t('common.creating')}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditing ? t('common.save') : t('challenges.createChallenge')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChallengeForm;
