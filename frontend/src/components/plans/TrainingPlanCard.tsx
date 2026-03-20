import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, Calendar, Clock, ArrowRight, AlertCircle, CheckCircle2, Timer, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface PlanCardProps {
  plan: any;
}

const STATUS_MAP: Record<string, { label: string; cls: string; Icon: typeof Timer }> = {
  IN_PROGRESS: { label: 'planStatus.inProgress', cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', Icon: Timer },
  ONGOING:     { label: 'planStatus.inProgress', cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', Icon: Timer },
  PENDING:     { label: 'planStatus.pending', cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400', Icon: Clock },
  UPCOMING:    { label: 'planStatus.pending', cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400', Icon: Clock },
  DELAYED:     { label: 'planStatus.delayed', cls: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400', Icon: AlertCircle },
  COMPLETED:   { label: 'planStatus.completed', cls: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400', Icon: CheckCircle2 },
  FINALIZED:   { label: 'planStatus.finalized', cls: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400', Icon: CheckCircle2 },
};

export default function TrainingPlanCard({ plan }: PlanCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const start = plan?.start_date ? new Date(plan.start_date) : null;
  const end = plan?.end_date ? new Date(plan.end_date) : null;

  // Resolve status
  let status = plan?.status || 'UNKNOWN';
  if (status === 'UNKNOWN' && start && end) {
    const today = new Date();
    if (today < start) status = 'UPCOMING';
    else if (today > end) status = 'COMPLETED';
    else status = 'ONGOING';
  }

  const sc = STATUS_MAP[status] || STATUS_MAP.IN_PROGRESS;
  const StatusIcon = sc.Icon;
  const progress = plan?.progress_percentage || 0;

  const getPlanRoute = () => {
    if (user?.role === 'ADMIN') return `/admin/training-plan/${plan?.id}`;
    if (user?.role === 'TRAINER') return `/trainer/training-plan/${plan?.id}`;
    return `/training-plan/${plan?.id}`;
  };

  const fmtDate = (d: Date | null) =>
    d ? d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

  const studentName = plan?.student?.full_name;
  const enrolledCount = plan?.enrolled_count || 0;
  const trainerName = plan?.trainers?.[0]?.full_name || plan?.trainer?.full_name;
  const extraTrainers = (plan?.trainers?.length || 0) > 1 ? plan.trainers.length - 1 : 0;

  return (
    <div
      onClick={() => navigate(getPlanRoute())}
      className="group cursor-pointer bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#EC0000]/30 transition-colors overflow-hidden"
    >
      {/* Status bar + header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.cls}`}>
            <StatusIcon className="w-3 h-3" />
            {t(sc.label)}
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">#{plan?.id}</span>
        </div>

        <h3 className="font-headline text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#EC0000] transition-colors line-clamp-1 mb-1">
          {plan?.title ?? t('navigation.trainingPlans')}
        </h3>
        {plan?.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 leading-relaxed">
            {plan.description}
          </p>
        )}
      </div>

      {/* Progress */}
      {progress > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-gray-400 dark:text-gray-500">{t('planCard.progress')}</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{progress}%</span>
          </div>
          <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div style={{ width: `${progress}%` }} className="h-full bg-emerald-500 rounded-full transition-all duration-500" />
          </div>
        </div>
      )}

      {/* Info rows */}
      <div className="px-4 pb-3 space-y-1.5">
        {/* Student */}
        <div className="flex items-center gap-2 text-xs">
          <div className="w-5 h-5 rounded-full bg-[#EC0000] flex items-center justify-center flex-shrink-0">
            {enrolledCount > 1 ? (
              <span className="text-white text-[9px] font-bold">{enrolledCount}</span>
            ) : studentName ? (
              <span className="text-white text-[9px] font-bold">{studentName.charAt(0).toUpperCase()}</span>
            ) : (
              <User className="w-2.5 h-2.5 text-white" />
            )}
          </div>
          <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
            {enrolledCount > 1
              ? `${enrolledCount} ${t('planCard.students')}`
              : studentName || t('planCard.noStudentAssigned')}
          </span>
        </div>

        {/* Trainer */}
        {trainerName && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{trainerName}</span>
            {extraTrainers > 0 && (
              <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">+{extraTrainers}</span>
            )}
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#EC0000]" />
              <span className="font-mono font-bold text-gray-900 dark:text-white">{plan?.total_courses ?? 0}</span>
              {t('planCard.courses')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#EC0000]" />
              <span className="font-mono font-bold text-gray-900 dark:text-white">{plan?.total_duration_hours ?? 0}h</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {fmtDate(start)}—{fmtDate(end)}
          </span>
        </div>

        <div className="flex items-center justify-end mt-2">
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#EC0000] group-hover:gap-2 transition-all">
            {t('planCard.viewDetails')}
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
