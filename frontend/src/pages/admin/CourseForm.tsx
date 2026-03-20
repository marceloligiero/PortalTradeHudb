import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Save, Building2, Package, Check,
  AlertCircle, GraduationCap, TrendingUp, Shield, Star,
  CheckCircle2, Loader2
} from 'lucide-react';
import api from '../../lib/axios';
import { getTranslatedProductName } from '../../utils/productTranslation';

interface Bank { id: number; code: string; name: string; country: string }
interface Product { id: number; code: string; name: string; description: string }

const LEVELS = [
  { value: 'BEGINNER',     icon: TrendingUp, label: 'admin.levelBeginner',     desc: 'admin.levelBeginnerDesc',     cls: 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  { value: 'INTERMEDIATE', icon: Shield,     label: 'admin.levelIntermediate', desc: 'admin.levelIntermediateDesc', cls: 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',     dot: 'bg-amber-500' },
  { value: 'EXPERT',       icon: Star,       label: 'admin.levelExpert',       desc: 'admin.levelExpertDesc',       cls: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
] as const;

export default function CourseForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const isEditing = Boolean(courseId);

  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    level: 'BEGINNER',
    course_type: 'CURSO',
    bank_ids: [] as number[],
    product_ids: [] as number[],
  });

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  /* ── Load data ── */

  useEffect(() => {
    (async () => {
      try {
        const [bRes, pRes] = await Promise.all([
          api.get('/api/admin/banks'),
          api.get('/api/admin/products'),
        ]);
        setBanks(bRes.data);
        setProducts(pRes.data);

        if (isEditing && courseId) {
          const { data: c } = await api.get(`/api/admin/courses/${courseId}`);
          setForm({
            title: c.title || '',
            description: c.description || '',
            level: c.level || 'BEGINNER',
            course_type: c.course_type || 'CURSO',
            bank_ids: (c.banks || []).map((b: { id: number }) => b.id),
            product_ids: (c.products || []).map((p: { id: number }) => p.id),
          });
        }
      } catch (err) {
        console.error('Error loading form data:', err);
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  /* ── Validate ── */

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = t('admin.titleRequired');
    if (!form.description.trim()) e.description = t('admin.descriptionRequired');
    if (form.bank_ids.length === 0) e.bank_ids = t('admin.bankRequired');
    if (form.product_ids.length === 0) e.product_ids = t('admin.productTypeRequired');
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
        title: form.title,
        description: form.description,
        level: form.level,
        course_type: form.course_type,
        bank_ids: form.bank_ids,
        product_ids: form.product_ids,
      };

      if (isEditing && courseId) {
        await api.put(`/api/admin/courses/${courseId}`, payload);
      } else {
        await api.post('/api/admin/courses', payload);
      }

      setSuccess(true);
      setTimeout(() => navigate(isEditing ? `/courses/${courseId}` : '/courses'), 1500);
    } catch (err) {
      console.error('Error saving course:', err);
      setErrors({ submit: t('messages.error') });
    } finally {
      setSaving(false);
    }
  };

  /* ── Toggle helpers ── */

  const toggleBank = (id: number) =>
    set('bank_ids', form.bank_ids.includes(id) ? form.bank_ids.filter(x => x !== id) : [...form.bank_ids, id]);

  const toggleProduct = (id: number) =>
    set('product_ids', form.product_ids.includes(id) ? form.product_ids.filter(x => x !== id) : [...form.product_ids, id]);

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
        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('admin.courseCreatedSuccess')}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.redirecting')}</p>
      </div>
    );
  }

  /* ── Form ── */

  const inputCls = (key: string) =>
    `w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/40 transition-colors ${
      errors[key] ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
    }`;

  return (
    <div className="max-w-3xl mx-auto">

      {/* ═══ Top bar ═══ */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/courses')}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? t('admin.editCourse', 'Editar Curso') : t('admin.newCourse')}
          </h1>
        </div>
        <button
          onClick={handleSubmit as any}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? t('messages.saving') : isEditing ? t('common.save', 'Guardar') : t('admin.createCourse')}
        </button>
      </div>

      {/* ═══ Form card ═══ */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">

        {/* ── Title + Description + Level ── */}
        <div className="p-5 sm:p-6 space-y-4 border-b border-gray-100 dark:border-gray-700/50">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
              {t('admin.courseTitle')} *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className={inputCls('title')}
              placeholder={t('admin.courseTitlePlaceholder')}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
              {t('admin.courseDescription')} *
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              className={`${inputCls('description')} resize-none`}
              placeholder={t('admin.courseDescriptionPlaceholder')}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
              <GraduationCap className="w-3.5 h-3.5 inline mr-1" />
              {t('admin.courseLevel', 'Nível')} *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map(lvl => {
                const sel = form.level === lvl.value;
                const Icon = lvl.icon;
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => set('level', lvl.value)}
                    className={`relative p-3 rounded-lg border text-center transition-colors ${
                      sel ? `border-current ${lvl.cls}` : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {sel && <Check className="absolute top-1.5 right-1.5 w-3.5 h-3.5" />}
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <p className="text-xs font-semibold">{t(lvl.label)}</p>
                    <p className="text-[10px] opacity-70">{t(lvl.desc)}</p>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Course Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
              {t('admin.courseType', 'Tipo de Curso')}
            </label>
            <select
              value={form.course_type}
              onChange={e => set('course_type', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EC0000]/30 focus:outline-none"
            >
              <option value="CURSO">{t('admin.courseTypeCurso', 'Curso Completo')}</option>
              <option value="CAPSULA_METODOLOGIA">{t('admin.courseTypeCapsulaMetodologia', 'Cápsula — Metodologia')}</option>
              <option value="CAPSULA_FUNCIONALIDADE">{t('admin.courseTypeCapsulaFuncionalidade', 'Cápsula — Funcionalidade')}</option>
            </select>
          </div>
        </div>

        {/* ── Banks ── */}
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/50">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
            <Building2 className="w-3.5 h-3.5 inline mr-1" />
            {t('admin.banks')} *
            <span className="font-normal normal-case text-gray-400 ml-1">({t('admin.selectMultiple')})</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {banks.map(bank => {
              const sel = form.bank_ids.includes(bank.id);
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => toggleBank(bank.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-colors ${
                    sel
                      ? 'border-[#EC0000] bg-red-50 dark:bg-red-500/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                    sel ? 'bg-[#EC0000] text-white' : 'border border-gray-300 dark:border-gray-600'
                  }`}>
                    {sel && <Check className="w-3 h-3" />}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{bank.name}</p>
                </button>
              );
            })}
          </div>
          {errors.bank_ids && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.bank_ids}</p>
          )}
        </div>

        {/* ── Products ── */}
        <div className="p-5 sm:p-6">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
            <Package className="w-3.5 h-3.5 inline mr-1" />
            {t('admin.services')} *
            <span className="font-normal normal-case text-gray-400 ml-1">({t('admin.selectMultiple')})</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {products.map(product => {
              const sel = form.product_ids.includes(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggleProduct(product.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-colors ${
                    sel
                      ? 'border-[#EC0000] bg-red-50 dark:bg-red-500/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                    sel ? 'bg-[#EC0000] text-white' : 'border border-gray-300 dark:border-gray-600'
                  }`}>
                    {sel && <Check className="w-3 h-3" />}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {getTranslatedProductName(t, product.code, product.name)}
                    </p>
                </button>
              );
            })}
          </div>
          {errors.product_ids && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.product_ids}</p>
          )}
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
