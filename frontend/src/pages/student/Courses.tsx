import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Filter, Search, CheckCircle } from 'lucide-react';
import api from '../../lib/axios';

interface Course {
  id: number;
  title: string;
  description: string;
  bank_code: string;
  product_name?: string;
  is_enrolled?: boolean;
  training_plan?: {
    id: number;
    title: string;
    start_date?: string;
    end_date?: string;
  } | null;
}

export default function StudentCoursesPage() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState<'ALL' | string>('ALL');
  const [search, setSearch] = useState('');
  const [enrolling, setEnrolling] = useState<number | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/student/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: number) => {
    try {
      setEnrolling(courseId);
      await api.post(`/api/student/enroll/${courseId}`);
      await fetchCourses();
    } catch (error: any) {
      console.error('Error enrolling:', error);
      alert(error.response?.data?.detail || 'Erro ao inscrever no curso');
    } finally {
      setEnrolling(null);
    }
  };

  const banks = [
    { code: 'ALL' as const, label: t('common.all') },
    { code: 'PT' as const, label: 'PT' },
    { code: 'ES' as const, label: 'ES' },
    { code: 'UN' as const, label: 'UN' },
  ];

  const uniqueBanks = ['ALL', ...Array.from(new Set(courses.map((c) => c.bank_code)))];

  const filteredCourses = courses.filter((course) => {
    const matchesBank = selectedBank === 'ALL' || course.bank_code === selectedBank;
    const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase());
    return matchesBank && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('navigation.myCourses')}</h1>
          <p className="text-gray-400">{t('courses.title')}</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('courses.courseName')}
              className="bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueBanks.map((bank) => (
              <button
                key={bank}
                onClick={() => setSelectedBank(bank)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  selectedBank === bank
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-transparent text-gray-300 border-white/10 hover:border-white/30'
                }`}
              >
                {bank === 'ALL' ? t('common.all') : bank}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          {t('messages.loading')}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{t('dashboard.student.emptyTitle')}</p>
          <p className="text-gray-500 text-sm mt-2">{t('dashboard.student.emptyDescription')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs uppercase text-gray-400 tracking-wider mb-1">{course.bank_code}</p>
                  <h3 className="text-lg font-semibold text-white mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{course.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {course.is_enrolled && (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  )}
                  {course.training_plan && (
                    <div className="px-2 py-1 bg-white/6 text-xs rounded-full text-white border border-white/10">{course.training_plan.title}</div>
                  )}
                </div>
              </div>
              {course.product_name && (
                <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white border border-white/10 self-start">
                  {course.product_name}
                </span>
              )}
              <div className="mt-auto pt-4 border-t border-white/10">
                {course.is_enrolled ? (
                  <button
                    className="w-full px-4 py-2 bg-green-600/20 text-green-400 rounded-lg font-medium cursor-default"
                    disabled
                  >
                    ✓ Inscrito
                  </button>
                ) : (
                  <button
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrolling === course.id}
                    className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling === course.id ? 'Inscrevendo...' : 'Inscrever-me'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
