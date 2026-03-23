import { useState, useEffect } from 'react';
import { Loader2, User, AlertTriangle, CheckCircle2, Award, Clock, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface MemberStat {
  user_id: number;
  name: string;
  email: string;
  role: string;
  errors_count: number;
  plans_total: number;
  plans_completed: number;
  completion_rate: number;
  avg_mpu: number;
  certificates: number;
}

const ROLE_COLORS: Record<string, string> = {
  STUDENT: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  TRAINEE: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  TRAINER: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  MANAGER: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

/* ─── Progress Bar ────────────────────────────────────────────────────────── */

function RateBar({ value }: { value: number }) {
  const color =
    value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-[#EC0000]';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span
        className={`text-xs font-mono font-semibold
          ${value >= 80 ? 'text-emerald-600 dark:text-emerald-400' : value >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-[#EC0000]'}`}
      >
        {value}%
      </span>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */

export default function MembersDashboard() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<MemberStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<keyof MemberStat>('completion_rate');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    api.get('/relatorios/members')
      .then(r => {
        const d = r.data;
        setMembers(Array.isArray(d) ? d : d.members ?? []);
      })
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

  const filtered = members
    .filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const va = a[sort] as number | string;
      const vb = b[sort] as number | string;
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb));
      return sortAsc ? cmp : -cmp;
    });

  function toggleSort(col: keyof MemberStat) {
    if (sort === col) setSortAsc(!sortAsc);
    else { setSort(col); setSortAsc(false); }
  }

  const SortIcon = ({ col }: { col: keyof MemberStat }) => {
    if (sort !== col) return null;
    return sortAsc
      ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
      : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
  };

  const SortTh = ({ col, children, className = '' }: { col: keyof MemberStat; children: React.ReactNode; className?: string }) => (
    <th
      onClick={() => toggleSort(col)}
      className={`py-3 font-semibold cursor-pointer select-none transition-colors hover:text-gray-700 dark:hover:text-gray-300
        ${sort === col ? 'text-[#EC0000]' : ''} ${className}`}
    >
      {children}<SortIcon col={col} />
    </th>
  );

  /* Summary stats */
  const total = members.length;
  const avgCompletion = total > 0 ? Math.round(members.reduce((s, m) => s + m.completion_rate, 0) / total) : 0;
  const totalErrors = members.reduce((s, m) => s + m.errors_count, 0);
  const totalCerts = members.reduce((s, m) => s + m.certificates, 0);

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1 text-[#EC0000]">
          {t('relMembers.portalTitle')}
        </p>
        <h1 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">
          {t('relMembers.title')}
        </h1>
      </div>

      {/* ── Summary KPIs ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: User, label: t('relMembers.members'), value: total, boxBg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400' },
          { icon: CheckCircle2, label: t('relMembers.avgRate'), value: `${avgCompletion}%`, boxBg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { icon: AlertTriangle, label: t('relMembers.totalErrors'), value: totalErrors, boxBg: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-[#EC0000]' },
          { icon: Award, label: t('relMembers.certificates'), value: totalCerts, boxBg: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-600 dark:text-amber-400' },
        ].map(({ icon: Icon, label, value, boxBg, iconColor }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${boxBg}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <p className="text-xl font-mono font-black text-gray-900 dark:text-white">{value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl border px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#EC0000]/30 transition-shadow">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('relMembers.searchPlaceholder')}
          className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50 text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <th className="px-5 py-3 text-left font-semibold">{t('relMembers.member')}</th>
                <th className="px-5 py-3 text-left font-semibold">{t('relMembers.role')}</th>
                <SortTh col="errors_count" className="px-4 text-center">
                  <AlertTriangle className="w-3.5 h-3.5 inline text-red-400" />
                </SortTh>
                <SortTh col="plans_total" className="px-4 text-center">
                  {t('relMembers.plans')}
                </SortTh>
                <SortTh col="completion_rate" className="px-5 text-left">
                  {t('relMembers.avgRate', 'Taxa')}
                </SortTh>
                <SortTh col="avg_mpu" className="px-4 text-center">
                  <Clock className="w-3.5 h-3.5 inline text-blue-400" />
                </SortTh>
                <SortTh col="certificates" className="px-4 text-center">
                  <Award className="w-3.5 h-3.5 inline text-yellow-400" />
                </SortTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-600">
                    {t('relMembers.noMemberFound')}
                  </td>
                </tr>
              ) : (
                filtered.map(m => (
                  <tr
                    key={m.user_id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{m.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-600">{m.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[m.role] ?? 'bg-gray-500/10 text-gray-500'}`}>
                        {t(`relMembers.roles.${m.role}`, m.role)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-mono font-medium ${m.errors_count > 0 ? 'text-[#EC0000]' : 'text-gray-400 dark:text-gray-600'}`}>
                        {m.errors_count}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-mono font-medium text-gray-700 dark:text-gray-300">
                      {m.plans_completed}/{m.plans_total}
                    </td>
                    <td className="px-5 py-4">
                      <RateBar value={m.completion_rate} />
                    </td>
                    <td className="px-4 py-4 text-center font-mono font-medium text-gray-700 dark:text-gray-300">
                      {m.avg_mpu > 0 ? m.avg_mpu : '---'}
                    </td>
                    <td className={`px-4 py-4 text-center font-mono font-medium ${m.certificates > 0 ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-600'}`}>
                      {m.certificates > 0 ? m.certificates : '---'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {filtered.length} / {total} {t('relMembers.members', 'membros')}
          </span>
        </div>
      </div>

    </div>
  );
}
