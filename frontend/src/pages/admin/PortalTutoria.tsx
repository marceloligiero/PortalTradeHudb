import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ClipboardList, CheckCircle2, Clock,
  Plus, TrendingUp, Shield, Users, AlertCircle,
  ArrowRight, BarChart3, XCircle, RefreshCw,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashStats {
  total_errors: number;
  errors_by_status: Record<string, number>;
  recurrent_errors: number;
  total_plans: number;
  plans_by_status: Record<string, number>;
  overdue_plans: number;
  severity_counts: Record<string, number>;
}

interface RecentError {
  id: number;
  date_occurrence: string;
  description: string;
  tutorado_name?: string;
  category_name?: string;
  severity: string;
  status: string;
  is_recurrent: boolean;
  recurrence_count: number;
  plans_count: number;
}

interface RecentPlan {
  id: number;
  tutorado_name?: string;
  created_by_name?: string;
  status: string;
  when_deadline?: string;
  items_total: number;
  items_completed: number;
  what?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_LABEL: Record<string, string> = {
  BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', CRITICA: 'Crítica',
};
const SEVERITY_COLOR: Record<string, string> = {
  BAIXA: 'bg-green-500/15 text-green-400 border-green-500/20',
  MEDIA: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  ALTA: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  CRITICA: 'bg-red-500/15 text-red-400 border-red-500/20',
};
const SEVERITY_COLOR_LIGHT: Record<string, string> = {
  BAIXA: 'bg-green-50 text-green-700 border-green-200',
  MEDIA: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  ALTA: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICA: 'bg-red-50 text-red-700 border-red-200',
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

function severityCls(s: string, isDark: boolean) {
  return isDark ? (SEVERITY_COLOR[s] || 'bg-gray-500/15 text-gray-400 border-gray-500/20')
                : (SEVERITY_COLOR_LIGHT[s] || 'bg-gray-100 text-gray-600 border-gray-200');
}

function statusDot(s: string): string {
  const map: Record<string, string> = {
    ABERTO: 'bg-red-400', EM_ANALISE: 'bg-yellow-400', PLANO_CRIADO: 'bg-blue-400',
    EM_EXECUCAO: 'bg-orange-400', CONCLUIDO: 'bg-green-400', VERIFICADO: 'bg-emerald-400',
  };
  return map[s] || 'bg-gray-400';
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, accent, isDark, delay = 0,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; accent: string; isDark: boolean; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`rounded-2xl border p-5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      {sub && <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{sub}</p>}
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PortalTutoria() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const isManager = user?.role === 'ADMIN' || user?.role === 'TRAINER';
  const isStudent = !isManager;

  const [stats, setStats] = useState<DashStats | null>(null);
  const [recentErrors, setRecentErrors] = useState<RecentError[]>([]);
  const [recentPlans, setRecentPlans] = useState<RecentPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, errorsRes, plansRes] = await Promise.allSettled([
          axios.get('/api/tutoria/dashboard'),
          axios.get('/api/tutoria/errors'),
          isStudent
            ? axios.get('/api/tutoria/my-plans')
            : axios.get('/api/tutoria/plans'),
        ]);

        if (dashRes.status === 'fulfilled') setStats(dashRes.value.data);
        if (errorsRes.status === 'fulfilled') {
          const data = errorsRes.value.data;
          setRecentErrors((Array.isArray(data) ? data : []).slice(0, 5));
        }
        if (plansRes.status === 'fulfilled') {
          const data = plansRes.value.data;
          setRecentPlans((Array.isArray(data) ? data : []).slice(0, 5));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [isStudent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>A carregar dashboard…</p>
        </div>
      </div>
    );
  }

  const byStatus = stats?.errors_by_status ?? {};
  const byPlanStatus = stats?.plans_by_status ?? {};
  const sevCounts = stats?.severity_counts ?? {};

  const openErrors = (byStatus['ABERTO'] ?? 0) + (byStatus['EM_ANALISE'] ?? 0) + (byStatus['PLANO_CRIADO'] ?? 0) + (byStatus['EM_EXECUCAO'] ?? 0);
  const pendingPlans = (byPlanStatus['RASCUNHO'] ?? 0) + (byPlanStatus['AGUARDANDO_APROVACAO'] ?? 0) + (byPlanStatus['APROVADO'] ?? 0);
  const activePlans  = byPlanStatus['EM_EXECUCAO'] ?? 0;
  const donePlans    = byPlanStatus['CONCLUIDO'] ?? 0;

  return (
    <div className="space-y-8 max-w-6xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`border-b pb-8 ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                Portal de Gestão de Erros
              </span>
              <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {isStudent ? 'Meu Painel' : 'Dashboard'}
              </h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                {isStudent
                  ? 'Os teus erros e planos de ação atribuídos'
                  : user?.role === 'ADMIN'
                    ? 'Visão geral de toda a operação'
                    : 'Visão da tua equipa de tutorados'}
              </p>
            </div>
          </div>

          {isManager && (
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/tutoria/errors/new')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold shadow-lg shadow-red-500/25"
              >
                <Plus className="w-4 h-4" /> Registar Erro
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle} label="Total de Erros"
          value={stats?.total_errors ?? 0} isDark={isDark}
          accent="bg-gradient-to-br from-red-500 to-rose-600"
          sub={`${openErrors} em aberto`} delay={0.05}
        />
        <StatCard
          icon={RefreshCw} label="Reincidentes"
          value={stats?.recurrent_errors ?? 0} isDark={isDark}
          accent="bg-gradient-to-br from-orange-500 to-amber-500"
          sub="mesmo tipo repetido" delay={0.1}
        />
        <StatCard
          icon={ClipboardList} label="Planos de Ação"
          value={stats?.total_plans ?? 0} isDark={isDark}
          accent="bg-gradient-to-br from-blue-500 to-indigo-500"
          sub={`${activePlans} em execução`} delay={0.15}
        />
        <StatCard
          icon={CheckCircle2} label="Planos Concluídos"
          value={donePlans} isDark={isDark}
          accent="bg-gradient-to-br from-green-500 to-emerald-500"
          sub={stats?.overdue_plans ? `${stats.overdue_plans} vencidos` : 'sem vencidos'}
          delay={0.2}
        />
      </div>

      {/* ── Two-column grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Erros recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
        >
          <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
              </div>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {isStudent ? 'Meus Erros Recentes' : 'Erros Recentes'}
              </p>
            </div>
            <button
              onClick={() => navigate(isStudent ? '/tutoria/my-errors' : '/tutoria/errors')}
              className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentErrors.length === 0 ? (
            <div className={`p-8 text-center text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              Nenhum erro registado
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentErrors.map(e => (
                <div
                  key={e.id}
                  onClick={() => navigate(`/tutoria/errors/${e.id}`)}
                  className={`px-5 py-3.5 flex items-center gap-3 cursor-pointer transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'}`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(e.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {e.description}
                    </p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {e.tutorado_name} · {e.category_name ?? '—'} · {STATUS_LABEL[e.status] ?? e.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {e.is_recurrent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                        {e.recurrence_count}ª vez
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${severityCls(e.severity, isDark)}`}>
                      {SEVERITY_LABEL[e.severity] ?? e.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Planos recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
        >
          <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-3.5 h-3.5 text-white" />
              </div>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {isStudent ? 'Meus Planos' : 'Planos Recentes'}
              </p>
            </div>
            <button
              onClick={() => navigate(isStudent ? '/tutoria/my-plans' : '/tutoria/plans')}
              className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentPlans.length === 0 ? (
            <div className={`p-8 text-center text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              Nenhum plano de ação criado
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentPlans.map(p => {
                const pct = p.items_total > 0 ? Math.round((p.items_completed / p.items_total) * 100) : 0;
                const isDone = p.status === 'CONCLUIDO';
                const isOverdue = p.when_deadline && new Date(p.when_deadline) < new Date() && !isDone;
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/tutoria/plans/${p.id}`)}
                    className={`px-5 py-3.5 cursor-pointer transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className={`text-sm font-semibold truncate flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {p.what ?? `Plano #${p.id}`}
                      </p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${
                        isDone
                          ? isDark ? 'bg-green-500/15 text-green-400 border-green-500/20' : 'bg-green-50 text-green-700 border-green-200'
                          : isOverdue
                            ? isDark ? 'bg-red-500/15 text-red-400 border-red-500/20' : 'bg-red-50 text-red-700 border-red-200'
                            : isDark ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {PLAN_STATUS_LABEL[p.status] ?? p.status}
                        {isOverdue && ' ⚠'}
                      </span>
                    </div>
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {p.tutorado_name ?? '—'}
                    </p>
                    {p.items_total > 0 && (
                      <div>
                        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                          {p.items_completed}/{p.items_total} ações concluídas
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Breakdown cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Erros por severidade */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className={`rounded-2xl border p-5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Erros por Severidade</p>
          </div>
          <div className="space-y-3">
            {(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA'] as const).map(sev => {
              const count = sevCounts[sev] ?? 0;
              const total = stats?.total_errors ?? 1;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const colors: Record<string, string> = {
                CRITICA: 'from-red-500 to-rose-600',
                ALTA: 'from-orange-500 to-amber-500',
                MEDIA: 'from-yellow-500 to-amber-400',
                BAIXA: 'from-green-500 to-emerald-500',
              };
              return (
                <div key={sev}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {SEVERITY_LABEL[sev]}
                    </span>
                    <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{count}</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <div
                      className={`h-full bg-gradient-to-r ${colors[sev]} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Status dos planos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className={`rounded-2xl border p-5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-white" />
            </div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Status dos Planos</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'RASCUNHO',            label: 'Rascunho',    icon: Clock,         color: 'text-gray-400' },
              { key: 'AGUARDANDO_APROVACAO', label: 'Ag. Aprova.', icon: Clock,         color: 'text-yellow-400' },
              { key: 'APROVADO',             label: 'Aprovado',    icon: CheckCircle2,  color: 'text-blue-400' },
              { key: 'EM_EXECUCAO',          label: 'Em Execução', icon: TrendingUp,    color: 'text-orange-400' },
              { key: 'CONCLUIDO',            label: 'Concluído',   icon: CheckCircle2,  color: 'text-green-400' },
              { key: 'DEVOLVIDO',            label: 'Devolvido',   icon: XCircle,       color: 'text-red-400' },
            ].map(({ key, label, icon: Icon, color }) => (
              <div key={key} className={`rounded-xl p-3 ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
                </div>
                <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {byPlanStatus[key] ?? 0}
                </p>
              </div>
            ))}
          </div>
          {(stats?.overdue_plans ?? 0) > 0 && (
            <div className={`mt-4 flex items-center gap-2 p-3 rounded-xl text-sm ${isDark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-semibold">{stats?.overdue_plans} plano(s) com prazo vencido</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Quick actions (manager only) ─────────────────────────────────────── */}
      {isManager && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { label: 'Registar Erro',     icon: AlertTriangle, path: '/tutoria/errors/new',  color: 'from-red-500 to-rose-600' },
            { label: 'Ver todos os Erros', icon: Users,         path: '/tutoria/errors',       color: 'from-orange-500 to-amber-500' },
            { label: 'Ver Planos',         icon: ClipboardList, path: '/tutoria/plans',        color: 'from-blue-500 to-indigo-500' },
          ].map(({ label, icon: Icon, path, color }) => (
            <motion.button
              key={path}
              whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate(path)}
              className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br ${color} text-white font-semibold text-sm shadow-lg`}
            >
              <Icon className="w-5 h-5" />
              {label}
              <ArrowRight className="w-4 h-4 ml-auto" />
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* ── Student CTA ──────────────────────────────────────────────────────── */}
      {isStudent && recentPlans.filter(p => p.status === 'EM_EXECUCAO').length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className={`rounded-2xl border p-5 flex items-center gap-4 ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className={`font-bold text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
              Tens planos em execução que precisam da tua atenção
            </p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-blue-400/70' : 'text-blue-600'}`}>
              Submete evidências para concluir as tuas ações
            </p>
          </div>
          <button
            onClick={() => navigate('/tutoria/my-plans')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold flex-shrink-0"
          >
            Ver Planos <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

    </div>
  );
}
