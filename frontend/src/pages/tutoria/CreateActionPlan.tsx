import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2, X, ClipboardList, AlertTriangle, CheckCircle2,
  ChevronRight, ChevronLeft, Save, Calendar, FileText,
  Lightbulb, Wrench, Eye, TrendingUp, Shield, ChevronDown,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useTranslation } from 'react-i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorInfo {
  id: number;
  description: string;
  tutorado_id: number;
  tutorado_name?: string;
  category_name?: string;
  severity: string;
  origin_name?: string;
}

interface UserItem {
  id: number;
  full_name: string;
  role?: string;
  is_tutor?: boolean;
  is_chefe_equipe?: boolean;
  is_referente?: boolean;
  is_admin?: boolean;
  is_gerente?: boolean;
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500 dark:text-gray-400">
      {children}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:placeholder-gray-600 dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
    />
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:placeholder-gray-600 dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
    />
  );
}

function SelectField({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2.5 pr-9 rounded-xl border text-sm outline-none transition-all bg-white border-gray-200 text-gray-900 focus:border-[#EC0000] focus:ring-2 focus:ring-[#EC0000]/10 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:focus:border-[#EC0000] dark:[color-scheme:dark]"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
    </div>
  );
}

// ─── PlanSection ──────────────────────────────────────────────────────────────

const colorMap = {
  amber: {
    card: 'border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/5',
    toggleOn: 'bg-amber-500',
    iconBg: 'from-amber-500 to-orange-500',
    divider: 'border-amber-200/60 dark:border-amber-500/10',
  },
  blue: {
    card: 'border-blue-300 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/5',
    toggleOn: 'bg-blue-500',
    iconBg: 'from-blue-500 to-indigo-500',
    divider: 'border-blue-200/60 dark:border-blue-500/10',
  },
  green: {
    card: 'border-green-300 bg-green-50 dark:border-green-500/30 dark:bg-green-500/5',
    toggleOn: 'bg-green-500',
    iconBg: 'from-green-500 to-emerald-500',
    divider: 'border-green-200/60 dark:border-green-500/10',
  },
};

interface PlanSectionProps {
  title: string;
  subtitle?: string;
  enabled: boolean;
  onToggle: () => void;
  colorScheme: 'amber' | 'blue' | 'green';
  icon: React.ReactNode;
  children: React.ReactNode;
}

function PlanSection({ title, subtitle, enabled, onToggle, colorScheme, icon, children }: PlanSectionProps) {
  const c = colorMap[colorScheme];
  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
      enabled ? c.card : 'border-gray-200 bg-gray-50 dark:border-white/8 dark:bg-white/[0.02]'
    }`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
          {subtitle && <p className="text-xs mt-0.5 text-gray-400 dark:text-gray-500">{subtitle}</p>}
        </div>
        <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          enabled ? c.toggleOn : 'bg-gray-200 dark:bg-white/10'
        }`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </div>
      </button>
      {enabled && (
        <div className={`px-5 pb-5 border-t ${c.divider}`}>
          <div className="pt-4 space-y-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Review plan styles (static, no isDark) ────────────────────────────────

const reviewStyles = {
  amber: {
    wrap: 'bg-amber-50 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20',
    label: 'text-amber-700/70 dark:text-amber-400/70',
    text: 'text-amber-900/80 dark:text-amber-200/80',
  },
  blue: {
    wrap: 'bg-blue-50 border-blue-200 dark:bg-blue-500/5 dark:border-blue-500/20',
    label: 'text-blue-700/70 dark:text-blue-400/70',
    text: 'text-blue-900/80 dark:text-blue-200/80',
  },
  green: {
    wrap: 'bg-green-50 border-green-200 dark:bg-green-500/5 dark:border-green-500/20',
    label: 'text-green-700/70 dark:text-green-400/70',
    text: 'text-green-900/80 dark:text-green-200/80',
  },
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CreateActionPlan() {
  const { errorId } = useParams<{ errorId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const STEPS = [
    { label: t('createPlan.stepAnalysis'), icon: Lightbulb },
    { label: t('createPlan.stepActions'), icon: Wrench },
    { label: t('createPlan.stepReview'), icon: Eye },
  ];

  const [step, setStep] = useState(0);

  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [team, setTeam] = useState<UserItem[]>([]);
  const [tutoradoId, setTutorado] = useState('');

  // Step 0 — Análise de causa raiz
  const [analysis5Why, setAnalysis5Why] = useState('');

  // Step 1 — Resumo para Excel
  const [actionPlanSummary, setActionPlanSummary] = useState('');

  // Plano Corretivo
  const [correctivoEnabled, setCorrectivoEnabled] = useState(false);
  const [correctivoDesc, setCorrectivoDesc] = useState('');
  const [correctivoResult, setCorrectivoResult] = useState('');
  const [correctivoResponsible, setCorrectivoResponsible] = useState('');
  const [correctivoPrazo, setCorrectivoPrazo] = useState('');

  // Plano Preventivo
  const [preventivoEnabled, setPreventivoEnabled] = useState(false);
  const [preventivoDesc, setPreventivoDesc] = useState('');
  const [preventivoResult, setPreventivoResult] = useState('');
  const [preventivoResponsible, setPreventivoResponsible] = useState('');
  const [preventivoPrazo, setPreventivoPrazo] = useState('');

  // Plano Melhoria/Desenvolvimento (só Trade_Personas)
  const [melhoriaEnabled, setMelhoriaEnabled] = useState(false);
  const [melhoriaDesc, setMelhoriaDesc] = useState('');
  const [melhoriaResult, setMelhoriaResult] = useState('');
  const [melhoriaResponsible, setMelhoriaResponsible] = useState('');
  const [melhoriaPrazo, setMelhoriaPrazo] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!errorId) return;
    (async () => {
      try {
        const [eRes, tRes] = await Promise.all([
          axios.get(`/api/tutoria/errors/${errorId}`),
          axios.get('/api/tutoria/team'),
        ]);
        const e = eRes.data;
        setErrorInfo(e);
        setTutorado(String(e.tutorado_id));
        setAnalysis5Why(e.analysis_5_why ?? '');
        setTeam(Array.isArray(tRes.data) ? tRes.data : []);
      } catch {
        setError(t('createPlan.loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [errorId]);

  const isTradePessonas = errorInfo?.origin_name?.toLowerCase().includes('personas') || false;

  const teamForCorretivoPrev = team.filter(u =>
    u.is_tutor || u.is_chefe_equipe || u.is_referente ||
    u.is_admin || u.is_gerente
  );
  const teamForMelhoria = team.filter(u => u.is_tutor);

  const canNextStep0 = analysis5Why.trim().length > 0;
  const canNextStep1 = correctivoEnabled || preventivoEnabled || melhoriaEnabled;
  const hasAnyPlanActive = correctivoEnabled || preventivoEnabled || (melhoriaEnabled && isTradePessonas);

  const handleNext = () => {
    if (step === 0 && !canNextStep0) { setError(t('createPlan.validationAnalysis')); return; }
    if (step === 1 && !canNextStep1) { setError(t('createPlan.validationPlans')); return; }
    setError('');
    setStep(s => s + 1);
  };

  const handleSave = async () => {
    if (!errorId) return;
    const planos: object[] = [];

    if (correctivoEnabled && correctivoDesc.trim()) {
      planos.push({
        plan_type: 'CORRECTIVO',
        tutorado_id: Number(tutoradoId),
        corrective_action: correctivoDesc.trim(),
        expected_result: correctivoResult.trim() || null,
        responsible_id: correctivoResponsible ? Number(correctivoResponsible) : null,
        deadline: correctivoPrazo || null,
        action_plan_summary: actionPlanSummary.trim() || null,
        analysis_5_why: analysis5Why.trim() || null,
      });
    }

    if (preventivoEnabled && preventivoDesc.trim()) {
      planos.push({
        plan_type: 'PREVENTIVO',
        tutorado_id: Number(tutoradoId),
        preventive_action: preventivoDesc.trim(),
        expected_result: preventivoResult.trim() || null,
        responsible_id: preventivoResponsible ? Number(preventivoResponsible) : null,
        deadline: preventivoPrazo || null,
        action_plan_summary: actionPlanSummary.trim() || null,
        analysis_5_why: analysis5Why.trim() || null,
      });
    }

    if (melhoriaEnabled && melhoriaDesc.trim()) {
      planos.push({
        plan_type: 'MELHORIA',
        tutorado_id: Number(tutoradoId),
        immediate_correction: melhoriaDesc.trim(),
        expected_result: melhoriaResult.trim() || null,
        responsible_id: melhoriaResponsible ? Number(melhoriaResponsible) : null,
        deadline: melhoriaPrazo || null,
        action_plan_summary: actionPlanSummary.trim() || null,
        analysis_5_why: analysis5Why.trim() || null,
      });
    }

    if (planos.length === 0) { setError(t('createPlan.validationPlansEmpty')); return; }

    setSaving(true);
    setError('');
    try {
      for (const plano of planos) {
        await axios.post(`/api/tutoria/errors/${errorId}/plans`, plano);
      }
      setSaved(true);
      setTimeout(() => navigate(`/tutoria/errors/${errorId}`), 1200);
    } catch (e: any) {
      setError(e?.response?.data?.detail || t('createPlan.saveError'));
    } finally {
      setSaving(false);
    }
  };

  // ── Success ───────────────────────────────────────────────────────────────
  if (saved) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center animate-in zoom-in-95 fade-in duration-200">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">{t('createPlan.successTitle')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('createPlan.redirecting')}</p>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 dark:text-blue-400" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-3xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b pb-8 border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400">{t('createPlan.portalLabel')}</span>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">{t('createPlan.pageTitle')}</h1>
            {errorInfo && (
              <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
                {`${t('createPlan.errorLabel')} #${errorInfo.id} · ${errorInfo.tutorado_name}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Error context ──────────────────────────────────────────────────── */}
      {errorInfo && (
        <div className="rounded-2xl border p-4 flex items-start gap-3 bg-red-50 border-red-200 dark:bg-red-500/5 dark:border-red-500/10">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-1 text-red-600/70 dark:text-red-400/70">{t('createPlan.errorUnderAnalysis')}</p>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">{errorInfo.description}</p>
            {errorInfo.category_name && (
              <p className="text-xs mt-0.5 text-red-600/60 dark:text-red-400/50">
                {errorInfo.category_name} · {errorInfo.severity}
                {errorInfo.origin_name && ` · ${errorInfo.origin_name}`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Step indicators ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                i === step
                  ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-300'
                  : i < step
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                    : 'bg-gray-50 border-gray-200 text-gray-300 dark:bg-white/[0.02] dark:border-white/5 dark:text-gray-700'
              }`}>
                {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                {s.label}
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200 dark:bg-white/10" />}
            </div>
          );
        })}
      </div>

      {/* ── Step 0: Análise 5 Porquês ──────────────────────────────────────── */}
      {step === 0 && (
        <div className="rounded-2xl border overflow-hidden bg-white border-gray-200 shadow-sm dark:bg-white/[0.03] dark:border-white/8 dark:shadow-none">
          <div className="px-6 py-4 border-b flex items-center gap-3 border-gray-100 bg-gray-50 dark:border-white/8 dark:bg-white/[0.02]">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t('createPlan.rootCauseTitle')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('createPlan.rootCauseSubtitle')}</p>
            </div>
          </div>
          <div className="p-6">
            <Label required>{t('createPlan.analysis5Why')}</Label>
            <Textarea
              value={analysis5Why}
              onChange={setAnalysis5Why}
              placeholder={t('createPlan.analysis5WhyPlaceholder')}
              rows={9}
            />
            <p className="text-xs mt-2 text-gray-400 dark:text-gray-600">{t('createPlan.analysisHint')}</p>
          </div>
        </div>
      )}

      {/* ── Step 1: Planos de Ação ──────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Campo de resumo para Excel */}
          <div className="rounded-2xl border overflow-hidden bg-white border-gray-200 shadow-sm dark:bg-white/[0.03] dark:border-white/8 dark:shadow-none">
            <div className="px-6 py-4 border-b flex items-center gap-3 border-gray-100 bg-gray-50 dark:border-white/8 dark:bg-white/[0.02]">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{t('createPlan.planActionsTitle')}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('createPlan.planActionsSubtitle')}</p>
              </div>
            </div>
            <div className="p-6">
              <Label>{t('createPlan.actionPlanSummaryLabel')}</Label>
              <Textarea
                value={actionPlanSummary}
                onChange={setActionPlanSummary}
                placeholder={t('createPlan.actionPlanSummaryHint')}
                rows={3}
              />
              <p className="text-xs mt-2 text-gray-400 dark:text-gray-600">{t('createPlan.actionPlanSummaryNote')}</p>
            </div>
          </div>

          {/* Plano Corretivo */}
          <PlanSection
            title={t('createPlan.correctivoPlanTitle')}
            subtitle={t('createPlan.correctivoPlanSubtitle')}
            enabled={correctivoEnabled}
            onToggle={() => setCorrectivoEnabled(v => !v)}
            colorScheme="amber"
            icon={<Wrench className="w-4 h-4 text-white" />}
          >
            <div>
              <Label required>{t('createPlan.planDesc')}</Label>
              <Textarea value={correctivoDesc} onChange={setCorrectivoDesc}
                placeholder={t('createPlan.correctivoDescHint')} rows={3} />
            </div>
            <div>
              <Label>{t('createPlan.planExpectedResult')}</Label>
              <Textarea value={correctivoResult} onChange={setCorrectivoResult}
                placeholder={t('createPlan.expectedResultHint')} rows={2} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t('createPlan.planResponsible')}</Label>
                <SelectField value={correctivoResponsible} onChange={setCorrectivoResponsible}>
                  <option value="">{t('createPlan.selectPlanResponsible')}</option>
                  {teamForCorretivoPrev.map(u => (
                    <option key={u.id} value={String(u.id)}>{u.full_name}</option>
                  ))}
                </SelectField>
              </div>
              <div>
                <Label>{t('createPlan.deadline')}</Label>
                <div className="relative">
                  <Input type="date" value={correctivoPrazo} onChange={setCorrectivoPrazo} />
                  <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                </div>
              </div>
            </div>
          </PlanSection>

          {/* Plano Preventivo */}
          <PlanSection
            title={t('createPlan.preventivoPlanTitle')}
            subtitle={t('createPlan.preventivoPlanSubtitle')}
            enabled={preventivoEnabled}
            onToggle={() => setPreventivoEnabled(v => !v)}
            colorScheme="blue"
            icon={<Shield className="w-4 h-4 text-white" />}
          >
            <div>
              <Label required>{t('createPlan.planDesc')}</Label>
              <Textarea value={preventivoDesc} onChange={setPreventivoDesc}
                placeholder={t('createPlan.preventivoDescHint')} rows={3} />
            </div>
            <div>
              <Label>{t('createPlan.planExpectedResult')}</Label>
              <Textarea value={preventivoResult} onChange={setPreventivoResult}
                placeholder={t('createPlan.expectedResultHint')} rows={2} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t('createPlan.planResponsible')}</Label>
                <SelectField value={preventivoResponsible} onChange={setPreventivoResponsible}>
                  <option value="">{t('createPlan.selectPlanResponsible')}</option>
                  {teamForCorretivoPrev.map(u => (
                    <option key={u.id} value={String(u.id)}>{u.full_name}</option>
                  ))}
                </SelectField>
              </div>
              <div>
                <Label>{t('createPlan.deadline')}</Label>
                <div className="relative">
                  <Input type="date" value={preventivoPrazo} onChange={setPreventivoPrazo} />
                  <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                </div>
              </div>
            </div>
          </PlanSection>

          {/* Plano Melhoria/Desenvolvimento — só visível se Trade_Personas */}
          {isTradePessonas && (
            <PlanSection
              title={t('createPlan.melhoriaPlanTitle')}
              subtitle={t('createPlan.melhoriaPlanSubtitle')}
              enabled={melhoriaEnabled}
              onToggle={() => setMelhoriaEnabled(v => !v)}
              colorScheme="green"
              icon={<TrendingUp className="w-4 h-4 text-white" />}
            >
              <div>
                <Label required>{t('createPlan.planDesc')}</Label>
                <Textarea value={melhoriaDesc} onChange={setMelhoriaDesc}
                  placeholder={t('createPlan.melhoriaDescHint')} rows={3} />
              </div>
              <div>
                <Label>{t('createPlan.planExpectedResult')}</Label>
                <Textarea value={melhoriaResult} onChange={setMelhoriaResult}
                  placeholder={t('createPlan.expectedResultHint')} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t('createPlan.planResponsibleTutor')}</Label>
                  <SelectField value={melhoriaResponsible} onChange={setMelhoriaResponsible}>
                    <option value="">{t('createPlan.selectPlanResponsible')}</option>
                    {teamForMelhoria.map(u => (
                      <option key={u.id} value={String(u.id)}>{u.full_name}</option>
                    ))}
                  </SelectField>
                  <p className="text-xs mt-1 text-green-700/60 dark:text-green-400/60">{t('createPlan.melhoriaTutorNote')}</p>
                </div>
                <div>
                  <Label>{t('createPlan.deadline')}</Label>
                  <div className="relative">
                    <Input type="date" value={melhoriaPrazo} onChange={setMelhoriaPrazo} />
                    <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                  </div>
                </div>
              </div>
            </PlanSection>
          )}

          {!correctivoEnabled && !preventivoEnabled && (!isTradePessonas || !melhoriaEnabled) && (
            <p className="text-xs text-center py-2 text-gray-400 dark:text-gray-600">
              {t('createPlan.activateAtLeastOne')}
            </p>
          )}
        </div>
      )}

      {/* ── Step 2: Revisão e Submissão ────────────────────────────────────── */}
      {step === 2 && (
        <div className="rounded-2xl border overflow-hidden bg-white border-gray-200 shadow-sm dark:bg-white/[0.03] dark:border-white/8 dark:shadow-none">
          <div className="px-6 py-4 border-b flex items-center gap-3 border-gray-100 bg-gray-50 dark:border-white/8 dark:bg-white/[0.02]">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t('createPlan.reviewTitle')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('createPlan.reviewSubtitle')}</p>
            </div>
          </div>
          <div className="p-6 space-y-5">

            {/* Resumo análise */}
            <div className="rounded-xl p-4 bg-yellow-50 border border-yellow-200 dark:bg-yellow-500/5 dark:border-yellow-500/15">
              <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-yellow-700/70 dark:text-yellow-400/70">
                <Lightbulb className="w-3.5 h-3.5" />
                {t('createPlan.rootCauseTitle')}
              </p>
              <p className="text-sm whitespace-pre-wrap text-yellow-900/80 dark:text-yellow-200/80">{analysis5Why || '—'}</p>
            </div>

            {/* Resumo Excel */}
            {actionPlanSummary && (
              <div className="rounded-xl p-4 bg-violet-50 border border-violet-200 dark:bg-violet-500/5 dark:border-violet-500/15">
                <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-violet-700/70 dark:text-violet-400/70">
                  <FileText className="w-3.5 h-3.5" />
                  {t('createPlan.actionPlanSummaryLabel')}
                </p>
                <p className="text-sm text-violet-900/80 dark:text-violet-200/80">{actionPlanSummary}</p>
              </div>
            )}

            {/* Planos activados */}
            {[
              {
                enabled: correctivoEnabled,
                label: t('createPlan.correctivoPlanTitle'),
                desc: correctivoDesc,
                result: correctivoResult,
                responsible: correctivoResponsible,
                prazo: correctivoPrazo,
                color: 'amber' as const,
              },
              {
                enabled: preventivoEnabled,
                label: t('createPlan.preventivoPlanTitle'),
                desc: preventivoDesc,
                result: preventivoResult,
                responsible: preventivoResponsible,
                prazo: preventivoPrazo,
                color: 'blue' as const,
              },
              {
                enabled: melhoriaEnabled && isTradePessonas,
                label: t('createPlan.melhoriaPlanTitle'),
                desc: melhoriaDesc,
                result: melhoriaResult,
                responsible: melhoriaResponsible,
                prazo: melhoriaPrazo,
                color: 'green' as const,
              },
            ]
              .filter(p => p.enabled)
              .map((p, i) => {
                const responsibleUser = team.find(u => String(u.id) === p.responsible);
                const s = reviewStyles[p.color];
                return (
                  <div key={i} className={`rounded-xl p-4 border ${s.wrap}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${s.label}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {p.label}
                    </p>
                    <div className="space-y-1.5">
                      <p className={`text-sm ${s.text}`}><span className="font-semibold">{t('createPlan.planDesc')}:</span> {p.desc || '—'}</p>
                      {p.result && <p className={`text-sm ${s.text}`}><span className="font-semibold">{t('createPlan.planExpectedResult')}:</span> {p.result}</p>}
                      {responsibleUser && <p className={`text-sm ${s.text}`}><span className="font-semibold">{t('createPlan.planResponsible')}:</span> {responsibleUser.full_name}</p>}
                      {p.prazo && <p className={`text-sm ${s.text}`}><span className="font-semibold">{t('createPlan.deadline')}:</span> {p.prazo}</p>}
                    </div>
                  </div>
                );
              })}

            {!hasAnyPlanActive && (
              <div className="rounded-xl p-4 border bg-red-50 border-red-200 dark:bg-red-500/5 dark:border-red-500/20">
                <p className="text-sm flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {t('createPlan.noPlansWarning')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Error message ────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm bg-red-50 border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* ── Navigation bar ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border p-5 flex items-center justify-between bg-white border-gray-200 shadow-sm dark:bg-white/[0.03] dark:border-white/8 dark:shadow-none">
        <button
          onClick={() => step === 0 ? navigate(`/tutoria/errors/${errorId}`) : setStep(s => s - 1)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:text-white"
        >
          {step === 0 ? <><X className="w-4 h-4" /> {t('common.cancel')}</> : <><ChevronLeft className="w-4 h-4" /> {t('createPlan.previous')}</>}
        </button>

        <div className="flex items-center gap-2">
          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:from-blue-400 hover:to-indigo-400 transition-all"
            >
              {t('createPlan.next')} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || !hasAnyPlanActive}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white text-sm font-bold shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('createPlan.saving')}</>
                : <><Save className="w-4 h-4" /> {t('createPlan.createPlan')}</>}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
