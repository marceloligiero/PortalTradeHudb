import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, ArrowLeft, CheckCircle2, Clock, XCircle,
  AlertCircle, TrendingUp, User, Calendar, MessageSquare,
  Send, Loader2, Plus, Trash2, ChevronDown, Pencil, Save,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  id: number;
  error_id: number;
  created_by_name?: string;
  tutorado_id: number;
  tutorado_name?: string;
  analysis_5_why?: string;
  immediate_correction?: string;
  corrective_action?: string;
  preventive_action?: string;
  what?: string;
  why?: string;
  where_field?: string;
  when_deadline?: string;
  who?: string;
  how?: string;
  how_much?: string;
  status: string;
  approved_by_name?: string;
  approved_at?: string;
  validated_by_name?: string;
  validated_at?: string;
  items_total: number;
  items_completed: number;
  created_at: string;
}

interface ActionItem {
  id: number;
  type: string;
  description: string;
  responsible_id?: number;
  responsible_name?: string;
  due_date?: string;
  status: string;
  evidence_text?: string;
  reviewer_comment?: string;
  is_overdue: boolean;
}

interface Comment {
  id: number;
  author_name?: string;
  content: string;
  created_at: string;
}

interface UserItem { id: number; full_name: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_STATUS_LABEL: Record<string, string> = {
  RASCUNHO: 'Rascunho', AGUARDANDO_APROVACAO: 'Ag. Aprovação',
  APROVADO: 'Aprovado', EM_EXECUCAO: 'Em Execução',
  CONCLUIDO: 'Concluído', DEVOLVIDO: 'Devolvido',
};
const ITEM_STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente', EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDO: 'Concluído', DEVOLVIDO: 'Devolvido',
};
const ITEM_TYPE_LABEL: Record<string, string> = {
  IMEDIATA: 'Imediata', CORRETIVA: 'Corretiva', PREVENTIVA: 'Preventiva',
};

function itemTypeCls(t: string, isDark: boolean) {
  const d: Record<string, string> = {
    IMEDIATA: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    CORRETIVA: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    PREVENTIVA: 'bg-green-500/15 text-green-400 border-green-500/20',
  };
  const l: Record<string, string> = {
    IMEDIATA: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    CORRETIVA: 'bg-blue-50 text-blue-700 border-blue-200',
    PREVENTIVA: 'bg-green-50 text-green-700 border-green-200',
  };
  return isDark ? d[t] || '' : l[t] || '';
}

