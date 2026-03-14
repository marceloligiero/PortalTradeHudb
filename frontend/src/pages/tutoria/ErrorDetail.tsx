import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, ArrowLeft, Plus, ChevronDown, User, Calendar,
  Tag, Shield, RefreshCw, MessageSquare, Send, Loader2,
  ClipboardList, CheckCircle2, Clock, ArrowRight, Package,
  Building2, Building, Activity, Globe, Zap, Eye, UserCheck,
  MapPin, Banknote, Hash,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorDetail {
  id: number;
  date_occurrence: string;
  date_detection?: string;
  date_solution?: string;
  description: string;
  solution?: string;
  action_plan_text?: string;
  // Pessoas
  tutorado_id: number;
  tutorado_name?: string;
  created_by_id?: number;
  created_by_name?: string;
  approver_id?: number;
  approver_name?: string;
  // Análise
  impact_level?: string;
  impact_detail?: string;
  origin_detail?: string;
  grabador_id?: number;
  grabador_name?: string;
  liberador_id?: number;
  liberador_name?: string;
  solution_confirmed?: boolean;
  pending_solution?: boolean;
  excel_sent?: boolean;
  action_plan_summary?: string;
  cancelled_reason?: string;
  cancelled_by_id?: number;
  cancelled_by_name?: string;
  // Transação
  bank_id?: number;
  bank_name?: string;
  office?: string;
  reference_code?: string;
  currency?: string;
  amount?: number;
  final_client?: string;
  // Classificação
  category_id?: number;
  category_name?: string;
  product_id?: number;
  product_name?: string;
  impact_id?: number;
  impact_name?: string;
  origin_id?: number;
  origin_name?: string;
  detected_by_id?: number;
  detected_by_name?: string;
  department_id?: number;
  department_name?: string;
  activity_id?: number;
  activity_name?: string;
  error_type_id?: number;
  error_type_name?: string;
  // Estado
  severity: string;
  status: string;
  tags?: string[];
  analysis_5_why?: string;
  is_recurrent: boolean;
  recurrence_count: number;
  recurrence_type?: string;
  is_active: boolean;
  inactivation_reason?: string;
  plans_count: number;
  motivos?: { id: number; typology: string; description?: string; created_at?: string }[];
  refs?: { id: number; referencia?: string; divisa?: string; importe?: number; cliente_final?: string }[];
  created_at: string;
  updated_at?: string;
}

interface Plan {
  id: number;
  tutorado_name?: string;
  created_by_name?: string;
  plan_type?: string;
  responsible_name?: string;
  expected_result?: string;
  deadline?: string;
  result_score?: number;
  result_comment?: string;
  started_at?: string;
  completed_at?: string;
  status: string;
  when_deadline?: string;
  items_total: number;
  items_completed: number;
  what?: string;
  description?: string;
  created_at: string;
}

