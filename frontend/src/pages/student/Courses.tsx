import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Search, CheckCircle, Clock, Target, ChevronRight, GraduationCap } from 'lucide-react';
import api from '../../lib/axios';
import { getTranslatedProductName } from '../../utils/productTranslation';

interface Course {
  id: number;
  title: string;
  description: string;
  bank_code: string;
  product_name?: string;
  product_code?: string;
  is_enrolled?: boolean;
  lessons_count?: number;
  challenges_count?: number;
  training_plan?: {
    id: number;
    title: string;
    start_date?: string;
    end_date?: string;
  } | null;
}

export default function StudentCoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const handleEnroll = async (courseId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setEnrolling(courseId);
      await api.post(`/api/student/enroll/${courseId}`);
      await fetchCourses();
    } catch (error: any) {
      console.error('Error enrolling:', error);
      alert(error.response?.data?.detail || t('courses.enrollError'));
    } finally {
      setEnrolling(null);
    }
  };

  const handleCourseClick = (course: Course) => {
    navigate(`/courses/${course.id}`);
  };

  const uniqueBanks = ['ALL', ...Array.from(new Set(courses.map((c) => c.bank_code)))];

  const filteredCourses = courses.filter((course) => {
    const matchesBank = selectedBank === 'ALL' || course.bank_code === selectedBank;
    const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase());
    return matchesBank && matchesSearch;
  });

  const enrolledCount = courses.filter(c => c.is_enrolled).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-[#EC0000]" />
          </div>
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
              {t('courses.badge', 'Formação')}
            </p>
            <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {t('navigation.myCourses', 'Meus Cursos')}
            </h1>
            <p className="font-body text-gray-500 dark:text-gray-400 mt-1 max-w-xl text-sm">
              {t('courses.subtitle', 'Cursos disponíveis e em progresso')}
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {[
            { icon: BookOpen, value: courses.length, label: t('courses.totalCourses', 'Total de Cursos') },
            { icon: CheckCircle, value: enrolledCount, label: t('courses.enrolledCourses', 'Cursos Inscritos') },
            { icon: Clock, value: courses.length - enrolledCount, label: t('courses.availableCourses', 'Disponíveis') },
            { icon: Target, value: uniqueBanks.length - 1, label: t('courses.banks', 'Bancos') },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <stat.icon className="w-5 h-5 text-[#EC0000] shrink-0" />
              <div>
                <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="font-body text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('courses.searchPlaceholder', 'Pesquisar cursos...')}
              className="bg-transparent font-body text-sm focus:outline-none w-full text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Bank Filter */}
          <div className="flex flex-wrap gap-2">
            {uniqueBanks.map((bank) => (
              <button
                key={bank}
                onClick={() => setSelectedBank(bank)}
                className={`px-4 py-2 rounded-xl font-body text-sm font-medium transition-colors ${
                  selectedBank === bank
                    ? 'bg-[#EC0000] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-[#EC0000]/30 border border-transparent'
                }`}
              >
                {bank === 'ALL' ? t('common.all', 'Todos') : bank}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white mb-2">
            {t('courses.noCourses', 'Nenhum curso encontrado')}
          </h3>
          <p className="font-body text-sm text-gray-500 dark:text-gray-400">
            {t('courses.tryDifferentFilter', 'Tente um filtro diferente')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => handleCourseClick(course)}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-[#EC0000]/30 transition-colors cursor-pointer"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded font-body text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {course.bank_code}
                      </span>
                      {course.is_enrolled && (
                        <span className="px-2 py-0.5 rounded font-body text-xs font-medium flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          {t('courses.enrolled', 'Inscrito')}
                        </span>
                      )}
                    </div>
                    <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {course.title}
                    </h3>
                    <p className="font-body text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {course.description}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-[#EC0000]" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                {/* Product Badge */}
                {course.product_name && (
                  <div className="inline-block px-3 py-1 rounded-lg font-body text-xs font-medium mb-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {getTranslatedProductName(t, course.product_code, course.product_name)}
                  </div>
                )}

                {/* Training Plan Link */}
                {course.training_plan && (
                  <div className="flex items-center gap-3 p-3 rounded-xl mb-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <GraduationCap className="w-5 h-5 text-[#EC0000] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('courses.trainingPlan', 'Plano de Formação')}</p>
                      <p className="font-body text-sm font-medium text-gray-900 dark:text-white truncate">{course.training_plan.title}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                )}

                {/* Action Button */}
                {course.is_enrolled ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (course.training_plan?.id) {
                        navigate(`/training-plan/${course.training_plan.id}`);
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl font-body font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                      course.training_plan?.id
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 cursor-default'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    {course.training_plan?.id
                      ? t('courses.viewPlan', 'Ver Plano de Formação')
                      : t('courses.enrolled', 'Inscrito')
                    }
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleEnroll(course.id, e)}
                    disabled={enrolling === course.id}
                    className="w-full px-4 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling === course.id ? t('courses.enrolling', 'Inscrevendo...') : t('courses.enroll', 'Inscrever-se')}
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
