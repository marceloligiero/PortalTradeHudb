import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Save, Building2, Package, Check,
  AlertCircle, GraduationCap, TrendingUp, Shield, Star,
  CheckCircle2, Loader2, BookOpen, Layers,
} from 'lucide-react';
import api from '../../lib/axios';
import { getTranslatedProductName } from '../../utils/productTranslation';

interface Bank { id: number; code: string; name: string; country: string }
interface Product { id: number; code: string; name: string; description: string }

const LEVELS = [
  { value: 'BEGINNER',     icon: TrendingUp, label: 'admin.levelBeginner',     desc: 'admin.levelBeginnerDesc',     color: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-50 dark:bg-orange-900/20',   border: 'border-orange-300 dark:border-orange-700',   selBorder: 'border-orange-500' },
  { value: 'INTERMEDIATE', icon: Shield,     label: 'admin.levelIntermediate', desc: 'admin.levelIntermediateDesc', color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20',     border: 'border-amber-300 dark:border-amber-700',     selBorder: 'border-amber-500' },
  { value: 'EXPERT',       icon: Star,       label: 'admin.levelExpert',       desc: 'admin.levelExpertDesc',       color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-300 dark:border-emerald-700', selBorder: 'border-emerald-500' },
] as const;

const COURSE_TYPES = [
  { value: 'CURSO',                   labelKey: 'admin.courseTypeCurso',                   desc: 'admin.courseTypeCursoDesc',                   icon: BookOpen },
  { value: 'CAPSULA_METODOLOGIA',     labelKey: 'admin.courseTypeCapsulaMetodologia',      desc: 'admin.courseTypeCapsulaMetodologiaDesc',      icon: Layers },
  { value: 'CAPSULA_FUNCIONALIDADE',  labelKey: 'admin.courseTypeCapsulaFuncionalidade',   desc: 'admin.courseTypeCapsulaFuncionalidadeDesc',   icon: Package },
] as const;

const inputCls = (err?: string) =>
  `w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/60 transition-colors ${
    err ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-800'
  }`;

const SectionHeader = ({ icon: Icon, label, count }: { icon: any; label: string; count?: number }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
      <Icon className="w-3.5 h-3.5 text-[#EC0000]" />
    </div>
    <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</span>
    {count !== undefined && count > 0 && (
      <span className="ml-auto text-[10px] font-bold text-[#EC0000] bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
        {count} ✓
      </span>
    )}
  </div>
);

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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = t('admin.titleRequired');
    if (!form.description.trim()) e.description = t('admin.descriptionRequired');
    if (form.bank_ids.length === 0) e.bank_ids = t('admin.bankRequired');
    if (form.product_ids.length === 0) e.product_ids = t('admin.productTypeRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

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

  const toggleBank = (id: number) =>
    set('bank_ids', form.bank_ids.includes(id) ? form.bank_ids.filter(x => x !== id) : [...form.bank_ids, id]);

  const toggleProduct = (id: number) =>
    set('product_ids', form.product_ids.includes(id) ? form.product_ids.filter(x => x !== id) : [...form.product_ids, id]);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#EC0000]" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-24 text-center">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
        <p className="text-lg font-headline font-bold text-gray-900 dark:text-white mb-1">{t('admin.courseCreatedSuccess')}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.redirecting')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="font-headline text-xl font-bold text-gray-900 dark:text-white">
              {isEditing ? t('admin.editCourse', 'Editar Curso') : t('admin.newCourse')}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {isEditing ? t('admin.editCourseDesc', 'Atualizar informações do curso') : t('admin.newCourseDesc', 'Preencha os dados para criar um novo curso')}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? t('messages.saving') : isEditing ? t('common.save', 'Guardar') : t('admin.createCourse')}
        </button>
      </div>

      {/* Submit error */}
      {errors.submit && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
        </div>
      )}

      {/* ── Main grid: 2 columns on lg+ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">

        {/* ── LEFT: Basic info ── */}
        <div className="space-y-5">

          {/* Title + Description */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <SectionHeader icon={BookOpen} label={t('admin.courseInfo', 'Informação do Curso')} />

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  {t('admin.courseTitle')} <span className="text-[#EC0000]">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => { set('title', e.target.value); if (e.target.value.trim()) setErrors(p => ({ ...p, title: '' })); }}
                  className={inputCls(errors.title)}
                  placeholder={t('admin.courseTitlePlaceholder')}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  {t('admin.courseDescription')} <span className="text-[#EC0000]">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => { set('description', e.target.value); if (e.target.value.trim()) setErrors(p => ({ ...p, description: '' })); }}
                  rows={5}
                  className={`${inputCls(errors.description)} resize-none`}
                  placeholder={t('admin.courseDescriptionPlaceholder')}
                />
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Level */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <SectionHeader icon={GraduationCap} label={t('admin.courseLevel', 'Nível')} />
            <div className="grid grid-cols-3 gap-3">
              {LEVELS.map(lvl => {
                const sel = form.level === lvl.value;
                const Icon = lvl.icon;
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => set('level', lvl.value)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                      sel
                        ? `${lvl.bg} ${lvl.selBorder}`
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    {sel && <Check className={`absolute top-2 right-2 w-3.5 h-3.5 ${lvl.color}`} />}
                    <Icon className={`w-5 h-5 ${sel ? lvl.color : 'text-gray-400 dark:text-gray-500'}`} />
                    <div className="text-center">
                      <p className={`text-xs font-bold ${sel ? lvl.color : 'text-gray-600 dark:text-gray-300'}`}>{t(lvl.label)}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{t(lvl.desc)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Course type */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <SectionHeader icon={Layers} label={t('admin.courseType', 'Tipo de Curso')} />
            <div className="space-y-2">
              {COURSE_TYPES.map(ct => {
                const sel = form.course_type === ct.value;
                const Icon = ct.icon;
                return (
                  <label
                    key={ct.value}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      sel
                        ? 'border-[#EC0000] bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="course_type"
                      value={ct.value}
                      checked={sel}
                      onChange={() => set('course_type', ct.value)}
                      className="sr-only"
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sel ? 'bg-[#EC0000] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${sel ? 'text-[#EC0000]' : 'text-gray-700 dark:text-gray-300'}`}>{t(ct.labelKey)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t(ct.desc, '')}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${sel ? 'border-[#EC0000]' : 'border-gray-300 dark:border-gray-600'}`}>
                      {sel && <div className="w-2 h-2 rounded-full bg-[#EC0000]" />}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Banks + Products ── */}
        <div className="space-y-5">

          {/* Banks */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <SectionHeader icon={Building2} label={`${t('admin.banks')} *`} count={form.bank_ids.length} />

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {banks.map(bank => {
                const sel = form.bank_ids.includes(bank.id);
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => { toggleBank(bank.id); setErrors(p => ({ ...p, bank_ids: '' })); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                      sel
                        ? 'border-[#EC0000] bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      sel ? 'bg-[#EC0000] border-[#EC0000]' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {sel && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${sel ? 'text-[#EC0000]' : 'text-gray-700 dark:text-gray-300'}`}>{bank.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{bank.country}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {errors.bank_ids && (
              <p className="text-xs text-red-500 mt-2.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.bank_ids}
              </p>
            )}
          </div>

          {/* Products */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <SectionHeader icon={Package} label={`${t('admin.services')} *`} count={form.product_ids.length} />

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {products.map(product => {
                const sel = form.product_ids.includes(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => { toggleProduct(product.id); setErrors(p => ({ ...p, product_ids: '' })); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                      sel
                        ? 'border-[#EC0000] bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      sel ? 'bg-[#EC0000] border-[#EC0000]' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {sel && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <p className={`text-sm font-medium truncate ${sel ? 'text-[#EC0000]' : 'text-gray-700 dark:text-gray-300'}`}>
                      {getTranslatedProductName(t, product.code, product.name)}
                    </p>
                  </button>
                );
              })}
            </div>

            {errors.product_ids && (
              <p className="text-xs text-red-500 mt-2.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.product_ids}
              </p>
            )}
          </div>

        </div>
      </div>
    </form>
  );
}
