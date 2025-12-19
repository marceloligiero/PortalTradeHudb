import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PlusCircle, Users, Calendar } from 'lucide-react';
import api from '../../lib/axios';

interface TrainerCourse {
  id: number;
  title: string;
  description: string;
  trainer_id: number;
  trainer_name: string;
  students_count: number;
  total_duration_minutes: number;
  completed_minutes: number;
  remaining_minutes: number;
  progress_percentage: number;
  created_at: string;
}

export default function TrainerCoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<TrainerCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/training-plans/');
      setCourses(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('messages.error'));
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-8 h-8 text-red-400" />
              <h1 className="text-3xl font-bold text-white">{t('trainingPlan.myPlans')}</h1>
            </div>
            <p className="text-slate-400">{t('trainingPlan.managePlans')}</p>
          </div>
          <button
            onClick={() => navigate('/training-plan/new')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-900/50"
          >
            <PlusCircle className="w-5 h-5" />
            {t('trainingPlan.createNew')}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            {t('messages.loading')}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {t('dashboard.trainer.emptyTitle')}
            </h3>
            <p className="text-gray-400 mb-6">{t('dashboard.trainer.emptyDescription')}</p>
            <button
              onClick={() => navigate('/training-plan/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              {t('trainingPlan.createFirst')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/training-plan/${course.id}`)}
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/50">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                    {course.progress_percentage}%
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {course.description}
                </p>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                      style={{ width: `${Math.min(course.progress_percentage, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{course.students_count} {t('navigation.students')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {Math.floor(course.total_duration_minutes / 60)}h {course.total_duration_minutes % 60}m total
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {Math.floor(course.remaining_minutes / 60)}h {course.remaining_minutes % 60}m restantes
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/training-plan/${course.id}`); }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/5 text-white rounded-lg font-medium hover:bg-white/10 transition-all"
                  >
                    Abrir
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course.id}/lessons/new`); }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all"
                  >
                    Nova aula
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
              <div className="text-2xl font-bold text-white">{courses.length}</div>
              <div className="text-sm text-gray-400">{t('trainingPlan.totalPlans')}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
              <div className="text-2xl font-bold text-blue-400">
                {courses.reduce((sum, c) => sum + c.total_students, 0)}
              </div>
              <div className="text-sm text-gray-400">{t('trainingPlan.totalStudents')}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
              <div className="text-2xl font-bold text-green-400">
                {courses.reduce((sum, c) => sum + c.max_students, 0)}
              </div>
              <div className="text-sm text-gray-400">{t('trainingPlan.totalCapacity')}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
