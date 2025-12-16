import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Plus, Target } from 'lucide-react';
import api from '../../lib/axios';

interface Course {
  id: number;
  title: string;
  description: string;
  bank_code: string;
  trainer_id: number;
  trainer_name: string;
  total_students: number;
  created_at: string;
}

export default function CoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/50">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                {t('navigation.courses')}
              </h1>
              <p className="text-gray-400">{t('admin.manageCourses')}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/course/new')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-900/50"
            >
              <Plus className="w-5 h-5" />
              {t('admin.newCourse')}
            </button>
            <button 
              onClick={() => navigate('/training-plan/new')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-900/50"
            >
              <Target className="w-5 h-5" />
              {t('admin.newTrainingPlan')}
            </button>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            {t('messages.loading')}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {t('admin.noCourses')}
            </h3>
            <p className="text-gray-400 mb-6">
              {t('admin.createFirstCourse')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 hover:border-red-500/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/50">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-xs font-medium">
                    {course.bank_code}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {t('admin.trainer')}: <span className="text-white">{course.trainer_name}</span>
                  </span>
                  <span className="text-gray-400">
                    {course.total_students} {t('admin.students')}
                  </span>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => navigate(`/courses/${course.id}/challenges/new`)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all"
                  >
                    <Target className="w-4 h-4" />
                    Novo desafio
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
            <div className="text-2xl font-bold text-white">{courses.length}</div>
            <div className="text-sm text-gray-400">{t('admin.totalCourses')}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
            <div className="text-2xl font-bold text-blue-400">
              {courses.reduce((sum, c) => sum + c.total_students, 0)}
            </div>
            <div className="text-sm text-gray-400">{t('admin.totalEnrollments')}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
            <div className="text-2xl font-bold text-green-400">
              {new Set(courses.map(c => c.trainer_id)).size}
            </div>
            <div className="text-sm text-gray-400">{t('admin.activeTrainers')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
