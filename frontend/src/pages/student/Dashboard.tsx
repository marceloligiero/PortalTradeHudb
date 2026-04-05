import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  Target,
  CheckCircle2,
  TrendingUp,
  PlayCircle,
  ChevronRight,
  Zap
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import TrainingPlanCard from '../../components/plans/TrainingPlanCard';

interface StudentStats {
  total_enrollments: number;
  completed_enrollments: number;
  total_training_plans: number;
  active_training_plans: number;
  total_lessons_started: number;
  completed_lessons: number;
  total_study_hours: number;
  certificates: number;
  total_submissions: number;
  approved_submissions: number;
  avg_mpu: number;
  completion_rate: number;
}

export default function StudentDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) return;
    fetchData();
  }, [token, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, plansRes] = await Promise.all([
        api.get('/api/student/stats'),
        api.get('/api/training-plans/')
      ]);
      setStats(statsRes.data);
      setPlans(plansRes.data?.slice(0, 6) || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-[#EC0000]" />
          </div>
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
              {t('dashboard.student.badge')}
            </p>
            <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.student.title')}
            </h1>
            <p className="font-body text-gray-500 dark:text-gray-400 mt-1 max-w-xl text-sm">
              {t('dashboard.student.subtitle')}
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {[
            { icon: BookOpen, value: stats?.total_enrollments ?? 0, label: t('dashboard.student.activeCourses') },
            { icon: Clock, value: `${stats?.total_study_hours ?? 0}h`, label: t('dashboard.student.studyHours') },
            { icon: Award, value: stats?.certificates ?? 0, label: t('dashboard.student.certificates') },
            { icon: Target, value: `${stats?.completion_rate ?? 0}%`, label: t('dashboard.student.completionRate') },
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

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { icon: GraduationCap, value: stats?.total_training_plans ?? 0, label: t('dashboard.student.assignedPlans'), color: 'text-gray-900 dark:text-white' },
          { icon: PlayCircle, value: stats?.active_training_plans ?? 0, label: t('dashboard.student.activePlans'), color: 'text-green-600 dark:text-green-400' },
          { icon: BookOpen, value: stats?.total_lessons_started ?? 0, label: t('dashboard.student.lessonsStarted'), color: 'text-gray-900 dark:text-white' },
          { icon: CheckCircle2, value: stats?.completed_lessons ?? 0, label: t('dashboard.student.lessonsCompleted'), color: 'text-green-600 dark:text-green-400' },
          { icon: Zap, value: stats?.total_submissions ?? 0, label: t('dashboard.student.challengesDone'), color: 'text-gray-900 dark:text-white' },
          { icon: TrendingUp, value: stats?.avg_mpu ?? 0, label: t('dashboard.student.avgMPU'), color: 'text-[#EC0000]' },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="w-4 h-4 text-[#EC0000]" />
              <span className="font-body text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
            </div>
            <div className={`font-mono text-2xl font-bold ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Assigned Training Plans */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#EC0000]" />
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold text-gray-900 dark:text-white">{t('trainingPlan.myPlans')}</h2>
              <p className="font-body text-sm text-gray-500 dark:text-gray-400">{t('dashboard.student.assignedTraining')}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:border-[#EC0000]/30 transition-colors font-body text-sm"
          >
            {t('dashboard.student.viewCourses')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white mb-2">{t('trainingPlan.noAssignedPlans')}</h3>
            <p className="font-body text-gray-500 dark:text-gray-400">{t('trainingPlan.contactTrainer')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <TrainingPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#EC0000]/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#EC0000]" />
          </div>
          <div>
            <p className="font-body text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.student.myCourses')}</p>
            <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('dashboard.student.viewTraining')}</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/certificates')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#EC0000]/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
            <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="font-body text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.student.certificates')}</p>
            <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('dashboard.student.viewAchievements')}</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#EC0000]/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-body text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.student.reports')}</p>
            <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('dashboard.student.viewProgress')}</p>
          </div>
        </button>

        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">{stats?.total_study_hours ?? 0}h</p>
            <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('dashboard.student.studyTime')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
