import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, Award, PlusCircle, Target, CheckCircle2, TrendingUp,
  GraduationCap, Zap, Clock, ChevronRight
} from 'lucide-react';
import api from '../../lib/axios';

interface TrainerStats {
  total_courses: number;
  total_lessons: number;
  total_training_plans: number;
  active_training_plans: number;
  total_students: number;
  total_challenges: number;
  total_submissions: number;
  approved_submissions: number;
  approval_rate: number;
  avg_mpu: number;
  certificates_issued: number;
  recent_submissions: number;
}

interface TrainingPlan {
  id: number;
  title: string;
  description: string;
  total_students: number;
  total_courses: number;
  is_active: boolean;
}

export default function TrainerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TrainerStats | null>(null);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, plansRes] = await Promise.all([
        api.get('/api/trainer/stats'),
        api.get('/api/training-plans/')
      ]);
      setStats(statsRes.data);
      setPlans(plansRes.data?.slice(0, 6) || []);
    } catch (error) {
      console.error('Error fetching trainer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 mt-4 font-body text-sm">{t('messages.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-[#EC0000]" />
            </div>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
                {t('dashboard.trainer.badge')}
              </p>
              <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {t('dashboard.trainer.title')}
              </h1>
              <p className="font-body text-gray-500 dark:text-gray-400 mt-1 max-w-xl text-sm">
                {t('dashboard.trainer.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/training-plan/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-sm transition-colors shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            {t('dashboard.trainer.createButton')}
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {[
            { icon: BookOpen,     value: stats?.total_courses || 0,         label: t('dashboard.trainer.createdCourses') },
            { icon: Users,        value: stats?.total_students || 0,         label: t('dashboard.trainer.activeStudents') },
            { icon: GraduationCap,value: stats?.total_training_plans || 0,  label: t('dashboard.trainer.trainingPlans') },
            { icon: Target,       value: stats?.total_challenges || 0,       label: t('dashboard.trainer.challenges') },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <stat.icon className="w-5 h-5 text-[#EC0000] shrink-0" />
              <div>
                <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="font-body text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Secondary Stats ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: Clock,        label: t('dashboard.trainer.createdLessons'), value: stats?.total_lessons || 0,        color: 'text-gray-900 dark:text-white' },
          { icon: Zap,          label: t('dashboard.trainer.activePlans'),    value: stats?.active_training_plans || 0, color: 'text-green-600 dark:text-green-400' },
          { icon: Target,       label: t('dashboard.trainer.submissions'),    value: stats?.total_submissions || 0,     color: 'text-gray-900 dark:text-white' },
          { icon: CheckCircle2, label: t('dashboard.trainer.approvalRate'),   value: `${stats?.approval_rate || 0}%`,   color: 'text-green-600 dark:text-green-400' },
          { icon: TrendingUp,   label: t('dashboard.trainer.avgMpu'),         value: stats?.avg_mpu || 0,              color: 'text-gray-900 dark:text-white' },
          { icon: Award,        label: t('dashboard.trainer.certificates'),   value: stats?.certificates_issued || 0,  color: 'text-gray-900 dark:text-white' },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="w-4 h-4 text-gray-400" />
              <span className="font-body text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
            </div>
            <div className={`font-mono text-2xl font-bold ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* ── Training Plans ───────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#EC0000]" />
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.trainer.myPlans')}</h2>
              <p className="font-body text-sm text-gray-500 dark:text-gray-400">{t('dashboard.trainer.managePlans')}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/training-plans')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-body text-sm"
          >
            {t('dashboard.trainer.viewAll')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="font-body text-gray-500 dark:text-gray-400 text-lg mb-2">{t('dashboard.trainer.emptyTitle')}</p>
            <p className="font-body text-gray-400 dark:text-gray-500 mb-6 text-sm">{t('dashboard.trainer.emptyDescription')}</p>
            <button
              onClick={() => navigate('/training-plan/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-sm transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              {t('trainingPlan.createPlan')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => navigate(`/training-plan/${plan.id}`)}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:border-[#EC0000]/30 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-body font-semibold text-gray-900 dark:text-white group-hover:text-[#EC0000] transition-colors line-clamp-1">
                    {plan.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full font-body text-xs ${
                    plan.is_active !== false
                      ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {plan.is_active !== false ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
                <p className="font-body text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                  {plan.description || t('common.noDescription')}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-body">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{plan.total_students || 0} {t('navigation.students')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{plan.total_courses || 0} {t('navigation.courses')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Actions ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: PlusCircle,   label: t('dashboard.trainer.newPlan'),      sub: t('dashboard.trainer.createTraining'),  iconCls: 'bg-red-50 dark:bg-red-900/20 text-[#EC0000]', path: '/training-plan/new' },
          { icon: GraduationCap,label: t('dashboard.trainer.myPlans'),      sub: t('dashboard.trainer.viewAll'),          iconCls: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300', path: '/training-plans' },
          { icon: Users,        label: t('navigation.students'),            sub: t('dashboard.trainer.manageStudents'),   iconCls: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300', path: '/students' },
          { icon: TrendingUp,   label: t('navigation.reports'),             sub: t('dashboard.trainer.viewAnalytics'),    iconCls: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300', path: '/reports' },
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#EC0000]/30 transition-colors text-left group"
          >
            <div className={`w-10 h-10 rounded-lg ${action.iconCls} flex items-center justify-center shrink-0`}>
              <action.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#EC0000] transition-colors">{action.label}</p>
              <p className="font-body text-xs text-gray-500 dark:text-gray-400">{action.sub}</p>
            </div>
          </button>
        ))}
      </div>

    </div>
  );
}
