import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, BookOpen, Loader2, Trash2, X, Save, GraduationCap, AlertCircle,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useTheme } from '../../contexts/ThemeContext';

interface Capsula {
  id: number;
  title: string;
  description?: string;
  level: string;
  course_type: string;
  managed_by_tutor: boolean;
  is_active: boolean;
  created_at: string;
}

const COURSE_TYPE_LABEL: Record<string, string> = {
  CAPSULA_METODOLOGIA: 'Metodologia',
  CAPSULA_FUNCIONALIDADE: 'Funcionalidade',
};

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Básico',
  INTERMEDIATE: 'Intermédio',
  ADVANCED: 'Avançado',
};

const LEVEL_BADGE: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  ADVANCED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const TYPE_BADGE: Record<string, string> = {
  CAPSULA_METODOLOGIA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CAPSULA_FUNCIONALIDADE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

function formatDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function TutorCapsules() {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const [capsulas, setCapsulas] = useState<Capsula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    level: 'BEGINNER',
    course_type: 'CAPSULA_METODOLOGIA',
    started_by: 'TRAINEE',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    axios.get('/api/tutoria/capsulas')
      .then(r => setCapsulas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError(t('tutorCapsules.loadError', 'Erro ao carregar cápsulas.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      setFormError(t('tutorCapsules.titleRequired', 'O título é obrigatório.'));
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await axios.post('/api/tutoria/capsulas', {
        title: form.title.trim(),
        description: form.description.trim() || null,
        level: form.level,
        course_type: form.course_type,
        started_by: form.started_by,
      });
      setForm({ title: '', description: '', level: 'BEGINNER', course_type: 'CAPSULA_METODOLOGIA', started_by: 'TRAINEE' });
      setShowCreate(false);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || t('tutorCapsules.saveError', 'Erro ao guardar cápsula.');
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    const confirmed = window.confirm(
      t('tutorCapsules.confirmDelete', 'Desactivar a cápsula "{{title}}"?', { title })
    );
    if (!confirmed) return;
    setDeleting(id);
    try {
      await axios.delete(`/api/tutoria/capsulas/${id}`);
      load();
    } catch { /* ignore */ } finally {
      setDeleting(null);
    }
  };

  const handleCloseCreate = () => {
    setShowCreate(false);
    setFormError(null);
    setForm({ title: '', description: '', level: 'BEGINNER', course_type: 'CAPSULA_METODOLOGIA', started_by: 'TRAINEE' });
  };

  // ── Card component ─────────────────────────────────────────────────────────
  const CapsulaCard = ({ c }: { c: Capsula }) => (
    <article
      className={`
        rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col gap-3 transition-shadow hover:shadow-md
        ${isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'}
      `}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`
              flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl
              ${isDark ? 'bg-red-900/30' : 'bg-red-50'}
            `}
          >
            <GraduationCap size={18} className="text-[#EC0000]" />
          </span>
          <h3
            className={`
              font-headline font-semibold text-sm sm:text-base truncate
              ${isDark ? 'text-white' : 'text-gray-900'}
            `}
            title={c.title}
          >
            {c.title}
          </h3>
        </div>

        {/* Delete button */}
        <button
          onClick={() => handleDelete(c.id, c.title)}
          disabled={deleting === c.id}
          aria-label={t('tutorCapsules.deactivate', 'Desactivar')}
          className={`
            flex-shrink-0 p-1.5 rounded-lg transition-colors
            ${isDark
              ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20 disabled:opacity-40'
              : 'text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40'}
          `}
        >
          {deleting === c.id
            ? <Loader2 size={16} className="animate-spin" />
            : <Trash2 size={16} />}
        </button>
      </div>

      {/* Description */}
      {c.description && (
        <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {c.description}
        </p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${TYPE_BADGE[c.course_type] ?? TYPE_BADGE.CAPSULA_METODOLOGIA}`}>
          {COURSE_TYPE_LABEL[c.course_type] ?? c.course_type}
        </span>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${LEVEL_BADGE[c.level] ?? LEVEL_BADGE.BEGINNER}`}>
          {LEVEL_LABEL[c.level] ?? c.level}
        </span>
      </div>

      {/* Footer */}
      <p className={`text-xs mt-auto ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {t('tutorCapsules.createdAt', 'Criada em')} {formatDate(c.created_at)}
      </p>
    </article>
  );

  // ── Create modal/panel ─────────────────────────────────────────────────────
  const CreatePanel = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCloseCreate}
      />

      {/* Panel */}
      <div
        className={`
          relative w-full max-w-md rounded-2xl shadow-xl p-6 flex flex-col gap-5
          ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}
        `}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between">
          <h2 className={`font-headline font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('tutorCapsules.createTitle', 'Nova Cápsula Formativa')}
          </h2>
          <button
            onClick={handleCloseCreate}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            aria-label={t('common.cancel', 'Cancelar')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form error */}
        {formError && (
          <div className="flex items-center gap-2 rounded-xl p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Título */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('tutorCapsules.fieldTitle', 'Título')}
            <span className="text-[#EC0000] ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder={t('tutorCapsules.titlePlaceholder', 'Ex: Fundamentos de Análise Técnica')}
            className={`
              w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none transition-colors
              focus:border-[#EC0000] focus:ring-1 focus:ring-[#EC0000]/20
              ${isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}
            `}
            autoFocus
          />
        </div>

        {/* Descrição */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('tutorCapsules.fieldDescription', 'Descrição')}
            <span className={`text-xs ml-1 font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              ({t('common.optional', 'opcional')})
            </span>
          </label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder={t('tutorCapsules.descriptionPlaceholder', 'Breve descrição do conteúdo...')}
            rows={3}
            className={`
              w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none transition-colors resize-none
              focus:border-[#EC0000] focus:ring-1 focus:ring-[#EC0000]/20
              ${isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}
            `}
          />
        </div>

        {/* Nível + Tipo — side by side on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nível */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('tutorCapsules.fieldLevel', 'Nível')}
            </label>
            <select
              value={form.level}
              onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
              className={`
                w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none transition-colors
                focus:border-[#EC0000] focus:ring-1 focus:ring-[#EC0000]/20
                ${isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-900'}
              `}
            >
              <option value="BEGINNER">{t('tutorCapsules.levelBasic', 'Básico')}</option>
              <option value="INTERMEDIATE">{t('tutorCapsules.levelIntermediate', 'Intermédio')}</option>
              <option value="ADVANCED">{t('tutorCapsules.levelAdvanced', 'Avançado')}</option>
            </select>
          </div>

          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('tutorCapsules.fieldType', 'Tipo')}
            </label>
            <select
              value={form.course_type}
              onChange={e => setForm(f => ({ ...f, course_type: e.target.value }))}
              className={`
                w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none transition-colors
                focus:border-[#EC0000] focus:ring-1 focus:ring-[#EC0000]/20
                ${isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-900'}
              `}
            >
              <option value="CAPSULA_METODOLOGIA">{t('tutorCapsules.typeMethodology', 'Metodologia')}</option>
              <option value="CAPSULA_FUNCIONALIDADE">{t('tutorCapsules.typeFunctionality', 'Funcionalidade')}</option>
            </select>
          </div>
        </div>

        {/* Tipo de Início */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('tutorCapsules.fieldStartedBy', 'Tipo de Início')}
          </label>
          <div className="flex gap-3">
            {[
              { value: 'TRAINEE', label: t('tutorCapsules.startedByTrainee', 'Vídeo (iniciado pelo utilizador)') },
              { value: 'TRAINER', label: t('tutorCapsules.startedByTrainer', 'Cápsula (iniciada pelo Tutor)') },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, started_by: opt.value }))}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                  form.started_by === opt.value
                    ? 'border-[#EC0000] bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50'
                    : 'border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={handleCloseCreate}
            className={`
              px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${isDark
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            {t('common.cancel', 'Cancelar')}
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving || !form.title.trim()}
            className="
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
              bg-[#EC0000] hover:bg-[#CC0000] disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {saving
              ? <><Loader2 size={15} className="animate-spin" />{t('common.saving', 'A guardar...')}</>
              : <><Save size={15} />{t('tutorCapsules.createButton', 'Criar Cápsula')}</>}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`font-headline font-bold text-xl sm:text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('tutorCapsules.pageTitle', 'Cápsulas Formativas')}
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('tutorCapsules.pageSubtitle', 'Gerir cápsulas de formação para os tutorados')}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="
            flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
            bg-[#EC0000] hover:bg-[#CC0000] transition-colors self-start sm:self-auto
          "
        >
          <Plus size={16} />
          {t('tutorCapsules.newCapsule', 'Nova Cápsula')}
        </button>
      </div>

      {/* Global error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-[#EC0000]" />
        </div>
      ) : capsulas.length === 0 ? (
        /* Empty state */
        <div className={`
          flex flex-col items-center justify-center gap-4 py-20 rounded-2xl border border-dashed
          ${isDark ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}
        `}>
          <BookOpen size={48} className="opacity-40" />
          <div className="text-center">
            <p className={`font-medium text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('tutorCapsules.emptyTitle', 'Nenhuma cápsula criada')}
            </p>
            <p className="text-sm mt-1">
              {t('tutorCapsules.emptySubtitle', 'Crie a primeira cápsula formativa.')}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white
              bg-[#EC0000] hover:bg-[#CC0000] transition-colors mt-2
            "
          >
            <Plus size={15} />
            {t('tutorCapsules.newCapsule', 'Nova Cápsula')}
          </button>
        </div>
      ) : (
        /* Grid of cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {capsulas.map(c => <CapsulaCard key={c.id} c={c} />)}
        </div>
      )}

      {/* Counter */}
      {!loading && capsulas.length > 0 && (
        <p className={`text-xs text-right ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          {capsulas.length} {capsulas.length === 1
            ? t('tutorCapsules.capsulaCount_one', 'cápsula activa')
            : t('tutorCapsules.capsulaCount_other', 'cápsulas activas')}
        </p>
      )}

      {/* Create modal */}
      {showCreate && <CreatePanel />}
    </div>
  );
}