interface Comment {
  id: number;
  author_name?: string;
  content: string;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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
    REGISTERED: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    ANALYSIS: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    PENDING_CHIEF_APPROVAL: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    PENDING_TUTOR_REVIEW: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    PENDING_SOLUTION: 'bg-red-500/15 text-red-300 border-red-500/20',
    APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    RESOLVED: 'bg-green-500/15 text-green-400 border-green-500/20',
    CANCELLED: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
    // Legacy
    ABERTO: 'bg-red-500/15 text-red-400 border-red-500/20',
    EM_ANALISE: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    PLANO_CRIADO: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    EM_EXECUCAO: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    CONCLUIDO: 'bg-green-500/15 text-green-400 border-green-500/20',
    VERIFICADO: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  };
  const l: Record<string, string> = {
    REGISTERED: 'bg-blue-50 text-blue-700 border-blue-200',
    ANALYSIS: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    PENDING_CHIEF_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
    PENDING_TUTOR_REVIEW: 'bg-orange-50 text-orange-700 border-orange-200',
    PENDING_SOLUTION: 'bg-red-50 text-red-600 border-red-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    RESOLVED: 'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
    // Legacy
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

const STATUS_STEPS = ['REGISTERED', 'ANALYSIS', 'PENDING_TUTOR_REVIEW', 'APPROVED', 'RESOLVED'];

function StatusStepper({ status, isDark }: { status: string; isDark: boolean }) {
  const { t } = useTranslation();
  const STATUS_LABEL: Record<string, string> = {
    REGISTERED: t('tutoriaDetail.status.REGISTERED', 'Registada'),
    ANALYSIS: t('tutoriaDetail.status.ANALYSIS', 'Em Análise'),
    PENDING_TUTOR_REVIEW: t('tutoriaDetail.status.PENDING_TUTOR_REVIEW', 'Revisão Tutor'),
    APPROVED: t('tutoriaDetail.status.APPROVED', 'Aprovada'),
    RESOLVED: t('tutoriaDetail.status.RESOLVED', 'Resolvida'),
  };
  const isCancelled = status === 'CANCELLED';
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-0 flex-wrap">
      {isCancelled ? (
        <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border ${isDark ? 'bg-gray-500/15 text-gray-400 border-gray-500/25' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {t('tutoriaDetail.status.CANCELLED', 'Cancelada')}
        </div>
      ) : (
        STATUS_STEPS.map((s, i) => (
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
      ))
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ErrorDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const SEVERITY_LABEL: Record<string, string> = {
    BAIXA: t('tutoriaDetail.severity.BAIXA'),
    MEDIA: t('tutoriaDetail.severity.MEDIA'),
    ALTA: t('tutoriaDetail.severity.ALTA'),
    CRITICA: t('tutoriaDetail.severity.CRITICA'),
  };
  const STATUS_LABEL: Record<string, string> = {
    REGISTERED: t('tutoriaDetail.status.REGISTERED', 'Registada'),
    ANALYSIS: t('tutoriaDetail.status.ANALYSIS', 'Em Análise'),
    PENDING_CHIEF_APPROVAL: t('tutoriaDetail.status.PENDING_CHIEF_APPROVAL', 'Aprovação Chefe'),
    PENDING_TUTOR_REVIEW: t('tutoriaDetail.status.PENDING_TUTOR_REVIEW', 'Revisão Tutor'),
    PENDING_SOLUTION: t('tutoriaDetail.status.PENDING_SOLUTION', 'Pendente Solução'),
    APPROVED: t('tutoriaDetail.status.APPROVED', 'Aprovada'),
    RESOLVED: t('tutoriaDetail.status.RESOLVED', 'Resolvida'),
    CANCELLED: t('tutoriaDetail.status.CANCELLED', 'Cancelada'),
    // Legacy
    ABERTO: t('tutoriaDetail.status.ABERTO', 'Aberto'),
    EM_ANALISE: t('tutoriaDetail.status.EM_ANALISE', 'Em Análise'),
    PLANO_CRIADO: t('tutoriaDetail.status.PLANO_CRIADO', 'Plano Criado'),
    EM_EXECUCAO: t('tutoriaDetail.status.EM_EXECUCAO', 'Em Execução'),
    CONCLUIDO: t('tutoriaDetail.status.CONCLUIDO', 'Concluído'),
    VERIFICADO: t('tutoriaDetail.status.VERIFICADO', 'Verificado'),
  };
  const PLAN_STATUS_LABEL: Record<string, string> = {
    OPEN: t('tutoriaDetail.planStatus.OPEN', 'Aberto'),
    IN_PROGRESS: t('tutoriaDetail.planStatus.IN_PROGRESS', 'Em Progresso'),
    DONE: t('tutoriaDetail.planStatus.DONE', 'Concluído'),
    RASCUNHO: t('tutoriaDetail.planStatus.RASCUNHO'),
    AGUARDANDO_APROVACAO: t('tutoriaDetail.planStatus.AGUARDANDO_APROVACAO'),
    APROVADO: t('tutoriaDetail.planStatus.APROVADO'),
    EM_EXECUCAO: t('tutoriaDetail.planStatus.EM_EXECUCAO'),
    CONCLUIDO: t('tutoriaDetail.planStatus.CONCLUIDO'),
    DEVOLVIDO: t('tutoriaDetail.planStatus.DEVOLVIDO'),
  };
  const TYPOLOGY_LABEL: Record<string, string> = {
    METHODOLOGY: t('tutoriaDetail.typology.METHODOLOGY'),
    KNOWLEDGE: t('tutoriaDetail.typology.KNOWLEDGE'),
    DETAIL: t('tutoriaDetail.typology.DETAIL'),
    PROCEDURE: t('tutoriaDetail.typology.PROCEDURE'),
  };

  const isManager = user?.role === 'ADMIN' || user?.role === 'TRAINER';
  const isAdmin   = user?.role === 'ADMIN';
  const isTutor   = !!(user as any)?.is_tutor || user?.role === 'ADMIN';
  const isChefe   = !!(user as any)?.is_team_lead || user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const isReferente = !!(user as any)?.is_referente;
  const isChefRef = isChefe || isReferente;
  const canAnalyze = isChefRef;
  const canReviewAsTutor = isTutor;

  const [error, setError]       = useState<ErrorDetail | null>(null);
  const [plans, setPlans]       = useState<Plan[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusDrop, setShowStatusDrop] = useState(false);

  const [activeTab, setActiveTab] = useState<'registo' | 'analise' | 'revisao' | 'historico'>('registo');
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);

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
      alert(e?.response?.data?.detail || t('tutoriaDetail.verifyError'));
    }
  };

  const handleSubmitAnalysis = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/tutoria/errors/${id}/submit-analysis`);
      setError(res.data);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao submeter análise');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setActionLoading(true);
    try {
      await axios.post(`/api/tutoria/errors/${id}/cancel`, { reason: cancelReason.trim() });
      setError(prev => prev ? { ...prev, status: 'CANCELLED', cancelled_reason: cancelReason.trim() } : prev);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao cancelar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePlans = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/tutoria/errors/${id}/approve-plans`);
      setError(res.data);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao aprovar planos');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnAnalysis = async () => {
    if (!returnReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/tutoria/errors/${id}/return-analysis`, { reason: returnReason.trim() });
      setError(res.data);
      setShowReturnModal(false);
      setReturnReason('');
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao devolver análise');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/tutoria/errors/${id}/resolve`);
      setError(res.data);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao resolver');
    } finally {
      setActionLoading(false);
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
      <p className={`font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('tutoriaDetail.errorNotFound')}</p>
      <button onClick={() => navigate('/tutoria/errors')} className="mt-4 inline-flex items-center gap-2 text-sm text-red-500 font-semibold">
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </button>
    </div>
  );

  const STATUS_TRANSITIONS: Record<string, string[]> = {};
  const availableTransitions: string[] = [];

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
          <ArrowLeft className="w-3.5 h-3.5" /> {t('tutoriaDetail.backToErrors')}
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
                <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-red-400' : 'text-red-500'}`}>{t('tutoriaDetail.errorLabel')} #{error.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCls(error.status, isDark)}`}>
                  {STATUS_LABEL[error.status] ?? error.status}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityCls(error.severity, isDark)}`}>
                  {SEVERITY_LABEL[error.severity]}
                </span>
                {error.is_recurrent && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${isDark ? 'bg-orange-500/15 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                    <RefreshCw className="w-2.5 h-2.5" /> {error.recurrence_count + 1}ª {t('tutoriaDetail.occurrence')}
                  </span>
                )}
                {error.pending_solution && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDark ? 'bg-red-500/15 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {t('tutoriaDetail.pendingSolution', 'Pendente Solução')}
                  </span>
                )}
              </div>
              <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{error.description}</p>
              {error.cancelled_reason && (
                <p className={`text-sm mt-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  {t('tutoriaDetail.cancelledReason', 'Motivo')}: {error.cancelled_reason}
                </p>
              )}
            </div>
          </div>

          {/* Contextual action buttons */}
          <div className="flex gap-2 flex-wrap">
            {/* Chefe/Manager: cancel button */}
            {isChefe && error.status !== 'CANCELLED' && error.status !== 'RESOLVED' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'}`}
              >
                {t('tutoriaDetail.cancelIncident', 'Eliminar')}
              </button>
            )}
            {/* Chefe/Ref: submit analysis */}
            {canAnalyze && (error.status === 'REGISTERED' || error.status === 'ANALYSIS') && (
              <button
                onClick={handleSubmitAnalysis}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {t('tutoriaDetail.submitAnalysis', 'Submeter para Tutor')}
              </button>
            )}
            {/* Tutor: approve plans */}
            {canReviewAsTutor && error.status === 'PENDING_TUTOR_REVIEW' && (
              <>
                <button
                  onClick={handleApprovePlans}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {t('tutoriaDetail.approvePlans', 'Aprovar Planos')}
                </button>
                <button
                  onClick={() => setShowReturnModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${isDark ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20' : 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'}`}
                >
                  {t('tutoriaDetail.returnAnalysis', 'Devolver')}
                </button>
              </>
            )}
            {/* Tutor: resolve */}
            {canReviewAsTutor && (error.status === 'APPROVED' || (error.status === 'PENDING_TUTOR_REVIEW' && error.solution_confirmed)) && (
              <button
                onClick={handleResolve}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                {t('tutoriaDetail.resolve', 'Resolver')}
              </button>
            )}
            {/* Manager: create plan */}
            {isManager && error.status !== 'CANCELLED' && error.status !== 'RESOLVED' && (
              <button
                onClick={() => navigate(`/tutoria/errors/${error.id}/plans/new`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" /> {t('tutoriaDetail.actionPlan')}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Status stepper ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
        className={`rounded-2xl border p-4 overflow-x-auto ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-gray-50 border-gray-200'}`}
      >
        <StatusStepper status={error.status} isDark={isDark} />
      </motion.div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto">
        {(['registo', 'analise', 'revisao', 'historico'] as const).map(tab => {
          const labels: Record<string, string> = {
            registo: t('tutoriaDetail.tabRegisto', 'Registo'),
            analise: t('tutoriaDetail.tabAnalise', 'Análise'),
            revisao: t('tutoriaDetail.tabRevisao', 'Revisão Tutor'),
            historico: t('tutoriaDetail.tabHistorico', 'Histórico'),
          };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? isDark ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200'
                  : isDark ? 'bg-white/[0.03] text-gray-500 border border-white/5 hover:text-white' : 'bg-gray-50 text-gray-400 border border-gray-100 hover:text-gray-700'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ── TAB: Registo ─────────────────────────────────────────────────────── */}
      {activeTab === 'registo' && (
        <>
      {/* ── Meta grid ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        {/* ── Pessoas & Datas ── */}
        <div className={`px-5 py-3 border-b text-xs font-bold uppercase tracking-wider ${isDark ? 'border-white/8 bg-white/[0.02] text-gray-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
          {t('tutoriaDetail.peopleDates')}
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
          {[
            { icon: User,      label: t('tutoriaDetail.tutorado'),       value: error.tutorado_name ?? '—' },
            { icon: User,      label: t('tutoriaDetail.registeredBy'),   value: error.created_by_name ?? '—' },
            error.approver_name ? { icon: UserCheck, label: t('tutoriaDetail.approver'), value: error.approver_name } : null,
            error.detected_by_name ? { icon: Eye, label: t('tutoriaDetail.detectedBy'), value: error.detected_by_name } : null,
            { icon: Calendar,  label: t('tutoriaDetail.dateOccurrence'), value: new Date(error.date_occurrence).toLocaleDateString('pt-PT') },
            error.date_detection ? { icon: Calendar, label: t('tutoriaDetail.dateDetection'), value: new Date(error.date_detection).toLocaleDateString('pt-PT') } : null,
            error.date_solution ? { icon: Calendar, label: t('tutoriaDetail.dateSolution'), value: new Date(error.date_solution).toLocaleDateString('pt-PT') } : null,
          ].filter(Boolean).map(({ icon: Icon, label, value }: any) => (
            <div key={label}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </p>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Classificação ── */}
        <div className={`px-5 py-3 border-b border-t text-xs font-bold uppercase tracking-wider ${isDark ? 'border-white/8 bg-white/[0.02] text-gray-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
          {t('tutoriaDetail.classification')}
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
          {[
            { icon: Shield,        label: t('tutoriaDetail.severity_label'),     value: SEVERITY_LABEL[error.severity] ?? error.severity },
            { icon: Tag,           label: t('tutoriaDetail.category'),     value: error.category_name ?? '—' },
            { icon: Package,       label: t('tutoriaDetail.service'),       value: error.product_name ?? '—' },
            error.activity_name    ? { icon: Activity,      label: t('tutoriaDetail.activity'),     value: error.activity_name } : null,
            error.error_type_name  ? { icon: AlertTriangle, label: t('tutoriaDetail.errorType'),  value: error.error_type_name } : null,
            error.origin_name      ? { icon: Globe,         label: t('tutoriaDetail.origin'),        value: error.origin_name } : null,
            error.impact_name      ? { icon: Zap,           label: t('tutoriaDetail.impact'),       value: error.impact_name } : null,
            error.department_name  ? { icon: Building,      label: t('tutoriaDetail.department'),  value: error.department_name } : null,
            { icon: ClipboardList, label: t('tutoriaDetail.plans'),        value: t('tutoriaDetail.plansCreated', { count: plans.length }) },
          ].filter(Boolean).map(({ icon: Icon, label, value }: any) => (
            <div key={label}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </p>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Transação (only if any transaction field exists) ── */}
        {(error.bank_name || error.office || error.reference_code || error.currency || error.amount != null || error.final_client) && (
          <>
            <div className={`px-5 py-3 border-b border-t text-xs font-bold uppercase tracking-wider ${isDark ? 'border-white/8 bg-white/[0.02] text-gray-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
              {t('tutoriaDetail.transactionData')}
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
              {[
                error.bank_name      ? { icon: Building2, label: t('tutoriaDetail.bank'),         value: error.bank_name } : null,
                error.office         ? { icon: MapPin,     label: t('tutoriaDetail.office'),    value: error.office } : null,
                error.reference_code ? { icon: Hash,       label: t('tutoriaDetail.reference'),    value: error.reference_code } : null,
                error.currency       ? { icon: Banknote,   label: t('tutoriaDetail.currency'),         value: error.currency } : null,
                error.amount != null ? { icon: Banknote,   label: t('tutoriaDetail.amount'),      value: error.amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 }) } : null,
                error.final_client   ? { icon: User,       label: t('tutoriaDetail.finalClient'), value: error.final_client } : null,
              ].filter(Boolean).map(({ icon: Icon, label, value }: any) => (
                <div key={label}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    <Icon className="w-3.5 h-3.5" />{label}
                  </p>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                </div>
              ))}
            </div>
          </>
        )}
        {/* ── Solução / Análise ── */}
        {(error.solution || error.action_plan_text || error.analysis_5_why) && (
          <div className={`px-5 pb-5 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
            {error.analysis_5_why && (
              <>
                <p className={`text-xs font-bold uppercase tracking-wider mt-4 mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {t('tutoriaDetail.rootCauseAnalysis')}
                </p>
                <p className={`text-sm whitespace-pre-wrap mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {error.analysis_5_why}
                </p>
              </>
            )}
            {error.solution && (
              <>
                <p className={`text-xs font-bold uppercase tracking-wider mt-4 mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {t('tutoriaDetail.solution')}
                </p>
                <p className={`text-sm whitespace-pre-wrap mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {error.solution}
                </p>
              </>
            )}
            {error.action_plan_text && (
              <>
                <p className={`text-xs font-bold uppercase tracking-wider mt-4 mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {t('tutoriaDetail.actionPlanText')}
                </p>
                <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {error.action_plan_text}
                </p>
              </>
            )}
          </div>
        )}

        {/* ── Motivos ── */}
        {error.motivos && error.motivos.length > 0 && (
          <div className={`px-5 pb-5 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mt-4 mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {t('tutoriaDetail.errorReasons')} ({error.motivos.length})
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

        {/* ── Refs ── */}
        {error.refs && error.refs.length > 0 && (
          <div className={`px-5 pb-5 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mt-4 mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {t('tutoriaDetail.refs', 'Referências')} ({error.refs.length})
            </p>
            <div className="overflow-x-auto">
              <table className={`w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <thead>
                  <tr className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    <th className="text-left py-2 pr-4">{t('tutoriaDetail.reference', 'Referência')}</th>
                    <th className="text-left py-2 pr-4">{t('tutoriaDetail.currency', 'Divisa')}</th>
                    <th className="text-right py-2 pr-4">{t('tutoriaDetail.amount', 'Importe')}</th>
                    <th className="text-left py-2">{t('tutoriaDetail.finalClient', 'Cliente Final')}</th>
                  </tr>
                </thead>
                <tbody>
                  {error.refs.map(r => (
                    <tr key={r.id} className={`border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                      <td className="py-2 pr-4 font-mono text-xs">{r.referencia || '—'}</td>
                      <td className="py-2 pr-4">{r.divisa || '—'}</td>
                      <td className="py-2 pr-4 text-right">{r.importe != null ? r.importe.toLocaleString('pt-PT', { minimumFractionDigits: 2 }) : '—'}</td>
                      <td className="py-2">{r.cliente_final || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
        </>
      )}

      {/* ── TAB: Análise ─────────────────────────────────────────────────────── */}
      {activeTab === 'analise' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
        >
          <div className={`px-5 py-3 border-b text-xs font-bold uppercase tracking-wider ${isDark ? 'border-white/8 bg-white/[0.02] text-gray-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
            {t('tutoriaDetail.analysisSection', 'Dados de Análise')}
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
            {[
              { label: t('tutoriaDetail.impactLevel', 'Nível Impacto'), value: error.impact_level || '—' },
              { label: t('tutoriaDetail.impactDetail', 'Detalhe Impacto'), value: error.impact_detail || '—' },
              { label: t('tutoriaDetail.origin', 'Origem'), value: error.origin_name || '—' },
              { label: t('tutoriaDetail.originDetail', 'Detalhe Origem'), value: error.origin_detail || '—' },
              { label: t('tutoriaDetail.grabador', 'Grabador'), value: error.grabador_name || '—' },
              { label: t('tutoriaDetail.liberador', 'Liberador'), value: error.liberador_name || '—' },
              { label: t('tutoriaDetail.solutionConfirmed', 'Solução Confirmada'), value: error.solution_confirmed ? t('common.yes', 'Sim') : t('common.no', 'Não') },
              { label: t('tutoriaDetail.recurrence', 'Recorrência'), value: error.recurrence_type || '—' },
              error.action_plan_summary ? { label: t('tutoriaDetail.actionPlanSummary', 'Resumo Plano Ação'), value: error.action_plan_summary } : null,
            ].filter(Boolean).map((item: any) => (
              <div key={item.label}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{item.label}</p>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</p>
              </div>
            ))}
          </div>
          {(error.solution || error.analysis_5_why) && (
            <div className={`px-5 pb-5 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
              {error.analysis_5_why && (
                <>
                  <p className={`text-xs font-bold uppercase tracking-wider mt-4 mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('tutoriaDetail.rootCauseAnalysis')}</p>
                  <p className={`text-sm whitespace-pre-wrap mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{error.analysis_5_why}</p>
                </>
              )}
              {error.solution && (
                <>
                  <p className={`text-xs font-bold uppercase tracking-wider mt-4 mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('tutoriaDetail.solution')}</p>
                  <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{error.solution}</p>
                </>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ── TAB: Revisão Tutor ───────────────────────────────────────────────── */}
      {activeTab === 'revisao' && (
        <>

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
              {t('tutoriaDetail.actionPlans')} ({plans.length})
            </p>
          </div>
          {isManager && (
            <button
              onClick={() => navigate(`/tutoria/errors/${error.id}/plans/new`)}
              className={`flex items-center gap-1.5 text-xs font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
            >
              <Plus className="w-3.5 h-3.5" /> {t('tutoriaDetail.newPlan')}
            </button>
          )}
        </div>

        {plans.length === 0 ? (
          <div className={`p-8 text-center text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            {t('tutoriaDetail.noPlans')}
            {isManager && (
              <div className="mt-3">
                <button
                  onClick={() => navigate(`/tutoria/errors/${error.id}/plans/new`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('tutoriaDetail.createPlan')}
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
                      {p.what ?? `${t('tutoriaDetail.planLabel')} #${p.id}`}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isOverdue && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'}`}>{t('tutoriaDetail.overdue')}</span>}
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
                        {p.items_completed}/{p.items_total} {t('tutoriaDetail.actions')} · {pct}%
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
        </>
      )}

      {/* ── TAB: Histórico ───────────────────────────────────────────────────── */}
      {activeTab === 'historico' && (
        <>

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
            {t('tutoriaDetail.comments')} ({comments.length})
          </p>
        </div>

        <div className="p-5 space-y-4">
          {comments.length === 0 && (
            <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {t('tutoriaDetail.noComments')}
            </p>
          )}
          {comments.map(c => (
            <div key={c.id} className={`rounded-xl p-3 ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                  {(c.author_name ?? '?')[0].toUpperCase()}
                </div>
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.author_name ?? t('tutoriaDetail.anonymous')}</span>
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
              placeholder={t('tutoriaDetail.addComment')}
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
        </>
      )}

      {/* ── Cancel Modal ─────────────────────────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-md rounded-2xl border p-6 ${isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200 shadow-xl'}`}
          >
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('tutoriaDetail.cancelError', 'Cancelar Incidência')}
            </h3>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder={t('tutoriaDetail.cancelReasonPlaceholder', 'Motivo do cancelamento...')}
              rows={4}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all mb-4 ${
                isDark
                  ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600 focus:border-red-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-400'
              }`}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {t('common.cancel', 'Voltar')}
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || actionLoading}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('tutoriaDetail.confirmCancel', 'Confirmar Cancelamento')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Return Analysis Modal ────────────────────────────────────────────── */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-md rounded-2xl border p-6 ${isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200 shadow-xl'}`}
          >
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('tutoriaDetail.returnAnalysis', 'Devolver Análise')}
            </h3>
            <textarea
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
              placeholder={t('tutoriaDetail.returnReasonPlaceholder', 'Motivo da devolução...')}
              rows={4}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all mb-4 ${
                isDark
                  ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600 focus:border-amber-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-400'
              }`}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowReturnModal(false); setReturnReason(''); }}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {t('common.cancel', 'Voltar')}
              </button>
              <button
                onClick={handleReturnAnalysis}
                disabled={!returnReason.trim() || actionLoading}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('tutoriaDetail.confirmReturn', 'Confirmar Devolução')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
