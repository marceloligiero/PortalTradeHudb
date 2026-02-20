import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Brain, Users, BookOpen, Target, Award, Clock, AlertTriangle,
  TrendingUp, ChevronDown, ChevronRight,
  Search, Download, RefreshCw,
  Minus, Star, Shield, X,
  Activity, Layers, Eye, EyeOff,
  Building2, Package, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';

// ============ TYPES ============

interface StudentSkillCell {
  lessons_completed: number;
  lessons_total: number;
  lesson_completion_pct: number;
  challenges_attempted: number;
  challenges_approved: number;
  challenge_approval_pct: number;
  avg_mpu: number | null;
  total_time_hours: number;
  error_methodology: number;
  error_knowledge: number;
  error_detail: number;
  error_procedure: number;
  total_errors: number;
  level: string;
}

interface StudentRow {
  student_id: number;
  student_name: string;
  email: string;
  overall_level: string;
  overall_completion_pct: number;
  overall_avg_mpu: number | null;
  total_study_hours: number;
  total_certificates: number;
  skills: { [courseId: string]: StudentSkillCell };
}

interface CourseColumn {
  course_id: number;
  course_title: string;
  course_level: string | null;
  bank_name: string | null;
  product_name: string | null;
  total_lessons: number;
  total_challenges: number;
}

interface KnowledgeMatrixSummary {
  total_students: number;
  total_courses: number;
  avg_completion: number;
  avg_mpu: number | null;
  students_expert: number;
  students_intermediate: number;
  students_beginner: number;
  students_not_started: number;
  top_error_type: string | null;
  total_study_hours: number;
}

interface KnowledgeMatrixData {
  summary: KnowledgeMatrixSummary;
  columns: CourseColumn[];
  rows: StudentRow[];
}

// ============ LEVEL CONFIG ============

const levelConfigBase: Record<string, {
  translationKey: string;
  shortLabel: string;
  color: string;
  textColor: string;
  bgGlow: string;
  dotColor: string;
  ringColor: string;
  gradient: string;
  icon: typeof Star;
  score: number;
}> = {
  EXPERT: {
    translationKey: 'levelExpert',
    shortLabel: 'EXP',
    color: '#10b981',
    textColor: 'text-emerald-400',
    bgGlow: 'shadow-emerald-500/30',
    dotColor: 'bg-emerald-500',
    ringColor: 'ring-emerald-500/40',
    gradient: 'from-emerald-500 to-teal-400',
    icon: Star,
    score: 5,
  },
  INTERMEDIATE: {
    translationKey: 'levelIntermediate',
    shortLabel: 'INT',
    color: '#f59e0b',
    textColor: 'text-amber-400',
    bgGlow: 'shadow-amber-500/30',
    dotColor: 'bg-amber-500',
    ringColor: 'ring-amber-500/40',
    gradient: 'from-amber-500 to-yellow-400',
    icon: Shield,
    score: 3,
  },
  BEGINNER: {
    translationKey: 'levelBeginner',
    shortLabel: 'INI',
    color: '#f97316',
    textColor: 'text-orange-400',
    bgGlow: 'shadow-orange-500/30',
    dotColor: 'bg-orange-500',
    ringColor: 'ring-orange-500/40',
    gradient: 'from-orange-500 to-red-400',
    icon: TrendingUp,
    score: 2,
  },
  NOT_STARTED: {
    translationKey: 'levelNotStarted',
    shortLabel: '—',
    color: '#6b7280',
    textColor: 'text-gray-500',
    bgGlow: '',
    dotColor: 'bg-gray-600',
    ringColor: 'ring-gray-600/20',
    gradient: 'from-gray-600 to-gray-500',
    icon: Minus,
    score: 0,
  },
};

const levelKeys = ['EXPERT', 'INTERMEDIATE', 'BEGINNER', 'NOT_STARTED'] as const;

// ============ CIRCULAR PROGRESS ============

