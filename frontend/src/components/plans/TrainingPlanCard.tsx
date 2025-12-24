import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Calendar, Clock, ArrowRight } from 'lucide-react';

interface PlanCardProps {
  plan: any;
}

export default function TrainingPlanCard({ plan }: PlanCardProps) {
  const navigate = useNavigate();

  const start = plan?.start_date ? new Date(plan.start_date) : null;
  const end = plan?.end_date ? new Date(plan.end_date) : null;
  const today = new Date();

  let status = 'UNKNOWN';
  let daysRemaining: number | null = null;
  if (start && end) {
    if (today < start) status = 'UPCOMING';
    else if (today > end) status = 'COMPLETED';
    else status = 'ONGOING';
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    daysRemaining = diff > 0 ? diff : 0;
  }

  return (
    <div
      onClick={() => navigate(`/trainer/training-plan/${plan?.id}`)}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-white/3 to-white/6 border border-white/6">
        <div className="flex">
          <div className="w-2 bg-gradient-to-b from-pink-500 via-rose-500 to-amber-400" />

          <div className="flex-1 p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h3 className="text-base sm:text-lg font-semibold text-white leading-snug truncate">{plan?.title ?? 'Plano'}</h3>
                <p className="mt-2 text-sm text-slate-300 line-clamp-2">{plan?.description ?? ''}</p>
              </div>

              <div className="flex-shrink-0 flex flex-col items-end">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${status === 'ONGOING' ? 'bg-emerald-500 text-white' : status === 'UPCOMING' ? 'bg-blue-500 text-white' : 'bg-slate-600 text-white'}`}>
                  {status.toLowerCase()}
                </div>
                <div className="mt-2 text-xs text-slate-400">{plan?.total_duration_hours ?? '-'}h</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <div>{plan?.total_courses ?? 0} { (plan?.total_courses ?? 0) === 1 ? 'curso' : 'cursos'}</div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                <div>{plan?.total_students ?? 0} { (plan?.total_students ?? 0) === 1 ? 'aluno' : 'alunos'}</div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> <span className="text-xs">{start ? start.toLocaleDateString() : '-'}</span></div>
                  <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> <span className="text-xs">{daysRemaining !== null ? `${daysRemaining}d` : '-'}</span></div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-slate-400">ID: {plan?.id ?? '-'}</div>
              <div className="text-slate-300">
                <ArrowRight className="w-4 h-4 opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
