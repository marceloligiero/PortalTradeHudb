import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus, Zap, Loader2, Trash2, X, Save, AlertCircle,
  Clock, Target, BarChart2, CheckSquare, Pencil,
} from 'lucide-react';
import axios from '../../lib/axios';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CapsuleChallenge {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  difficulty: string;
  challenge_type: string;
  operations_required: number;
  time_limit_minutes: number;
  target_mpu: number;
  max_errors: number;
  use_volume_kpi: boolean;
  use_mpu_kpi: boolean;
  use_errors_kpi: boolean;
  kpi_mode: string;
  allow_retry: boolean;
  is_active: boolean;
  is_released: boolean;
  course_type: string;
  level: string | null;
  started_by: string;
  submissions_count: number;
  created_at: string;
}

interface ChallengeFormData {
  title: string;
  description: string;
  course_type: string;
  level: string;
  started_by: string;
  difficulty: string;
  challenge_type: string;
  operations_required: number;
  time_limit_minutes: number;
  target_mpu: number;
  max_errors: number;
  use_volume_kpi: boolean;
  use_mpu_kpi: boolean;
  use_errors_kpi: boolean;
  kpi_mode: string;
  allow_retry: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_FORM: ChallengeFormData = {
  title: '',
  description: '',
  course_type: 'CAPSULA_METODOLOGIA',
  level: 'BEGINNER',
  started_by: 'TRAINEE',
  difficulty: 'medium',
  challenge_type: 'COMPLETE',
  operations_required: 100,
  time_limit_minutes: 60,
  target_mpu: 0.6,
  max_errors: 0,
  use_volume_kpi: true,
  use_mpu_kpi: true,
  use_errors_kpi: true,
  kpi_mode: 'AUTO',
  allow_retry: false,
};

const DIFFICULTY_BADGE: Record<string, string> = {
  easy:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  hard:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const TYPE_BADGE: Record<string, string> = {
  CAPSULA_METODOLOGIA:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CAPSULA_FUNCIONALIDADE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

function formatDate(iso: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return iso; }
}

function recalcMpu(ops: number, time: number) {
  return ops > 0 && time > 0 ? parseFloat((time / ops).toFixed(2)) : 0;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all
        ${value
          ? 'border-[#EC0000] bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50'
          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800'}`}
    >
      {label}
    </button>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}{required && <span className="text-[#EC0000] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = `w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none transition-colors
  bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600
  text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
  focus:border-[#EC0000] focus:ring-1 focus:ring-[#EC0000]/20`;

const selectCls = `w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none transition-colors
  bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600
  text-gray-900 dark:text-white
  focus:border-[#EC0000] focus:ring-1 focus:ring-[#EC0000]/20`;

// ── Main component ─────────────────────────────────────────────────────────────

export default function TutorCapsules() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [capsules, setCapsules] = useState<CapsuleChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ChallengeFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const setF = <K extends keyof ChallengeFormData>(key: K, val: ChallengeFormData[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleOpsOrTime = (field: 'operations_required' | 'time_limit_minutes', value: number) => {
    const next = { ...form, [field]: value };
    next.target_mpu = recalcMpu(next.operations_required, next.time_limit_minutes);
    setForm(next);
  };

  // ── Load ───────────────────────────────────────────────────────────────────

  const load = () => {
    setLoading(true);
    setError(null);
    axios.get('/api/tutoria/capsulas-challenges')
      .then(r => setCapsules(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError(t('tutorCapsules.loadError', 'Erro ao carregar cápsulas.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ── Open create / edit ────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (c: CapsuleChallenge, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setForm({
      title: c.title,
      description: c.description || '',
      course_type: c.course_type,
      level: c.level || 'BEGINNER',
      started_by: c.started_by || 'TRAINEE',
      difficulty: c.difficulty,
      challenge_type: c.challenge_type,
      operations_required: c.operations_required,
      time_limit_minutes: c.time_limit_minutes,
      target_mpu: c.target_mpu,
      max_errors: c.max_errors,
      use_volume_kpi: c.use_volume_kpi,
      use_mpu_kpi: c.use_mpu_kpi,
      use_errors_kpi: c.use_errors_kpi,
      kpi_mode: c.kpi_mode,
      allow_retry: c.allow_retry,
    });
    setFormError(null);
    setShowModal(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormError(t('tutorCapsules.titleRequired', 'O título é obrigatório.'));
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim() || null,
      };
      if (editingId) {
        await axios.put(`/api/tutoria/capsulas-challenges/${editingId}`, payload);
      } else {
        await axios.post('/api/tutoria/capsulas-challenges', payload);
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || t('tutorCapsules.saveError', 'Erro ao guardar.'));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (c: CapsuleChallenge, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t('tutorCapsules.confirmDelete', 'Desactivar a cápsula "{{title}}"?', { title: c.title }))) return;
    setDeleting(c.id);
    try {
      await axios.delete(`/api/tutoria/capsulas-challenges/${c.id}`);
      load();
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  };

  // ── Card ──────────────────────────────────────────────────────────────────

  const CapsuleCard = ({ c }: { c: CapsuleChallenge }) => (
    <article
      onClick={() => navigate(`/tutoria/capsulas/${c.course_id}/challenges/${c.id}`)}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm flex flex-col gap-3 hover:shadow-md hover:border-[#EC0000]/30 dark:hover:border-[#EC0000]/30 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#EC0000]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-headline font-semibold text-sm text-gray-900 dark:text-white truncate" title={c.title}>
              {c.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {formatDate(c.created_at)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => openEdit(c, e)}
            aria-label={t('common.edit', 'Editar')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => handleDelete(c, e)}
            disabled={deleting === c.id}
            aria-label={t('tutorCapsules.deactivate', 'Desactivar')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-colors"
          >
            {deleting === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* Description */}
      {c.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
          {c.description}
        </p>
      )}

      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[c.course_type] ?? TYPE_BADGE.CAPSULA_METODOLOGIA}`}>
          {c.course_type === 'CAPSULA_METODOLOGIA'
            ? t('tutorCapsules.typeMethodology', 'Metodologia')
            : t('tutorCapsules.typeFunctionality', 'Funcionalidade')}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFFICULTY_BADGE[c.difficulty] ?? DIFFICULTY_BADGE.medium}`}>
          {c.difficulty === 'easy' ? t('tutorCapsules.diffEasy', 'Fácil')
            : c.difficulty === 'hard' ? t('tutorCapsules.diffHard', 'Difícil')
            : t('tutorCapsules.diffMedium', 'Médio')}
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {c.challenge_type === 'COMPLETE'
            ? t('tutorCapsules.challengeTypeComplete', 'Completo')
            : c.challenge_type === 'SUMMARY'
            ? t('tutorCapsules.challengeTypeSummary', 'Resumo')
            : c.challenge_type}
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 text-gray-400">
            <BarChart2 size={11} />
            <span className="text-[10px]">{t('tutorCapsules.kpiOps', 'Ops')}</span>
          </div>
          <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">{c.operations_required}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 text-gray-400">
            <Clock size={11} />
            <span className="text-[10px]">{t('tutorCapsules.kpiTime', 'Min')}</span>
          </div>
          <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">{c.time_limit_minutes}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 text-gray-400">
            <Target size={11} />
            <span className="text-[10px]">MPU</span>
          </div>
          <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">{c.target_mpu}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <div className="flex items-center gap-1">
          <CheckSquare size={11} />
          <span>{c.submissions_count} {t('tutorCapsules.submissions', 'submissões')}</span>
        </div>
        {c.max_errors > 0 && (
          <span>{t('tutorCapsules.maxErrors', 'Erros max')}: {c.max_errors}</span>
        )}
      </div>
    </article>
  );

  // ── Modal ─────────────────────────────────────────────────────────────────

  const Modal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />

      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div>
            <p className="font-body text-[10px] font-bold uppercase tracking-widest text-[#EC0000]">
              {t('tutorCapsules.modalBadge', 'Cápsula Formativa')}
            </p>
            <h2 className="font-headline font-bold text-lg text-gray-900 dark:text-white mt-0.5">
              {editingId
                ? t('tutorCapsules.editTitle', 'Editar Cápsula')
                : t('tutorCapsules.createTitle', 'Nova Cápsula')}
            </h2>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={t('common.close', 'Fechar')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-6 flex flex-col gap-5">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Title */}
          <FormField label={t('tutorCapsules.fieldTitle', 'Título')} required>
            <input
              type="text"
              value={form.title}
              onChange={e => setF('title', e.target.value)}
              placeholder={t('tutorCapsules.titlePlaceholder', 'Ex: Fundamentos Cambiais')}
              className={inputCls}
              autoFocus
            />
          </FormField>

          {/* Description */}
          <FormField label={`${t('tutorCapsules.fieldDescription', 'Descrição')} (${t('common.optional', 'opcional')})`}>
            <textarea
              value={form.description}
              onChange={e => setF('description', e.target.value)}
              placeholder={t('tutorCapsules.descriptionPlaceholder', 'Breve descrição do conteúdo...')}
              rows={2}
              className={inputCls + ' resize-none'}
            />
          </FormField>

          {/* Type + Level */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('tutorCapsules.fieldType', 'Tipo de Cápsula')}>
              <select value={form.course_type} onChange={e => setF('course_type', e.target.value)} className={selectCls}>
                <option value="CAPSULA_METODOLOGIA">{t('tutorCapsules.typeMethodology', 'Metodologia')}</option>
                <option value="CAPSULA_FUNCIONALIDADE">{t('tutorCapsules.typeFunctionality', 'Funcionalidade')}</option>
              </select>
            </FormField>
            <FormField label={t('tutorCapsules.fieldLevel', 'Nível')}>
              <select value={form.level} onChange={e => setF('level', e.target.value)} className={selectCls}>
                <option value="BEGINNER">{t('tutorCapsules.levelBasic', 'Básico')}</option>
                <option value="INTERMEDIATE">{t('tutorCapsules.levelIntermediate', 'Intermédio')}</option>
                <option value="ADVANCED">{t('tutorCapsules.levelAdvanced', 'Avançado')}</option>
              </select>
            </FormField>
          </div>

          {/* Difficulty + Challenge type */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('challenges.difficulty', 'Dificuldade')}>
              <select value={form.difficulty} onChange={e => setF('difficulty', e.target.value)} className={selectCls}>
                <option value="easy">{t('challenges.difficultyEasy', 'Fácil')}</option>
                <option value="medium">{t('challenges.difficultyMedium', 'Médio')}</option>
                <option value="hard">{t('challenges.difficultyHard', 'Difícil')}</option>
              </select>
            </FormField>
            <FormField label={t('tutorCapsules.fieldChallengeType', 'Tipo de Desafio')}>
              <select value={form.challenge_type} onChange={e => setF('challenge_type', e.target.value)} className={selectCls}>
                <option value="COMPLETE">{t('tutorCapsules.challengeTypeComplete', 'Completo')}</option>
                <option value="SUMMARY">{t('tutorCapsules.challengeTypeSummary', 'Resumo')}</option>
              </select>
            </FormField>
          </div>

          {/* Ops + Time */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('challenges.operationsRequired', 'Operações')}>
              <input
                type="number"
                min={1}
                value={form.operations_required}
                onChange={e => handleOpsOrTime('operations_required', Number(e.target.value))}
                className={inputCls}
              />
            </FormField>
            <FormField label={t('challenges.timeLimit', 'Tempo (min)')}>
              <input
                type="number"
                min={1}
                value={form.time_limit_minutes}
                onChange={e => handleOpsOrTime('time_limit_minutes', Number(e.target.value))}
                className={inputCls}
              />
            </FormField>
          </div>

          {/* MPU + Max errors */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('challenges.targetMpu', 'MPU alvo (min/op)')}>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.target_mpu}
                onChange={e => setF('target_mpu', Number(e.target.value))}
                className={inputCls}
              />
            </FormField>
            <FormField label={t('challenges.maxErrors', 'Máx. erros')}>
              <input
                type="number"
                min={0}
                value={form.max_errors}
                onChange={e => setF('max_errors', Number(e.target.value))}
                className={inputCls}
              />
            </FormField>
          </div>

          {/* KPI toggles */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('challenges.kpiConfig', 'KPIs activos')}
            </label>
            <div className="flex gap-2">
              <KpiToggle label={t('tutorCapsules.kpiOps', 'Volume')} value={form.use_volume_kpi} onChange={v => setF('use_volume_kpi', v)} />
              <KpiToggle label="MPU" value={form.use_mpu_kpi} onChange={v => setF('use_mpu_kpi', v)} />
              <KpiToggle label={t('challenges.maxErrors', 'Erros')} value={form.use_errors_kpi} onChange={v => setF('use_errors_kpi', v)} />
            </div>
          </div>

          {/* KPI mode + allow retry */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('challenges.kpiMode', 'Modo KPI')}>
              <select value={form.kpi_mode} onChange={e => setF('kpi_mode', e.target.value)} className={selectCls}>
                <option value="AUTO">{t('tutorCapsules.kpiModeAuto', 'Auto')}</option>
                <option value="MANUAL">{t('tutorCapsules.kpiModeManual', 'Manual')}</option>
              </select>
            </FormField>
            <FormField label={t('challenges.allowRetry', 'Permitir retry')}>
              <button
                type="button"
                onClick={() => setF('allow_retry', !form.allow_retry)}
                className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium border transition-all
                  ${form.allow_retry
                    ? 'border-[#EC0000] bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700'}`}
              >
                {form.allow_retry ? t('common.yes', 'Sim') : t('common.no', 'Não')}
              </button>
            </FormField>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {t('common.cancel', 'Cancelar')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#EC0000] hover:bg-[#CC0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving
              ? <><Loader2 size={15} className="animate-spin" />{t('common.saving', 'A guardar...')}</>
              : <><Save size={15} />{editingId ? t('common.save', 'Guardar') : t('tutorCapsules.createButton', 'Criar Cápsula')}</>}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-xl sm:text-2xl text-gray-900 dark:text-white">
            {t('tutorCapsules.pageTitle', 'Cápsulas Formativas')}
          </h1>
          <p className="text-sm mt-0.5 text-gray-500 dark:text-gray-400">
            {t('tutorCapsules.pageSubtitle', 'Desafios especiais para os tutorados')}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#EC0000] hover:bg-[#CC0000] transition-colors self-start sm:self-auto"
        >
          <Plus size={16} />
          {t('tutorCapsules.newCapsule', 'Nova Cápsula')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-[#EC0000]" />
        </div>
      ) : capsules.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Zap size={28} className="text-[#EC0000] opacity-60" />
          </div>
          <div className="text-center">
            <p className="font-medium text-base text-gray-600 dark:text-gray-300">
              {t('tutorCapsules.emptyTitle', 'Nenhuma cápsula criada')}
            </p>
            <p className="text-sm mt-1">
              {t('tutorCapsules.emptySubtitle', 'Crie a primeira cápsula formativa.')}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#EC0000] hover:bg-[#CC0000] transition-colors mt-2"
          >
            <Plus size={15} />
            {t('tutorCapsules.newCapsule', 'Nova Cápsula')}
          </button>
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {capsules.map(c => <CapsuleCard key={c.id} c={c} />)}
        </div>
      )}

      {/* Counter */}
      {!loading && capsules.length > 0 && (
        <p className="text-xs text-right text-gray-400 dark:text-gray-600">
          {capsules.length} {capsules.length === 1
            ? t('tutorCapsules.capsulaCount_one', 'cápsula activa')
            : t('tutorCapsules.capsulaCount_other', 'cápsulas activas')}
        </p>
      )}

      {/* Modal */}
      {showModal && <Modal />}
    </div>
  );
}
