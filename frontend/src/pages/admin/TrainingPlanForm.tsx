import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Target, Calendar, CheckCircle2, AlertCircle, Building2, Package,
  Check, Infinity as InfinityIcon, Users, GraduationCap, ArrowLeft,
  BookOpen, Loader2
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { NAVIGATE_AFTER_SUBMIT_MS } from '../../constants/timings';
import { getTranslatedProductName } from '../../utils/productTranslation';

interface Course {
  id: number;
  title: string;
  description: string;
  bank_name?: string;
  product_name?: string;
  product_code?: string;
}

interface Bank {
  id: number;
  name: string;
  code: string;
  country?: string;
}

interface Product {
  id: number;
  name: string;
  code: string;
}

interface Trainer {
  id: number;
  name: string;
  email: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
}

export default function AdminTrainingPlanForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bank_ids: [] as number[],
    product_ids: [] as number[],
    trainer_ids: [] as number[],
    student_ids: [] as number[],
    start_date: '',
    end_date: '',
    is_permanent: false,
    course_ids: [] as number[],
  });

  const TOTAL_STEPS = 4;

  const steps = [
    { number: 1, title: t('trainingPlan.stepInfo'),   icon: Target },
    { number: 2, title: t('trainingPlan.stepScope'),  icon: Calendar },
    { number: 3, title: t('trainingPlan.stepTeam'),   icon: Users },
    { number: 4, title: t('trainingPlan.stepReview'), icon: CheckCircle2 },
  ];

  useEffect(() => {
    if (!token || !user) { navigate('/login'); return; }
    fetchData();
  }, [token, user, navigate]);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const [coursesRes, banksRes, productsRes, trainersRes, studentsRes] = await Promise.all([
        api.get('/api/admin/courses'),
        api.get('/api/admin/banks'),
        api.get('/api/admin/products'),
        api.get('/api/admin/trainers'),
        api.get('/api/admin/students'),
      ]);
      setCourses(coursesRes.data || []);
      setBanks(banksRes.data || []);
      setProducts(productsRes.data || []);
      setTrainers(trainersRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error: any) {
      setErrors({ submit: `${t('common.loadFailed', 'Falha ao carregar')}: ${error.response?.data?.detail || error.message}` });
    } finally {
      setDataLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = t('trainingPlan.titleRequired');
      else if (formData.title.trim().length < 3) newErrors.title = t('trainingPlan.titleTooShort');
      if (!formData.description.trim()) newErrors.description = t('trainingPlan.descRequired');
      else if (formData.description.trim().length < 10) newErrors.description = t('trainingPlan.descTooShort');
    }
    if (step === 2) {
      if (formData.start_date && formData.end_date && !formData.is_permanent) {
        if (new Date(formData.end_date) < new Date(formData.start_date))
          newErrors.end_date = t('trainingPlan.endDateMustBeAfterStartDate');
      }
    }
    if (step === 3) {
      if (formData.course_ids.length === 0) newErrors.course_ids = t('trainingPlan.selectAtLeastOneCourse');
    }
    if (step === 4) {
      if (!formData.title.trim()) newErrors.title = t('trainingPlan.titleRequired');
      if (!formData.description.trim()) newErrors.description = t('trainingPlan.descRequired');
      if (formData.course_ids.length === 0) newErrors.course_ids = t('trainingPlan.selectAtLeastOneCourse');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validateStep(currentStep)) { setCurrentStep(s => s + 1); setErrors({}); } };
  const handleBack = () => { setCurrentStep(s => s - 1); setErrors({}); };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    try {
      setLoading(true);
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        bank_ids: formData.bank_ids,
        product_ids: formData.product_ids,
        trainer_ids: formData.trainer_ids,
        student_ids: formData.student_ids,
        start_date: formData.start_date || null,
        end_date: formData.is_permanent ? null : (formData.end_date || null),
        is_permanent: formData.is_permanent,
        course_ids: formData.course_ids,
      };
      await api.post('/api/training-plans/', payload);
      setSuccess(true);
      setTimeout(() => navigate('/admin/training-plans'), NAVIGATE_AFTER_SUBMIT_MS);
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.detail || t('trainingPlan.createError') });
    } finally {
      setLoading(false);
    }
  };

  const toggle = <T extends number>(arr: T[], id: T): T[] =>
    arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];

  /* ── Loading ─────────────────────────────────── */
  if (dataLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#EC0000] animate-spin" />
      </div>
    );
  }

  /* ── Data error ──────────────────────────────── */
  if (errors.submit && courses.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('common.loadFailed', 'Falha ao Carregar')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{errors.submit}</p>
          <button onClick={fetchData} className="px-6 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-medium text-sm transition-colors">
            {t('common.retry', 'Tentar Novamente')}
          </button>
        </div>
      </div>
    );
  }

  /* ── Success ─────────────────────────────────── */
  if (success) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('trainingPlan.createdSuccess', 'Plano criado com sucesso!')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.redirecting', 'Redirecionando...')}</p>
        </div>
      </div>
    );
  }

  /* ── Helpers ──────────────────────────────────── */
  const inputCls = (field: string) =>
    `w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
      errors[field]
        ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
        : 'border-gray-200 dark:border-gray-700 focus:border-[#EC0000] focus:ring-[#EC0000]/20'
    }`;

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {errors[field]}
      </p>
    ) : null;

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );

  const SectionHeading = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-[#EC0000]" />
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
      <span className="text-xs text-gray-400 dark:text-gray-500">({t('trainingPlan.multipleSelect')})</span>
    </div>
  );

  const SelectionGrid = ({ items, selected, onToggle, renderItem }: {
    items: { id: number }[];
    selected: number[];
    onToggle: (id: number) => void;
    renderItem: (item: any) => React.ReactNode;
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {items.map((item: any) => {
        const isSelected = selected.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
              isSelected
                ? 'border-[#EC0000] bg-[#EC0000]/5 dark:bg-[#EC0000]/10'
                : 'border-gray-200 dark:border-gray-700 hover:border-[#EC0000]/40 bg-white dark:bg-gray-800'
            }`}
          >
            {renderItem(item)}
            <div className={`w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
              isSelected ? 'border-[#EC0000] bg-[#EC0000]' : 'border-gray-300 dark:border-gray-600'
            }`}>
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          </button>
        );
      })}
    </div>
  );

  const progressPct = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* ═══ PAGE HEADER ═══════════════════════════════════ */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/training-plans')}
          className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EC0000] flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-headline font-bold text-gray-900 dark:text-white leading-tight">
              {t('trainingPlan.createNew')}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('trainingPlan.createDescription')}</p>
          </div>
        </div>
      </div>

      {/* ═══ STEPPER ════════════════════════════════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        {/* Step labels */}
        <div className="flex items-start justify-between mb-3">
          {steps.map((step) => {
            const done = currentStep > step.number;
            const active = currentStep === step.number;
            return (
              <div key={step.number} className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                  done    ? 'bg-[#EC0000]' :
                  active  ? 'bg-[#EC0000]' :
                            'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}>
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-white" />
                    : <step.icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                  }
                </div>
                <span className={`text-[10px] font-medium text-center leading-tight hidden sm:block ${
                  active || done ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#EC0000] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
          {t('common.step', 'Passo')} {currentStep} / {TOTAL_STEPS}
        </p>
      </div>

      {/* ═══ FORM CARD ══════════════════════════════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">

        {/* ── STEP 1: Info ────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5 text-[#EC0000]" />
              <h2 className="font-headline text-lg font-semibold text-gray-900 dark:text-white">
                {t('trainingPlan.stepInfo')}
              </h2>
            </div>

            <div>
              <Label>{t('trainingPlan.titleField')} *</Label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className={inputCls('title')}
                placeholder={t('trainingPlan.titlePlaceholder')}
              />
              <FieldError field="title" />
            </div>

            <div>
              <Label>{t('trainingPlan.descriptionField')} *</Label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className={`${inputCls('description')} resize-none`}
                placeholder={t('trainingPlan.descriptionPlaceholder')}
              />
              <FieldError field="description" />
            </div>
          </div>
        )}

        {/* ── STEP 2: Scope & Dates ────────────────────── */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-[#EC0000]" />
              <h2 className="font-headline text-lg font-semibold text-gray-900 dark:text-white">
                {t('trainingPlan.stepScope')}
              </h2>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t('trainingPlan.startDate')}</Label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  className={inputCls('start_date')}
                />
              </div>
              <div>
                <Label>{t('trainingPlan.endDate')}</Label>
                {formData.is_permanent ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400">
                    <InfinityIcon className="w-4 h-4 flex-shrink-0" />
                    {t('trainingPlan.permanentEndDateAuto')}
                  </div>
                ) : (
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className={inputCls('end_date')}
                  />
                )}
                <FieldError field="end_date" />
              </div>
            </div>

            {/* Permanent toggle */}
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_permanent: !prev.is_permanent, end_date: '' }))}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                formData.is_permanent
                  ? 'border-[#EC0000] bg-[#EC0000]/5 dark:bg-[#EC0000]/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-[#EC0000]/30'
              }`}
            >
              {/* Toggle pill */}
              <div className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${
                formData.is_permanent ? 'bg-[#EC0000]' : 'bg-gray-200 dark:bg-gray-600'
              }`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  formData.is_permanent ? 'left-5' : 'left-0.5'
                }`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <InfinityIcon className={`w-4 h-4 flex-shrink-0 ${formData.is_permanent ? 'text-[#EC0000]' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${formData.is_permanent ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t('trainingPlan.permanentPlan')}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                  {t('trainingPlan.permanentPlanDescription')}
                </p>
              </div>
            </button>

            {/* Banks */}
            <div>
              <SectionHeading icon={Building2} label={t('trainingPlan.banks')} />
              {banks.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">{t('errors.noBanks', 'Nenhum banco disponível')}</p>
              ) : (
                <SelectionGrid
                  items={banks}
                  selected={formData.bank_ids}
                  onToggle={id => setFormData(prev => ({ ...prev, bank_ids: toggle(prev.bank_ids, id) }))}
                  renderItem={(b: Bank) => (
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.name}</p>
                      {b.country && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{b.country}</p>}
                    </div>
                  )}
                />
              )}
            </div>

            {/* Products */}
            <div>
              <SectionHeading icon={Package} label={t('trainingPlan.services')} />
              {products.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">{t('errors.noProducts', 'Nenhum serviço disponível')}</p>
              ) : (
                <SelectionGrid
                  items={products}
                  selected={formData.product_ids}
                  onToggle={id => setFormData(prev => ({ ...prev, product_ids: toggle(prev.product_ids, id) }))}
                  renderItem={(p: Product) => (
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getTranslatedProductName(t, p.code, p.name)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{p.code}</p>
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Team & Courses ───────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-[#EC0000]" />
              <h2 className="font-headline text-lg font-semibold text-gray-900 dark:text-white">
                {t('trainingPlan.stepTeam')}
              </h2>
            </div>

            {/* Trainers */}
            <div>
              <SectionHeading icon={GraduationCap} label={t('trainingPlan.trainers')} />
              {trainers.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">{t('trainingPlan.noTrainersAvailable')}</p>
              ) : (
                <SelectionGrid
                  items={trainers}
                  selected={formData.trainer_ids}
                  onToggle={id => setFormData(prev => ({ ...prev, trainer_ids: toggle(prev.trainer_ids, id) }))}
                  renderItem={(tr: Trainer) => (
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tr.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{tr.email}</p>
                    </div>
                  )}
                />
              )}
            </div>

            {/* Students */}
            <div>
              <SectionHeading icon={Users} label={t('trainingPlan.students')} />
              {students.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">{t('trainingPlan.noStudentsAvailable')}</p>
              ) : (
                <SelectionGrid
                  items={students}
                  selected={formData.student_ids}
                  onToggle={id => setFormData(prev => ({ ...prev, student_ids: toggle(prev.student_ids, id) }))}
                  renderItem={(s: Student) => (
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.email}</p>
                    </div>
                  )}
                />
              )}
            </div>

            {/* Courses */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-[#EC0000]" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('trainingPlan.selectCourses')} *</span>
              </div>
              {courses.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <BookOpen className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">{t('errors.noCourses', 'Nenhum curso disponível')}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {courses.map(course => {
                    const isSelected = formData.course_ids.includes(course.id);
                    return (
                      <label
                        key={course.id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#EC0000]/5 dark:bg-[#EC0000]/10 border-[#EC0000]/40'
                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700 hover:border-[#EC0000]/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            const ids = e.target.checked
                              ? [...formData.course_ids, course.id]
                              : formData.course_ids.filter(id => id !== course.id);
                            setFormData({ ...formData, course_ids: ids });
                          }}
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#EC0000] focus:ring-[#EC0000]/20 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{course.title}</p>
                          {course.description && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{course.description}</p>
                          )}
                          {(course.bank_name || course.product_name) && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {course.bank_name && (
                                <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[10px] font-medium">
                                  {course.bank_name}
                                </span>
                              )}
                              {course.product_name && (
                                <span className="px-1.5 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded text-[10px] font-medium">
                                  {getTranslatedProductName(t, course.product_code, course.product_name)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              <FieldError field="course_ids" />
              {formData.course_ids.length > 0 && (
                <p className="mt-2 text-xs text-[#EC0000] font-medium">
                  {formData.course_ids.length} {t('trainingPlan.coursesSelected')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: Review ──────────────────────────── */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-[#EC0000]" />
              <h2 className="font-headline text-lg font-semibold text-gray-900 dark:text-white">
                {t('trainingPlan.stepReview')}
              </h2>
            </div>

            {/* Title + description */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                {t('trainingPlan.basicInfo')}
              </p>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">{formData.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{formData.description}</p>
            </div>

            {/* Dates */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                {t('trainingPlan.stepScope')}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mb-0.5">{t('trainingPlan.startDate')}</p>
                  <p className="text-gray-900 dark:text-white font-medium">{formData.start_date || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mb-0.5">{t('trainingPlan.endDate')}</p>
                  <p className="text-gray-900 dark:text-white font-medium flex items-center gap-1">
                    {formData.is_permanent
                      ? <><InfinityIcon className="w-4 h-4" /> {t('trainingPlan.permanent')}</>
                      : (formData.end_date || '-')}
                  </p>
                </div>
              </div>
              {(formData.bank_ids.length > 0 || formData.product_ids.length > 0) && (
                <div className="space-y-2">
                  {formData.bank_ids.length > 0 && (
                    <div>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mb-1">{t('trainingPlan.banks')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.bank_ids.map(bid => {
                          const b = banks.find(x => x.id === bid);
                          return b ? (
                            <span key={bid} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
                              {b.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  {formData.product_ids.length > 0 && (
                    <div>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mb-1">{t('trainingPlan.services')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.product_ids.map(pid => {
                          const p = products.find(x => x.id === pid);
                          return p ? (
                            <span key={pid} className="px-2 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded text-xs font-medium">
                              {getTranslatedProductName(t, p.code, p.name)}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Team */}
            {(formData.trainer_ids.length > 0 || formData.student_ids.length > 0) && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                  {t('trainingPlan.stepTeam')}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mb-1">{t('trainingPlan.trainers')}</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formData.trainer_ids.length > 0
                        ? `${formData.trainer_ids.length} ${t('trainingPlan.trainers').toLowerCase()}`
                        : t('trainingPlan.noneSelected')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mb-1">{t('trainingPlan.students')}</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formData.student_ids.length > 0
                        ? `${formData.student_ids.length} ${t('trainingPlan.students').toLowerCase()}`
                        : t('trainingPlan.noneSelected')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Courses */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                {t('trainingPlan.courses')}
              </p>
              <p className="text-gray-900 dark:text-white font-medium">
                {formData.course_ids.length} {t('trainingPlan.coursesSelected')}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {formData.course_ids.slice(0, 6).map(cid => {
                  const c = courses.find(x => x.id === cid);
                  return c ? (
                    <span key={cid} className="px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-700 dark:text-gray-300">
                      {c.title}
                    </span>
                  ) : null;
                })}
                {formData.course_ids.length > 6 && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-500 dark:text-gray-400">
                    +{formData.course_ids.length - 6}
                  </span>
                )}
              </div>
            </div>

            {errors.submit && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.submit}
              </div>
            )}
            {errors.course_ids && <FieldError field="course_ids" />}
          </div>
        )}

        {/* ═══ NAVIGATION BUTTONS ═══════════════════════ */}
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </button>
          )}

          {currentStep < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white font-semibold text-sm rounded-xl transition-colors"
            >
              {t('common.next')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{t('common.saving')}</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" />{t('trainingPlan.createButton')}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
