import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Users, AlertTriangle, CheckCircle2, TrendingUp, Search } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

interface TeamStat {
  team_id: number;
  team_name: string;
  product_name: string | null;
  manager_name: string | null;
  members_count: number;
  errors_count: number;
  plans_total: number;
  plans_completed: number;
  completion_rate: number;
  avg_mpu: number;
}

const BAR_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export default function TeamsDashboard() {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const { isDark } = useTheme();
  const [teams, setTeams] = useState<TeamStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/relatorios/teams', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setTeams(Array.isArray(d) ? d : d.teams ?? []))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;

  const filtered = teams.filter(t =>
    t.team_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.product_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const axisColor = isDark ? '#6b7280' : '#9ca3af';
  const completionData = filtered.map(t => ({ name: t.team_name, value: t.completion_rate }));
  const errorsData = filtered.map(t => ({ name: t.team_name, value: t.errors_count }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{t('relTeams.portalTitle')}</p>
        <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('relTeams.title')}</h1>
      </div>

      {/* Search */}
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200'}`}>
        <Search className="w-4 h-4 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('relTeams.searchPlaceholder')}
          className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
        />
      </div>

      {/* Charts */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className={`rounded-2xl border p-5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
          >
            <p className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('relTeams.completionRate')}</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={completionData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#f3f4f6'} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: axisColor }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: axisColor }} />
                <Tooltip contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, t('relTeams.rate')]} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {completionData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={`rounded-2xl border p-5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
          >
            <p className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('relTeams.errorsByTeam')}</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={errorsData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#f3f4f6'} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: axisColor }} />
                <YAxis tick={{ fontSize: 10, fill: axisColor }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs uppercase tracking-wider ${isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-50 text-gray-500'}`}>
                <th className="px-5 py-3 text-left font-semibold">{t('relTeams.team')}</th>
                <th className="px-5 py-3 text-left font-semibold">{t('relTeams.product')}</th>
                <th className="px-5 py-3 text-left font-semibold">{t('relTeams.manager')}</th>
                <th className="px-4 py-3 text-center font-semibold"><Users className="w-3.5 h-3.5 inline" /></th>
                <th className="px-4 py-3 text-center font-semibold"><AlertTriangle className="w-3.5 h-3.5 inline text-red-500" /></th>
                <th className="px-4 py-3 text-center font-semibold"><CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-500" /></th>
                <th className="px-4 py-3 text-center font-semibold"><TrendingUp className="w-3.5 h-3.5 inline text-blue-500" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-5 py-8 text-center text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {t('relTeams.noTeamFound')}
                  </td>
                </tr>
              ) : (
                filtered.map((t, i) => (
                  <tr key={t.team_id}
                    className={`border-t transition-colors ${isDark ? 'border-white/5 hover:bg-white/[0.02]' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className={`px-5 py-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.team_name}</td>
                    <td className={`px-5 py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.product_name ?? '—'}</td>
                    <td className={`px-5 py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.manager_name ?? '—'}</td>
                    <td className={`px-4 py-4 text-center font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.members_count}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-medium ${t.errors_count > 0 ? 'text-red-500' : isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {t.errors_count}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${t.completion_rate >= 80 ? 'bg-emerald-500/10 text-emerald-500'
                          : t.completion_rate >= 50 ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-red-500/10 text-red-500'}`}>
                        {t.completion_rate}%
                      </span>
                    </td>
                    <td className={`px-4 py-4 text-center font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t.avg_mpu > 0 ? `${t.avg_mpu}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
