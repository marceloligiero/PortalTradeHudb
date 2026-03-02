import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, ArrowLeft, Plus, ChevronDown, User, Calendar,
  Tag, Shield, RefreshCw, MessageSquare, Send, Loader2,
  ClipboardList, CheckCircle2, Clock, ArrowRight, Package,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorDetail {
  id: number;
  date_occurrence: string;
  description: string;
  tutorado_id: number;
  tutorado_name?: string;
  created_by_name?: string;
  category_id?: number;
  category_name?: string;
  product_id?: number;
  product_name?: string;
  severity: string;
  status: string;
  tags?: string[];
  analysis_5_why?: string;
  is_recurrent: boolean;
  recurrence_count: number;
  is_active: boolean;
  inactivation_reason?: string;
  plans_count: number;
  motivos?: { id: number; typology: string; description?: string; created_at?: string }[];
  created_at: string;
  updated_at?: string;
}

interface Plan {
  id: number;
  tutorado_name?: string;
  created_by_name?: string;
  status: string;
  when_deadline?: string;
  items_total: number;
  items_completed: number;
  what?: string;
  created_at: string;
}

interface Comment {
  id: number;
  author_name?: string;
  content: string;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_LABEL: Record<string, string> = {
  BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', CRITICA: 'Crítica',
};
const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Aberto', EM_ANALISE: 'Em Análise', PLANO_CRIADO: 'Plano Criado',
  EM_EXECUCAO: 'Em Execução', CONCLUIDO: 'Concluído', VERIFICADO: 'Verificado',
};
const PLAN_STATUS_LABEL: Record<string, string> = {
  RASCUNHO: 'Rascunho', AGUARDANDO_APROVACAO: 'Ag. Aprovação',
  APROVADO: 'Aprovado', EM_EXECUCAO: 'Em Execução',
  CONCLUIDO: 'Concluído', DEVOLVIDO: 'Devolvido',
};

const TYPOLOGY_LABEL: Record<string, string> = {
  METHODOLOGY: 'Metodologia', KNOWLEDGE: 'Conhecimento',
  DETAIL: 'Detalhe', PROCEDURE: 'Procedimento',
};
const TYPOLOGY_CLR_DARK: Record<string, string> = {
  METHODOLOGY: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  KNOWLEDGE:   'bg-blue-500/15 text-blue-400 border-blue-500/25',
  DETAIL:      'bg-amber-500/15 text-amber-400 border-amber-500/25',
  PROCEDURE:   'bg-green-500/15 text-green-400 border-green-500/25',
};
const TYPOLOGY_CLR_LIGHT: Record<string, string> = {
  METHODOLOGY: 'bg-purple-50 text-purple-700 border-purple-200',
  KNOWLEDGE:   'bg-blue-50 text-blue-700 border-blue-200',
  DETAIL:      'bg-amber-50 text-amber-700 border-amber-200',
  PROCEDURE:   'bg-green-50 text-green-700 border-green-200',
};

