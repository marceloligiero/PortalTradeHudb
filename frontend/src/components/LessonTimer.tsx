import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../lib/axios';

interface LessonTimerProps {
  lessonId: number;
  userId: number;
  trainingPlanId?: number;
  estimatedMinutes: number;
  onStatusChange?: (status: string) => void;
  onComplete?: () => void;
  readOnly?: boolean;
}

interface TimerState {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
  remainingSeconds: number;
  elapsedSeconds: number;
  isPaused: boolean;
  isDelayed: boolean;
  startedAt?: string;
  completedAt?: string;
}

const formatTime = (totalSeconds: number): string => {
  const isNegative = totalSeconds < 0;
  const absSeconds = Math.abs(totalSeconds);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;
  
  const timeStr = hours > 0 
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  return isNegative ? `-${timeStr}` : timeStr;
};

const LessonTimer: React.FC<LessonTimerProps> = ({
  lessonId,
  userId,
  trainingPlanId,
  estimatedMinutes,
  onStatusChange,
  onComplete,
  readOnly = false
}) => {
  const [timerState, setTimerState] = useState<TimerState>({
    status: 'NOT_STARTED',
    remainingSeconds: estimatedMinutes * 60,
    elapsedSeconds: 0,
    isPaused: false,
    isDelayed: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch current timer state from backend
  const fetchTimerState = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        user_id: userId.toString()
      });
      if (trainingPlanId) {
        params.append('training_plan_id', trainingPlanId.toString());
      }
      
      const response = await api.get(`/api/lessons/${lessonId}/timer-state?${params}`);
      const data = response.data;
      
      setTimerState({
        status: data.status,
        remainingSeconds: data.remaining_seconds,
        elapsedSeconds: data.elapsed_seconds,
        isPaused: data.is_paused,
        isDelayed: data.is_delayed,
        startedAt: data.started_at,
        completedAt: data.completed_at
      });
      
      if (onStatusChange) {
        onStatusChange(data.status);
      }
    } catch (err) {
      console.error('Error fetching timer state:', err);
    }
  }, [lessonId, userId, trainingPlanId, onStatusChange]);

  // Initial fetch
  useEffect(() => {
    fetchTimerState();
  }, [fetchTimerState]);

  // Countdown timer effect
  useEffect(() => {
    if (timerState.status !== 'IN_PROGRESS' || timerState.isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setTimerState(prev => {
        const newRemaining = prev.remainingSeconds - 1;
        const newElapsed = prev.elapsedSeconds + 1;
        const isNowDelayed = newRemaining < 0;
        
        return {
          ...prev,
          remainingSeconds: newRemaining,
          elapsedSeconds: newElapsed,
          isDelayed: isNowDelayed
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.status, timerState.isPaused]);

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        user_id: userId.toString()
      });
      if (trainingPlanId) {
        params.append('training_plan_id', trainingPlanId.toString());
      }
      
      await api.post(`/api/lessons/${lessonId}/start?${params}`);
      await fetchTimerState();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao iniciar lição');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        user_id: userId.toString()
      });
      if (trainingPlanId) {
        params.append('training_plan_id', trainingPlanId.toString());
      }
      
      await api.post(`/api/lessons/${lessonId}/pause?${params}`);
      await fetchTimerState();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao pausar lição');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        user_id: userId.toString()
      });
      if (trainingPlanId) {
        params.append('training_plan_id', trainingPlanId.toString());
      }
      
      await api.post(`/api/lessons/${lessonId}/resume?${params}`);
      await fetchTimerState();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao retomar lição');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (approved: boolean = true) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        user_id: userId.toString()
      });
      if (trainingPlanId) {
        params.append('training_plan_id', trainingPlanId.toString());
      }
      
      await api.post(`/api/lessons/${lessonId}/finish?${params}`, {
        is_approved: approved
      });
      await fetchTimerState();
      
      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao finalizar lição');
    } finally {
      setLoading(false);
    }
  };

  // Determine color based on time remaining
  const getTimerColor = () => {
    if (timerState.status === 'COMPLETED') return 'text-green-500';
    if (timerState.isDelayed) return 'text-red-500';
    if (timerState.remainingSeconds < 300) return 'text-yellow-500'; // < 5 min
    return 'text-blue-500';
  };

  const getBgColor = () => {
    if (timerState.status === 'COMPLETED') return 'bg-green-50 dark:bg-green-900/20';
    if (timerState.isDelayed) return 'bg-red-50 dark:bg-red-900/20';
    if (timerState.remainingSeconds < 300) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-blue-50 dark:bg-blue-900/20';
  };

  return (
    <div className={`rounded-lg p-4 ${getBgColor()}`}>
      {/* Timer Display */}
      <div className="flex items-center justify-center mb-4">
        <div className={`text-4xl font-mono font-bold ${getTimerColor()}`}>
          {timerState.status === 'COMPLETED' ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-8 h-8" />
              <span>Concluída</span>
            </div>
          ) : (
            <>
              {timerState.isDelayed && <AlertTriangle className="w-8 h-8 inline mr-2" />}
              {formatTime(timerState.remainingSeconds)}
            </>
          )}
        </div>
      </div>

      {/* Status Info */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
        <div className="flex items-center justify-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Tempo estimado: {estimatedMinutes} min
          </span>
          <span>
            Decorrido: {formatTime(timerState.elapsedSeconds)}
          </span>
        </div>
        {timerState.isDelayed && timerState.status !== 'COMPLETED' && (
          <div className="text-red-500 font-semibold mt-2">
            ⚠️ Tempo excedido por {formatTime(Math.abs(timerState.remainingSeconds))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-sm text-center mb-4">
          {error}
        </div>
      )}

      {/* Control Buttons */}
      {!readOnly && timerState.status !== 'COMPLETED' && (
        <div className="flex justify-center gap-2">
          {timerState.status === 'NOT_STARTED' && (
            <button
              onClick={handleStart}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Play className="w-5 h-5" />
              Iniciar
            </button>
          )}

          {timerState.status === 'IN_PROGRESS' && !timerState.isPaused && (
            <button
              onClick={handlePause}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              <Pause className="w-5 h-5" />
              Pausar
            </button>
          )}

          {(timerState.status === 'PAUSED' || timerState.isPaused) && (
            <button
              onClick={handleResume}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Play className="w-5 h-5" />
              Retomar
            </button>
          )}

          {(timerState.status === 'IN_PROGRESS' || timerState.status === 'PAUSED') && (
            <button
              onClick={() => handleFinish(true)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Square className="w-5 h-5" />
              Finalizar
            </button>
          )}
        </div>
      )}

      {/* Status Badge */}
      <div className="flex justify-center mt-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          timerState.status === 'COMPLETED' ? 'bg-green-200 text-green-800' :
          timerState.status === 'IN_PROGRESS' ? 'bg-blue-200 text-blue-800' :
          timerState.status === 'PAUSED' ? 'bg-yellow-200 text-yellow-800' :
          'bg-gray-200 text-gray-800'
        }`}>
          {timerState.status === 'COMPLETED' ? 'Concluída' :
           timerState.status === 'IN_PROGRESS' ? 'Em Progresso' :
           timerState.status === 'PAUSED' ? 'Pausada' :
           'Não Iniciada'}
        </span>
      </div>
    </div>
  );
};

export default LessonTimer;
