import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Save, Target, Clock, TrendingUp, AlertCircle,
  CheckCircle2, Loader2, CheckSquare, Shield, Star, Zap, RotateCcw,
  Minus, Plus
} from 'lucide-react';
import api from '../../lib/axios';

interface ChallengeFormData {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  challenge_type: string;
  operations_required: number;
  time_limit_minutes: number;
  target_mpu: number;
  max_errors: number;
  is_active: boolean;
  use_volume_kpi: boolean;
  use_mpu_kpi: boolean;
  use_errors_kpi: boolean;
  kpi_mode: 'AUTO' | 'MANUAL';
  allow_retry: boolean;
}

const DIFFICULTIES = [
  { value: 'easy' as const, label: 'challenges.difficultyEasy', fallback: 'Fácil', icon: TrendingUp, cls: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  { value: 'medium' as const, label: 'challenges.difficultyMedium', fallback: 'Médio', icon: Shield, cls: 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  { value: 'hard' as const, label: 'challenges.difficultyHard', fallback: 'Difícil', icon: Star, cls: 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400', dot: 'bg-red-500' },
] as const;

export default function ChallengeForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courseId, challengeId } = useParams<{ courseId: string; challengeId: string }>();
  const isEditing = !!challengeId;

  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<ChallengeFormData>({
    title: '',
    description: '',
    difficulty: 'medium',
    challenge_type: 'COMPLETE',
    operations_required: 10,
    time_limit_minutes: 60,
    target_mpu: 6,
    max_errors: 0,
    is_active: true,
    use_volume_kpi: true,
    use_mpu_kpi: true,
    use_errors_kpi: true,
    kpi_mode: 'AUTO',
    allow_retry: false,
  });

  const set = <K extends keyof ChallengeFormData>(key: K, val: ChallengeFormData[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const recalcMpu = (ops: number, time: number) =>
    ops > 0 && time > 0 ? parseFloat((time / ops).toFixed(2)) : 0;

  const handleOpsOrTimeChange = (field: 'operations_required' | 'time_limit_minutes', value: number) => {
    const next = { ...form, [field]: value };
    next.target_mpu = recalcMpu(next.operations_required, next.time_limit_minutes);
    setForm(next);
  };

  /* ── Load data ── */

  useEffect(() => {
    if (!isEditing || !courseId || !challengeId) {
      setLoadingData(false);
      return;
    }
    (async () => {
      try {
        const { data: c } = await api.get(`/api/admin/courses/${courseId}/challenges/${challengeId}`);
        setForm({
          title: c.title || '',
          description: c.description || '',
          difficulty: c.difficulty || 'medium',
          challenge_type: c.challenge_type || 'COMPLETE',
          operations_required: c.operations_required || 10,
          time_limit_minutes: c.time_limit_minutes || 60,
          target_mpu: c.target_mpu || 6,
          max_errors: c.max_errors || 0,
          is_active: c.is_active !== undefined ? c.is_active : true,
          use_volume_kpi: c.use_volume_kpi !== undefined ? c.use_volume_kpi : true,
          use_mpu_kpi: c.use_mpu_kpi !== undefined ? c.use_mpu_kpi : true,
          use_errors_kpi: c.use_errors_kpi !== undefined ? c.use_errors_kpi : true,
          kpi_mode: c.kpi_mode || 'AUTO',
          allow_retry: c.allow_retry !== undefined ? c.allow_retry : false,
        });
      } catch (err) {
        console.error('Error loading challenge:', err);
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  /* ── Validate ── */

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = t('admin.titleRequired');
    if (form.operations_required < 1) e.operations_required = t('challenges.minOperations', 'Mínimo 1 operação');
    if (form.time_limit_minutes < 1) e.time_limit_minutes = t('challenges.minTime', 'Mínimo 1 minuto');
    if (form.kpi_mode === 'AUTO' && !form.use_volume_kpi && !form.use_mpu_kpi && !form.use_errors_kpi) {
      e.kpis = t('challenges.kpiSelectWarning');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      if (isEditing) {
        await api.put(`/api/admin/courses/${courseId}/challenges/${challengeId}`, form);
      } else {
        await api.post('/api/challenges/', { ...form, course_id: parseInt(courseId || '0') });
      }
      setSuccess(true);
      setTimeout(() => navigate(`/courses/${courseId}`), 1500);
    } catch (err: any) {
      console.error('Error saving challenge:', err);
      setErrors({ submit: err.response?.data?.detail || t('messages.error') });
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading ── */

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-[3px] border-[#EC0000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Success ── */

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {isEditing ? t('challenges.challengeUpdated', 'Desafio atualizado!') : t('challenges.challengeCreated', 'Desafio criado!')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.redirecting')}</p>
      </div>
    );
  }

  /* ── Helpers ── */

  const inputCls = (key: string) =>
    `w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/40 transition-colors ${
      errors[key] ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
    }`;

  const ErrorMsg = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors[field]}</p>
    ) : null;

  const toggleCls = (selected: boolean) =>
    `flex items-center gap-2.5 p-3 rounded-lg border text-left transition-colors ${
      selected
        ? 'border-[#EC0000] bg-red-50 dark:bg-red-500/10'
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
    }`;

  const checkBox = (selected: boolean) =>
    `w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
      selected ? 'bg-[#EC0000] text-white' : 'border border-gray-300 dark:border-gray-600'
    }`;

  return (
    <div className="max-w-3xl mx-auto">

      {/* ═══ Top bar ═══ */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? t('challenges.editChallenge') : t('challenges.createChallenge')}
          </h1>
        </div>
        <button
          onClick={handleSubmit as any}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? t('messages.saving') : isEditing ? t('common.save', 'Guardar') : t('challenges.createChallenge')}
        </button>
      </div>

      {/* ═══ Form card ═══ */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">

        {/* ── Identity ── */}
        <div className="p-5 sm:p-6 space-y-4 border-b border-gray-100 dark:border-gray-700/50">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
              {t('challenges.titleLabel')} *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className={inputCls('title')}
              placeholder={t('challenges.titlePlaceholder')}
            />
            <ErrorMsg field="title" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
              {t('challenges.descriptionLabel')}
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className={`${inputCls('description')} resize-none`}
              placeholder={t('challenges.descriptionPlaceholder')}
            />
          </div>

          {/* Challenge Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
              <Target className="w-3.5 h-3.5 inline mr-1" />
              {t('challenges.typeLabel')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'COMPLETE', label: t('challenges.typeCompleteTitle'), desc: t('challenges.typeCompleteDesc'), Icon: Target },
                { value: 'SUMMARY', label: t('challenges.typeSummaryTitle'), desc: t('challenges.typeSummaryDesc'), Icon: TrendingUp },
              ]).map(opt => {
                const sel = form.challenge_type === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => set('challenge_type', opt.value)} className={toggleCls(sel)}>
                    <div className={checkBox(sel)}>
                      {sel && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
              <Zap className="w-3.5 h-3.5 inline mr-1" />
              {t('challenges.difficultyLabel', 'Dificuldade')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map(d => {
                const sel = form.difficulty === d.value;
                const Icon = d.icon;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => set('difficulty', d.value)}
                    className={`relative p-3 rounded-lg border text-center transition-colors ${
                      sel ? `border-current ${d.cls}` : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {sel && <CheckCircle2 className="absolute top-1.5 right-1.5 w-3.5 h-3.5" />}
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <p className="text-xs font-semibold">{t(d.label, d.fallback)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Targets ── */}
        <div className="p-5 sm:p-6 space-y-4 border-b border-gray-100 dark:border-gray-700/50">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0">
            <Target className="w-3.5 h-3.5 inline mr-1" />
            {t('challenges.targetsSection', 'Metas')}
          </label>

          <div className="grid grid-cols-2 gap-4">
            {/* Operations */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                {t('challenges.operationsLabel')}
              </label>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => form.operations_required > 1 && handleOpsOrTimeChange('operations_required', form.operations_required - 5)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
                  disabled={form.operations_required <= 1}><Minus className="w-3.5 h-3.5" /></button>
                <input type="number" value={form.operations_required}
                  onChange={e => handleOpsOrTimeChange('operations_required', Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="flex-1 px-2 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white text-center font-semibold focus:ring-2 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/40 transition-colors" />
                <button type="button" onClick={() => handleOpsOrTimeChange('operations_required', form.operations_required + 5)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex gap-1 mt-1.5">
                {[5, 10, 20, 50].map(v => (
                  <button key={v} type="button" onClick={() => handleOpsOrTimeChange('operations_required', v)}
                    className={`flex-1 py-1 text-[11px] font-medium rounded transition-colors ${
                      form.operations_required === v
                        ? 'bg-[#EC0000] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}>{v}</button>
                ))}
              </div>
              <ErrorMsg field="operations_required" />
            </div>

            {/* Time Limit */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {t('challenges.timeLimitLabel')}
              </label>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => form.time_limit_minutes > 1 && handleOpsOrTimeChange('time_limit_minutes', Math.max(1, form.time_limit_minutes - 15))}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
                  disabled={form.time_limit_minutes <= 1}><Minus className="w-3.5 h-3.5" /></button>
                <div className="flex-1 relative">
                  <input type="number" value={form.time_limit_minutes}
                    onChange={e => handleOpsOrTimeChange('time_limit_minutes', Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    className="w-full px-2 py-2 pr-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white text-center font-semibold focus:ring-2 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/40 transition-colors" />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 pointer-events-none">min</span>
                </div>
                <button type="button" onClick={() => handleOpsOrTimeChange('time_limit_minutes', form.time_limit_minutes + 15)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex gap-1 mt-1.5">
                {[15, 30, 60, 120].map(v => (
                  <button key={v} type="button" onClick={() => handleOpsOrTimeChange('time_limit_minutes', v)}
                    className={`flex-1 py-1 text-[11px] font-medium rounded transition-colors ${
                      form.time_limit_minutes === v
                        ? 'bg-[#EC0000] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}>{v >= 60 ? `${v / 60}h` : `${v}m`}</button>
                ))}
              </div>
              <ErrorMsg field="time_limit_minutes" />
            </div>

            {/* Max Errors */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {t('challenges.maxErrorsLabel')}
              </label>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => form.max_errors > 0 && set('max_errors', form.max_errors - 1)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
                  disabled={form.max_errors <= 0}><Minus className="w-3.5 h-3.5" /></button>
                <input type="number" value={form.max_errors}
                  onChange={e => set('max_errors', Math.max(0, parseInt(e.target.value || '0')))}
                  min={0}
                  className="flex-1 px-2 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white text-center font-semibold focus:ring-2 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/40 transition-colors" />
                <button type="button" onClick={() => set('max_errors', form.max_errors + 1)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                {form.max_errors === 0 ? t('challenges.zeroTolerance', '0 = tolerância zero') : `${t('challenges.allowUpTo', 'Até')} ${form.max_errors} ${t('challenges.errorsAllowed', 'erros')}`}
              </p>
            </div>

            {/* MPU Target (auto-calculated) */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                {t('challenges.mpuMetaTitle', 'MPU Meta')}
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{form.target_mpu.toFixed(2)}</span>
                <span className="text-xs text-gray-400">min/op</span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                {form.time_limit_minutes} min &divide; {form.operations_required} ops = {form.target_mpu.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Evaluation ── */}
        <div className="p-5 sm:p-6 space-y-4 border-b border-gray-100 dark:border-gray-700/50">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            <CheckSquare className="w-3.5 h-3.5 inline mr-1" />
            {t('challenges.kpisTitle')}
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">{t('challenges.kpisDesc')}</p>

          {/* KPI toggles */}
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'use_volume_kpi' as const, label: t('challenges.volumeLabel'), desc: t('challenges.volumeHelp') },
              { key: 'use_mpu_kpi' as const, label: t('challenges.mpuLabel'), desc: t('challenges.mpuHelp') },
              { key: 'use_errors_kpi' as const, label: t('challenges.errorsLabel'), desc: t('challenges.errorsHelp') },
            ]).map(kpi => {
              const sel = form[kpi.key];
              return (
                <button key={kpi.key} type="button" onClick={() => set(kpi.key, !sel)} className={toggleCls(sel)}>
                  <div className={checkBox(sel)}>
                    {sel && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{kpi.label}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">{kpi.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <ErrorMsg field="kpis" />

          {/* KPI Mode */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
              {t('challenges.kpiModeTitle')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'AUTO' as const, label: t('challenges.modeAutoTitle'), desc: t('challenges.modeAutoDesc') },
                { value: 'MANUAL' as const, label: t('challenges.modeManualTitle'), desc: t('challenges.modeManualDesc') },
              ]).map(mode => {
                const sel = form.kpi_mode === mode.value;
                return (
                  <button key={mode.value} type="button" onClick={() => set('kpi_mode', mode.value)} className={toggleCls(sel)}>
                    <div className={checkBox(sel)}>
                      {sel && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{mode.label}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">{mode.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allow Retry */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t('challenges.allowRetryTitle')}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{t('challenges.allowRetryDesc')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => set('allow_retry', !form.allow_retry)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                form.allow_retry ? 'bg-[#EC0000]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                form.allow_retry ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* ── Status (edit only) ── */}
        {isEditing && (
          <div className="p-5 sm:p-6">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
              {t('admin.status')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: true, label: t('admin.active') },
                { value: false, label: t('admin.inactive') },
              ]).map(opt => {
                const sel = form.is_active === opt.value;
                return (
                  <button key={String(opt.value)} type="button" onClick={() => set('is_active', opt.value)} className={toggleCls(sel)}>
                    <div className={checkBox(sel)}>
                      {sel && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </form>

      {/* Submit error */}
      {errors.submit && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />{errors.submit}
          </p>
        </div>
      )}
    </div>
  );
}