function severityCls(s: string, isDark: boolean) {
  const d: Record<string, string> = {
    BAIXA: 'bg-green-500/15 text-green-400 border-green-500/20',
    MEDIA: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    ALTA: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    CRITICA: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  const l: Record<string, string> = {
    BAIXA: 'bg-green-50 text-green-700 border-green-200',
    MEDIA: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    ALTA: 'bg-orange-50 text-orange-700 border-orange-200',
    CRITICA: 'bg-red-50 text-red-700 border-red-200',
  };
  return isDark ? (d[s] || 'bg-gray-500/15 text-gray-400') : (l[s] || 'bg-gray-100 text-gray-600');
}
function statusCls(s: string, isDark: boolean) {
  const d: Record<string, string> = {
    ABERTO: 'bg-red-500/15 text-red-400 border-red-500/20',
    EM_ANALISE: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    PLANO_CRIADO: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    EM_EXECUCAO: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    CONCLUIDO: 'bg-green-500/15 text-green-400 border-green-500/20',
    VERIFICADO: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  };
  const l: Record<string, string> = {
    ABERTO: 'bg-red-50 text-red-700 border-red-200',
    EM_ANALISE: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    PLANO_CRIADO: 'bg-blue-50 text-blue-700 border-blue-200',
    EM_EXECUCAO: 'bg-orange-50 text-orange-700 border-orange-200',
    CONCLUIDO: 'bg-green-50 text-green-700 border-green-200',
    VERIFICADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return isDark ? (d[s] || 'bg-gray-500/15 text-gray-400') : (l[s] || 'bg-gray-100 text-gray-600');
}

// ─── Status progress bar ──────────────────────────────────────────────────────

const STATUS_STEPS = ['ABERTO', 'EM_ANALISE', 'PLANO_CRIADO', 'EM_EXECUCAO', 'CONCLUIDO', 'VERIFICADO'];

function StatusStepper({ status, isDark }: { status: string; isDark: boolean }) {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
            i < idx
              ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : i === idx
                ? isDark ? 'bg-red-500/15 text-red-300 border-red-500/30' : 'bg-red-100 text-red-700 border-red-300'
                : isDark ? 'bg-white/[0.02] text-gray-700 border-white/5' : 'bg-gray-50 text-gray-300 border-gray-100'
          }`}>
            {i < idx && <CheckCircle2 className="w-3 h-3" />}
            {i === idx && <Clock className="w-3 h-3 animate-pulse" />}
            <span>{STATUS_LABEL[s]}</span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`w-4 h-px mx-0.5 ${i < idx ? isDark ? 'bg-emerald-500/30' : 'bg-emerald-200' : isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ErrorDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const isManager = user?.role === 'ADMIN' || user?.role === 'TRAINER';
  const isAdmin   = user?.role === 'ADMIN';

  const [error, setError]       = useState<ErrorDetail | null>(null);
  const [plans, setPlans]       = useState<Plan[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusDrop, setShowStatusDrop] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [eRes, pRes, cRes] = await Promise.all([
          axios.get(`/api/tutoria/errors/${id}`),
          axios.get(`/api/tutoria/errors/${id}/plans`),
          axios.get(`/api/tutoria/errors/${id}/comments`),
        ]);
        setError(eRes.data);
        setPlans(Array.isArray(pRes.data) ? pRes.data : []);
        setComments(Array.isArray(cRes.data) ? cRes.data : []);
      } catch (e: any) {
        if (e?.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!error) return;
    setUpdatingStatus(true);
    setShowStatusDrop(false);
    try {
      const res = await axios.patch(`/api/tutoria/errors/${id}`, { status: newStatus });
      setError(res.data);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleVerify = async () => {
    try {
      await axios.post(`/api/tutoria/errors/${id}/verify`);
      setError(prev => prev ? { ...prev, status: 'VERIFICADO' } : prev);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao verificar');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      const res = await axios.post(`/api/tutoria/errors/${id}/comments`, { content: commentText.trim() });
      setComments(prev => [...prev, res.data]);
      setCommentText('');
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-red-400' : 'text-red-500'}`} />
    </div>
  );

  if (notFound || !error) return (
    <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-white border-gray-200'}`}>
      <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
      <p className={`font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Erro não encontrado</p>
      <button onClick={() => navigate('/tutoria/errors')} className="mt-4 inline-flex items-center gap-2 text-sm text-red-500 font-semibold">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
    </div>
  );

  const STATUS_TRANSITIONS: Record<string, string[]> = {
    ABERTO: ['EM_ANALISE'],
    EM_ANALISE: ['PLANO_CRIADO', 'ABERTO'],
    PLANO_CRIADO: ['EM_EXECUCAO'],
    EM_EXECUCAO: ['CONCLUIDO'],
    CONCLUIDO: [],
    VERIFICADO: [],
  };
  const availableTransitions = STATUS_TRANSITIONS[error.status] || [];

  return (
    <div className="space-y-8 max-w-4xl">

      {/* ── Back + Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className={`border-b pb-8 ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <button
          onClick={() => navigate('/tutoria/errors')}
          className={`flex items-center gap-1.5 text-xs font-semibold mb-5 ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar aos Erros
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              error.severity === 'CRITICA' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
              error.severity === 'ALTA' ? 'bg-gradient-to-br from-orange-500 to-amber-500' :
              'bg-gradient-to-br from-yellow-500 to-amber-400'
            } shadow-lg`}>
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-red-400' : 'text-red-500'}`}>Erro #{error.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCls(error.status, isDark)}`}>
                  {STATUS_LABEL[error.status]}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityCls(error.severity, isDark)}`}>
                  {SEVERITY_LABEL[error.severity]}
                </span>
                {error.is_recurrent && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${isDark ? 'bg-orange-500/15 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                    <RefreshCw className="w-2.5 h-2.5" /> {error.recurrence_count + 1}ª ocorrência
                  </span>
                )}
              </div>
              <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{error.description}</p>
            </div>
          </div>

          {/* Status actions */}
          {isManager && error.status !== 'VERIFICADO' && (
            <div className="flex gap-2">
              {availableTransitions.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowStatusDrop(!showStatusDrop)}
                    disabled={updatingStatus}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${isDark ? 'bg-white/[0.04] border-white/10 text-gray-300 hover:text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Mudar Status <ChevronDown className={`w-4 h-4 transition-transform ${showStatusDrop ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showStatusDrop && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        className={`absolute right-0 top-full mt-1 z-50 rounded-xl border shadow-xl overflow-hidden min-w-[160px] ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-gray-200'}`}
                      >
                        {availableTransitions.map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            → {STATUS_LABEL[s]}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {isAdmin && error.status === 'CONCLUIDO' && (
                <button
                  onClick={handleVerify}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-bold"
                >
                  <CheckCircle2 className="w-4 h-4" /> Verificar e Encerrar
                </button>
              )}
              <button
                onClick={() => navigate(`/tutoria/errors/${error.id}/plans/new`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" /> Plano de Ação
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Status stepper ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
        className={`rounded-2xl border p-4 overflow-x-auto ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-gray-50 border-gray-200'}`}
      >
        <StatusStepper status={error.status} isDark={isDark} />
      </motion.div>

      {/* ── Meta grid ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={`px-5 py-3 border-b text-xs font-bold uppercase tracking-wider ${isDark ? 'border-white/8 bg-white/[0.02] text-gray-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
          Detalhes da Ocorrência
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
          {[
            { icon: User,      label: 'Tutorado',     value: error.tutorado_name ?? '—' },
            { icon: User,      label: 'Registado por', value: error.created_by_name ?? '—' },
            { icon: Calendar,  label: 'Data',          value: new Date(error.date_occurrence).toLocaleDateString('pt-PT') },
            { icon: Tag,       label: 'Categoria',     value: error.category_name ?? '—' },
            { icon: Package,   label: 'Serviço',       value: error.product_name ?? '—' },
            { icon: Shield,    label: 'Gravidade',     value: SEVERITY_LABEL[error.severity] ?? error.severity },
            { icon: ClipboardList, label: 'Planos',    value: `${plans.length} criado${plans.length !== 1 ? 's' : ''}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </p>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>
        {error.analysis_5_why && (
          <div className={`px-5 pb-5 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mt-4 mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              Análise de Causa Raiz (5 Porquês)
            </p>
            <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {error.analysis_5_why}
            </p>
          </div>
        )}

        {/* ── Motivos ── */}
        {error.motivos && error.motivos.length > 0 && (
          <div className={`px-5 pb-5 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mt-4 mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              Motivos do Erro ({error.motivos.length})
            </p>
            <div className="space-y-2">
              {error.motivos.map(m => (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-gray-50 border-gray-100'}`}
                >
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap mt-0.5 ${isDark ? (TYPOLOGY_CLR_DARK[m.typology] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/25') : (TYPOLOGY_CLR_LIGHT[m.typology] ?? 'bg-gray-50 text-gray-700 border-gray-200')}`}>
                    {TYPOLOGY_LABEL[m.typology] ?? m.typology}
                  </span>
                  {m.description && (
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {m.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Plans ────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-3.5 h-3.5 text-white" />
            </div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Planos de Ação ({plans.length})
            </p>
          </div>
          {isManager && (
            <button
              onClick={() => navigate(`/tutoria/errors/${error.id}/plans/new`)}
              className={`flex items-center gap-1.5 text-xs font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
            >
              <Plus className="w-3.5 h-3.5" /> Novo Plano
            </button>
          )}
        </div>

        {plans.length === 0 ? (
          <div className={`p-8 text-center text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            Nenhum plano de ação criado ainda
            {isManager && (
              <div className="mt-3">
                <button
                  onClick={() => navigate(`/tutoria/errors/${error.id}/plans/new`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" /> Criar plano de ação
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {plans.map(p => {
              const pct = p.items_total > 0 ? Math.round((p.items_completed / p.items_total) * 100) : 0;
              const isOverdue = p.when_deadline && new Date(p.when_deadline) < new Date() && p.status !== 'CONCLUIDO';
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/tutoria/plans/${p.id}`)}
                  className={`px-5 py-4 cursor-pointer transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className={`text-sm font-semibold flex-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {p.what ?? `Plano #${p.id}`}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isOverdue && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'}`}>Vencido</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDark ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {PLAN_STATUS_LABEL[p.status] ?? p.status}
                      </span>
                      <ArrowRight className={`w-4 h-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                    </div>
                  </div>
                  {p.items_total > 0 && (
                    <div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {p.items_completed}/{p.items_total} ações · {pct}%
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Comments ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={`px-5 py-4 border-b flex items-center gap-3 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
          <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          </div>
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Comentários ({comments.length})
          </p>
        </div>

        <div className="p-5 space-y-4">
          {comments.length === 0 && (
            <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              Sem comentários ainda
            </p>
          )}
          {comments.map(c => (
            <div key={c.id} className={`rounded-xl p-3 ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                  {(c.author_name ?? '?')[0].toUpperCase()}
                </div>
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.author_name ?? 'Anónimo'}</span>
                <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {new Date(c.created_at).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{c.content}</p>
            </div>
          ))}

          {/* Add comment */}
          <div className="flex gap-3 pt-2">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Adicionar comentário…"
              rows={2}
              className={`flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all ${
                isDark
                  ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600 focus:border-purple-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-400'
              }`}
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim() || sendingComment}
              className="self-end px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
