import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, LayoutDashboard, AlertTriangle, ClipboardList,
  Award, TrendingUp, Zap, Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface OverviewData {
  total_users: number;
  total_teams: number;
  total_plans: number;
  active_plans: number;
  total_errors: number;
  critical_errors: number;
  pending_action_plans: number;
  total_certificates: number;
  avg_mpu: number;
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  const { isDark } = useTheme();
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`rounded-2xl border p-5 flex gap-4 items-start ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
        {sub && <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{sub}</p>}
      </div>
    </motion.div>
  );
}

const stagger = { visible: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function RelatoriosOverview() {
  const { token, user } = useAuthStore();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/relatorios/overview', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [token]);

  const roleLabel: Record<string, string> = {
    ADMIN: t('overview.roleAdmin'),
    MANAGER: t('overview.roleManager'),
    TRAINER: t('overview.roleTrainer'),
    STUDENT: t('overview.roleStudent'),
    TRAINEE: t('overview.roleStudent'),
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
          {roleLabel[user?.role || 'STUDENT']}
        </p>
        <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('overview.title')}</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('overview.subtitle')}
        </p>
      </div>

      {/* Stats grid */}
      <motion.div
        variants={stagger} initial="hidden" animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <motion.div variants={fadeUp}>
          <StatCard icon={Users} label={t('overview.users')} value={data.total_users}
            sub={data.total_teams > 0 ? `${data.total_teams} ${t('overview.teams')}` : undefined}
            color="bg-gradient-to-br from-blue-600 to-blue-500" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard icon={LayoutDashboard} label={t('overview.trainingPlans')} value={data.total_plans}
            sub={`${data.active_plans} ${t('overview.inProgress')}`}
            color="bg-gradient-to-br from-emerald-600 to-emerald-500" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard icon={AlertTriangle} label={t('overview.registeredErrors')} value={data.total_errors}
            sub={data.critical_errors > 0 ? `${data.critical_errors} ${t('overview.critical')}` : t('overview.noCritical')}
            color={data.critical_errors > 0 ? 'bg-gradient-to-br from-red-600 to-red-500' : 'bg-gradient-to-br from-amber-600 to-amber-500'} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard icon={ClipboardList} label={t('overview.pendingPlans')} value={data.pending_action_plans}
            color="bg-gradient-to-br from-purple-600 to-purple-500" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard icon={Award} label={t('overview.certificates')} value={data.total_certificates}
            color="bg-gradient-to-br from-yellow-600 to-yellow-500" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard icon={TrendingUp} label={t('overview.avgMpu')} value={data.avg_mpu > 0 ? `${data.avg_mpu}` : '—'}
            sub={data.avg_mpu > 0 ? t('overview.mpuUnit') : t('overview.noMpuData')}
            color="bg-gradient-to-br from-teal-600 to-teal-500" />
        </motion.div>
      </motion.div>

      {/* Quick navigation */}
      <div>
        <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('overview.quickAccess')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: t('overview.viewTrainingReport'), href: '/relatorios/formacoes', color: 'text-blue-500 border-blue-500/20 hover:border-blue-400/40' },
            { label: t('overview.viewTutoriaReport'), href: '/relatorios/tutoria', color: 'text-red-500 border-red-500/20 hover:border-red-400/40' },
          ].map(link => (
            <motion.a key={link.href} href={link.href} whileHover={{ x: 4 }}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${link.color} ${isDark ? 'bg-white/[0.02]' : 'bg-white'}`}
            >
              <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{link.label}</span>
              <Zap className="w-4 h-4" />
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
