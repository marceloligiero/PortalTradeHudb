import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Save, FileText, Clock, CheckCircle2,
  BookOpen, Video, Link as LinkIcon, Layers,
  AlertCircle, Loader2, Settings, Play
} from 'lucide-react';
import api from '../../lib/axios';
import DOMPurify from 'dompurify';
import RichTextEditor from '../../components/RichTextEditor';
import { useTheme } from '../../contexts/ThemeContext';

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

export default function LessonForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const { isDark } = useTheme();
  const isEditing = !!lessonId;

  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<LessonFormData>({
    title: '',
    description: '',
    content: '',
    lesson_type: 'THEORETICAL',
    started_by: 'TRAINER',
    estimated_minutes: 30,
    order_index: 1,
    video_url: '',
    materials_url: '',
  });

  const set = <K extends keyof LessonFormData>(key: K, val: LessonFormData[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  /* ── Load data ── */

  useEffect(() => {
    (async () => {
      try {
        if (isEditing && courseId && lessonId) {
          const { data: lesson } = await api.get(`/api/admin/courses/${courseId}/lessons/${lessonId}`);
          setForm({
            title: lesson.title || '',
            description: lesson.description || '',
            content: lesson.content || '',
            lesson_type: lesson.lesson_type || 'THEORETICAL',
            started_by: lesson.started_by || 'TRAINER',
            estimated_minutes: lesson.estimated_minutes || 30,
            order_index: lesson.order_index || 1,
            video_url: lesson.video_url || '',
            materials_url: lesson.materials_url || '',
          });
        } else if (courseId) {
          const { data: course } = await api.get(`/api/admin/courses/${courseId}`);
          const lessons = course?.lessons || [];
          setForm(prev => ({ ...prev, order_index: lessons.length + 1 }));
        }
      } catch (err) {
        console.error('Error loading lesson data:', err);
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  /* ── Validate ── */

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = t('admin.titleRequired');
    if (form.video_url && !form.video_url.startsWith('http')) e.video_url = t('lessons.invalidUrl', 'URL inválida');
    if (form.materials_url && !form.materials_url.startsWith('http')) e.materials_url = t('lessons.invalidUrl', 'URL inválida');
    if (form.estimated_minutes < 1) e.estimated_minutes = t('lessons.minDuration', 'Mínimo 1 minuto');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        ...form,
        course_id: parseInt(courseId || '0', 10),
        order_index: isEditing ? form.order_index : form.order_index - 1,
      };

      if (isEditing && lessonId) {
        await api.put(`/api/admin/courses/${courseId}/lessons/${lessonId}`, payload);
      } else {
        await api.post('/api/trainer/lessons', payload);
      }

      setSuccess(true);
      setTimeout(() => navigate(`/courses/${courseId}`), 1500);
    } catch (err: any) {
      console.error('Error saving lesson:', err);
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
        <p className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
          {isEditing ? t('lessons.lessonUpdated') : t('lessons.lessonCreated')}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin.redirecting')}</p>
      </div>
    );
  }

  /* ── Form ── */

  const inputCls = (key: string) =>
    `w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#EC0000]/20 focus:border-[#EC0000] transition-colors ${
      errors[key] ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'
    }`;

  const ErrorMsg = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors[field]}</p>
    ) : null;

  return (
    <div className="max-w-3xl mx-auto">

      {/* ═══ Top bar ═══ */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-headline text-xl font-bold text-neutral-900 dark:text-white">
            {isEditing ? t('lessons.editLesson') : t('lessons.createLesson')}
          </h1>
        </div>
        <button
          onClick={handleSubmit as any}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? t('messages.saving') : isEditing ? t('common.save', 'Guardar') : t('lessons.createLesson')}
        </button>
      </div>

      {/* ═══ Form card ═══ */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">

        {/* ── Basic Info ── */}
        <div className="p-5 sm:p-6 space-y-4 border-b border-neutral-100 dark:border-neutral-700/50">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-1.5">
              {t('lessons.titleLabel')} *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className={inputCls('title')}
              placeholder={t('lessons.titlePlaceholder')}
            />
            <ErrorMsg field="title" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-1.5">
              {t('lessons.descriptionLabel')}
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className={`${inputCls('description')} resize-none`}
              placeholder={t('lessons.descriptionPlaceholder')}
            />
          </div>

          {/* Lesson Type */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-2">
              <BookOpen className="w-3.5 h-3.5 inline mr-1" />
              {t('lessons.lessonType', 'Tipo de Módulo')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'THEORETICAL' as const, label: t('lessons.theoretical', 'Teórico'), Icon: FileText },
                { value: 'PRACTICAL' as const, label: t('lessons.practical', 'Prático'), Icon: Settings },
              ]).map(opt => {
                const sel = form.lesson_type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('lesson_type', opt.value)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                      sel
                        ? 'border-[#EC0000] bg-red-50 dark:bg-red-500/10'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                      sel ? 'bg-[#EC0000] text-white' : 'border border-neutral-300 dark:border-neutral-600'
                    }`}>
                      {sel && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <opt.Icon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Started By */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-2">
              <Play className="w-3.5 h-3.5 inline mr-1" />
              {t('lessons.startedByLabel')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'TRAINER' as const, label: t('lessons.startedByTrainer'), desc: t('lessons.startedByTrainerDesc') },
                { value: 'TRAINEE' as const, label: t('lessons.startedByTrainee'), desc: t('lessons.startedByTraineeDesc') },
              ]).map(opt => {
                const sel = form.started_by === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('started_by', opt.value)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                      sel
                        ? 'border-[#EC0000] bg-red-50 dark:bg-red-500/10'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                      sel ? 'bg-[#EC0000] text-white' : 'border border-neutral-300 dark:border-neutral-600'
                    }`}>
                      {sel && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">{opt.label}</p>
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Content (Rich Text) ── */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 dark:border-neutral-700/50">
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-2">
            <FileText className="w-3.5 h-3.5 inline mr-1" />
            {t('lessons.contentTitle')}
          </label>
          <RichTextEditor
            content={form.content}
            onChange={(html) => set('content', html)}
            placeholder={t('lessons.contentPlaceholder')}
            isDark={isDark}
          />
        </div>

        {/* ── Resources & Settings ── */}
        <div className="p-5 sm:p-6 space-y-4">
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-0">
            <Video className="w-3.5 h-3.5 inline mr-1" />
            {t('lessons.resourcesTitle')}
          </label>

          {/* Video URL */}
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              {t('lessons.videoUrlLabel')}
            </label>
            <div className="relative">
              <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="url"
                value={form.video_url}
                onChange={e => set('video_url', e.target.value)}
                className={`${inputCls('video_url')} pl-9`}
                placeholder={t('lessons.videoUrlPlaceholder')}
              />
            </div>
            <ErrorMsg field="video_url" />
          </div>

          {/* Materials URL */}
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              {t('lessons.materialsUrlLabel')}
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="url"
                value={form.materials_url}
                onChange={e => set('materials_url', e.target.value)}
                className={`${inputCls('materials_url')} pl-9`}
                placeholder={t('lessons.materialsUrlPlaceholder')}
              />
            </div>
            <ErrorMsg field="materials_url" />
          </div>

          {/* Duration + Order (inline) */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {t('lessons.durationLabel')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form.estimated_minutes}
                  onChange={e => set('estimated_minutes', parseInt(e.target.value) || 1)}
                  min={1}
                  className={`w-20 px-3 py-2.5 bg-white dark:bg-neutral-900 border rounded-xl text-sm text-neutral-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-[#EC0000]/20 focus:border-[#EC0000] transition-colors ${
                    errors.estimated_minutes ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                />
                <span className="text-sm text-neutral-400">{t('lessons.minutes')}</span>
              </div>
              <ErrorMsg field="estimated_minutes" />
            </div>

            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                {t('lessons.orderLabel')}
              </label>
              <div className="flex items-center gap-2">
                <div className="w-20 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-500 dark:text-neutral-400 text-center">
                  {form.order_index}
                </div>
                <span className="text-xs text-neutral-400">{t('lessons.orderAutomatic')}</span>
              </div>
            </div>
          </div>
        </div>
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
