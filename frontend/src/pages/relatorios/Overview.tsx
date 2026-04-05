import { useState, useEffect } from 'react';
import {
  Users, AlertTriangle, ClipboardList, Award, TrendingUp, ArrowRight,
  Loader2, GraduationCap, BarChart3, Shield, Ticket, Building2, BookOpen,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/axios';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { KpiCard } from '../../components/reports';

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

// ─── Module Navigation Card ────────────────────────────────────────────────────

function ModuleCard({ to, icon: Icon, title, description, stat, statLabel, boxClass, iconClass }: {
  to: string; icon: any; title: string; description: string;
  stat?: string | number; statLabel?: string; boxClass: string; iconClass: string;
}) {
  return (
    <Link
      to={to}
      className="group rep-card-enter bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:border-[#EC0000]/30 hover:shadow-sm transition-all flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${boxClass}`}>
          <Icon className={`w-5 h-5 ${iconClass}`} />
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-[#EC0000] group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="font-headline font-bold text-gray-900 dark:text-white text-sm leading-snug">{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 flex-1">{description}</p>
      {stat !== undefined && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-lg font-mono font-bold text-gray-900 dark:text-white">{stat}</span>
          {statLabel && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5">{statLabel}</span>}
        </div>
      )}
    </Link>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RelatoriosOverview() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [data, setData] = useState<OverviewData | null>(null);
  const [chamadosOpen, setChamadosOpen] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/relatorios/overview'),
      api.get('/dw/chamados/by-status'),
    ]).then(([ovRes, chamRes]) => {
      if (ovRes.status === 'fulfilled') setData(ovRes.value.data);
      if (chamRes.status === 'fulfilled') {
        const arr: { status: string; count: number }[] = Array.isArray(chamRes.value.data) ? chamRes.value.data : [];
        const open = arr
          .filter(d => d.status === 'ABERTO' || d.status === 'EM_ANDAMENTO')
          .reduce((s, d) => s + d.count, 0);
        setChamadosOpen(open);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#EC0000]" />
      </div>
    );
  }
  if (!data) return null;

  const roleLabel: Record<string, string> = {
    ADMIN: t('overview.roleAdmin'),
    DIRETOR: t('overview.roleAdmin'),
    GERENTE: t('overview.roleManager'),
    CHEFE_EQUIPE: t('overview.roleManager'),
    FORMADOR: t('overview.roleTrainer'),
    USUARIO: t('overview.roleStudent'),
  };

  const isAdmin = user?.is_admin || user?.is_diretor;
  const isManager = user?.is_gerente || user?.is_chefe_equipe;

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-[#EC0000]/10 flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-7 h-7 text-[#EC0000]" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#EC0000]">
            {roleLabel[user?.role || 'USUARIO']}
          </p>
          <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">
            {t('overview.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('overview.subtitle')}
          </p>
        </div>
      </div>

      {/* ── Alert Banner ─────────────────────────────────────────────────── */}
      {data.critical_errors > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-[#EC0000] flex-shrink-0" />
          <p className="text-sm font-body text-red-700 dark:text-red-300">
            {t('overview.criticalAlert', { count: data.critical_errors })}
          </p>
        </div>
      )}

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          index={0}
          icon={Users}
          label={t('overview.users')}
          value={data.total_users}
          sub={data.total_teams > 0 ? `${data.total_teams} ${t('overview.teams')}` : undefined}
          boxClass="bg-blue-50 dark:bg-blue-900/20"
          iconClass="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          index={1}
          icon={ClipboardList}
          label={t('overview.trainingPlans')}
          value={data.total_plans}
          sub={`${data.active_plans} ${t('overview.inProgress')}`}
          boxClass="bg-emerald-50 dark:bg-emerald-900/20"
          iconClass="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          index={2}
          icon={AlertTriangle}
          label={t('overview.registeredErrors')}
          value={data.total_errors}
          sub={
            data.critical_errors > 0
              ? `${data.critical_errors} ${t('overview.critical')}`
              : t('overview.noCritical')
          }
          boxClass={
            data.critical_errors > 0
              ? 'bg-red-50 dark:bg-red-900/20'
              : 'bg-amber-50 dark:bg-amber-900/20'
          }
          iconClass={
            data.critical_errors > 0
              ? 'text-[#EC0000]'
              : 'text-amber-600 dark:text-amber-400'
          }
        />
        <KpiCard
          index={3}
          icon={BookOpen}
          label={t('overview.pendingPlans')}
          value={data.pending_action_plans}
          boxClass="bg-purple-50 dark:bg-purple-900/20"
          iconClass="text-purple-600 dark:text-purple-400"
        />
        <KpiCard
          index={4}
          icon={Award}
          label={t('overview.certificates')}
          value={data.total_certificates}
          boxClass="bg-yellow-50 dark:bg-yellow-900/20"
          iconClass="text-yellow-600 dark:text-yellow-400"
        />
        <KpiCard
          index={5}
          icon={TrendingUp}
          label={t('overview.avgMpu')}
          value={data.avg_mpu > 0 ? `${data.avg_mpu}` : '—'}
          sub={data.avg_mpu > 0 ? t('overview.mpuUnit') : t('overview.noMpuData')}
          boxClass="bg-teal-50 dark:bg-teal-900/20"
          iconClass="text-teal-600 dark:text-teal-400"
        />
        <KpiCard
          index={6}
          icon={Ticket}
          label={t('overview.chamados')}
          value={chamadosOpen}
          sub={t('overview.openChamados')}
          boxClass="bg-orange-50 dark:bg-orange-900/20"
          iconClass="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* ── Module Links ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-400 dark:text-gray-500">
          {t('overview.quickAccess')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ModuleCard
            to="/relatorios/formacoes"
            icon={GraduationCap}
            title={t('relatoriosSidebar.formacoes', 'Formações')}
            description={t('overview.viewTrainingReport')}
            stat={data.total_plans}
            statLabel={t('overview.trainingPlans')}
            boxClass="bg-emerald-50 dark:bg-emerald-900/20"
            iconClass="text-emerald-600 dark:text-emerald-400"
          />
          <ModuleCard
            to="/relatorios/tutoria"
            icon={Shield}
            title={t('relatoriosSidebar.tutoria', 'Tutoria')}
            description={t('overview.viewTutoriaReport')}
            stat={data.total_errors}
            statLabel={t('overview.registeredErrors')}
            boxClass="bg-red-50 dark:bg-red-900/20"
            iconClass="text-[#EC0000]"
          />
          {(isAdmin || isManager) && (
            <>
              <ModuleCard
                to="/relatorios/teams"
                icon={Building2}
                title={t('relatoriosSidebar.teams', 'Equipas')}
                description={t('relTeams.portalTitle', 'Visão por equipa')}
                stat={data.total_teams}
                statLabel={t('overview.teams')}
                boxClass="bg-blue-50 dark:bg-blue-900/20"
                iconClass="text-blue-600 dark:text-blue-400"
              />
              <ModuleCard
                to="/relatorios/incidents"
                icon={Ticket}
                title={t('relIncidents.title', 'Incidências')}
                description={t('relIncidents.accessRestrictedDesc', 'Registo e exportação')}
                boxClass="bg-orange-50 dark:bg-orange-900/20"
                iconClass="text-orange-600 dark:text-orange-400"
              />
            </>
          )}
          {!(isAdmin || isManager) && (
            <ModuleCard
              to="/relatorios/tutoria"
              icon={TrendingUp}
              title={t('navigation.analyticsSection', 'Análise')}
              description={t('relatoriosSidebar.tutoria', 'Erros, planos e evolução')}
              boxClass="bg-teal-50 dark:bg-teal-900/20"
              iconClass="text-teal-600 dark:text-teal-400"
            />
          )}
        </div>
      </div>

    </div>
  );
}
