import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Search, Filter, ChevronDown, Plus, ArrowRight,
  Loader2, Clock, CheckCircle2, XCircle, AlertCircle, User,
  Calendar, TrendingUp,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  id: number;
  error_id: number;
  tutorado_name?: string;
  created_by_name?: string;
  status: string;
  what?: string;
  when_deadline?: string;
  items_total: number;
  items_completed: number;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_STATUS_LABEL: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  AGUARDANDO_APROVACAO: 'Ag. Aprovação',
  APROVADO: 'Aprovado',
  EM_EXECUCAO: 'Em Execução',
  CONCLUIDO: 'Concluído',
  DEVOLVIDO: 'Devolvido',
};
const PLAN_STATUS_ORDER = ['RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'EM_EXECUCAO', 'CONCLUIDO', 'DEVOLVIDO'];

const PLAN_STATUS_ICON: Record<string, React.ElementType> = {
  RASCUNHO: Clock,
  AGUARDANDO_APROVACAO: AlertCircle,
  APROVADO: CheckCircle2,
  EM_EXECUCAO: TrendingUp,
  CONCLUIDO: CheckCircle2,
  DEVOLVIDO: XCircle,
};

function planStatusClsDark(s: string) {
  const m: Record<string, string> = {
    RASCUNHO: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
    AGUARDANDO_APROVACAO: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    APROVADO: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    EM_EXECUCAO: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    CONCLUIDO: 'bg-green-500/15 text-green-400 border-green-500/20',
    DEVOLVIDO: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return m[s] || 'bg-gray-500/15 text-gray-400 border-gray-500/20';
}
function planStatusClsLight(s: string) {
  const m: Record<string, string> = {
    RASCUNHO: 'bg-gray-100 text-gray-600 border-gray-200',
    AGUARDANDO_APROVACAO: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    APROVADO: 'bg-blue-50 text-blue-700 border-blue-200',
    EM_EXECUCAO: 'bg-orange-50 text-orange-700 border-orange-200',
    CONCLUIDO: 'bg-green-50 text-green-700 border-green-200',
    DEVOLVIDO: 'bg-red-50 text-red-700 border-red-200',
  };
  return m[s] || 'bg-gray-100 text-gray-600 border-gray-200';
}

function planTopColor(s: string) {
  const m: Record<string, string> = {
    RASCUNHO: 'from-gray-500 to-gray-600',
    AGUARDANDO_APROVACAO: 'from-yellow-500 to-amber-500',
    APROVADO: 'from-blue-500 to-indigo-500',
    EM_EXECUCAO: 'from-orange-500 to-amber-500',
    CONCLUIDO: 'from-green-500 to-emerald-500',
    DEVOLVIDO: 'from-red-500 to-rose-600',
  };
  return m[s] || 'from-gray-500 to-gray-600';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TutoriaPlans() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const isManager = user?.role === 'ADMIN' || user?.role === 'TRAINER';

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const endpoint = isManager ? '/api/tutoria/plans' : '/api/tutoria/my-plans';
        const res = await axios.get(endpoint);
        setPlans(Array.isArray(res.data) ? res.data : []);
      } catch {
        setLoadError('Não foi possível carregar os planos.');
      } finally {
        setLoading(false);
      }
    })();
  }, [isManager]);

  const filtered = plans.filter(p => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !(p.what ?? '').toLowerCase().includes(q) &&
        !(p.tutorado_name ?? '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const statusCounts = PLAN_STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = plans.filter(p => p.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-8 max-w-6xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className={`border-b pb-8 ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30"
            >
              <ClipboardList className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>Tutoria</span>
              <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {isManager ? 'Planos de Ação' : 'Meus Planos de Ação'}
              </h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                {filtered.length} plano{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Status quick-pills ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex gap-2 flex-wrap"
      >
        <button
          onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            filterStatus === ''
              ? 'bg-blue-500 border-blue-500 text-white'
              : isDark ? 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'
          }`}
        >
          Todos ({plans.length})
        </button>
        {PLAN_STATUS_ORDER.map(s => statusCounts[s] > 0 ? (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              filterStatus === s
                ? 'bg-blue-500 border-blue-500 text-white'
                : isDark ? 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'
            }`}
          >
            {PLAN_STATUS_LABEL[s]} ({statusCounts[s]})
          </button>
        ) : null)}
      </motion.div>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative"
      >
        <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar por ação ou tutorado…"
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
            isDark
              ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600 focus:border-blue-500'
              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400'
          }`}
        />
      </motion.div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
        </div>
      ) : loadError ? (
        <div className={`rounded-2xl border p-6 text-sm ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {loadError}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`rounded-2xl border p-16 text-center ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-white border-gray-200'}`}
        >
          <ClipboardList className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
          <p className={`text-lg font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {plans.length === 0 ? 'Nenhum plano de ação criado' : 'Sem resultados para os filtros aplicados'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <AnimatePresence initial={false}>
            {filtered.map((p, i) => {
              const pct = p.items_total > 0 ? Math.round((p.items_completed / p.items_total) * 100) : 0;
              const isOverdue = p.when_deadline && new Date(p.when_deadline) < new Date() && p.status !== 'CONCLUIDO';
              const StatusIcon = PLAN_STATUS_ICON[p.status] ?? Clock;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  whileHover={{ y: -3, boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.08)' }}
                  onClick={() => navigate(`/tutoria/plans/${p.id}`)}
                  className={`rounded-2xl border overflow-hidden cursor-pointer transition-all ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
                >
                  {/* Color bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${planTopColor(p.status)}`} />

                  <div className="p-5">
                    {/* Status + overdue */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${isDark ? planStatusClsDark(p.status) : planStatusClsLight(p.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        {PLAN_STATUS_LABEL[p.status]}
                      </span>
                      {isOverdue && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'}`}>
                          Vencido
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <p className={`text-sm font-bold mb-3 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {p.what ?? `Plano de Ação #${p.id}`}
                    </p>

                    {/* Meta */}
                    <div className={`space-y-1.5 mb-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {p.tutorado_name && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />{p.tutorado_name}
                        </div>
                      )}
                      {p.when_deadline && (
                        <div className={`flex items-center gap-1.5 ${isOverdue ? isDark ? 'text-red-400' : 'text-red-500' : ''}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          Prazo: {new Date(p.when_deadline).toLocaleDateString('pt-PT')}
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    {p.items_total > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {p.items_completed}/{p.items_total} ações
                          </span>
                          <span className={`text-[10px] font-bold ${pct === 100 ? isDark ? 'text-green-400' : 'text-green-600' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                          <div
                            className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className={`mt-4 pt-3 border-t flex items-center justify-between ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                      <span className={`text-[10px] ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
                        #{p.id} · Erro #{p.error_id}
                      </span>
                      <ArrowRight className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

    </div>
  );
}
