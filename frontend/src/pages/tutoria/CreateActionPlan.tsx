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

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Análise', icon: Lightbulb },
  { label: 'Ações',   icon: Wrench },
  { label: '5W2H',   icon: Target },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CreateActionPlan() {
  const { errorId } = useParams<{ errorId: string }>();
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();

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
        setError('Não foi possível carregar o erro.');
      } finally {
        setLoading(false);
      }
    })();
  }, [errorId]);

  const canNextStep0 = analysis5Why.trim().length > 0;
  const canNextStep1 = immediateCorrection.trim() || correctiveAction.trim() || preventiveAction.trim();
  const canSave = what.trim() && tutoradoId;

  const handleNext = () => {
    if (step === 0 && !canNextStep0) {
      setError('Preencha a análise de causa raiz (5 Porquês).');
      return;
    }
    if (step === 1 && !canNextStep1) {
      setError('Preencha pelo menos uma das ações (imediata, corretiva ou preventiva).');
      return;
    }
    setError('');
    setStep(s => s + 1);
  };

  const handleSave = async () => {
    if (!canSave) {
      setError('Preencha o campo "O quê" e o tutorado.');
      return;
    }
    if (!errorId) return;
    setSaving(true);
    setError('');
    try {
      await axios.post(`/api/tutoria/errors/${errorId}/plans`, {
        tutorado_id: Number(tutoradoId),
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
      });
      setSaved(true);
      setTimeout(() => navigate(`/tutoria/errors/${errorId}`), 1200);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Erro ao guardar. Tente novamente.');
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
          <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Plano criado!</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>A redirecionar…</p>
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
            <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>Tutoria</span>
            <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Plano de Ação</h1>
            {errorInfo && (
              <p className={`mt-1 text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                Erro #{errorInfo.id} · {errorInfo.tutorado_name}
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
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-red-400/70' : 'text-red-600/70'}`}>Erro em análise</p>
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
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Análise de Causa Raiz</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Técnica dos 5 Porquês — pergunte "porquê" repetidamente até encontrar a causa raiz</p>
              </div>
            </div>
            <div className="p-6">
              <Label isDark={isDark} required>Análise dos 5 Porquês</Label>
              <Textarea
                value={analysis5Why}
                onChange={setAnalysis5Why}
                placeholder={`Por que ocorreu o erro?\nPor que esse motivo aconteceu?\nPor que esse segundo motivo aconteceu?\nPor que esse terceiro motivo aconteceu?\nPor que esse quarto motivo aconteceu?\n\n→ Causa raiz: [resposta ao 5º porquê]`}
                rows={9}
                isDark={isDark}
              />
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                Registe a cadeia de causas até chegar à causa raiz real
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
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Ações do Plano</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Defina as três dimensões de resposta ao erro</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className={`rounded-xl border p-4 space-y-3 ${isDark ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-yellow-200 bg-yellow-50'}`}>
                <Label isDark={isDark}>Correção Imediata</Label>
                <Textarea value={immediateCorrection} onChange={setImmediate}
                  placeholder="O que foi feito imediatamente para conter o impacto do erro?"
                  rows={3} isDark={isDark} />
                <p className={`text-xs ${isDark ? 'text-yellow-400/60' : 'text-yellow-700/60'}`}>Ação de contenção — resolve o sintoma imediato</p>
              </div>
              <div className={`rounded-xl border p-4 space-y-3 ${isDark ? 'border-blue-500/20 bg-blue-500/5' : 'border-blue-200 bg-blue-50'}`}>
                <Label isDark={isDark}>Ação Corretiva</Label>
                <Textarea value={correctiveAction} onChange={setCorrective}
                  placeholder="O que será feito para corrigir a causa raiz do erro?"
                  rows={3} isDark={isDark} />
                <p className={`text-xs ${isDark ? 'text-blue-400/60' : 'text-blue-700/60'}`}>Resolve a causa raiz identificada nos 5 Porquês</p>
              </div>
              <div className={`rounded-xl border p-4 space-y-3 ${isDark ? 'border-green-500/20 bg-green-500/5' : 'border-green-200 bg-green-50'}`}>
                <Label isDark={isDark}>Ação Preventiva</Label>
                <Textarea value={preventiveAction} onChange={setPreventive}
                  placeholder="O que será feito para prevenir que este erro se repita no futuro?"
                  rows={3} isDark={isDark} />
                <p className={`text-xs ${isDark ? 'text-green-400/60' : 'text-green-700/60'}`}>Evita recorrência — cria salvaguardas sistémicas</p>
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
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Metodologia 5W2H</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Estrutura completa do plano de ação</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label isDark={isDark} required>O quê? (What)</Label>
                <Input value={what} onChange={setWhat} placeholder="Qual ação específica será realizada?" isDark={isDark} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label isDark={isDark}>Por quê? (Why)</Label>
                  <Textarea value={why} onChange={setWhy} placeholder="Por que esta ação é necessária?" rows={3} isDark={isDark} />
                </div>
                <div>
                  <Label isDark={isDark}>Onde? (Where)</Label>
                  <Textarea value={whereField} onChange={setWhere} placeholder="Área/processo onde a ação ocorrerá" rows={3} isDark={isDark} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label isDark={isDark}>Tutorado (quem recebe a tutoria)</Label>
                  <div className="relative">
                    <select
                      value={tutoradoId}
                      onChange={e => { setTutorado(e.target.value); const u = students.find(u => String(u.id) === e.target.value); if (u) setWho(u.full_name); }}
                      className={`w-full appearance-none px-3 py-2.5 pr-9 rounded-xl border text-sm outline-none ${isDark ? 'bg-white/[0.04] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : undefined }}
                    >
                      <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>Seleccionar tutorado</option>
                      {students.map(u => <option key={u.id} value={String(u.id)} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{u.full_name}</option>)}
                    </select>
                    <User className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                  </div>
                </div>
                <div>
                  <Label isDark={isDark}>Responsável pela Ação (Who)</Label>
                  <div className="relative">
                    <select
                      value={who}
                      onChange={e => setWho(e.target.value)}
                      className={`w-full appearance-none px-3 py-2.5 pr-9 rounded-xl border text-sm outline-none ${isDark ? 'bg-white/[0.04] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : undefined }}
                    >
                      <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>Seleccionar responsável</option>
                      {team.map(u => <option key={u.id} value={u.full_name} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{u.full_name}</option>)}
                    </select>
                    <User className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                  </div>
                </div>
              </div>
              <div>
                <Label isDark={isDark}>Prazo (When)</Label>
                <div className="relative">
                  <Input type="date" value={whenDeadline} onChange={setWhen} isDark={isDark} />
                  <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                </div>
              </div>
              <div>
                <Label isDark={isDark}>Como? (How)</Label>
                <Textarea value={how} onChange={setHow} placeholder="Passo a passo detalhado de como a ação será executada…" rows={4} isDark={isDark} />
              </div>
              <div>
                <Label isDark={isDark}>Quanto custa? (How much)</Label>
                <Input value={howMuch} onChange={setHowMuch} placeholder="Recursos necessários (tempo, material, formação…) — opcional" isDark={isDark} />
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
          {step === 0 ? <><X className="w-4 h-4" /> Cancelar</> : <><ChevronLeft className="w-4 h-4" /> Anterior</>}
        </button>

        <div className="flex items-center gap-2">
          {step < STEPS.length - 1 ? (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 12px 30px rgba(59,130,246,.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving || !canSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white text-sm font-bold shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> A guardar…</> : <><Save className="w-4 h-4" /> Criar Plano</>}
            </motion.button>
          )}
        </div>
      </motion.div>

    </div>
  );
}
