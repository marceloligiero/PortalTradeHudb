import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, Calendar, Clock, ArrowRight, TrendingUp, Target, User, GraduationCap, AlertCircle, CheckCircle2, Timer } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface PlanCardProps {
  plan: any;
}

export default function TrainingPlanCard({ plan }: PlanCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const start = plan?.start_date ? new Date(plan.start_date) : null;
  const end = plan?.end_date ? new Date(plan.end_date) : null;
  const today = new Date();

  let status = plan?.status || 'UNKNOWN';
  let daysRemaining: number | null = plan?.days_remaining ?? null;

  // Se não tiver status calculado, calcular localmente
  if (status === 'UNKNOWN' && start && end) {
    if (today < start) status = 'UPCOMING';
    else if (today > end) status = 'COMPLETED';
    else status = 'ONGOING';
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    daysRemaining = diff > 0 ? diff : 0;
  }

  // Determinar a rota baseada no role do usuário
  const getPlanRoute = () => {
    if (user?.role === 'ADMIN') return `/admin/training-plan/${plan?.id}`;
    if (user?.role === 'TRAINER') return `/trainer/training-plan/${plan?.id}`;
    return `/training-plan/${plan?.id}`;
  };

  // Status config
  const getStatusConfig = () => {
    switch (status) {
      case 'IN_PROGRESS':
      case 'ONGOING':
        return { label: t('planStatus.inProgress'), bg: 'bg-emerald-500', icon: Timer, iconColor: 'text-emerald-500' };
      case 'PENDING':
      case 'UPCOMING':
        return { label: t('planStatus.pending'), bg: 'bg-amber-500', icon: Clock, iconColor: 'text-amber-500' };
      case 'DELAYED':
        return { label: t('planStatus.delayed'), bg: 'bg-red-500', icon: AlertCircle, iconColor: 'text-red-500' };
      case 'COMPLETED':
        return { label: t('planStatus.completed'), bg: 'bg-blue-500', icon: CheckCircle2, iconColor: 'text-blue-500' };
      case 'FINALIZED':
        return { label: t('planStatus.finalized', 'Finalizado'), bg: 'bg-gray-500', icon: CheckCircle2, iconColor: 'text-gray-500' };
      default:
        return { label: t('planCard.active'), bg: 'bg-emerald-500', icon: Timer, iconColor: 'text-emerald-500' };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const progress = plan?.progress_percentage || 0;

  return (
    <div
      onClick={() => navigate(getPlanRoute())}
      className="group cursor-pointer h-full"
    >
      <div className="relative h-full overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[#EC0000]/30 transition-colors duration-200">
        {/* Top Status Bar */}
        <div className={`h-1 w-full ${statusConfig.bg}`} />

        {/* Header Section */}
        <div className="relative p-5 pb-4">
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white ${statusConfig.bg}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </div>
          </div>

          {/* Title & Description */}
          <div className="pr-24">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-[#EC0000]" />
              </div>
            </div>
            <h3 className="font-headline text-base font-bold text-gray-900 dark:text-white mb-1 group-hover:text-[#EC0000] transition-colors line-clamp-1">
              {plan?.title ?? t('navigation.trainingPlans')}
            </h3>
            <p className="font-body text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {plan?.description ?? t('planCard.noDescription')}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="px-5 pb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-body font-medium text-gray-500 dark:text-gray-400">{t('planCard.progress')}</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        )}

        {/* Student Section */}
        <div className="mx-5 mb-4 p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EC0000] flex items-center justify-center shrink-0">
              {(plan?.enrolled_count || 0) > 0 ? (
                <span className="text-white font-bold text-sm">
                  {plan.enrolled_count}
                </span>
              ) : plan?.student ? (
                <span className="text-white font-bold text-sm">
                  {plan.student.full_name?.charAt(0)?.toUpperCase() || 'F'}
                </span>
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#EC0000] uppercase tracking-wider mb-0.5">
                {(plan?.enrolled_count || 0) > 1 ? t('planCard.enrolledStudents') : t('planCard.student')}
              </p>
              {(plan?.enrolled_count || 0) > 1 ? (
                <>
                  <p className="font-body font-bold text-sm text-gray-900 dark:text-white">
                    {plan.enrolled_count} {t('planCard.students')}
                  </p>
                  <p className="font-body text-xs text-gray-500 dark:text-gray-400">
                    {plan.enrolled_students?.filter((s: any) => s.status === 'IN_PROGRESS').length || 0} {t('planCard.active').toLowerCase()}
                  </p>
                </>
              ) : plan?.student ? (
                <>
                  <p className="font-body font-bold text-sm text-gray-900 dark:text-white truncate">{plan.student.full_name}</p>
                  <p className="font-body text-xs text-gray-500 dark:text-gray-400 truncate">{plan.student.email}</p>
                </>
              ) : (
                <p className="font-body text-sm text-gray-400 italic">{t('planCard.noStudentAssigned')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <BookOpen className="w-4 h-4 text-[#EC0000] mx-auto mb-1" />
              <p className="font-mono text-base font-bold text-gray-900 dark:text-white">{plan?.total_courses ?? 0}</p>
              <p className="font-body text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">{t('planCard.courses')}</p>
            </div>
            <div className="text-center p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Clock className="w-4 h-4 text-[#EC0000] mx-auto mb-1" />
              <p className="font-mono text-base font-bold text-gray-900 dark:text-white">{plan?.total_duration_hours ?? 0}h</p>
              <p className="font-body text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">{t('planCard.duration')}</p>
            </div>
            <div className="text-center p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Calendar className="w-4 h-4 text-[#EC0000] mx-auto mb-1" />
              <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                {start ? start.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) : '-'}
              </p>
              <p className="font-body text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">{t('planCard.startDate')}</p>
            </div>
            <div className="text-center p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Calendar className="w-4 h-4 text-[#EC0000] mx-auto mb-1" />
              <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                {end ? end.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) : '-'}
              </p>
              <p className="font-body text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">
                {plan?.is_permanent ? t('trainingPlan.permanent', 'Permanente') : t('planCard.endDate')}
              </p>
            </div>
          </div>
        </div>

        {/* Days Remaining or Trainer */}
        <div className="px-5 pb-4 space-y-2">
          {daysRemaining !== null && daysRemaining > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span className="font-body text-sm font-medium text-gray-600 dark:text-gray-300">{t('planCard.daysRemaining')}</span>
              </div>
              <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-lg">{daysRemaining}</span>
            </div>
          )}

          {plan?.trainer?.full_name && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="font-body text-sm font-medium text-gray-600 dark:text-gray-300">
                  {plan.trainers && plan.trainers.length > 1 ? t('planCard.trainers') : t('planCard.trainer')}
                </span>
              </div>
              <div className="flex items-center gap-1 max-w-[160px]">
                {plan.trainers && plan.trainers.length > 0 ? (
                  <>
                    <span className="font-body text-sm font-bold text-gray-900 dark:text-white truncate">
                      {plan.trainers[0]?.full_name}
                    </span>
                    {plan.trainers.length > 1 && (
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        +{plan.trainers.length - 1}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="font-body text-sm font-bold text-gray-900 dark:text-white truncate">{plan.trainer.full_name}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className="font-body text-xs text-gray-400 dark:text-gray-500">
              #{plan?.id}
            </span>
            <span className="flex items-center gap-1 font-body text-xs font-bold text-[#EC0000] group-hover:gap-2 transition-all">
              {t('planCard.viewDetails')}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
