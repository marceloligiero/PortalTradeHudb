import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  Search,
  Mail,
  TrendingUp,
  BookOpen,
  ChevronRight,
  UserCheck,
  UserX,
  Sparkles,
  Filter
} from 'lucide-react';
import api from '../../lib/axios';

interface StudentPlan {
  plan_id: number;
  plan_title: string;
  assigned_at: string | null;
}

interface Student {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  plans_count: number;
  plans: StudentPlan[];
  avg_progress: number;
  created_at: string | null;
}

export default function TrainerStudentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/trainer/students');
      setStudents(res.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = searchTerm === '' ||
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && student.is_active) ||
        (statusFilter === 'INACTIVE' && !student.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const activePlans = new Set(students.flatMap(s => s.plans.map(p => p.plan_id))).size;
    const avgProgress = students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.avg_progress, 0) / students.length)
      : 0;
    return { totalStudents, activePlans, avgProgress };
  }, [students]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-indigo-500/10" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              {t('trainerStudents.title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('trainerStudents.subtitle')}</p>
          </div>
          <Sparkles className="absolute top-4 right-4 w-5 h-5 text-indigo-400 animate-pulse" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-600/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">{t('trainerStudents.totalStudents')}</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-white mt-1">{stats.totalStudents}</p>
            </div>
            <Users className="w-10 h-10 text-blue-400 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-500/10 dark:to-green-600/10 border border-green-200 dark:border-green-500/20 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">{t('trainerStudents.activePlans')}</p>
              <p className="text-3xl font-bold text-green-700 dark:text-white mt-1">{stats.activePlans}</p>
            </div>
            <BookOpen className="w-10 h-10 text-green-400 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-500/10 dark:to-purple-600/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400">{t('trainerStudents.avgProgress')}</p>
              <p className="text-3xl font-bold text-purple-700 dark:text-white mt-1">{stats.avgProgress}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-400 opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('trainerStudents.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="ALL">{t('trainerStudents.allStatuses')}</option>
              <option value="ACTIVE">{t('trainerStudents.active')}</option>
              <option value="INACTIVE">{t('trainerStudents.inactive')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-12 text-center"
        >
          <GraduationCap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('trainerStudents.noStudents')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('trainerStudents.noStudentsDescription')}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Student Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {student.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {student.full_name}
                      </h3>
                      {student.is_active ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30">
                          <UserCheck className="w-3 h-3" />
                          {t('trainerStudents.active')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                          <UserX className="w-3 h-3" />
                          {t('trainerStudents.inactive')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 lg:gap-8">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('trainerStudents.plans')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{student.plans_count}</p>
                  </div>

                  <div className="text-center min-w-[120px]">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('trainerStudents.progress')}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-white/10 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            student.avg_progress >= 75
                              ? 'bg-gradient-to-r from-green-400 to-green-500'
                              : student.avg_progress >= 40
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                              : 'bg-gradient-to-r from-indigo-400 to-indigo-500'
                          }`}
                          style={{ width: `${Math.min(student.avg_progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-white min-w-[3rem] text-right">
                        {student.avg_progress}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Plans */}
              {student.plans.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider font-medium">
                    {t('trainerStudents.assignedPlans')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {student.plans.map((plan) => (
                      <button
                        key={plan.plan_id}
                        onClick={() => navigate(`/training-plan/${plan.plan_id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded-lg text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 transition-all group"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{plan.plan_title}</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