function itemStatusCls(s: string, isDark: boolean) {
  const d: Record<string, string> = {
    PENDENTE: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
    EM_ANDAMENTO: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    CONCLUIDO: 'bg-green-500/15 text-green-400 border-green-500/20',
    DEVOLVIDO: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  const l: Record<string, string> = {
    PENDENTE: 'bg-gray-100 text-gray-600 border-gray-200',
    EM_ANDAMENTO: 'bg-orange-50 text-orange-700 border-orange-200',
    CONCLUIDO: 'bg-green-50 text-green-700 border-green-200',
    DEVOLVIDO: 'bg-red-50 text-red-700 border-red-200',
  };
  return isDark ? d[s] || '' : l[s] || '';
}

function planStatusCls(s: string, isDark: boolean) {
  const d: Record<string, string> = {
    RASCUNHO: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
    AGUARDANDO_APROVACAO: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    APROVADO: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    EM_EXECUCAO: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    CONCLUIDO: 'bg-green-500/15 text-green-400 border-green-500/20',
    DEVOLVIDO: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  const l: Record<string, string> = {
    RASCUNHO: 'bg-gray-100 text-gray-600 border-gray-200',
    AGUARDANDO_APROVACAO: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    APROVADO: 'bg-blue-50 text-blue-700 border-blue-200',
    EM_EXECUCAO: 'bg-orange-50 text-orange-700 border-orange-200',
    CONCLUIDO: 'bg-green-50 text-green-700 border-green-200',
    DEVOLVIDO: 'bg-red-50 text-red-700 border-red-200',
  };
  return isDark ? d[s] || '' : l[s] || '';
}

// ─── Section card ─────────────────────────────────────────────────────────────

function InfoSection({ title, value, isDark }: { title: string; value?: string; isDark: boolean }) {
  if (!value) return null;
  return (
    <div>
      <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{title}</p>
      <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{value}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PlanDetail() {
  const { planId } = useParams<{ planId: string }>();
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const isManager = user?.role === 'ADMIN' || user?.role === 'TRAINER';
  const isAdmin   = user?.role === 'ADMIN';
  const isStudent = !isManager;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [items, setItems] = useState<ActionItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [students, setStudents] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Add item form
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemType, setNewItemType] = useState('CORRETIVA');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemResp, setNewItemResp] = useState('');
  const [newItemDue, setNewItemDue]   = useState('');
  const [addingItem, setAddingItem]   = useState(false);

  // Evidence form per item
  const [evidenceOpen, setEvidenceOpen] = useState<number | null>(null);
  const [evidenceText, setEvidenceText] = useState('');
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  // Return item form
  const [returnItemId, setReturnItemId] = useState<number | null>(null);
  const [returnItemComment, setReturnItemComment] = useState('');
  const [returningItem, setReturningItem] = useState(false);

  // Comments
  const [commentText, setCommentText]     = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  // Status actions
  const [actioning, setActioning] = useState(false);
  const [returnComment, setReturnComment] = useState('');
  const [showReturn, setShowReturn] = useState(false);

  // Inline edit mode
  const canEdit = isManager && (plan?.status === 'DEVOLVIDO' || plan?.status === 'RASCUNHO');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    analysis_5_why: '', immediate_correction: '', corrective_action: '', preventive_action: '',
    what: '', why: '', where_field: '', when_deadline: '', who: '', how: '', how_much: '',
  });
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    if (!planId) return;
    (async () => {
      try {
        const [pRes, iRes, cRes, uRes, sRes] = await Promise.all([
          axios.get(`/api/tutoria/plans/${planId}`),
          axios.get(`/api/tutoria/plans/${planId}/items`),
          axios.get(`/api/tutoria/plans/${planId}/comments`),
          isManager ? axios.get('/api/tutoria/team') : Promise.resolve({ data: [] }),
          isManager ? axios.get('/api/tutoria/students') : Promise.resolve({ data: [] }),
        ]);
        setPlan(pRes.data);
        setItems(Array.isArray(iRes.data) ? iRes.data : []);
        setComments(Array.isArray(cRes.data) ? cRes.data : []);
        setUsers(Array.isArray(uRes.data) ? uRes.data : []);
        setStudents(Array.isArray(sRes.data) ? sRes.data : []);
      } catch (e: any) {
        if (e?.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [planId, isManager]);

  const reload = async () => {
    if (!planId) return;
    const [pRes, iRes] = await Promise.all([
      axios.get(`/api/tutoria/plans/${planId}`),
      axios.get(`/api/tutoria/plans/${planId}/items`),
    ]);
    setPlan(pRes.data);
    setItems(Array.isArray(iRes.data) ? iRes.data : []);
  };

  const startEditing = () => {
    if (!plan) return;
    setEditData({
      analysis_5_why: plan.analysis_5_why ?? '',
      immediate_correction: plan.immediate_correction ?? '',
      corrective_action: plan.corrective_action ?? '',
      preventive_action: plan.preventive_action ?? '',
      what: plan.what ?? '',
      why: plan.why ?? '',
      where_field: plan.where_field ?? '',
      when_deadline: plan.when_deadline ? plan.when_deadline.slice(0, 10) : '',
      who: plan.who ?? '',
      how: plan.how ?? '',
      how_much: plan.how_much ?? '',
    });
    setEditing(true);
  };

  const handleSavePlan = async () => {
    if (!planId) return;
    setSavingPlan(true);
    try {
      const payload: Record<string, string | null> = {};
      for (const [k, v] of Object.entries(editData)) {
        payload[k] = v.trim() || null;
      }
      const res = await axios.patch(`/api/tutoria/plans/${planId}`, payload);
      setPlan(res.data);
      setEditing(false);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao guardar alterações');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleAction = async (action: 'submit' | 'approve' | 'validate') => {
    if (!planId) return;
    setActioning(true);
    try {
      const res = await axios.post(`/api/tutoria/plans/${planId}/${action}`);
      setPlan(res.data);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro na operação');
    } finally {
      setActioning(false);
    }
  };

  const handleReturn = async () => {
    if (!planId || !returnComment.trim()) return;
    setActioning(true);
    try {
      await axios.post(`/api/tutoria/plans/${planId}/return`, { comment: returnComment.trim() });
      setShowReturn(false);
      setReturnComment('');
      await reload();
      const cRes = await axios.get(`/api/tutoria/plans/${planId}/comments`);
      setComments(Array.isArray(cRes.data) ? cRes.data : []);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao devolver');
    } finally {
      setActioning(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemDesc.trim() || !planId) return;
    setAddingItem(true);
    try {
      await axios.post(`/api/tutoria/plans/${planId}/items`, {
        type: newItemType,
        description: newItemDesc.trim(),
        responsible_id: newItemResp ? Number(newItemResp) : null,
        due_date: newItemDue || null,
      });
      setShowAddItem(false);
      setNewItemDesc(''); setNewItemResp(''); setNewItemDue(''); setNewItemType('CORRETIVA');
      await reload();
    } finally {
      setAddingItem(false);
    }
  };

  const handleItemStatus = async (itemId: number, status: string) => {
    await axios.patch(`/api/tutoria/items/${itemId}`, { status });
    await reload();
  };

  const handleSubmitEvidence = async (itemId: number) => {
    if (!evidenceText.trim()) return;
    setSubmittingEvidence(true);
    try {
      await axios.patch(`/api/tutoria/items/${itemId}`, {
        evidence_text: evidenceText.trim(),
        status: 'CONCLUIDO',
      });
      setEvidenceOpen(null);
      setEvidenceText('');
      await reload();
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const handleReturnItem = async (itemId: number) => {
    if (!returnItemComment.trim()) return;
    setReturningItem(true);
    try {
      await axios.post(`/api/tutoria/items/${itemId}/return`, { comment: returnItemComment.trim() });
      setReturnItemId(null);
      setReturnItemComment('');
      await reload();
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao devolver ação');
    } finally {
      setReturningItem(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !planId) return;
    setSendingComment(true);
    try {
      const res = await axios.post(`/api/tutoria/plans/${planId}/comments`, { content: commentText.trim() });
      setComments(prev => [...prev, res.data]);
      setCommentText('');
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
    </div>
  );

  if (notFound || !plan) return (
    <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-white border-gray-200'}`}>
      <ClipboardList className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
      <p className={`font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Plano não encontrado</p>
      <button onClick={() => navigate('/tutoria/plans')} className="mt-4 inline-flex items-center gap-2 text-sm text-blue-500 font-semibold">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
    </div>
  );

  const pct = plan.items_total > 0 ? Math.round((plan.items_completed / plan.items_total) * 100) : 0;
  const allDone = items.length > 0 && items.every(i => i.status === 'CONCLUIDO');

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${isDark ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600 focus:border-blue-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400'}`;
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  return (
    <div className="space-y-8 max-w-4xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className={`border-b pb-8 ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <button onClick={() => navigate('/tutoria/plans')} className={`flex items-center gap-1.5 text-xs font-semibold mb-5 ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar aos Planos
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>Plano #{plan.id}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${planStatusCls(plan.status, isDark)}`}>
                {PLAN_STATUS_LABEL[plan.status]}
              </span>
              {plan.when_deadline && new Date(plan.when_deadline) < new Date() && plan.status !== 'CONCLUIDO' && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'}`}>Vencido</span>
              )}
            </div>
            <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {plan.what ?? `Plano de Ação #${plan.id}`}
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Tutorado: {plan.tutorado_name ?? '—'} · Erro #{plan.error_id}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {canEdit && !editing && (
              <button onClick={startEditing}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${isDark ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                <Pencil className="w-4 h-4" /> Editar Plano
              </button>
            )}
            {isManager && (plan.status === 'RASCUNHO' || plan.status === 'DEVOLVIDO') && (
              <button onClick={() => handleAction('submit')} disabled={actioning}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm font-bold">
                {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                {plan.status === 'DEVOLVIDO' ? 'Re-submeter para Aprovação' : 'Submeter para Aprovação'}
              </button>
            )}
            {isAdmin && plan.status === 'AGUARDANDO_APROVACAO' && (
              <>
                <button onClick={() => handleAction('approve')} disabled={actioning}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold">
                  {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Aprovar
                </button>
                <button onClick={() => setShowReturn(!showReturn)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${isDark ? 'border-red-500/30 text-red-400' : 'border-red-300 text-red-600'}`}>
                  <XCircle className="w-4 h-4" /> Devolver
                </button>
              </>
            )}
            {isManager && plan.status === 'EM_EXECUCAO' && (
              <>
                <button onClick={() => handleAction('validate')} disabled={actioning || !allDone}
                  title={!allDone ? 'Todos os itens devem estar concluídos' : ''}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                  {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Validar Conclusão
                </button>
                <button onClick={() => setShowReturn(!showReturn)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${isDark ? 'border-red-500/30 text-red-400' : 'border-red-300 text-red-600'}`}>
                  <XCircle className="w-4 h-4" /> Devolver
                </button>
              </>
            )}
          </div>
        </div>

        {/* Return form */}
        <AnimatePresence>
          {showReturn && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className={`mt-4 rounded-xl border p-4 space-y-3 ${isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}
            >
              <p className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>Motivo da devolução</p>
              <textarea
                value={returnComment}
                onChange={e => setReturnComment(e.target.value)}
                placeholder="Explique o que deve ser ajustado…"
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none ${isDark ? 'bg-white/[0.04] border-red-500/20 text-white placeholder-gray-600' : 'bg-white border-red-200 text-gray-900 placeholder-gray-400'}`}
              />
              <div className="flex gap-2">
                <button onClick={handleReturn} disabled={!returnComment.trim() || actioning}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-bold disabled:opacity-50">
                  Confirmar Devolução
                </button>
                <button onClick={() => setShowReturn(false)} className={`px-4 py-2 rounded-lg text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Cancelar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DEVOLVIDO banner */}
        {plan.status === 'DEVOLVIDO' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}
          >
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <div>
              <p className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Plano Devolvido</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                {isManager
                  ? 'Este plano foi devolvido. Reveja os comentários, efetue as correções necessárias e re-submeta para aprovação.'
                  : 'Este plano foi devolvido para correção. Aguarde que o tutor efetue os ajustes.'}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ── Progress ─────────────────────────────────────────────────────────── */}
      {plan.items_total > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className={`rounded-2xl border p-5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Progresso</p>
            <span className={`text-sm font-black ${pct === 100 ? isDark ? 'text-green-400' : 'text-green-600' : isDark ? 'text-white' : 'text-gray-900'}`}>{pct}%</span>
          </div>
          <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${pct === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
            />
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{plan.items_completed} de {plan.items_total} ações concluídas</p>
        </motion.div>
      )}

      {/* ── 5W2H ─────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={`px-5 py-3 border-b flex items-center justify-between text-xs font-bold uppercase tracking-wider ${isDark ? 'border-white/8 bg-white/[0.02] text-gray-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
          <span>5W2H — Estrutura do Plano</span>
          {editing && (
            <div className="flex gap-2">
              <button onClick={handleSavePlan} disabled={savingPlan}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold normal-case tracking-normal disabled:opacity-50">
                {savingPlan ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Guardar
              </button>
              <button onClick={() => setEditing(false)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold normal-case tracking-normal ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                Cancelar
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="p-5 space-y-5">
            <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>5W2H</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>O quê? (What) *</label>
                <input value={editData.what} onChange={e => setEditData(d => ({ ...d, what: e.target.value }))} className={inputCls} placeholder="O que será feito?" />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Por quê? (Why)</label>
                <input value={editData.why} onChange={e => setEditData(d => ({ ...d, why: e.target.value }))} className={inputCls} placeholder="Por que será feito?" />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Onde? (Where)</label>
                <input value={editData.where_field} onChange={e => setEditData(d => ({ ...d, where_field: e.target.value }))} className={inputCls} placeholder="Onde?" />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Quando? (When)</label>
                <input type="date" value={editData.when_deadline} onChange={e => setEditData(d => ({ ...d, when_deadline: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Quem? (Who)</label>
                <input value={editData.who} onChange={e => setEditData(d => ({ ...d, who: e.target.value }))} className={inputCls} placeholder="Quem?" />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Quanto custa? (How much)</label>
                <input value={editData.how_much} onChange={e => setEditData(d => ({ ...d, how_much: e.target.value }))} className={inputCls} placeholder="Quanto custa?" />
              </div>
              <div className="sm:col-span-2">
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Como? (How)</label>
                <textarea value={editData.how} onChange={e => setEditData(d => ({ ...d, how: e.target.value }))} rows={3} className={`${inputCls} resize-none`} placeholder="Como será feito?" />
              </div>
            </div>

            <div className={`border-t pt-5 space-y-4 ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Análise & Ações</p>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Análise 5 Porquês</label>
                <textarea value={editData.analysis_5_why} onChange={e => setEditData(d => ({ ...d, analysis_5_why: e.target.value }))} rows={3} className={`${inputCls} resize-none`} placeholder="Análise de causa raiz…" />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Correção Imediata</label>
                <textarea value={editData.immediate_correction} onChange={e => setEditData(d => ({ ...d, immediate_correction: e.target.value }))} rows={2} className={`${inputCls} resize-none`} placeholder="Correção imediata…" />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ação Corretiva</label>
                <textarea value={editData.corrective_action} onChange={e => setEditData(d => ({ ...d, corrective_action: e.target.value }))} rows={2} className={`${inputCls} resize-none`} placeholder="Ação corretiva…" />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ação Preventiva</label>
                <textarea value={editData.preventive_action} onChange={e => setEditData(d => ({ ...d, preventive_action: e.target.value }))} rows={2} className={`${inputCls} resize-none`} placeholder="Ação preventiva…" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoSection title="O quê? (What)" value={plan.what} isDark={isDark} />
              <InfoSection title="Por quê? (Why)" value={plan.why} isDark={isDark} />
              <InfoSection title="Onde? (Where)" value={plan.where_field} isDark={isDark} />
              <InfoSection title="Quando? (When)" value={plan.when_deadline ? new Date(plan.when_deadline).toLocaleDateString('pt-PT') : undefined} isDark={isDark} />
              <InfoSection title="Quem? (Who)" value={plan.who} isDark={isDark} />
              <InfoSection title="Quanto custa? (How much)" value={plan.how_much} isDark={isDark} />
              {plan.how && <div className="sm:col-span-2"><InfoSection title="Como? (How)" value={plan.how} isDark={isDark} /></div>}
            </div>
            {(plan.analysis_5_why || plan.immediate_correction || plan.corrective_action || plan.preventive_action) && (
              <div className={`px-5 pb-5 border-t space-y-4 pt-4 ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                <InfoSection title="Análise 5 Porquês" value={plan.analysis_5_why} isDark={isDark} />
                <InfoSection title="Correção Imediata" value={plan.immediate_correction} isDark={isDark} />
                <InfoSection title="Ação Corretiva" value={plan.corrective_action} isDark={isDark} />
                <InfoSection title="Ação Preventiva" value={plan.preventive_action} isDark={isDark} />
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ── Action Items ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Ações ({items.length})</p>
          </div>
          {isManager && ['RASCUNHO', 'DEVOLVIDO', 'APROVADO', 'EM_EXECUCAO'].includes(plan.status) && (
            <button onClick={() => setShowAddItem(!showAddItem)} className={`flex items-center gap-1.5 text-xs font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          )}
        </div>

        {/* Item flow legend */}
        {items.length > 0 && (
          <div className={`px-5 py-2.5 border-b flex items-center justify-center gap-1.5 flex-wrap ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-gray-50 bg-gray-50/50'}`}>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDark ? 'bg-gray-500/15 text-gray-400 border-gray-500/20' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>Pendente</span>
            <span className={`text-[9px] ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>→</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDark ? 'bg-orange-500/15 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>Em Andamento</span>
            <span className={`text-[9px] ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>→</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDark ? 'bg-green-500/15 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-200'}`}>Concluído</span>
            <span className={`text-[9px] ${isDark ? 'text-gray-700' : 'text-gray-300'} mx-1`}>|</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDark ? 'bg-red-500/15 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200'}`}>Devolvido</span>
            <span className={`text-[9px] ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>→</span>
            <span className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>recomeçar</span>
          </div>
        )}

        {/* Add item form */}
        <AnimatePresence>
          {showAddItem && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className={`border-b p-5 space-y-3 ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-gray-100 bg-gray-50'}`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <select value={newItemType} onChange={e => setNewItemType(e.target.value)} className={`${selectCls} pr-8`} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : undefined }}>
                    <option value="IMEDIATA">Imediata</option>
                    <option value="CORRETIVA">Corretiva</option>
                    <option value="PREVENTIVA">Preventiva</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                </div>
                <div className="relative">
                  <select value={newItemResp} onChange={e => setNewItemResp(e.target.value)} className={`${selectCls} pr-8`} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : undefined }}>
                    <option value="">Responsável…</option>
                    {users.map(u => <option key={u.id} value={String(u.id)}>{u.full_name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                </div>
                <input type="date" value={newItemDue} onChange={e => setNewItemDue(e.target.value)} className={inputCls} />
              </div>
              <textarea
                value={newItemDesc}
                onChange={e => setNewItemDesc(e.target.value)}
                placeholder="Descrição detalhada da ação…"
                rows={2}
                className={`${inputCls} resize-none`}
              />
              <div className="flex gap-2">
                <button onClick={handleAddItem} disabled={!newItemDesc.trim() || addingItem}
                  className="px-4 py-2 rounded-lg bg-orange-500 text-white text-xs font-bold disabled:opacity-50">
                  {addingItem ? <Loader2 className="w-4 h-4 animate-spin inline" /> : '+ Adicionar'}
                </button>
                <button onClick={() => setShowAddItem(false)} className={`px-4 py-2 rounded-lg text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Cancelar</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {items.length === 0 ? (
          <div className={`p-8 text-center text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            Nenhuma ação adicionada ainda
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {items.map(item => (
              <div key={item.id} className={`p-5 ${isDark ? '' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${itemTypeCls(item.type, isDark)}`}>
                      {ITEM_TYPE_LABEL[item.type]}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${itemStatusCls(item.status, isDark)}`}>
                      {ITEM_STATUS_LABEL[item.status]}
                    </span>
                    {item.is_overdue && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'}`}>Vencido</span>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                    {plan.status !== 'CONCLUIDO' && (<>
                    {/* ── PENDENTE: Iniciar ── */}
                    {item.status === 'PENDENTE' && (
                      (isManager || (isStudent && item.responsible_id === user?.id)) && (
                        <button onClick={() => handleItemStatus(item.id, 'EM_ANDAMENTO')}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isDark ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-50 text-orange-700'}`}>
                          Iniciar
                        </button>
                      )
                    )}
                    {/* ── EM_ANDAMENTO: Evidência / Concluir / Devolver ── */}
                    {item.status === 'EM_ANDAMENTO' && (
                      <>
                        {(isStudent && item.responsible_id === user?.id) && (
                          <button onClick={() => { setEvidenceOpen(item.id); setEvidenceText(item.evidence_text ?? ''); }}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                            Submeter Evidência
                          </button>
                        )}
                        {isManager && (
                          <>
                            <button onClick={() => handleItemStatus(item.id, 'CONCLUIDO')}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isDark ? 'bg-green-500/15 text-green-400' : 'bg-green-50 text-green-700'}`}>
                              Concluir
                            </button>
                            <button onClick={() => { setReturnItemId(item.id); setReturnItemComment(''); }}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-700'}`}>
                              Devolver
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {/* ── CONCLUIDO: Manager pode devolver ── */}
                    {item.status === 'CONCLUIDO' && isManager && (
                      <button onClick={() => { setReturnItemId(item.id); setReturnItemComment(''); }}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-700'}`}>
                        Devolver
                      </button>
                    )}
                    {/* ── DEVOLVIDO: Reiniciar ── */}
                    {item.status === 'DEVOLVIDO' && (
                      (isManager || (isStudent && item.responsible_id === user?.id)) && (
                        <button onClick={() => handleItemStatus(item.id, 'EM_ANDAMENTO')}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isDark ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-50 text-orange-700'}`}>
                          Reiniciar
                        </button>
                      )
                    )}
                    </>)}
                  </div>
                </div>

                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.description}</p>

                <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {item.responsible_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.responsible_name}</span>}
                  {item.due_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(item.due_date).toLocaleDateString('pt-PT')}</span>}
                </div>

                {item.evidence_text && (
                  <div className={`mt-3 rounded-lg p-3 text-xs ${isDark ? 'bg-green-500/5 border border-green-500/10 text-green-300/80' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                    <p className="font-bold uppercase tracking-wider mb-1">Evidência submetida</p>
                    <p>{item.evidence_text}</p>
                  </div>
                )}
                {item.reviewer_comment && (
                  <div className={`mt-2 rounded-lg p-3 text-xs ${isDark ? 'bg-red-500/5 border border-red-500/10 text-red-300/80' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    <p className="font-bold uppercase tracking-wider mb-1">Comentário do revisor</p>
                    <p>{item.reviewer_comment}</p>
                  </div>
                )}

                {/* Evidence form */}
                <AnimatePresence>
                  {evidenceOpen === item.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-2"
                    >
                      <textarea
                        value={evidenceText}
                        onChange={e => setEvidenceText(e.target.value)}
                        placeholder="Descreva o que foi feito / cole a URL da evidência…"
                        rows={3}
                        className={`w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none ${isDark ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleSubmitEvidence(item.id)} disabled={!evidenceText.trim() || submittingEvidence}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500 text-white text-xs font-bold disabled:opacity-50">
                          {submittingEvidence ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Submeter e Concluir
                        </button>
                        <button onClick={() => setEvidenceOpen(null)} className={`px-4 py-2 rounded-lg text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Cancelar</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Return item form */}
                <AnimatePresence>
                  {returnItemId === item.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className={`mt-3 rounded-xl border p-3 space-y-2 ${isDark ? 'bg-red-500/5 border-red-500/15' : 'bg-red-50 border-red-200'}`}
                    >
                      <p className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>Motivo da devolução da ação</p>
                      <textarea
                        value={returnItemComment}
                        onChange={e => setReturnItemComment(e.target.value)}
                        placeholder="Explique o que precisa ser corrigido…"
                        rows={2}
                        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none ${isDark ? 'bg-white/[0.04] border-red-500/20 text-white placeholder-gray-600' : 'bg-white border-red-200 text-gray-900 placeholder-gray-400'}`}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleReturnItem(item.id)} disabled={!returnItemComment.trim() || returningItem}
                          className="px-4 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold disabled:opacity-50">
                          {returningItem ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : 'Confirmar Devolução'}
                        </button>
                        <button onClick={() => setReturnItemId(null)} className={`px-4 py-1.5 rounded-lg text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Cancelar</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
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
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Comentários ({comments.length})</p>
        </div>
        <div className="p-5 space-y-4">
          {comments.length === 0 && (
            <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Sem comentários ainda</p>
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
          <div className="flex gap-3 pt-2">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Adicionar comentário…"
              rows={2}
              className={`flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none resize-none ${isDark ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600 focus:border-purple-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-400'}`}
            />
            <button onClick={handleComment} disabled={!commentText.trim() || sendingComment}
              className="self-end px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 text-white text-sm font-bold disabled:opacity-50">
              {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
