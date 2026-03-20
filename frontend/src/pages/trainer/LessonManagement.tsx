import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen, Play, Pause, Square, User, ArrowLeft,
  RefreshCw, CheckCircle, AlertCircle, Timer, Users
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

interface Student {
  id: number;
  user_id: number;
  name: string;
  email: string;
}

interface LessonProgress {
  id: number;
  lesson_id: number;
  user_id: number;
  user_name?: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  paused_at?: string;
  is_paused: boolean;
  accumulated_seconds: number;
  elapsed_seconds: number;
  remaining_seconds: number;
  estimated_minutes: number;
  is_delayed: boolean;
  is_approved: boolean;
}

interface Lesson {
  id: number;
  title: string;
  description?: string;
  estimated_minutes: number;
  lesson_type: string;
  materials_url?: string;
  video_url?: string;
}

export default function LessonManagement() {
  const { lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { t } = useTranslation();
  const isTutor = user?.is_tutor === true;

  const trainingPlanId = searchParams.get('planId');

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, LessonProgress>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [error, setError] = useState('');

  /* ── Load data ── */

  const loadData = useCallback(async () => {
    if (!token || !lessonId) return;
    try {
      setLoading(true);
      setError('');
      const lessonResp = await api.get(`/api/lessons/${lessonId}/detail`);
      setLesson(lessonResp.data);

      if (trainingPlanId) {
        const studentsResp = await api.get(`/api/training-plans/${trainingPlanId}/students`);
        setStudents(studentsResp.data || []);

        const progressData: Record<number, LessonProgress> = {};
        for (const student of studentsResp.data || []) {
          try {
            const progResp = await api.get(`/api/lessons/${lessonId}/progress`, {
              params: { user_id: student.user_id, training_plan_id: trainingPlanId },
            });
            progressData[student.user_id] = progResp.data;
          } catch {
            // No progress yet
          }
        }
        setProgressMap(progressData);
      }
    } catch {
      setError(t('messages.error'));
    } finally {
      setLoading(false);
    }
  }, [token, lessonId, trainingPlanId, t]);

  useEffect(() => { loadData(); }, [loadData]);

  // Tick timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressMap(prev => {
        const updated = { ...prev };
        for (const [userId, prog] of Object.entries(updated)) {
          if (prog.status === 'IN_PROGRESS' && !prog.is_paused) {
            updated[Number(userId)] = {
              ...prog,
              elapsed_seconds: prog.elapsed_seconds + 1,
              remaining_seconds: Math.max(0, prog.remaining_seconds - 1),
              is_delayed: (prog.elapsed_seconds + 1) > (prog.estimated_minutes * 60),
            };
          }
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ── Actions ── */

  const doAction = async (action: string, studentId: number) => {
    try {
      setActionLoading(studentId);
      setError('');
      await api.post(`/api/lessons/${lessonId}/${action}`, null, {
        params: { user_id: studentId, training_plan_id: trainingPlanId },
      });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || t('messages.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action: 'start' | 'finish') => {
    if (selectedStudents.length === 0) return;
    for (const sid of selectedStudents) {
      if (action === 'finish') {
        const prog = progressMap[sid];
        if (!prog || prog.status !== 'IN_PROGRESS') continue;
      }
      await doAction(action, sid);
    }
    setSelectedStudents([]);
  };

  /* ── Helpers ── */

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${m}:${String(sec).padStart(2, '0')}`;
  };

  const progressPct = (prog: LessonProgress) => {
    const totalSec = (lesson?.estimated_minutes || 1) * 60;
    return Math.min(100, (prog.elapsed_seconds / totalSec) * 100);
  };

  const toggleStudent = (uid: number) =>
    setSelectedStudents(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);

  const toggleAll = () =>
    setSelectedStudents(prev => prev.length === students.length ? [] : students.map(s => s.user_id));

  /* ── Loading ── */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-[3px] border-[#EC0000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const estMin = lesson?.estimated_minutes || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {lesson?.title}
            </h1>
            {isTutor && (
              <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EC0000] text-white">
                {t('lessonManagement.tutorMode')}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {lesson?.lesson_type === 'THEORETICAL' ? t('lessons.theoretical', 'Teórico') : t('lessons.practical', 'Prático')}
            {' · '}{estMin} min
          </p>
        </div>
        <button onClick={loadData}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Bulk actions bar ── */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedStudents.length === students.length && students.length > 0}
            onChange={toggleAll}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#EC0000] focus:ring-[#EC0000]/20"
          />
          {t('lessonManagement.selectAll')} ({selectedStudents.length}/{students.length})
        </label>
        <div className="flex gap-2">
          <button onClick={() => handleBulkAction('start')} disabled={selectedStudents.length === 0}
            title={isTutor ? t('lessonManagement.initiatedByTutor') : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-colors">
            <Play className="w-3.5 h-3.5" />
            {isTutor ? t('lessonManagement.startAllTutor') : t('lessonManagement.startSelected')}
          </button>
          <button onClick={() => handleBulkAction('finish')} disabled={selectedStudents.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EC0000] hover:bg-[#CC0000] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-colors">
            <Square className="w-3.5 h-3.5" />
            {t('lessonManagement.finishSelected')}
          </button>
        </div>
      </div>

      {/* ── Students list ── */}
      {students.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {t('lessonManagement.noStudentsAssigned')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t('lessonManagement.planHasNoStudents')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map(student => {
            const prog = progressMap[student.user_id];
            const isSelected = selectedStudents.includes(student.user_id);
            const status = prog?.status || 'NOT_STARTED';
            const isActive = status === 'IN_PROGRESS';
            const isPaused = prog?.is_paused ?? false;
            const isCompleted = status === 'COMPLETED';
            const isDelayed = prog?.is_delayed ?? false;
            const hasTimer = prog && status !== 'NOT_STARTED';
            const isLoading = actionLoading === student.user_id;

            return (
              <div
                key={student.user_id}
                className={`bg-white dark:bg-gray-800 rounded-lg border overflow-hidden transition-colors ${
                  isSelected
                    ? 'border-[#EC0000]/40 bg-red-50/50 dark:bg-red-500/5'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="p-4">
                  {/* Row 1: checkbox + student + status + timer */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleStudent(student.user_id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#EC0000] focus:ring-[#EC0000]/20 flex-shrink-0"
                    />

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>

                    {/* Name + email */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{student.name}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{student.email}</p>
                    </div>

                    {/* Status badge */}
                    <StatusBadge status={status} isPaused={isPaused} t={t} />

                    {/* Timer */}
                    {hasTimer && (
                      <div className="text-right flex-shrink-0">
                        <p className={`text-lg font-mono font-bold tabular-nums ${
                          isDelayed ? 'text-red-500' : isCompleted ? 'text-emerald-500' : 'text-gray-900 dark:text-white'
                        }`}>
                          {fmtTime(prog.elapsed_seconds)}
                        </p>
                        {isDelayed && (
                          <p className="text-[10px] text-red-500 flex items-center gap-0.5 justify-end">
                            <AlertCircle className="w-3 h-3" />{t('lessonManagement.delayed')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Row 2: progress bar (only for active lessons) */}
                  {hasTimer && !isCompleted && (
                    <div className="mt-3 ml-[3.25rem]">
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${isDelayed ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${progressPct(prog)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        <span>{fmtTime(prog.elapsed_seconds)}</span>
                        <span>{estMin} min ({t('lessonManagement.estimated')})</span>
                      </div>
                    </div>
                  )}

                  {/* Row 3: actions */}
                  <div className="mt-3 ml-[3.25rem] flex flex-wrap items-center gap-2">
                    {status !== 'NOT_STARTED' && isTutor && (
                      <span className="text-[10px] font-semibold text-[#EC0000] dark:text-red-400">
                        {t('lessonManagement.initiatedByTutor')}
                      </span>
                    )}
                    {status === 'NOT_STARTED' && (
                      <ActionBtn onClick={() => doAction('start', student.user_id)} loading={isLoading}
                        cls="bg-emerald-600 hover:bg-emerald-700" icon={Play} label={t('lessonManagement.start')}
                        title={isTutor ? t('lessonManagement.initiatedByTutor') : undefined} />
                    )}

                    {isActive && !isPaused && (
                      <>
                        <ActionBtn onClick={() => doAction('pause', student.user_id)} loading={isLoading}
                          cls="bg-amber-500 hover:bg-amber-600" icon={Pause} label={t('lessonManagement.pause')} />
                        <ActionBtn onClick={() => doAction('finish', student.user_id)} loading={isLoading}
                          cls="bg-[#EC0000] hover:bg-[#CC0000]" icon={Square} label={t('lessonManagement.finish')} />
                      </>
                    )}

                    {isActive && isPaused && (
                      <>
                        <ActionBtn onClick={() => doAction('resume', student.user_id)} loading={isLoading}
                          cls="bg-blue-600 hover:bg-blue-700" icon={Play} label={t('lessonManagement.resume')} />
                        <ActionBtn onClick={() => doAction('finish', student.user_id)} loading={isLoading}
                          cls="bg-[#EC0000] hover:bg-[#CC0000]" icon={Square} label={t('lessonManagement.finish')} />
                      </>
                    )}

                    {isCompleted && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t('lessonManagement.time')}: {fmtTime(prog.elapsed_seconds)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Small sub-components ── */

function StatusBadge({ status, isPaused, t }: { status: string; isPaused: boolean; t: any }) {
  if (status === 'COMPLETED') return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
      <CheckCircle className="w-3 h-3 inline mr-0.5" />{t('lessonManagement.completed')}
    </span>
  );
  if (status === 'IN_PROGRESS' && isPaused) return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
      <Pause className="w-3 h-3 inline mr-0.5" />{t('lessonManagement.paused')}
    </span>
  );
  if (status === 'IN_PROGRESS') return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
      <Play className="w-3 h-3 inline mr-0.5" />{t('lessonManagement.inProgress')}
    </span>
  );
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
      {t('lessonManagement.notStarted')}
    </span>
  );
}

function ActionBtn({ onClick, loading, cls, icon: Icon, label, title }: {
  onClick: () => void; loading: boolean; cls: string; icon: typeof Play; label: string; title?: string;
}) {
  return (
    <button onClick={onClick} disabled={loading} title={title}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${cls}`}>
      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}
