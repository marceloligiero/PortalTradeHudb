import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, X, ClipboardList, AlertTriangle, CheckCircle2,
  ChevronRight, ChevronLeft, Save, User, Calendar, FileText,
  Lightbulb, Target, Wrench, Shield,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorInfo {
  id: number;
  description: string;
  tutorado_id: number;
  tutorado_name?: string;
  category_name?: string;
  severity: string;
}

interface UserItem { id: number; full_name: string }

// ─── Field helpers ────────────────────────────────────────────────────────────

function Label({ children, isDark, required }: { children: React.ReactNode; isDark: boolean; required?: boolean }) {
  return (
    <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      {children}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}

function Textarea({ value, onChange, placeholder, rows = 4, isDark }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; isDark: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all ${
        isDark
          ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10'
      }`}
    />
  );
}

function Input({ value, onChange, placeholder, type = 'text', isDark }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; isDark: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
        isDark
          ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10'
      }`}
    />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CreateActionPlan() {
  const { errorId } = useParams<{ errorId: string }>();
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const STEPS = [
    { label: t('createPlan.stepAnalysis'), icon: Lightbulb },
    { label: t('createPlan.stepActions'), icon: Wrench },
    { label: t('createPlan.step5W2H'), icon: Target },
  ];

  const [step, setStep] = useState(0);

  // Error info
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [students, setStudents] = useState<UserItem[]>([]);
  const [team, setTeam] = useState<UserItem[]>([]);

  // Step 0 — Análise de causa raiz
  const [analysis5Why, setAnalysis5Why] = useState('');

  // Step 1 — Ações
  const [immediateCorrection, setImmediate] = useState('');
  const [correctiveAction, setCorrective]   = useState('');
  const [preventiveAction, setPreventive]   = useState('');

  // Plan metadata
  const [planType, setPlanType]         = useState('CORRECTIVO');
  const [responsibleId, setResponsibleId] = useState('');
  const [deadline, setDeadline]         = useState('');

  // Side by Side (Seguimento)
  const [sideByS, setSideByS]     = useState(false);
  const [obsDate, setObsDate]     = useState('');
  const [obsNotes, setObsNotes]   = useState('');

  // Step 2 — 5W2H
  const [what, setWhat]           = useState('');
  const [why, setWhy]             = useState('');
  const [whereField, setWhere]    = useState('');
  const [whenDeadline, setWhen]   = useState('');
  const [who, setWho]             = useState('');
  const [how, setHow]             = useState('');
  const [howMuch, setHowMuch]     = useState('');
  const [tutoradoId, setTutorado] = useState('');

  // UI
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!errorId) return;
    (async () => {
      try {
        const [eRes, sRes, tRes] = await Promise.all([
          axios.get(`/api/tutoria/errors/${errorId}`),
          axios.get('/api/tutoria/students'),
          axios.get('/api/tutoria/team'),
        ]);
        const e = eRes.data;
        setErrorInfo(e);
        // Pre-fill tutorado from error
        setTutorado(String(e.tutorado_id));
        // Pre-fill who from tutorado name
        setWho(e.tutorado_name ?? '');
        // Pre-populate 5W2H from error context
        setAnalysis5Why(e.analysis_5_why ?? '');
        setStudents(Array.isArray(sRes.data) ? sRes.data : []);
        setTeam(Array.isArray(tRes.data) ? tRes.data : []);
      } catch {
        setError(t('createPlan.loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [errorId]);

  const canNextStep0 = analysis5Why.trim().length > 0;
  const canNextStep1 = planType === 'SEGUIMENTO' || !!(immediateCorrection.trim() || correctiveAction.trim() || preventiveAction.trim());
  const canSave = what.trim() && tutoradoId;

  const handleNext = () => {
    if (step === 0 && !canNextStep0) {
      setError(t('createPlan.validationAnalysis'));
      return;
    }
    if (step === 1 && !canNextStep1) {
      setError(t('createPlan.validationActions'));
      return;
    }
    setError('');
    setStep(s => s + 1);
  };

  const handleSave = async () => {
    if (!canSave) {
      setError(t('createPlan.validationWhat'));
      return;
    }
    if (!errorId) return;
    setSaving(true);
    setError('');
    try {
      await axios.post(`/api/tutoria/errors/${errorId}/plans`, {
        tutorado_id: Number(tutoradoId),
        plan_type: planType || null,
        responsible_id: responsibleId ? Number(responsibleId) : null,
        deadline: deadline || null,
        analysis_5_why: analysis5Why.trim() || null,
        immediate_correction: immediateCorrection.trim() || null,
        corrective_action: correctiveAction.trim() || null,
        preventive_action: preventiveAction.trim() || null,
        what: what.trim() || null,
        why: why.trim() || null,
        where_field: whereField.trim() || null,
        when_deadline: whenDeadline || null,
        who: who.trim() || null,
        how: how.trim() || null,
        how_much: howMuch.trim() || null,
        side_by_side: planType === 'SEGUIMENTO' ? sideByS : undefined,
        observation_date: planType === 'SEGUIMENTO' && obsDate ? obsDate : undefined,
        observation_notes: planType === 'SEGUIMENTO' && obsNotes.trim() ? obsNotes.trim() : undefined,
      });
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
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('createPlan.successTitle')}</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('createPlan.redirecting')}</p>
        </motion.div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
    </div>
  );

  return (
    <div className="space-y-8 max-w-3xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className={`border-b pb-8 ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <div>
            <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>{t('createPlan.portalLabel')}</span>
            <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('createPlan.pageTitle')}</h1>
            {errorInfo && (
              <p className={`mt-1 text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                {`${t('createPlan.errorLabel')} #${errorInfo.id} · ${errorInfo.tutorado_name}`}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Error context ────────────────────────────────────────────────────── */}
      {errorInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
          className={`rounded-2xl border p-4 flex items-start gap-3 ${isDark ? 'bg-red-500/5 border-red-500/10' : 'bg-red-50 border-red-200'}`}
        >
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-red-400/70' : 'text-red-600/70'}`}>{t('createPlan.errorUnderAnalysis')}</p>
            <p className={`text-sm font-semibold ${isDark ? 'text-red-300' : 'text-red-800'}`}>{errorInfo.description}</p>
            {errorInfo.category_name && <p className={`text-xs mt-0.5 ${isDark ? 'text-red-400/50' : 'text-red-600/60'}`}>{errorInfo.category_name} · {errorInfo.severity}</p>}
          </div>
        </motion.div>
      )}

      {/* ── Step indicators ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-2"
      >
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                i === step
                  ? isDark ? 'bg-blue-500/15 border-blue-500/30 text-blue-300' : 'bg-blue-100 border-blue-300 text-blue-700'
                  : i < step
                    ? isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : isDark ? 'bg-white/[0.02] border-white/5 text-gray-700' : 'bg-gray-50 border-gray-200 text-gray-300'
              }`}>
                {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                {s.label}
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />}
            </div>
          );
        })}
      </motion.div>

      {/* ── Step content ─────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
          >
            <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center"><Lightbulb className="w-4 h-4 text-white" /></div>
              <div>
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('createPlan.rootCauseTitle')}</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('createPlan.rootCauseSubtitle')}</p>
              </div>
            </div>
            <div className="p-6">
              <Label isDark={isDark} required>{t('createPlan.analysis5Why')}</Label>
              <Textarea
                value={analysis5Why}
                onChange={setAnalysis5Why}
                placeholder={t('createPlan.analysis5WhyPlaceholder')}
                rows={9}
                isDark={isDark}
              />
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                {t('createPlan.analysisHint')}
              </p>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
          >
            <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center"><Wrench className="w-4 h-4 text-white" /></div>
              <div>
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('createPlan.planActionsTitle')}</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('createPlan.planActionsSubtitle')}</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className={`rounded-xl border p-4 space-y-3 ${isDark ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-yellow-200 bg-yellow-50'}`}>
                <Label isDark={isDark}>{t('createPlan.immediateCorrection')}</Label>
                <Textarea value={immediateCorrection} onChange={setImmediate}
                  placeholder={t('createPlan.immediateHint')}
                  rows={3} isDark={isDark} />
                <p className={`text-xs ${isDark ? 'text-yellow-400/60' : 'text-yellow-700/60'}`}>{t('createPlan.immediateNote')}</p>
              </div>
              <div className={`rounded-xl border p-4 space-y-3 ${isDark ? 'border-blue-500/20 bg-blue-500/5' : 'border-blue-200 bg-blue-50'}`}>
                <Label isDark={isDark}>{t('createPlan.correctiveAction')}</Label>
                <Textarea value={correctiveAction} onChange={setCorrective}
                  placeholder={t('createPlan.correctiveHint')}
                  rows={3} isDark={isDark} />
                <p className={`text-xs ${isDark ? 'text-blue-400/60' : 'text-blue-700/60'}`}>{t('createPlan.correctiveNote')}</p>
              </div>
              <div className={`rounded-xl border p-4 space-y-3 ${isDark ? 'border-green-500/20 bg-green-500/5' : 'border-green-200 bg-green-50'}`}>
                <Label isDark={isDark}>{t('createPlan.preventiveAction')}</Label>
                <Textarea value={preventiveAction} onChange={setPreventive}
                  placeholder={t('createPlan.preventiveHint')}
                  rows={3} isDark={isDark} />
                <p className={`text-xs ${isDark ? 'text-green-400/60' : 'text-green-700/60'}`}>{t('createPlan.preventiveNote')}</p>
              </div>

              {/* ── Plan metadata: type, responsible, deadline ──────── */}
              <div className={`rounded-xl border p-4 space-y-4 ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Shield className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                  {t('createPlan.planMetadata')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Plan Type */}
                  <div>
                    <Label isDark={isDark}>{t('createPlan.planType')}</Label>
                    <div className="relative">
                      <select
                        value={planType}
                        onChange={e => setPlanType(e.target.value)}
                        className={`w-full appearance-none px-3 py-2.5 pr-9 rounded-xl border text-sm outline-none transition-all ${
                          isDark
                            ? 'bg-white/[0.04] border-white/10 text-white focus:border-[#EC0000] focus:ring-2 focus:ring-[#EC0000]/10'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-[#EC0000] focus:ring-2 focus:ring-[#EC0000]/10'
                        }`}
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : undefined }}
                      >
                        <option value="CORRECTIVO" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('createPlan.planTypeCorrectivo')}</option>
                        <option value="PREVENTIVO" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('createPlan.planTypePreventivo')}</option>
                        <option value="MELHORIA" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('createPlan.planTypeMelhoria')}</option>
                        <option value="SEGUIMENTO" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('createPlan.planTypeSeguimento')}</option>
                      </select>
                      <FileText className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                    </div>
                  </div>

                  {/* Responsible */}
                  <div>
                    <Label isDark={isDark}>{t('createPlan.responsible')}</Label>
                    <div className="relative">
                      <select
                        value={responsibleId}
                        onChange={e => setResponsibleId(e.target.value)}
                        className={`w-full appearance-none px-3 py-2.5 pr-9 rounded-xl border text-sm outline-none transition-all ${
                          isDark
                            ? 'bg-white/[0.04] border-white/10 text-white focus:border-[#EC0000] focus:ring-2 focus:ring-[#EC0000]/10'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-[#EC0000] focus:ring-2 focus:ring-[#EC0000]/10'
                        }`}
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : undefined }}
                      >
                        <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('createPlan.selectPlanResponsible')}</option>
                        {team.map(u => (
                          <option key={u.id} value={String(u.id)} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{u.full_name}</option>
                        ))}
                      </select>
                      <User className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                    </div>
                  </div>

                  {/* Deadline */}
                  <div>
                    <Label isDark={isDark}>{t('createPlan.deadline')}</Label>
                    <div className="relative">
                      <Input type="date" value={deadline} onChange={setDeadline} isDark={isDark} />
                      <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Side by Side (Seguimento) */}
                {planType === 'SEGUIMENTO' && (
                  <div className={`border-t pt-4 space-y-3 ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sideByS}
                        onChange={e => setSideByS(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#EC0000]"
                      />
                      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {t('createPlan.sideByS')}
                      </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label isDark={isDark}>{t('createPlan.observationDate')}</Label>
                        <Input type="date" value={obsDate} onChange={setObsDate} isDark={isDark} />
                      </div>
                      <div>
                        <Label isDark={isDark}>{t('createPlan.observationNotes')}</Label>
                        <Textarea value={obsNotes} onChange={setObsNotes} placeholder={t('createPlan.observationNotesHint')} rows={3} isDark={isDark} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
          >
            <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"><Target className="w-4 h-4 text-white" /></div>
              <div>
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('createPlan.methodology5W2H')}</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('createPlan.methodology5W2HSubtitle')}</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label isDark={isDark} required>{t('createPlan.what')}</Label>
                <Input value={what} onChange={setWhat} placeholder={t('createPlan.whatHint')} isDark={isDark} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label isDark={isDark}>{t('createPlan.why')}</Label>
                  <Textarea value={why} onChange={setWhy} placeholder={t('createPlan.whyHint')} rows={3} isDark={isDark} />
                </div>
                <div>
                  <Label isDark={isDark}>{t('createPlan.where')}</Label>
                  <Textarea value={whereField} onChange={setWhere} placeholder={t('createPlan.whereHint')} rows={3} isDark={isDark} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label isDark={isDark}>{t('createPlan.tutorado')}</Label>
                  <div className="relative">
                    <select
                      value={tutoradoId}
                      onChange={e => { setTutorado(e.target.value); const u = students.find(u => String(u.id) === e.target.value); if (u) setWho(u.full_name); }}
                      className={`w-full appearance-none px-3 py-2.5 pr-9 rounded-xl border text-sm outline-none ${isDark ? 'bg-white/[0.04] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : undefined }}
                    >
                      <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('createPlan.selectTutorado')}</option>
                      {students.map(u => <option key={u.id} value={String(u.id)} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{u.full_name}</option>)}
                    </select>
                    <User className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                  </div>
                </div>
                <div>
                  <Label isDark={isDark}>{t('createPlan.who')}</Label>
                  <div className="relative">
                    <select
                      value={who}
                      onChange={e => setWho(e.target.value)}
                      className={`w-full appearance-none px-3 py-2.5 pr-9 rounded-xl border text-sm outline-none ${isDark ? 'bg-white/[0.04] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : undefined }}
                    >
                      <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('createPlan.selectResponsible')}</option>
                      {team.map(u => <option key={u.id} value={u.full_name} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{u.full_name}</option>)}
                    </select>
                    <User className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                  </div>
                </div>
              </div>
              <div>
                <Label isDark={isDark}>{t('createPlan.when')}</Label>
                <div className="relative">
                  <Input type="date" value={whenDeadline} onChange={setWhen} isDark={isDark} />
                  <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                </div>
              </div>
              <div>
                <Label isDark={isDark}>{t('createPlan.how')}</Label>
                <Textarea value={how} onChange={setHow} placeholder={t('createPlan.howHint')} rows={4} isDark={isDark} />
              </div>
              <div>
                <Label isDark={isDark}>{t('createPlan.howMuch')}</Label>
                <Input value={howMuch} onChange={setHowMuch} placeholder={t('createPlan.howMuchHint')} isDark={isDark} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error message ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation bar ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
        className={`rounded-2xl border p-5 flex items-center justify-between ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <button
          onClick={() => step === 0 ? navigate(`/tutoria/errors/${errorId}`) : setStep(s => s - 1)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            isDark
              ? 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {step === 0 ? <><X className="w-4 h-4" /> {t('common.cancel')}</> : <><ChevronLeft className="w-4 h-4" /> {t('createPlan.previous')}</>}
        </button>

        <div className="flex items-center gap-2">
          {step < STEPS.length - 1 ? (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25"
            >
              {t('createPlan.next')} <ChevronRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 12px 30px rgba(59,130,246,.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving || !canSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white text-sm font-bold shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('createPlan.saving')}</> : <><Save className="w-4 h-4" /> {t('createPlan.createPlan')}</>}
            </motion.button>
          )}
        </div>
      </motion.div>

    </div>
  );
}
