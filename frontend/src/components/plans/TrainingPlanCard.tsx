import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, Calendar, Clock, ArrowRight, TrendingUp, Target } from 'lucide-react';
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

  return (
    <div
      onClick={() => navigate(getPlanRoute())}
      className="group cursor-pointer h-full"
    >
      <div className="relative h-full overflow-hidden rounded-2xl shadow-lg bg-white border border-gray-200 hover:shadow-2xl hover:border-[#ec0000]/30 transition-all duration-300">
        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg ${
            status === 'IN_PROGRESS' || status === 'ONGOING'
              ? 'bg-green-500 text-white' 
              : status === 'PENDING' || status === 'UPCOMING'
                ? 'bg-blue-500 text-white' 
                : status === 'DELAYED'
                  ? 'bg-red-500 text-white'
                  : status === 'COMPLETED'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-400 text-white'
          }`}>
            {status === 'IN_PROGRESS' || status === 'ONGOING' ? 'Ativo' 
              : status === 'PENDING' || status === 'UPCOMING' ? 'Pendente' 
              : status === 'DELAYED' ? 'Atrasado'
              : status === 'COMPLETED' ? 'Completo' 
              : status}
          </div>
        </div>

        {/* Card Header with Gradient */}
        <div className="bg-gradient-to-br from-gray-50 to-white p-6 pb-4 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#ec0000] transition-colors duration-300 line-clamp-2 pr-20">
            {plan?.title ?? 'Plano'}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {plan?.description ?? ''}
          </p>
        </div>

        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-br from-[#ec0000]/5 to-[#ec0000]/10 rounded-xl p-4 border border-[#ec0000]/10 group-hover:from-[#ec0000]/10 group-hover:to-[#ec0000]/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-[#ec0000]" />
                <span className="text-xs font-bold text-gray-600 uppercase">Cursos</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{plan?.total_courses ?? 0}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-100 group-hover:from-blue-100 group-hover:to-blue-200/50 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-600 uppercase">Formando</span>
              </div>
              {plan?.student ? (
                <div>
                  <p className="text-sm font-bold text-gray-900 truncate">{plan.student.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{plan.student.email}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Não atribuído</p>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Duração Total</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{plan?.total_duration_hours ?? 0}h</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Início</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {start ? start.toLocaleDateString('pt-PT') : '-'}
              </span>
            </div>

            {daysRemaining !== null && daysRemaining > 0 && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-700">Dias Restantes</span>
                </div>
                <span className="text-sm font-bold text-orange-900">{daysRemaining} dias</span>
              </div>
            )}
          </div>

          {/* Trainer Info */}
          {plan?.trainer_name && (
            <div className="mb-6 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-gray-600 uppercase">Formador</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-1">{plan.trainer_name}</p>
            </div>
          )}

          {/* Action Button */}
          <button
            className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-[#ec0000] to-[#cc0000] text-white rounded-xl font-bold hover:from-[#cc0000] hover:to-[#b00000] transition-all shadow-md hover:shadow-xl group-hover:scale-105 duration-300"
          >
            <span>Ver Detalhes</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#ec0000]/5 rounded-full blur-3xl group-hover:bg-[#ec0000]/10 transition-colors duration-500" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ec0000] to-[#cc0000] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </div>
  );
}