function CircularProgress({ value, size = 48, strokeWidth = 4, color = '#10b981' }: {
  value: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

// ============ MAIN COMPONENT ============

export default function KnowledgeMatrix() {
  const { t } = useTranslation();
  const [data, setData] = useState<KnowledgeMatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLevelFilters, setActiveLevelFilters] = useState<Set<string>>(new Set());
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ studentId: number; courseId: number; rect: DOMRect } | null>(null);
  const [sortBy, setSortBy] = useState<'level' | 'completion' | 'name' | 'mpu'>('level');
  const [sortAsc, setSortAsc] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [groupBy, setGroupBy] = useState<'none' | 'bank' | 'service'>('service');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // Helper to get translated level label
  const getLevelLabel = useCallback((levelKey: string) => {
    const cfg = levelConfigBase[levelKey];
    if (!cfg) return levelKey;
    return t(`knowledgeMatrix.${cfg.translationKey}`, levelKey);
  }, [t]);

  // Build levelConfig with translated labels
  const levelConfig = useMemo(() => {
    const config: Record<string, typeof levelConfigBase[string] & { label: string }> = {};
    for (const [key, val] of Object.entries(levelConfigBase)) {
      config[key] = { ...val, label: getLevelLabel(key) };
    }
    return config;
  }, [getLevelLabel]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/knowledge-matrix');
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('knowledgeMatrix.errorLoadingData', 'Erro ao carregar'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Close tooltip on click outside
  useEffect(() => {
    const handler = () => setHoveredCell(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // ============ FILTERING & SORTING ============
  const filteredRows = useMemo(() => {
    if (!data) return [];
    let rows = [...data.rows];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      rows = rows.filter(r =>
        r.student_name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term)
      );
    }

    if (activeLevelFilters.size > 0) {
      rows = rows.filter(r => activeLevelFilters.has(r.overall_level));
    }

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'level':
          cmp = (levelConfig[b.overall_level]?.score || 0) - (levelConfig[a.overall_level]?.score || 0);
          break;
        case 'completion':
          cmp = b.overall_completion_pct - a.overall_completion_pct;
          break;
        case 'name':
          cmp = a.student_name.localeCompare(b.student_name);
          break;
        case 'mpu':
          cmp = (a.overall_avg_mpu || 999) - (b.overall_avg_mpu || 999);
          break;
      }
      return sortAsc ? -cmp : cmp;
    });

    return rows;
  }, [data, searchTerm, activeLevelFilters, sortBy, sortAsc]);

  const toggleLevelFilter = (level: string) => {
    setActiveLevelFilters(prev => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  // ============ BANK/SERVICE GROUPING ============
  const groupOptions = useMemo(() => {
    if (!data) return [];
    const groups = new Map<string, string>();
    data.columns.forEach(col => {
      if (groupBy === 'bank' && col.bank_name) {
        groups.set(col.bank_name, col.bank_name);
      } else if (groupBy === 'service' && col.product_name) {
        groups.set(col.product_name, col.product_name);
      }
    });
    return Array.from(groups.values()).sort();
  }, [data, groupBy]);

  const filteredColumns = useMemo(() => {
    if (!data) return [];
    if (groupBy === 'none' || selectedGroup === 'all') return data.columns;
    return data.columns.filter(col => {
      if (groupBy === 'bank') return col.bank_name === selectedGroup;
      if (groupBy === 'service') return col.product_name === selectedGroup;
      return true;
    });
  }, [data, groupBy, selectedGroup]);

  // ============ EXPORT CSV ============
  const exportCSV = useCallback(() => {
    if (!data) return;
    const headers = [t('knowledgeMatrix.trainees', 'Formando'), 'Email', t('knowledgeMatrix.levelExpert', 'Nível'), `${t('knowledgeMatrix.completion', 'Conclusão')} %`, 'MPU', t('knowledgeMatrix.hours', 'Horas'), t('common.certificates', 'Certificados')];
    filteredColumns.forEach(c => headers.push(`${c.course_title} (${t('knowledgeMatrix.levelExpert', 'Nível')})`, `${c.course_title} (%)`));

    const csvRows = [headers.join(';')];
    filteredRows.forEach(row => {
      const cols: string[] = [
        row.student_name, row.email,
        levelConfig[row.overall_level]?.label || row.overall_level,
        row.overall_completion_pct.toFixed(1),
        row.overall_avg_mpu?.toFixed(2) || 'N/A',
        row.total_study_hours.toFixed(1),
        String(row.total_certificates),
      ];
      filteredColumns.forEach(c => {
        const s = row.skills[String(c.course_id)];
        cols.push(s ? (levelConfig[s.level]?.label || s.level) : 'N/A');
        cols.push(s ? s.lesson_completion_pct.toFixed(1) : '0');
      });
      csvRows.push(cols.join(';'));
    });

    const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matriz_conhecimento_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, filteredRows, filteredColumns, levelConfig, t]);

  // ============ LOADING / ERROR ============
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-purple-500/20 animate-pulse" />
            <Brain className="w-8 h-8 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-gray-400 text-sm animate-pulse">{t('knowledgeMatrix.loading', 'A carregar Matriz de Conhecimento…')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-red-400 text-center">{error}</p>
        <button onClick={fetchData} className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all">
          {t('knowledgeMatrix.tryAgain', 'Tentar novamente')}
        </button>
      </div>
    );
  }

  if (!data) return null;
  const { summary, columns } = data;

  const levelDistribution = [
    { key: 'EXPERT', count: summary.students_expert },
    { key: 'INTERMEDIATE', count: summary.students_intermediate },
    { key: 'BEGINNER', count: summary.students_beginner },
    { key: 'NOT_STARTED', count: summary.students_not_started },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-full min-h-screen">
      
      {/* ═══════════════ HEADER ═══════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-blue-900/40 border border-purple-500/20 p-6 md:p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {t('knowledgeMatrix.title', 'Matriz de Conhecimento')}
              </h1>
              <p className="text-purple-300/70 text-sm mt-0.5">
                {t('knowledgeMatrix.subtitle', 'Visão completa das competências e evolução dos formandos')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 transition-all text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              {t('knowledgeMatrix.exportCSV', 'Exportar CSV')}
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all text-sm font-medium shadow-lg shadow-purple-600/20"
            >
              <RefreshCw className="w-4 h-4" />
              {t('common.refresh', 'Atualizar')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════ KPI RIBBON ═══════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: Users, label: t('knowledgeMatrix.students', 'Formandos'), value: summary.total_students, suffix: '', color: 'from-blue-600/20 to-blue-800/20', border: 'border-blue-500/20', iconColor: 'text-blue-400' },
          { icon: BookOpen, label: t('knowledgeMatrix.courses', 'Cursos'), value: summary.total_courses, suffix: '', color: 'from-purple-600/20 to-purple-800/20', border: 'border-purple-500/20', iconColor: 'text-purple-400' },
          { icon: Target, label: t('knowledgeMatrix.completion', 'Conclusão'), value: summary.avg_completion.toFixed(1), suffix: '%', color: 'from-emerald-600/20 to-emerald-800/20', border: 'border-emerald-500/20', iconColor: 'text-emerald-400' },
          { icon: Clock, label: t('knowledgeMatrix.hours', 'Horas'), value: summary.total_study_hours.toFixed(1), suffix: 'h', color: 'from-amber-600/20 to-amber-800/20', border: 'border-amber-500/20', iconColor: 'text-amber-400' },
          { icon: Activity, label: t('knowledgeMatrix.mpuAvg', 'MPU Médio'), value: summary.avg_mpu ? summary.avg_mpu.toFixed(2) : '—', suffix: '', color: 'from-cyan-600/20 to-cyan-800/20', border: 'border-cyan-500/20', iconColor: 'text-cyan-400' },
          { icon: AlertTriangle, label: t('knowledgeMatrix.frequentError', 'Erro Frequente'), value: summary.top_error_type || t('knowledgeMatrix.noErrors', 'Nenhum'), suffix: '', color: 'from-red-600/20 to-red-800/20', border: 'border-red-500/20', iconColor: 'text-red-400' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-gradient-to-br ${kpi.color} backdrop-blur-xl rounded-2xl border ${kpi.border} p-4 hover:scale-[1.02] transition-transform`}
          >
            <kpi.icon className={`w-5 h-5 ${kpi.iconColor} mb-2`} />
            <div className="text-xl md:text-2xl font-black text-white">{kpi.value}{kpi.suffix}</div>
            <div className="text-xs text-gray-400 mt-0.5">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ═══════════════ LEVEL DISTRIBUTION — Clickable filter chips ═══════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            {t('knowledgeMatrix.levelDistribution', 'Distribuição por Nível')}
          </h3>
          {activeLevelFilters.size > 0 && (
            <button onClick={() => setActiveLevelFilters(new Set())} className="text-xs text-purple-400 hover:text-purple-300 underline">
              {t('knowledgeMatrix.clearFilters', 'Limpar filtros')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {levelDistribution.map(({ key, count }) => {
            const cfg = levelConfig[key];
            const pct = summary.total_students > 0 ? (count / summary.total_students * 100) : 0;
            const isActive = activeLevelFilters.size === 0 || activeLevelFilters.has(key);
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => toggleLevelFilter(key)}
                className={`relative group rounded-2xl border p-4 text-left transition-all duration-300
                  ${isActive
                    ? 'hover:ring-2'
                    : 'border-white/5 bg-white/[0.02] opacity-40 hover:opacity-70'}
                `}
                style={isActive ? { borderColor: cfg.color + '40', backgroundColor: cfg.color + '08' } : {}}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: cfg.color + '20' }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <span className="text-2xl font-black text-white">{count}</span>
                </div>
                <div className="text-xs font-semibold mb-2" style={{ color: cfg.color }}>{cfg.label}</div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                </div>
                <div className="text-[10px] text-gray-500 mt-1">{pct.toFixed(0)}% {t('knowledgeMatrix.ofTotalPct', 'do total')}</div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ═══════════════ BANK/SERVICE GROUPING ═══════════════ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-xl p-1">
            <button
              onClick={() => { setGroupBy('none'); setSelectedGroup('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${groupBy === 'none' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/[0.06]'}`}
            >
              {t('knowledgeMatrix.allCourses', 'Todos')}
            </button>
            <button
              onClick={() => { setGroupBy('bank'); setSelectedGroup('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${groupBy === 'bank' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/[0.06]'}`}
            >
              <Building2 className="w-3 h-3" />
              {t('knowledgeMatrix.groupByBank', 'Agrupar por Banco')}
            </button>
            <button
              onClick={() => { setGroupBy('service'); setSelectedGroup('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${groupBy === 'service' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/[0.06]'}`}
            >
              <Package className="w-3 h-3" />
              {t('knowledgeMatrix.groupByService', 'Agrupar por Serviço')}
            </button>
          </div>
          {groupBy !== 'none' && groupOptions.length > 0 && (
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.08] rounded-xl text-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-purple-500/40"
            >
              <option value="all">
                {groupBy === 'bank' ? t('knowledgeMatrix.allBanks', 'Todos os Bancos') : t('knowledgeMatrix.allServices', 'Todos os Serviços')}
              </option>
              {groupOptions.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ═══════════════ TOOLBAR ═══════════════ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder={t('knowledgeMatrix.searchStudent', 'Pesquisar formando...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all text-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-gray-500 hover:text-white" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'level' | 'completion' | 'name' | 'mpu')}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl text-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500/40"
          >
            <option value="level">{t('knowledgeMatrix.sortLevel', 'Ordenar: Nível')}</option>
            <option value="completion">{t('knowledgeMatrix.sortCompletion', 'Ordenar: Conclusão')}</option>
            <option value="name">{t('knowledgeMatrix.sortName', 'Ordenar: Nome')}</option>
            <option value="mpu">{t('knowledgeMatrix.sortMPU', 'Ordenar: MPU')}</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.06] transition-colors"
            title={sortAsc ? t('knowledgeMatrix.ascending', 'Ascendente') : t('knowledgeMatrix.descending', 'Descendente')}
          >
            {sortAsc ? <ChevronDown className="w-4 h-4 text-gray-400 rotate-180" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            className={`p-2.5 rounded-xl border transition-colors ${showTooltip ? 'bg-purple-600/20 border-purple-500/30 text-purple-400' : 'bg-white/[0.03] border-white/[0.08] text-gray-400'}`}
            title={showTooltip ? t('knowledgeMatrix.hideDetails', 'Ocultar detalhes ao clicar') : t('knowledgeMatrix.showDetails', 'Mostrar detalhes ao clicar')}
          >
            {showTooltip ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500">{filteredRows.length} {t('knowledgeMatrix.ofTotal', 'de')} {data.rows.length} {t('knowledgeMatrix.trainees', 'formandos')}</div>

      {/* ═══════════════ STUDENT CARDS ═══════════════ */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredRows.map((row, idx) => {
            const overallCfg = levelConfig[row.overall_level] || levelConfig.NOT_STARTED;
            const OverallIcon = overallCfg.icon;
            const isExpanded = selectedStudent?.student_id === row.student_id;

            return (
              <motion.div
                key={row.student_id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.4) }}
                className="group"
              >
                <div
                  className={`relative rounded-2xl border backdrop-blur-xl overflow-hidden transition-all duration-300 cursor-pointer
                    ${isExpanded
                      ? 'bg-white/[0.04] border-purple-500/30 shadow-xl shadow-purple-500/5'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]'}`}
                  onClick={() => setSelectedStudent(isExpanded ? null : row)}
                >
                  {/* Glow accent on left */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ backgroundColor: overallCfg.color }}
                  />

                  <div className="p-4 md:p-5 pl-5 md:pl-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-lg"
                          style={{ background: `linear-gradient(135deg, ${overallCfg.color}80, ${overallCfg.color}40)` }}>
                          {row.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center border-2 border-[#0d0d1a]"
                          style={{ backgroundColor: overallCfg.color }}
                        >
                          <OverallIcon className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>

                      {/* Name + email */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-bold text-base truncate">{row.student_name}</h3>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide"
                            style={{ backgroundColor: overallCfg.color + '20', color: overallCfg.color }}
                          >
                            {overallCfg.label}
                          </span>
                          {row.total_certificates > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 flex items-center gap-1">
                              <Award className="w-2.5 h-2.5" /> {row.total_certificates}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5 truncate">{row.email}</p>

                        {/* Course skill pills */}
                        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                          {filteredColumns.map(col => {
                            const skill = row.skills[String(col.course_id)];
                            const cfg = levelConfig[skill?.level || 'NOT_STARTED'];
                            const SkillIcon = cfg.icon;
                            return (
                              <div
                                key={col.course_id}
                                className="relative"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!showTooltip) return;
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  setHoveredCell(
                                    hoveredCell?.studentId === row.student_id && hoveredCell?.courseId === col.course_id
                                      ? null
                                      : { studentId: row.student_id, courseId: col.course_id, rect }
                                  );
                                }}
                              >
                                <div
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all hover:scale-105 cursor-pointer"
                                  style={{
                                    backgroundColor: cfg.color + '10',
                                    borderColor: cfg.color + '25',
                                    color: cfg.color,
                                  }}
                                >
                                  <SkillIcon className="w-3 h-3" />
                                  <span className="max-w-[80px] truncate" title={col.course_title}>{col.course_title}</span>
                                  {skill && skill.lesson_completion_pct > 0 && (
                                    <span className="text-[10px] opacity-70">{skill.lesson_completion_pct.toFixed(0)}%</span>
                                  )}
                                  {skill && skill.total_errors > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-red-500/80 text-white text-[9px] font-bold flex items-center justify-center ml-0.5">
                                      {skill.total_errors > 9 ? '9+' : skill.total_errors}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right metrics */}
                      <div className="hidden md:flex items-center gap-5 flex-shrink-0">
                        <div className="relative flex items-center justify-center">
                          <CircularProgress value={row.overall_completion_pct} size={52} strokeWidth={3} color={overallCfg.color} />
                          <span className="absolute text-xs font-bold text-white">{row.overall_completion_pct.toFixed(0)}%</span>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-black text-white">{row.overall_avg_mpu?.toFixed(2) || '—'}</div>
                          <div className="text-[10px] text-gray-500 uppercase">MPU</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-black text-blue-400">{row.total_study_hours.toFixed(1)}h</div>
                          <div className="text-[10px] text-gray-500 uppercase">{t('knowledgeMatrix.time', 'Tempo')}</div>
                        </div>
                        <div className="text-gray-500">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Mobile metrics */}
                    <div className="flex md:hidden items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1">
                        <CircularProgress value={row.overall_completion_pct} size={32} strokeWidth={2.5} color={overallCfg.color} />
                        <span className="text-xs font-bold text-white ml-1">{row.overall_completion_pct.toFixed(0)}%</span>
                      </div>
                      <div className="text-xs text-gray-400">MPU: <span className="text-white font-bold">{row.overall_avg_mpu?.toFixed(2) || '—'}</span></div>
                      <div className="text-xs text-gray-400">{t('knowledgeMatrix.time', 'Tempo')}: <span className="text-blue-400 font-bold">{row.total_study_hours.toFixed(1)}h</span></div>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    </div>
                  </div>

                  {/* ── Expanded Detail Panel ── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 md:px-6 pb-5 pt-2 border-t border-white/[0.06]">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-3">
                            {filteredColumns.map(col => {
                              const skill = row.skills[String(col.course_id)];
                              if (!skill) return null;
                              const cfg = levelConfig[skill.level];
                              const SkillIcon = cfg.icon;

                              return (
                                <motion.div
                                  key={col.course_id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                  className="rounded-2xl border p-4 relative overflow-hidden"
                                  style={{ borderColor: cfg.color + '20', backgroundColor: cfg.color + '05' }}
                                >
                                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20"
                                    style={{ backgroundColor: cfg.color }} />

                                  <div className="relative">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-bold text-sm truncate" title={col.course_title}>
                                          {col.course_title}
                                        </h4>
                                        {col.course_level && (
                                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                                            col.course_level === 'EXPERT' ? 'bg-emerald-500/20 text-emerald-400' :
                                            col.course_level === 'INTERMEDIATE' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-orange-500/20 text-orange-400'
                                          }`}>
                                            {col.course_level === 'EXPERT' ? <><Star className="w-2.5 h-2.5" /> {t('knowledgeMatrix.expert', 'Especialista')}</> :
                                             col.course_level === 'INTERMEDIATE' ? <><Shield className="w-2.5 h-2.5" /> {t('knowledgeMatrix.intermediate', 'Intermédio')}</> :
                                             <><TrendingUp className="w-2.5 h-2.5" /> {t('knowledgeMatrix.beginner', 'Iniciante')}</>}
                                          </span>
                                        )}
                                        {col.bank_name && (
                                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                            {col.bank_name}{col.product_name ? ` · ${col.product_name}` : ''}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold"
                                        style={{ backgroundColor: cfg.color + '20', color: cfg.color }}>
                                        <SkillIcon className="w-3 h-3" />
                                        {cfg.label}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4 mb-3">
                                      <div className="flex items-center gap-2">
                                        <CircularProgress value={skill.lesson_completion_pct} size={40} strokeWidth={3} color="#3b82f6" />
                                        <div>
                                          <div className="text-xs text-gray-400">{t('knowledgeMatrix.lessons', 'Aulas')}</div>
                                          <div className="text-xs text-white font-bold">{skill.lessons_completed}/{skill.lessons_total}</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <CircularProgress value={skill.challenge_approval_pct} size={40} strokeWidth={3} color="#10b981" />
                                        <div>
                                          <div className="text-xs text-gray-400">{t('knowledgeMatrix.challenges', 'Desafios')}</div>
                                          <div className="text-xs text-white font-bold">{skill.challenges_approved}/{skill.challenges_attempted}</div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="bg-white/[0.04] rounded-lg p-2 text-center">
                                        <div className="text-[10px] text-gray-500">{t('knowledgeMatrix.mpu', 'MPU')}</div>
                                        <div className="text-sm font-bold text-white">{skill.avg_mpu?.toFixed(2) || '—'}</div>
                                      </div>
                                      <div className="bg-white/[0.04] rounded-lg p-2 text-center">
                                        <div className="text-[10px] text-gray-500">{t('knowledgeMatrix.time', 'Tempo')}</div>
                                        <div className="text-sm font-bold text-white">{skill.total_time_hours.toFixed(1)}h</div>
                                      </div>
                                      <div className="bg-white/[0.04] rounded-lg p-2 text-center">
                                        <div className="text-[10px] text-gray-500">{t('knowledgeMatrix.errors', 'Erros')}</div>
                                        <div className={`text-sm font-bold ${skill.total_errors > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                          {skill.total_errors}
                                        </div>
                                      </div>
                                    </div>

                                    {skill.total_errors > 0 && (
                                      <div className="mt-3 pt-3 border-t border-white/[0.04]">
                                        <div className="flex items-center gap-4 text-[11px]">
                                          {[
                                            { label: t('knowledgeMatrix.errorMethodologyShort', 'Met'), value: skill.error_methodology, color: '#ef4444' },
                                            { label: t('knowledgeMatrix.errorKnowledgeShort', 'Con'), value: skill.error_knowledge, color: '#f97316' },
                                            { label: t('knowledgeMatrix.errorDetailShort', 'Det'), value: skill.error_detail, color: '#eab308' },
                                            { label: t('knowledgeMatrix.errorProcedureShort', 'Proc'), value: skill.error_procedure, color: '#a855f7' },
                                          ].filter(e => e.value > 0).map(err => (
                                            <div key={err.label} className="flex items-center gap-1">
                                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: err.color }} />
                                              <span className="text-gray-400">{err.label}:</span>
                                              <span className="font-bold" style={{ color: err.color }}>{err.value}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredRows.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-gray-600" />
          </div>
          <p className="text-gray-500 text-lg font-medium">{t('knowledgeMatrix.noStudents', 'Nenhum formando encontrado')}</p>
          <p className="text-gray-600 text-sm mt-1">{t('knowledgeMatrix.adjustFilters', 'Tente ajustar os filtros')}</p>
        </motion.div>
      )}

      {/* ═══════════════ LEGEND ═══════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/[0.05] p-4"
      >
        <div className="flex items-center gap-6 justify-center flex-wrap">
          {levelKeys.map(key => {
            const cfg = levelConfig[key];
            const Icon = cfg.icon;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: cfg.color + '20' }}>
                  <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                </div>
                <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                <span className="text-[10px] text-gray-600">
                  {key === 'EXPERT' ? '≥ 85%' : key === 'INTERMEDIATE' ? '≥ 50%' : key === 'BEGINNER' ? '< 50%' : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══════════════ FLOATING TOOLTIP ═══════════════ */}
      <AnimatePresence>
        {hoveredCell && showTooltip && (() => {
          const row = data.rows.find(r => r.student_id === hoveredCell.studentId);
          const col = filteredColumns.find(c => c.course_id === hoveredCell.courseId) || columns.find(c => c.course_id === hoveredCell.courseId);
          const skill = row?.skills[String(hoveredCell.courseId)];
          if (!row || !col || !skill) return null;
          const cfg = levelConfig[skill.level];
          const SkillIcon = cfg.icon;

          const { rect } = hoveredCell;
          const tooltipStyle: React.CSSProperties = {
            position: 'fixed',
            top: rect.bottom + 8,
            left: Math.min(rect.left, window.innerWidth - 340),
            zIndex: 9999,
          };

          if (rect.bottom + 300 > window.innerHeight) {
            tooltipStyle.top = rect.top - 8;
            tooltipStyle.transform = 'translateY(-100%)';
          }

          return (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              style={tooltipStyle}
              className="w-80 rounded-2xl border border-white/10 bg-[#13132a]/95 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 pb-3" style={{ borderBottom: `1px solid ${cfg.color}20` }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-2">
                    <h4 className="text-white font-bold text-sm truncate">{col.course_title}</h4>
                    {col.course_level && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                        col.course_level === 'EXPERT' ? 'bg-red-500/20 text-red-400' :
                        col.course_level === 'INTERMEDIATE' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {col.course_level === 'EXPERT' ? t('knowledgeMatrix.expert', 'Experto') :
                         col.course_level === 'INTERMEDIATE' ? t('knowledgeMatrix.intermediate', 'Intermédio') :
                         t('knowledgeMatrix.beginner', 'Principiante')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold"
                    style={{ backgroundColor: cfg.color + '20', color: cfg.color }}>
                    <SkillIcon className="w-3 h-3" />
                    {cfg.label}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{row.student_name}</p>
              </div>

              <div className="p-4 pt-3 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <CircularProgress value={skill.lesson_completion_pct} size={36} strokeWidth={2.5} color="#3b82f6" />
                  <div>
                    <div className="text-[10px] text-gray-500">{t('knowledgeMatrix.lessons', 'Aulas')}</div>
                    <div className="text-xs text-white font-bold">{skill.lessons_completed}/{skill.lessons_total} ({skill.lesson_completion_pct.toFixed(0)}%)</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CircularProgress value={skill.challenge_approval_pct} size={36} strokeWidth={2.5} color="#10b981" />
                  <div>
                    <div className="text-[10px] text-gray-500">{t('knowledgeMatrix.challengesApproved', 'Desafios Aprov.')}</div>
                    <div className="text-xs text-white font-bold">{skill.challenges_approved}/{skill.challenges_attempted} ({skill.challenge_approval_pct.toFixed(0)}%)</div>
                  </div>
                </div>
                <div className="bg-white/[0.04] rounded-lg p-2 text-center">
                  <div className="text-[10px] text-gray-500">{t('knowledgeMatrix.mpuAvg', 'MPU Médio')}</div>
                  <div className="text-sm font-bold text-white">{skill.avg_mpu?.toFixed(2) || '—'}</div>
                  <div className="text-[9px] text-gray-600">{t('knowledgeMatrix.minPerOp', 'min/op')}</div>
                </div>
                <div className="bg-white/[0.04] rounded-lg p-2 text-center">
                  <div className="text-[10px] text-gray-500">{t('knowledgeMatrix.studyTime', 'Tempo de Estudo')}</div>
                  <div className="text-sm font-bold text-white">{skill.total_time_hours.toFixed(1)}h</div>
                </div>
              </div>

              {skill.total_errors > 0 && (
                <div className="px-4 pb-3">
                  <div className="bg-red-500/10 rounded-xl p-3">
                    <div className="text-[11px] text-red-400 font-bold mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {skill.total_errors} {t('knowledgeMatrix.errorsIdentified', 'erros identificados')}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                      {skill.error_methodology > 0 && <div className="text-gray-300">{t('knowledgeMatrix.errorMethodology', 'Metodologia')}: <span className="text-red-400 font-bold">{skill.error_methodology}</span></div>}
                      {skill.error_knowledge > 0 && <div className="text-gray-300">{t('knowledgeMatrix.errorKnowledge', 'Conhecimento')}: <span className="text-orange-400 font-bold">{skill.error_knowledge}</span></div>}
                      {skill.error_detail > 0 && <div className="text-gray-300">{t('knowledgeMatrix.errorDetail', 'Detalhe')}: <span className="text-amber-400 font-bold">{skill.error_detail}</span></div>}
                      {skill.error_procedure > 0 && <div className="text-gray-300">{t('knowledgeMatrix.errorProcedure', 'Procedimento')}: <span className="text-purple-400 font-bold">{skill.error_procedure}</span></div>}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
