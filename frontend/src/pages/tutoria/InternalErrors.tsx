import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Plus, Search,
  RefreshCw, Calendar, User, ArrowRight, Loader2,
  Scale, FileText,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

interface InternalError {
  id: number;
  senso_id: number;
  gravador_id: number;
  gravador_name?: string;
  liberador_name?: string;
  creator_name?: string;
  impact_name?: string;
  impact_level?: string;
  category_name?: string;
  error_type_name?: string;
  department_name?: string;
  bank_name?: string;
  description: string;
  reference_code?: string;
  date_occurrence?: string;
  peso_liberador?: number;
  peso_gravador?: number;
  peso_tutor?: number;
  status: string;
  has_learning_sheet: boolean;
  has_action_plan: boolean;
  created_at: string;
}

interface Senso {
  id: number;
  name: string;
  status: string;
}

function statusCls(s: string, isDark: boolean) {
  const dark: Record<string, string> = {
    PENDENTE: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    AVALIADO: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    PLANO_CRIADO: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    CONCLUIDO: 'bg-green-500/15 text-green-400 border-green-500/20',
  };
  const light: Record<string, string> = {
    PENDENTE: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    AVALIADO: 'bg-blue-50 text-blue-700 border-blue-200',
    PLANO_CRIADO: 'bg-purple-50 text-purple-700 border-purple-200',
    CONCLUIDO: 'bg-green-50 text-green-700 border-green-200',
  };
  const m = isDark ? dark : light;
  return m[s] || (isDark ? 'bg-gray-500/15 text-gray-400 border-gray-500/20' : 'bg-gray-100 text-gray-600 border-gray-200');
}

const STATUS_LABELS_STATIC: Record<string, string> = {
  PENDENTE: 'Pendente',
  AVALIADO: 'Avaliado',
  PLANO_CRIADO: 'Plano Criado',
  CONCLUIDO: 'Concluído',
};

export default function InternalErrors() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [errors, setErrors] = useState<InternalError[]>([]);
  const [sensos, setSensos] = useState<Senso[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sensoFilter, setSensoFilter] = useState('');

  const isLiberador = user?.is_liberador || user?.role === 'ADMIN';

  const load = async () => {
    setLoading(true);
    try {
      const [errRes, sensoRes] = await Promise.all([
        axios.get('/internal-errors/errors', { params: { senso_id: sensoFilter || undefined, status: statusFilter || undefined } }),
        axios.get('/internal-errors/sensos'),
      ]);
      setErrors(Array.isArray(errRes.data) ? errRes.data : []);
      setSensos(Array.isArray(sensoRes.data) ? sensoRes.data : []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [sensoFilter, statusFilter]);

  const filtered = errors.filter(e => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      e.description?.toLowerCase().includes(s) ||
      e.gravador_name?.toLowerCase().includes(s) ||
      e.reference_code?.toLowerCase().includes(s) ||
      e.bank_name?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <ShieldAlert className="w-7 h-7 inline mr-2 text-red-500" />
            {t('internalErrors.title')}
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('internalErrors.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className={`p-2.5 rounded-xl border transition-all ${isDark ? 'border-white/10 hover:bg-white/5 text-gray-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
          {isLiberador && (
            <button onClick={() => navigate('/tutoria/internal-errors/new')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm hover:shadow-lg hover:shadow-red-600/20 transition-all">
              <Plus className="w-4 h-4" /> {t('internalErrors.registerError')}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={`flex flex-wrap gap-3 p-4 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200'}`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('internalErrors.searchPlaceholder')}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
          />
        </div>
        <select value={sensoFilter} onChange={e => setSensoFilter(e.target.value)}
          className={`px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
          <option value="">{t('internalErrors.allSensos')}</option>
          {sensos.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className={`px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
          <option value="">{t('internalErrors.allStatuses')}</option>
          {Object.entries(STATUS_LABELS_STATIC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('internalErrors.total'), value: errors.length, color: 'text-white' },
          { label: t('internalErrors.pending'), value: errors.filter(e => e.status === 'PENDENTE').length, color: 'text-yellow-400' },
          { label: t('internalErrors.withPlan'), value: errors.filter(e => e.has_action_plan).length, color: 'text-purple-400' },
          { label: t('internalErrors.completed'), value: errors.filter(e => e.status === 'CONCLUIDO').length, color: 'text-green-400' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200'}`}>
            <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-20 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200'}`}>
          <ShieldAlert className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('internalErrors.noErrors')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((err, idx) => (
              <motion.div
                key={err.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => navigate(`/tutoria/internal-errors/${err.id}`)}
                className={`group p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-lg ${isDark ? 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-gray-200/50'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>#{err.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusCls(err.status, isDark)}`}>
                        {STATUS_LABELS_STATIC[err.status] || err.status}
                      </span>
                      {err.has_action_plan && (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                          {t('internalErrors.plan')}
                        </span>
                      )}
                      {err.has_learning_sheet && (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                          <FileText className="w-3 h-3 inline mr-1" />{t('internalErrors.sheet')}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-medium line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{err.description}</p>
                    <div className={`flex flex-wrap items-center gap-4 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {err.gravador_name || 'N/A'}</span>
                      {err.date_occurrence && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(err.date_occurrence).toLocaleDateString('pt-PT')}</span>}
                      {err.bank_name && <span>{err.bank_name}</span>}
                      {err.reference_code && <span className="font-mono">{err.reference_code}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(err.peso_liberador != null || err.peso_gravador != null || err.peso_tutor != null) && (
                      <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Scale className="w-3 h-3" />
                        {err.peso_liberador ?? '-'}/{err.peso_gravador ?? '-'}/{err.peso_tutor ?? '-'}
                      </div>
                    )}
                    <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
