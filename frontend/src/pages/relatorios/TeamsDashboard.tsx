import { useState, useEffect } from 'react';
import { Loader2, Users, AlertTriangle, CheckCircle2, TrendingUp, Search } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';

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

const BAR_COLORS = ['#EC0000', '#10B981', '#F59E0B', '#3B82F6', '#8b5cf6', '#06b6d4', '#f97316'];

/* Custom Recharts tooltip using Tailwind dark: classes */
function ChartTooltip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-headline font-medium text-gray-900 dark:text-white mb-0.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="font-mono" style={{ color: entry.color }}>
          {entry.value}{suffix ?? ''}
        </p>
      ))}
    </div>
  );
}

export default function TeamsDashboard() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<TeamStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/relatorios/teams')
      .then(r => { const d = r.data; setTeams(Array.isArray(d) ? d : d.teams ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#EC0000]" /></div>;

  const filtered = teams.filter(team =>
    team.team_name.toLowerCase().includes(search.toLowerCase()) ||
    (team.product_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const completionData = filtered.map(team => ({ name: team.team_name, value: team.completion_rate }));
  const errorsData = filtered.map(team => ({ name: team.team_name, value: team.errors_count }));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1 text-[#EC0000]">
          {t('relTeams.portalTitle')}
        </p>
        <h1 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">
          {t('relTeams.title')}
        </h1>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 rounded-xl border px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#EC0000]/30 transition-shadow">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('relTeams.searchPlaceholder')}
          className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Charts */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion Rate Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-sm font-headline font-bold mb-4 text-gray-900 dark:text-white">
              {t('relTeams.completionRate')}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={completionData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip content={<ChartTooltip suffix="%" />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {completionData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Errors by Team Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-sm font-headline font-bold mb-4 text-gray-900 dark:text-white">
              {t('relTeams.errorsByTeam')}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={errorsData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#EC0000" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50 text-gray-500">
                <th className="px-5 py-3 text-left font-semibold">{t('relTeams.team')}</th>
                <th className="px-5 py-3 text-left font-semibold">{t('relTeams.product')}</th>
                <th className="px-5 py-3 text-left font-semibold">{t('relTeams.manager')}</th>
                <th className="px-4 py-3 text-center font-semibold"><Users className="w-3.5 h-3.5 inline" /></th>
                <th className="px-4 py-3 text-center font-semibold"><AlertTriangle className="w-3.5 h-3.5 inline text-red-500" /></th>
                <th className="px-4 py-3 text-center font-semibold"><CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-500" /></th>
                <th className="px-4 py-3 text-center font-semibold"><TrendingUp className="w-3.5 h-3.5 inline text-blue-500" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-600">
                    {t('relTeams.noTeamFound')}
                  </td>
                </tr>
              ) : (
                filtered.map((team) => (
                  <tr key={team.team_id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">{team.team_name}</td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{team.product_name ?? '---'}</td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{team.manager_name ?? '---'}</td>
                    <td className="px-4 py-4 text-center font-mono font-medium text-gray-900 dark:text-white">{team.members_count}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-mono font-medium ${team.errors_count > 0 ? 'text-red-500' : 'text-gray-400 dark:text-gray-600'}`}>
                        {team.errors_count}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold
                        ${team.completion_rate >= 80 ? 'bg-emerald-500/10 text-emerald-500'
                          : team.completion_rate >= 50 ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-red-500/10 text-red-500'}`}>
                        {team.completion_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-mono font-medium text-gray-700 dark:text-gray-300">
                      {team.avg_mpu > 0 ? `${team.avg_mpu}` : '---'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
