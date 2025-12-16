import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen, Clock, Award, Target, Activity, Trophy,
  BarChart3, Download
} from 'lucide-react';
import api from '../../lib/axios';

interface StudentOverview {
  enrolled_courses: number;
  active_courses: number;
  completed_courses: number;
  total_lessons: number;
  completed_lessons: number;
  certificates_earned: number;
  total_study_hours: number;
  avg_progress: number;
  current_streak: number;
}

interface CourseProgress {
  course_id: number;
  course_title: string;
  trainer_name: string;
  bank_code: string;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  start_date: string;
  expected_end_date: string;
  last_activity: string;
  status: 'active' | 'completed' | 'behind_schedule';
}

interface LessonActivity {
  lesson_title: string;
  course_title: string;
  status: 'completed' | 'in_progress' | 'not_started';
  completion_date: string | null;
  time_spent: number;
  score: number | null;
}

interface Achievement {
  title: string;
  description: string;
  icon: string;
  earned_date: string;
  type: 'course' | 'lesson' | 'streak' | 'certificate';
}

export default function StudentReportsPage() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [lessonActivity, setLessonActivity] = useState<LessonActivity[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('ALL');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [overviewRes, coursesRes, lessonsRes, achievementsRes] = await Promise.all([
        api.get('/api/student/reports/overview'),
        api.get('/api/student/reports/courses'),
        api.get('/api/student/reports/lessons'),
        api.get('/api/student/reports/achievements'),
      ]);

      setOverview(overviewRes.data);
      setCourseProgress(coursesRes.data);
      setLessonActivity(lessonsRes.data);
      setAchievements(achievementsRes.data);
    } catch (error) {
      console.error('Error fetching student reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    alert(t('studentReports.exportingPDF'));
  };

  const filteredLessons = selectedCourse === 'ALL' 
    ? lessonActivity 
    : lessonActivity.filter(lesson => lesson.course_title === selectedCourse);

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      behind_schedule: 'bg-red-500/20 text-red-400 border-red-500/30',
      in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      not_started: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return styles[status as keyof typeof styles] || styles.active;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            {t('studentReports.title')}
          </h1>
          <p className="text-gray-400 mt-1">{t('studentReports.subtitle')}</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all"
        >
          <Download className="w-4 h-4" />
          {t('studentReports.downloadReport')}
        </button>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{t('studentReports.enrolledCourses')}</p>
                <p className="text-3xl font-bold text-white mt-1">{overview.enrolled_courses}</p>
                <p className="text-sm text-blue-400 mt-2">
                  {overview.active_courses} {t('studentReports.active').toLowerCase()}
                </p>
              </div>
              <BookOpen className="w-12 h-12 text-blue-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{t('studentReports.avgProgress')}</p>
                <p className="text-3xl font-bold text-white mt-1">{overview.avg_progress.toFixed(0)}%</p>
                <p className="text-sm text-green-400 mt-2">
                  {overview.completed_lessons}/{overview.total_lessons} {t('studentReports.lessons')}
                </p>
              </div>
              <Target className="w-12 h-12 text-green-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{t('studentReports.certificates')}</p>
                <p className="text-3xl font-bold text-white mt-1">{overview.certificates_earned}</p>
                <p className="text-sm text-purple-400 mt-2">
                  {overview.completed_courses} {t('studentReports.completed')}
                </p>
              </div>
              <Award className="w-12 h-12 text-purple-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{t('studentReports.studyTime')}</p>
                <p className="text-3xl font-bold text-white mt-1">{overview.total_study_hours}h</p>
                <p className="text-sm text-orange-400 mt-2">
                  {overview.current_streak} {t('studentReports.dayStreak')}
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-400 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Course Progress */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-semibold text-white">{t('studentReports.courseProgress')}</h2>
        </div>
        
        {courseProgress.length > 0 ? (
          <div className="space-y-4">
            {courseProgress.map((course) => (
              <div key={course.course_id} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{course.course_title}</h3>
                        <p className="text-sm text-gray-400">{course.trainer_name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm border ${getStatusBadge(course.status)}`}>
                        {t(`studentReports.${course.status}`)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-400">{t('studentReports.progress')}</p>
                        <p className="text-sm font-medium text-white">{course.progress.toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{t('studentReports.lessons')}</p>
                        <p className="text-sm font-medium text-white">{course.completed_lessons}/{course.total_lessons}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{t('studentReports.bank')}</p>
                        <p className="text-sm font-medium text-white">{course.bank_code}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{t('studentReports.lastActivity')}</p>
                        <p className="text-sm font-medium text-white">
                          {new Date(course.last_activity).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">{t('studentReports.progress')}</span>
                        <span className="text-xs text-gray-400">
                          {t('studentReports.expectedEnd')}: {new Date(course.expected_end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{t('studentReports.noCourses')}</p>
          </div>
        )}
      </div>

      {/* Recent Lesson Activity */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-semibold text-white">{t('studentReports.recentActivity')}</h2>
          </div>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="ALL">{t('studentReports.allCourses')}</option>
            {courseProgress.map((course) => (
              <option key={course.course_id} value={course.course_title}>
                {course.course_title}
              </option>
            ))}
          </select>
        </div>
        
        {filteredLessons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('studentReports.lessonName')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('studentReports.course')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('studentReports.status')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('studentReports.timeSpent')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('studentReports.score')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('studentReports.completionDate')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLessons.map((lesson, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-medium text-white">
                      {lesson.lesson_title}
                    </td>
                    <td className="py-4 px-4 text-gray-400">
                      {lesson.course_title}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-sm border ${getStatusBadge(lesson.status)}`}>
                        {t(`studentReports.${lesson.status}`)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white">
                      {lesson.time_spent}h
                    </td>
                    <td className="py-4 px-4">
                      {lesson.score !== null ? (
                        <span className="text-white font-medium">{lesson.score}%</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {lesson.completion_date 
                        ? new Date(lesson.completion_date).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">{t('studentReports.noActivity')}</p>
        )}
      </div>

      {/* Achievements */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-semibold text-white">{t('studentReports.achievements')}</h2>
        </div>
        
        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, idx) => (
              <div key={idx} className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg p-4 hover:scale-105 transition-transform">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{achievement.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                    <p className="text-xs text-yellow-400">
                      {new Date(achievement.earned_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{t('studentReports.noAchievements')}</p>
            <p className="text-sm text-gray-500 mt-2">{t('studentReports.keepLearning')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
