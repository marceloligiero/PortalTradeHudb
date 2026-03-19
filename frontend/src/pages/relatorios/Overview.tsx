import { useState, useEffect } from 'react';
import {
  Users, LayoutDashboard, AlertTriangle, ClipboardList,
  Award, TrendingUp, ArrowRight, Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/axios';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

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

function StatCard({ icon: Icon, label, value, sub, colorClass }: {
  icon: any; label: string; value: string | number; sub?: string; colorClass: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex gap-4 items-start hover:border-[#EC0000]/30 transition-colors">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {sub && <p className="text-xs mt-0.5 text-gray-400 dark:text-gray-600">{sub}</p>}
      </div>
    </div>
  );
}

export default function RelatoriosOverview() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/relatorios/overview')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const roleLabel: Record<string, string> = {
    ADMIN: t('overview.roleAdmin'),
    MANAGER: t('overview.roleManager'),
    TRAINER: t('overview.roleTrainer'),
    STUDENT: t('overview.roleStudent'),
    TRAINEE: t('overview.roleStudent'),
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#EC0000]" /></div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1 text-[#EC0000]">
          {roleLabel[user?.role || 'STUDENT']}
        </p>
        <h1 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">{t('overview.title')}</h1>
        <p className="text-sm mt-1 font-body text-gray-500 dark:text-gray-400">
          {t('overview.subtitle')}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users} label={t('overview.users')} value={data.total_users}
          sub={data.total_teams > 0 ? `${data.total_teams} ${t('overview.teams')}` : undefined}
          colorClass="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" />
        <StatCard icon={LayoutDashboard} label={t('overview.trainingPlans')} value={data.total_plans}
          sub={`${data.active_plans} ${t('overview.inProgress')}`}
          colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={AlertTriangle} label={t('overview.registeredErrors')} value={data.total_errors}
          sub={data.critical_errors > 0 ? `${data.critical_errors} ${t('overview.critical')}` : t('overview.noCritical')}
          colorClass={data.critical_errors > 0
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
          } />
        <StatCard icon={ClipboardList} label={t('overview.pendingPlans')} value={data.pending_action_plans}
          colorClass="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" />
        <StatCard icon={Award} label={t('overview.certificates')} value={data.total_certificates}
          colorClass="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400" />
        <StatCard icon={TrendingUp} label={t('overview.avgMpu')} value={data.avg_mpu > 0 ? `${data.avg_mpu}` : '—'}
          sub={data.avg_mpu > 0 ? t('overview.mpuUnit') : t('overview.noMpuData')}
          colorClass="bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400" />
      </div>

      {/* Quick navigation */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide mb-3 text-gray-400 dark:text-gray-500">{t('overview.quickAccess')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/relatorios/formacoes"
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-[#EC0000]/30 transition-colors group"
          >
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('overview.viewTrainingReport')}</span>
            <ArrowRight className="w-4 h-4 text-[#EC0000] transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="/relatorios/tutoria"
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-[#EC0000]/30 transition-colors group"
          >
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('overview.viewTutoriaReport')}</span>
            <ArrowRight className="w-4 h-4 text-[#EC0000] transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
