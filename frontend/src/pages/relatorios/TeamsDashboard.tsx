import { useState, useEffect } from 'react';
import { Loader2, Users, AlertTriangle, CheckCircle2, TrendingUp, Search, Building2 } from 'lucide-react';
import { BarChart, BarList } from '@tremor/react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';

/* ─── Types ──────────────────────────────────────────────────────────────── */

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

/* ─── Progress bar ────────────────────────────────────────────────────────── */

function RateBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-[#EC0000]';
  const textColor = value >= 80
    ? 'text-emerald-600 dark:text-emerald-400'
    : value >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-[#EC0000]';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-mono font-semibold ${textColor}`}>{value}%</span>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */

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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#EC0000]" />
      </div>
    );
  }

  const filtered = teams.filter(team =>
    team.team_name.toLowerCase().includes(search.toLowerCase()) ||
    (team.product_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  /* Summary KPIs */
  const avgCompletion = teams.length > 0
    ? Math.round(teams.reduce((s, t) => s + t.completion_rate, 0) / teams.length)
    : 0;
  const totalMembers = teams.reduce((s, t) => s + t.members_count, 0);
  const totalErrors = teams.reduce((s, t) => s + t.errors_count, 0);

  /* Tremor chart data */
  const completionBarList = filtered
    .sort((a, b) => b.completion_rate - a.completion_rate)
    .map(t => ({ name: t.team_name, value: t.completion_rate }));

  const errorsBarList = filtered
    .filter(t => t.errors_count > 0)
    .sort((a, b) => b.errors_count - a.errors_count)
    .map(t => ({ name: t.team_name, value: t.errors_count }));

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1 text-[#EC0000]">
          {t('relTeams.portalTitle')}
        </p>
        <h1 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">
          {t('relTeams.title')}
        </h1>
      </div>

      {/* ── Summary KPIs ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Building2, label: t('relTeams.title', 'Equipas'), value: teams.length, boxBg: 'bg-blue-50 dark:bg-blue-900/20', icon_: 'text-blue-600 dark:text-blue-400' },
          { icon: Users, label: t('overview.users', 'Membros'), value: totalMembers, boxBg: 'bg-emerald-50 dark:bg-emerald-900/20', icon_: 'text-emerald-600 dark:text-emerald-400' },
          { icon: TrendingUp, label: t('relTeams.completionRate', 'Taxa Média'), value: `${avgCompletion}%`, boxBg: avgCompletion >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/20' : avgCompletion >= 50 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20', icon_: avgCompletion >= 80 ? 'text-emerald-600 dark:text-emerald-400' : avgCompletion >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-[#EC0000]' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${kpi.boxBg}`}>
              <kpi.icon className={`w-5 h-5 ${kpi.icon_}`} />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts — BarList (Tremor) ─────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Completion rate ranking */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-sm font-headline font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {t('relTeams.completionRate')}
            </p>
            <BarList
              data={completionBarList}
              color="emerald"
              valueFormatter={(v) => `${v}%`}
              className="mt-1"
            />
          </div>

          {/* Errors by team */}
          {errorsBarList.length > 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <p className="text-sm font-headline font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <AlertTriangle className="w-4 h-4 text-[#EC0000]" />
                {t('relTeams.errorsByTeam')}
              </p>
              <BarList
                data={errorsBarList}
                color="red"
                valueFormatter={(v) => `${v} erros`}
                className="mt-1"
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex items-center justify-center">
              <div className="text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('relTeams.noErrors', 'Sem erros registados')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl border px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#EC0000]/30 transition-shadow">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('relTeams.searchPlaceholder')}
          className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50 text-gray-500">
                <th className="px-5 py-3 text-left font-semibold">{t('relTeams.team')}</th>
                <th className="px-5 py-3 text-left font-semibold">{t('relTeams.product')}</th>
                <th className="px-5 py-3 text-left font-semibold">{t('relTeams.manager')}</th>
                <th className="px-4 py-3 text-center font-semibold">
                  <Users className="w-3.5 h-3.5 inline" />
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 inline text-red-500" />
                </th>
                <th className="px-5 py-3 text-left font-semibold" style={{ minWidth: 180 }}>
                  {t('relTeams.completionRate', 'Conclusão')}
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 inline text-blue-500" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-600">
                    {t('relTeams.noTeamFound')}
                  </td>
                </tr>
              ) : (
                filtered.map(team => (
                  <tr key={team.team_id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">{team.team_name}</td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{team.product_name ?? '---'}</td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{team.manager_name ?? '---'}</td>
                    <td className="px-4 py-4 text-center font-mono font-medium text-gray-900 dark:text-white">
                      {team.members_count}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-mono font-medium ${team.errors_count > 0 ? 'text-[#EC0000]' : 'text-gray-400 dark:text-gray-600'}`}>
                        {team.errors_count}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <RateBar value={team.completion_rate} />
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
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {filtered.length} / {teams.length} {t('relTeams.title', 'equipas')}
          </span>
        </div>
      </div>

    </div>
  );
}
