import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, GraduationCap, Search, Mail, TrendingUp, BookOpen,
  ChevronRight, UserCheck, UserX, Filter
} from 'lucide-react';
import api from '../../lib/axios';

interface StudentPlan {
  plan_id: number;
  plan_title: string;
  assigned_at: string | null;
  progress: number;
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

  useEffect(() => { fetchStudents(); }, []);

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 mt-4 font-body text-sm">{t('messages.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-[#EC0000]" />
          </div>
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
              {t('navigation.students')}
            </p>
            <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {t('trainerStudents.title')}
            </h1>
            <p className="font-body text-gray-500 dark:text-gray-400 mt-1 max-w-xl text-sm">
              {t('trainerStudents.subtitle')}
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {[
            { icon: Users,        value: stats.totalStudents, label: t('trainerStudents.totalStudents') },
            { icon: BookOpen,     value: stats.activePlans,   label: t('trainerStudents.activePlans') },
            { icon: TrendingUp,   value: `${stats.avgProgress}%`, label: t('trainerStudents.avgProgress') },
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

      {/* ── Filter Bar ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('trainerStudents.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-body text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#EC0000]/30 focus:border-[#EC0000]/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-body text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EC0000]/30 focus:border-[#EC0000]/30 transition-all"
            >
              <option value="ALL">{t('trainerStudents.allStatuses')}</option>
              <option value="ACTIVE">{t('trainerStudents.active')}</option>
              <option value="INACTIVE">{t('trainerStudents.inactive')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Students List ────────────────────────────────────── */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <GraduationCap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="font-headline text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            {t('trainerStudents.noStudents')}
          </h3>
          <p className="font-body text-gray-500 dark:text-gray-400 text-sm">
            {t('trainerStudents.noStudentsDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-[#EC0000]/30 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Student Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                    <span className="font-headline text-[#EC0000] font-bold text-lg">
                      {student.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-body font-semibold text-gray-900 dark:text-white truncate">
                        {student.full_name}
                      </h3>
                      {student.is_active ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 font-body text-xs rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30">
                          <UserCheck className="w-3 h-3" />{t('trainerStudents.active')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 font-body text-xs rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                          <UserX className="w-3 h-3" />{t('trainerStudents.inactive')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 font-body text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 lg:gap-8 shrink-0">
                  <div className="text-center">
                    <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('trainerStudents.plans')}</p>
                    <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">{student.plans_count}</p>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <p className="font-body text-xs text-gray-500 dark:text-gray-400">{t('trainerStudents.avgProgress')}</p>
                    <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">{student.avg_progress}%</p>
                  </div>
                </div>
              </div>

              {/* Assigned Plans */}
              {student.plans.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="font-body text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider font-bold">
                    {t('trainerStudents.assignedPlans')}
                  </p>
                  <div className="space-y-2">
                    {student.plans.map((plan) => (
                      <div key={plan.plan_id} className="flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/training-plan/${plan.plan_id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-[#EC0000] rounded-lg font-body text-sm hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800/30 transition-colors group min-w-[180px]"
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[200px]">{plan.plan_title}</span>
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                plan.progress >= 75 ? 'bg-green-500' : plan.progress >= 40 ? 'bg-yellow-500' : 'bg-[#EC0000]'
                              }`}
                              style={{ width: `${Math.min(plan.progress, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-medium text-gray-600 dark:text-gray-300 min-w-[2.5rem] text-right">
                            {plan.progress}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
