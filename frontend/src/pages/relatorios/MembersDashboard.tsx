import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, User, AlertTriangle, CheckCircle2, Award, Clock, Search } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

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

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Estudante', TRAINEE: 'Tutorado', TRAINER: 'Tutor', MANAGER: 'Manager',
};
const ROLE_COLORS: Record<string, string> = {
  STUDENT: 'bg-blue-500/10 text-blue-500',
  TRAINEE: 'bg-purple-500/10 text-purple-500',
  TRAINER: 'bg-emerald-500/10 text-emerald-500',
  MANAGER: 'bg-amber-500/10 text-amber-500',
};

export default function MembersDashboard() {
  const { token } = useAuthStore();
  const { isDark } = useTheme();
  const [members, setMembers] = useState<MemberStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<keyof MemberStat>('completion_rate');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetch('/api/relatorios/members', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setMembers(Array.isArray(d) ? d : d.members ?? []))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  const filtered = members
    .filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const va = a[sort] as number | string;
      const vb = b[sort] as number | string;
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sortAsc ? cmp : -cmp;
    });

  function toggleSort(col: keyof MemberStat) {
    if (sort === col) setSortAsc(!sortAsc);
    else { setSort(col); setSortAsc(false); }
  }

  const SortTh = ({ col, children }: { col: keyof MemberStat; children: React.ReactNode }) => (
    <th onClick={() => toggleSort(col)}
      className={`px-4 py-3 text-center font-semibold cursor-pointer select-none transition-colors
        ${sort === col ? isDark ? 'text-emerald-400' : 'text-emerald-600' : ''}`}>
      {children} {sort === col ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  // Summary cards
  const total = members.length;
  const avgCompletion = total > 0 ? Math.round(members.reduce((s, m) => s + m.completion_rate, 0) / total) : 0;
  const totalErrors = members.reduce((s, m) => s + m.errors_count, 0);
  const totalCerts = members.reduce((s, m) => s + m.certificates, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Portal de Relatórios</p>
        <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Minha Equipa</h1>
      </div>

      {/* Summary KPIs */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { icon: User, label: 'Membros', value: total, color: 'bg-gradient-to-br from-blue-600 to-blue-500' },
          { icon: CheckCircle2, label: 'Taxa Média', value: `${avgCompletion}%`, color: 'bg-gradient-to-br from-emerald-600 to-emerald-500' },
          { icon: AlertTriangle, label: 'Total de Erros', value: totalErrors, color: 'bg-gradient-to-br from-red-600 to-red-500' },
          { icon: Award, label: 'Certificados', value: totalCerts, color: 'bg-gradient-to-br from-yellow-600 to-yellow-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`rounded-2xl border p-5 flex gap-4 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Search */}
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200'}`}>
        <Search className="w-4 h-4 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar membro…"
          className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
        />
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs uppercase tracking-wider ${isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-50 text-gray-500'}`}>
                <th className="px-5 py-3 text-left font-semibold">Membro</th>
                <th className="px-5 py-3 text-left font-semibold">Role</th>
                <SortTh col="errors_count"><AlertTriangle className="w-3.5 h-3.5 inline text-red-400" /></SortTh>
                <SortTh col="plans_total">Planos</SortTh>
                <SortTh col="completion_rate"><CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-400" /></SortTh>
                <SortTh col="avg_mpu"><Clock className="w-3.5 h-3.5 inline text-blue-400" /></SortTh>
                <SortTh col="certificates"><Award className="w-3.5 h-3.5 inline text-yellow-400" /></SortTh>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-5 py-8 text-center text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    Nenhum membro encontrado
                  </td>
                </tr>
              ) : (
                filtered.map(m => (
                  <tr key={m.user_id}
                    className={`border-t transition-colors ${isDark ? 'border-white/5 hover:bg-white/[0.02]' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="px-5 py-4">
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.name}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{m.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[m.role] ?? 'bg-gray-500/10 text-gray-500'}`}>
                        {ROLE_LABELS[m.role] ?? m.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-medium ${m.errors_count > 0 ? 'text-red-500' : isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {m.errors_count}
                      </span>
                    </td>
                    <td className={`px-4 py-4 text-center font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {m.plans_completed}/{m.plans_total}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                        ${m.completion_rate >= 80 ? 'bg-emerald-500/10 text-emerald-500'
                          : m.completion_rate >= 50 ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-red-500/10 text-red-500'}`}>
                        {m.completion_rate}%
                      </span>
                    </td>
                    <td className={`px-4 py-4 text-center font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {m.avg_mpu > 0 ? m.avg_mpu : '—'}
                    </td>
                    <td className={`px-4 py-4 text-center font-medium ${m.certificates > 0 ? 'text-yellow-500' : isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      {m.certificates > 0 ? `🏅 ${m.certificates}` : '—'}
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
