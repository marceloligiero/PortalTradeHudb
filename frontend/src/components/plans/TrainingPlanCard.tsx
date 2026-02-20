import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, Calendar, Clock, ArrowRight, TrendingUp, Target, User, GraduationCap, AlertCircle, CheckCircle2, Timer } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { motion } from 'framer-motion';

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
    <motion.div
      onClick={() => navigate(getPlanRoute())}
      className="group cursor-pointer h-full"
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-500">
        {/* Top Gradient Bar */}
        <div className={`h-1.5 w-full ${statusConfig.bg}`} />
        
        {/* Header Section */}
        <div className="relative p-6 pb-4">
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg ${statusConfig.bg}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </div>
          </div>

          {/* Title & Description */}
          <div className="pr-24">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors duration-300 line-clamp-1">
              {plan?.title ?? t('navigation.trainingPlans')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {plan?.description ?? t('planCard.noDescription')}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-gray-500 dark:text-gray-400">{t('planCard.progress')}</span>
              <span className="font-bold text-emerald-600">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Student Section - Highlighted */}
        <div className="mx-6 mb-4 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              {(plan?.enrolled_count || 0) > 0 ? (
                <span className="text-white font-bold text-lg">
                  {plan.enrolled_count}
                </span>
              ) : plan?.student ? (
                <span className="text-white font-bold text-lg">
                  {plan.student.full_name?.charAt(0)?.toUpperCase() || 'F'}
                </span>
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-0.5">
                {(plan?.enrolled_count || 0) > 1 ? t('planCard.enrolledStudents') : t('planCard.student')}
              </p>
              {(plan?.enrolled_count || 0) > 1 ? (
                <>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {plan.enrolled_count} {t('planCard.students')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {plan.enrolled_students?.filter((s: any) => s.status === 'IN_PROGRESS').length || 0} {t('planCard.active').toLowerCase()}
                  </p>
                </>
              ) : plan?.student ? (
                <>
                  <p className="font-bold text-gray-900 dark:text-white truncate">{plan.student.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{plan.student.email}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400 italic">{t('planCard.noStudentAssigned')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <BookOpen className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">{plan?.total_courses ?? 0}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">{t('planCard.courses')}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">{plan?.total_duration_hours ?? 0}h</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">{t('planCard.duration')}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <Calendar className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {start ? start.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) : '-'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">{t('planCard.startDate')}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <Calendar className="w-4 h-4 text-red-500 mx-auto mb-1" />
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {end ? end.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) : '-'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">
                {plan?.is_permanent ? `♾️ ${t('trainingPlan.permanent', 'Permanente')}` : t('planCard.endDate')}
              </p>
            </div>
          </div>
        </div>

        {/* Days Remaining or Trainer */}
        <div className="px-6 pb-4 space-y-2">
          {daysRemaining !== null && daysRemaining > 0 && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('planCard.daysRemaining')}</span>
              </div>
              <span className="text-sm font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-800/50 px-2 py-0.5 rounded-lg">{daysRemaining}</span>
            </div>
          )}

          {plan?.trainer?.full_name && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {plan.trainers && plan.trainers.length > 1 ? t('planCard.trainers') : t('planCard.trainer')}
                </span>
              </div>
              <div className="flex items-center gap-1 max-w-[160px]">
                {plan.trainers && plan.trainers.length > 0 ? (
                  <>
                    <span className="text-sm font-bold text-purple-900 dark:text-purple-200 truncate">
                      {plan.trainers[0]?.full_name}
                    </span>
                    {plan.trainers.length > 1 && (
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-800/50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        +{plan.trainers.length - 1}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm font-bold text-purple-900 dark:text-purple-200 truncate">{plan.trainer.full_name}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="px-6 pb-6">
          <button className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 group-hover:from-indigo-700 group-hover:to-indigo-800 transition-all duration-300">
            <span>{t('planCard.viewDetails')}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </div>
    </motion.div>
  );
}
