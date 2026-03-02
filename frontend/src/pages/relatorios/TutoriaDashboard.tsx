import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, CheckCircle2, RefreshCw, Clock, Shield, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

interface TutoriaData {
  total_errors: number;
  recurrent_errors: number;
  recurrent_rate: number;
  resolved_errors: number;
  resolved_rate: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  plans_by_status: Record<string, number>;
}

const SEVERITY_COLORS: Record<string, string> = {
  BAIXA: '#10b981',
  MEDIA: '#f59e0b',
  ALTA: '#ef4444',
  CRITICA: '#7c3aed',
};
const SEVERITY_LABELS: Record<string, string> = {
  BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', CRITICA: 'Crítica',
};
const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto', IN_PROGRESS: 'Em Curso', RESOLVED: 'Resolvido',
  CLOSED: 'Fechado', PENDING: 'Pendente',
};
const PLAN_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente', IN_PROGRESS: 'Em Curso', COMPLETED: 'Concluído', DELAYED: 'Atrasado',
};

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#7c3aed'];
const BAR_COLORS = ['#6b7280', '#3b82f6', '#10b981', '#f59e0b'];

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-2xl border p-5 flex gap-4 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
        {sub && <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{sub}</p>}
      </div>
    </div>
  );
}

export default function TutoriaDashboard() {
  const { token } = useAuthStore();
  const { isDark } = useTheme();
  const [data, setData] = useState<TutoriaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/relatorios/tutoria', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  if (!data) return null;

  const axisColor = isDark ? '#6b7280' : '#9ca3af';

  const severityData = Object.entries(data.by_severity)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: SEVERITY_LABELS[k] || k, value: v, color: SEVERITY_COLORS[k] || '#6b7280' }));

  const statusData = Object.entries(data.by_status)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v }));

  const plansData = Object.entries(data.plans_by_status)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: PLAN_STATUS_LABELS[k] || k, value: v }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>Portal de Tutoria</p>
        <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Relatório de Tutoria</h1>
      </div>

      {/* KPIs */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <KpiCard icon={AlertTriangle} label="Total de Erros" value={data.total_errors}
          color="bg-gradient-to-br from-red-600 to-red-500" />
        <KpiCard icon={CheckCircle2} label="Taxa de Resolução" value={`${data.resolved_rate}%`}
          sub={`${data.resolved_errors} resolvidos`} color="bg-gradient-to-br from-emerald-600 to-emerald-500" />
        <KpiCard icon={RefreshCw} label="Taxa de Recorrência" value={`${data.recurrent_rate}%`}
          sub={`${data.recurrent_errors} recorrentes`} color="bg-gradient-to-br from-amber-600 to-amber-500" />
        <KpiCard icon={Shield} label="Erros Críticos" value={data.by_severity['CRITICA'] ?? 0}
          color="bg-gradient-to-br from-purple-600 to-purple-500" />
        <KpiCard icon={Clock} label="Em Aberto" value={data.by_status['OPEN'] ?? 0}
          color="bg-gradient-to-br from-blue-600 to-blue-500" />
        <KpiCard icon={TrendingUp} label="Planos Concluídos" value={data.plans_by_status['COMPLETED'] ?? 0}
          color="bg-gradient-to-br from-teal-600 to-teal-500" />
      </motion.div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity pie */}
        {severityData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={`rounded-2xl border p-5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
          >
            <p className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Erros por Severidade</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {severityData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Error status bar chart */}
        {statusData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className={`rounded-2xl border p-5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
          >
            <p className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Erros por Estado</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#f3f4f6'} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisColor }} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Plans bar chart */}
      {plansData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={`rounded-2xl border p-5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
        >
          <p className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Planos de Ação por Estado</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={plansData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#f3f4f6'} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisColor }} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {plansData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
