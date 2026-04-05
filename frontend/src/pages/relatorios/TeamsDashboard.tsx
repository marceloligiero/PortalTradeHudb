import { useState, useEffect } from 'react';
import { Loader2, Users, AlertTriangle, CheckCircle2, TrendingUp, Search, Building2 } from 'lucide-react';
import { BarList } from '@tremor/react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import { KpiCard, RateBar } from '../../components/reports';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface InternalErrorRow { team_name: string; errors_count: number; }

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

/* ─── Main ────────────────────────────────────────────────────────────────── */

export default function TeamsDashboard() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<TeamStat[]>([]);
  const [internalErrors, setInternalErrors] = useState<InternalErrorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hideEmpty, setHideEmpty] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/relatorios/teams'),
      api.get('/dw/internal-errors/by-team'),
    ]).then(([teamsRes, errRes]) => {
      if (teamsRes.status === 'fulfilled') {
        const d = teamsRes.value.data;
        setTeams(Array.isArray(d) ? d : d.teams ?? []);
      }
      if (errRes.status === 'fulfilled') {
        const d = errRes.value.data;
        setInternalErrors(Array.isArray(d) ? d : []);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#EC0000]" />
      </div>
    );
  }

  const filtered = teams.filter(team => {
    if (hideEmpty && team.members_count === 0) return false;
    return (
      team.team_name.toLowerCase().includes(search.toLowerCase()) ||
      (team.product_name ?? '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const internalErrMap = Object.fromEntries(internalErrors.map(e => [e.team_name, e.errors_count]));

  /* Summary KPIs — only teams with members */
  const activeTeams = teams.filter(t => t.members_count > 0);
  const avgCompletion = activeTeams.length > 0
    ? Math.round(activeTeams.reduce((s, t) => s + t.completion_rate, 0) / activeTeams.length)
    : 0;
  const totalMembers = teams.reduce((s, t) => s + t.members_count, 0);

  /* Tremor chart data — only teams with members */
  const completionBarList = filtered
    .filter(t => t.members_count > 0)
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
        <KpiCard index={0}
          icon={Building2} label={t('relTeams.title', 'Equipas')} value={activeTeams.length}
          boxClass="bg-blue-50 dark:bg-blue-900/20" iconClass="text-blue-600 dark:text-blue-400"
        />
        <KpiCard index={1}
          icon={Users} label={t('overview.users', 'Membros')} value={totalMembers}
          boxClass="bg-emerald-50 dark:bg-emerald-900/20" iconClass="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard index={2}
          icon={TrendingUp} label={t('relTeams.completionRate', 'Taxa Média')} value={`${avgCompletion}%`}
          boxClass={avgCompletion >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/20' : avgCompletion >= 50 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20'}
          iconClass={avgCompletion >= 80 ? 'text-emerald-600 dark:text-emerald-400' : avgCompletion >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-[#EC0000]'}
        />
      </div>

      {/* ── Charts — BarList (Tremor) ─────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-sm font-headline font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {t('relTeams.completionRate')}
            </p>
            <BarList
              data={completionBarList}
              color="emerald"
              valueFormatter={(v: number) => `${v}%`}
              className="mt-1"
            />
          </div>

          {errorsBarList.length > 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <p className="text-sm font-headline font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <AlertTriangle className="w-4 h-4 text-[#EC0000]" />
                {t('relTeams.errorsByTeam')}
              </p>
              <BarList
                data={errorsBarList}
                color="red"
                valueFormatter={(v: number) => `${v} erros`}
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

      {/* ── Search + toggle ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3 rounded-xl border px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#EC0000]/30 transition-shadow">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('relTeams.searchPlaceholder')}
            className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
        <button
          onClick={() => setHideEmpty(v => !v)}
          className={`flex-shrink-0 px-3 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
            hideEmpty
              ? 'bg-[#EC0000] text-white border-[#EC0000]'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
          }`}
        >
          {hideEmpty ? t('relTeams.showAll', 'Todas') : t('relTeams.hideEmpty', 'Só ativas')}
        </button>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={t('relTeams.title')}>
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
                <th className="px-4 py-3 text-center font-semibold text-orange-500" title={t('relTeams.internalErrors', 'Erros Internos')}>
                  ⚠
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-600">
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
                    <td className="px-4 py-4 text-center">
                      {(() => {
                        const n = internalErrMap[team.team_name] ?? 0;
                        return (
                          <span className={`font-mono font-medium ${n > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-600'}`}>
                            {n > 0 ? n : '—'}
                          </span>
                        );
                      })()}
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
