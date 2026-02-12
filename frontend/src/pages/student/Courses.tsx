import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BookOpen, Search, CheckCircle, Clock, Target, ChevronRight, GraduationCap } from 'lucide-react';
import api from '../../lib/axios';
import { useTheme } from '../../contexts/ThemeContext';
import { PremiumHeader } from '../../components/premium';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function StudentCoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
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
    // Navigate to course detail page
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
    <div className="space-y-6">
      {/* Premium Header */}
      <PremiumHeader
        icon={BookOpen}
        title={t('navigation.myCourses', 'Meus Cursos')}
        subtitle={t('courses.subtitle', 'Cursos disponíveis e em progresso')}
        badge={`${enrolledCount} ${t('courses.enrolled', 'Inscrito(s)')}`}
        iconColor="from-blue-500 to-blue-700"
      >
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 border`}>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{courses.length}</span>
            </div>
            <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>{t('courses.totalCourses', 'Total de Cursos')}</p>
          </div>

          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 border`}>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{enrolledCount}</span>
            </div>
            <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>{t('courses.enrolledCourses', 'Cursos Inscritos')}</p>
          </div>

          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 border`}>
            <div className="flex items-center gap-3 mb-2">
              <Clock className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{courses.length - enrolledCount}</span>
            </div>
            <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>{t('courses.availableCourses', 'Disponíveis')}</p>
          </div>

          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-xl p-4 border`}>
            <div className="flex items-center gap-3 mb-2">
              <Target className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{uniqueBanks.length - 1}</span>
            </div>
            <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>{t('courses.banks', 'Bancos')}</p>
          </div>
        </div>
      </PremiumHeader>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className={`flex items-center gap-2 flex-1 px-4 py-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <Search className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('courses.searchPlaceholder', 'Pesquisar cursos...')}
              className={`bg-transparent text-sm focus:outline-none w-full ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
            />
          </div>
          
          {/* Bank Filter */}
          <div className="flex flex-wrap gap-2">
            {uniqueBanks.map((bank) => (
              <button
                key={bank}
                onClick={() => setSelectedBank(bank)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedBank === bank
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/20'
                    : isDark 
                      ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {bank === 'ALL' ? t('common.all', 'Todos') : bank}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`rounded-2xl p-6 space-y-4 animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <div className={`h-6 w-3/4 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
              <div className={`h-4 w-full rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
              <div className={`h-4 w-5/6 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
              <div className={`h-10 w-full rounded mt-4 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}
        >
          <BookOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('courses.noCourses', 'Nenhum curso encontrado')}</p>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('courses.tryDifferentFilter', 'Tente um filtro diferente')}</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              variants={cardVariants}
              onClick={() => handleCourseClick(course)}
              className={`rounded-2xl border overflow-hidden transition-all cursor-pointer hover:scale-[1.02] hover:shadow-xl ${isDark 
                ? 'bg-white/5 border-white/10 hover:border-white/20' 
                : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
              }`}
            >
              {/* Card Header */}
              <div className={`p-5 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                        {course.bank_code}
                      </span>
                      {course.is_enrolled && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                          <CheckCircle className="w-3 h-3" />
                          {t('courses.enrolled', 'Inscrito')}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {course.title}
                    </h3>
                    <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {course.description}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/20">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                {/* Product Badge */}
                {course.product_name && (
                  <div className={`inline-block px-3 py-1 rounded-lg text-xs font-medium mb-4 ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {getTranslatedProductName(t, course.product_code, course.product_name)}
                  </div>
                )}

                {/* Training Plan Link */}
                {course.training_plan && (
                  <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-100'}`}>
                    <GraduationCap className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>{t('courses.trainingPlan', 'Plano de Formação')}</p>
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{course.training_plan.title}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
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
                    className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      course.training_plan?.id
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-600/20'
                        : isDark 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default' 
                          : 'bg-green-100 text-green-700 border border-green-200 cursor-default'
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
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
                  >
                    {enrolling === course.id ? t('courses.enrolling', 'Inscrevendo...') : t('courses.enroll', 'Inscrever-se')}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
