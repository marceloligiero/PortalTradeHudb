import React from 'react';
import { Clock, CheckCircle, AlertTriangle, Play, Pause } from 'lucide-react';

interface PlanStatusBadgeProps {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | string;
  daysRemaining?: number | null;
  daysDelayed?: number | null;
  progressPercentage?: number;
  size?: 'sm' | 'md' | 'lg';
}

const PlanStatusBadge: React.FC<PlanStatusBadgeProps> = ({
  status,
  daysRemaining,
  daysDelayed,
  progressPercentage,
  size = 'md'
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'COMPLETED':
        return {
          icon: CheckCircle,
          text: 'Concluído',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-700 dark:text-green-400',
          borderColor: 'border-green-300 dark:border-green-700'
        };
      case 'IN_PROGRESS':
        return {
          icon: Play,
          text: 'Em Curso',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-700 dark:text-blue-400',
          borderColor: 'border-blue-300 dark:border-blue-700'
        };
      case 'DELAYED':
        return {
          icon: AlertTriangle,
          text: 'Atrasado',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-700 dark:text-red-400',
          borderColor: 'border-red-300 dark:border-red-700'
        };
      case 'PAUSED':
        return {
          icon: Pause,
          text: 'Pausado',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          textColor: 'text-yellow-700 dark:text-yellow-400',
          borderColor: 'border-yellow-300 dark:border-yellow-700'
        };
      case 'PENDING':
      default:
        return {
          icon: Clock,
          text: 'Pendente',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-700 dark:text-gray-400',
          borderColor: 'border-gray-300 dark:border-gray-600'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={`inline-flex items-center gap-1.5 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}`}>
        <IconComponent className={iconSizes[size]} />
        <span className="font-medium">{config.text}</span>
      </div>
      
      {/* Days info */}
      {(daysRemaining !== null && daysRemaining !== undefined && daysRemaining > 0) && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {daysRemaining} dias restantes
        </span>
      )}
      
      {(daysDelayed !== null && daysDelayed !== undefined && daysDelayed > 0) && (
        <span className="text-xs text-red-500 font-semibold">
          {daysDelayed} dias de atraso
        </span>
      )}

      {/* Progress bar */}
      {progressPercentage !== undefined && status !== 'COMPLETED' && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
          <div 
            className={`h-1.5 rounded-full ${
              status === 'DELAYED' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          />
        </div>
      )}
    </div>
  );
};

interface CourseStatusBadgeProps {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | string;
  canFinalize?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CourseStatusBadge: React.FC<CourseStatusBadgeProps> = ({
  status,
  canFinalize,
  size = 'sm'
}) => {
  const getConfig = () => {
    switch (status) {
      case 'COMPLETED':
        return {
          icon: CheckCircle,
          text: 'Concluído',
          className: 'bg-green-100 text-green-700 border-green-300'
        };
      case 'IN_PROGRESS':
        return {
          icon: Play,
          text: 'Em Curso',
          className: 'bg-blue-100 text-blue-700 border-blue-300'
        };
      default:
        return {
          icon: Clock,
          text: 'Pendente',
          className: 'bg-gray-100 text-gray-700 border-gray-300'
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 rounded-full border ${config.className} ${sizeClasses[size]}`}>
        <IconComponent className="w-3 h-3" />
        {config.text}
      </span>
      {canFinalize && status !== 'COMPLETED' && (
        <span className="text-xs text-green-600 font-medium">
          ✓ Pronto para finalizar
        </span>
      )}
    </div>
  );
};

export default PlanStatusBadge;
