import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Brain, Users, BookOpen, Target, Award, Clock, AlertTriangle,
  TrendingUp, ChevronDown, ChevronRight,
  Search, Download, RefreshCw,
  Minus, Star, Shield, X,
  Activity, Layers, Eye, EyeOff,
  Building2, Package
} from 'lucide-react';
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
  lightBg: string;
  lightText: string;
  darkBg: string;
  darkText: string;
  icon: typeof Star;
  score: number;
}> = {
  EXPERT: {
    translationKey: 'levelExpert',
    shortLabel: 'EXP',
    color: '#10b981',
    lightBg: 'bg-emerald-50',
    lightText: 'text-emerald-700',
    darkBg: 'dark:bg-emerald-900/20',
    darkText: 'dark:text-emerald-400',
    icon: Star,
    score: 5,
  },
  INTERMEDIATE: {
    translationKey: 'levelIntermediate',
    shortLabel: 'INT',
    color: '#f59e0b',
    lightBg: 'bg-amber-50',
    lightText: 'text-amber-700',
    darkBg: 'dark:bg-amber-900/20',
    darkText: 'dark:text-amber-400',
    icon: Shield,
    score: 3,
  },
  BEGINNER: {
    translationKey: 'levelBeginner',
    shortLabel: 'INI',
    color: '#f97316',
    lightBg: 'bg-orange-50',
    lightText: 'text-orange-700',
    darkBg: 'dark:bg-orange-900/20',
    darkText: 'dark:text-orange-400',
    icon: TrendingUp,
    score: 2,
  },
  NOT_STARTED: {
    translationKey: 'levelNotStarted',
    shortLabel: '—',
    color: '#6b7280',
    lightBg: 'bg-gray-100',
    lightText: 'text-gray-600',
    darkBg: 'dark:bg-gray-800',
    darkText: 'dark:text-gray-400',
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
      <circle cx={size / 2} cy={size / 2} r={radius} className="stroke-gray-200 dark:stroke-gray-700" strokeWidth={strokeWidth} fill="none" />
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

// ============ KPI CARD ============

function KpiCard({ icon: Icon, label, value, suffix, color }: {
  icon: React.ElementType; label: string; value: string | number; suffix?: string;
  color: 'red' | 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan';
}) {
  const bg: Record<string, string> = {
    red:     'bg-red-50 dark:bg-red-900/20 text-[#EC0000]',
    blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    purple:  'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    cyan:    'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{value}{suffix}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
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

  const getLevelLabel = useCallback((levelKey: string) => {
    const cfg = levelConfigBase[levelKey];
    if (!cfg) return levelKey;
    return t(`knowledgeMatrix.${cfg.translationKey}`, levelKey);
  }, [t]);

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
            <div className="w-16 h-16 rounded-full border-2 border-[#EC0000]/30 animate-pulse" />
            <Brain className="w-8 h-8 text-[#EC0000] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">{t('knowledgeMatrix.loading', 'A carregar Matriz de Conhecimento…')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-[#EC0000]" />
        </div>
        <p className="text-[#EC0000] text-center font-medium">{error}</p>
        <button onClick={fetchData} className="px-5 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-lg transition-colors">
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

  const inputCls = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#EC0000]/40 focus:ring-1 focus:ring-[#EC0000]/20 transition-all';
  const pillActive = 'bg-[#EC0000] text-white';
  const pillInactive = 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700';

  return (
    <div className="space-y-6 max-w-full">

      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Brain className="w-6 h-6 text-[#EC0000]" />
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">
              {t('knowledgeMatrix.title', 'Matriz de Conhecimento')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              {t('knowledgeMatrix.subtitle', 'Visão completa das competências e evolução dos formandos')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            {t('knowledgeMatrix.exportCSV', 'Exportar CSV')}
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.refresh', 'Atualizar')}
          </button>
        </div>
      </div>

      {/* ═══════════════ KPI RIBBON ═══════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={Users} label={t('knowledgeMatrix.students', 'Formandos')} value={summary.total_students} color="blue" />
        <KpiCard icon={BookOpen} label={t('knowledgeMatrix.courses', 'Cursos')} value={summary.total_courses} color="purple" />
        <KpiCard icon={Target} label={t('knowledgeMatrix.completion', 'Conclusão')} value={summary.avg_completion.toFixed(1)} suffix="%" color="emerald" />
        <KpiCard icon={Clock} label={t('knowledgeMatrix.hours', 'Horas')} value={summary.total_study_hours.toFixed(1)} suffix="h" color="amber" />
        <KpiCard icon={Activity} label={t('knowledgeMatrix.mpuAvg', 'MPU Médio')} value={summary.avg_mpu ? summary.avg_mpu.toFixed(2) : '—'} color="cyan" />
        <KpiCard icon={AlertTriangle} label={t('knowledgeMatrix.frequentError', 'Erro Frequente')} value={summary.top_error_type || t('knowledgeMatrix.noErrors', 'Nenhum')} color="red" />
      </div>

      {/* ═══════════════ LEVEL DISTRIBUTION ═══════════════ */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-headline font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#EC0000]" />
            {t('knowledgeMatrix.levelDistribution', 'Distribuição por Nível')}
          </h3>
          {activeLevelFilters.size > 0 && (
            <button onClick={() => setActiveLevelFilters(new Set())} className="text-xs text-[#EC0000] hover:text-[#CC0000] underline">
              {t('knowledgeMatrix.clearFilters', 'Limpar filtros')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {levelDistribution.map(({ key, count }) => {
            const cfg = levelConfig[key];
            const pct = summary.total_students > 0 ? (count / summary.total_students * 100) : 0;
            const isActive = activeLevelFilters.size === 0 || activeLevelFilters.has(key);
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => toggleLevelFilter(key)}
                className={`relative group rounded-xl border p-4 text-left transition-all duration-200
                  ${isActive
                    ? `${cfg.lightBg} ${cfg.darkBg} border-current hover:shadow-md`
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-50 hover:opacity-80'}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.lightBg} ${cfg.darkBg}`}>
                    <Icon className={`w-4 h-4 ${cfg.lightText} ${cfg.darkText}`} />
                  </div>
                  <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{count}</span>
                </div>
                <div className={`text-xs font-semibold mb-2 ${cfg.lightText} ${cfg.darkText}`}>{cfg.label}</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ backgroundColor: cfg.color, width: `${pct}%` }}
                  />
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-mono">{pct.toFixed(0)}% {t('knowledgeMatrix.ofTotalPct', 'do total')}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════ CONTROLS BAR ═══════════════ */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Group by pills */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              onClick={() => { setGroupBy('none'); setSelectedGroup('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${groupBy === 'none' ? pillActive : pillInactive}`}
            >
              {t('knowledgeMatrix.allCourses', 'Todos')}
            </button>
            <button
              onClick={() => { setGroupBy('bank'); setSelectedGroup('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${groupBy === 'bank' ? pillActive : pillInactive}`}
            >
              <Building2 className="w-3 h-3" />
              {t('knowledgeMatrix.groupByBank', 'Agrupar por Banco')}
            </button>
            <button
              onClick={() => { setGroupBy('service'); setSelectedGroup('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${groupBy === 'service' ? pillActive : pillInactive}`}
            >
              <Package className="w-3 h-3" />
              {t('knowledgeMatrix.groupByService', 'Agrupar por Serviço')}
            </button>
          </div>

          {groupBy !== 'none' && groupOptions.length > 0 && (
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className={inputCls}
            >
              <option value="all">
                {groupBy === 'bank' ? t('knowledgeMatrix.allBanks', 'Todos os Bancos') : t('knowledgeMatrix.allServices', 'Todos os Serviços')}
              </option>
              {groupOptions.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          )}

          <div className="flex-1" />

          {/* Search */}
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('knowledgeMatrix.searchStudent', 'Pesquisar formando...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-8 ${inputCls}`}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700 dark:hover:text-white" />
              </button>
            )}
          </div>

          {/* Sort + toggle */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={inputCls}
            >
              <option value="level">{t('knowledgeMatrix.sortLevel', 'Ordenar: Nível')}</option>
              <option value="completion">{t('knowledgeMatrix.sortCompletion', 'Ordenar: Conclusão')}</option>
              <option value="name">{t('knowledgeMatrix.sortName', 'Ordenar: Nome')}</option>
              <option value="mpu">{t('knowledgeMatrix.sortMPU', 'Ordenar: MPU')}</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title={sortAsc ? t('knowledgeMatrix.ascending', 'Ascendente') : t('knowledgeMatrix.descending', 'Descendente')}
            >
              {sortAsc ? <ChevronDown className="w-4 h-4 text-gray-500 rotate-180" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            <button
              onClick={() => setShowTooltip(!showTooltip)}
              className={`p-2.5 rounded-xl border transition-colors ${showTooltip
                ? 'bg-red-50 dark:bg-red-900/20 border-[#EC0000]/30 text-[#EC0000]'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400'}`}
              title={showTooltip ? t('knowledgeMatrix.hideDetails', 'Ocultar detalhes ao clicar') : t('knowledgeMatrix.showDetails', 'Mostrar detalhes ao clicar')}
            >
              {showTooltip ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{filteredRows.length} {t('knowledgeMatrix.ofTotal', 'de')} {data.rows.length} {t('knowledgeMatrix.trainees', 'formandos')}</div>

      {/* ═══════════════ STUDENT CARDS ═══════════════ */}
      <div className="space-y-3">
        {filteredRows.map((row) => {
          const overallCfg = levelConfig[row.overall_level] || levelConfig.NOT_STARTED;
          const OverallIcon = overallCfg.icon;
          const isExpanded = selectedStudent?.student_id === row.student_id;

          return (
            <div key={row.student_id} className="group">
              <div
                className={`relative rounded-2xl border overflow-hidden transition-all duration-200 cursor-pointer
                  ${isExpanded
                    ? 'bg-white dark:bg-gray-900 border-[#EC0000]/30 shadow-lg shadow-[#EC0000]/5'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md'}`}
                onClick={() => setSelectedStudent(isExpanded ? null : row)}
              >
                {/* Level accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{ backgroundColor: overallCfg.color }}
                />

                <div className="p-4 md:p-5 pl-5 md:pl-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-md"
                        style={{ backgroundColor: overallCfg.color }}>
                        {row.student_name.charAt(0).toUpperCase()}
                      </div>
                      <div
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-900"
                        style={{ backgroundColor: overallCfg.color }}
                      >
                        <OverallIcon className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>

                    {/* Name + email */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-gray-900 dark:text-white font-bold text-base truncate">{row.student_name}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${overallCfg.lightBg} ${overallCfg.darkBg} ${overallCfg.lightText} ${overallCfg.darkText}`}
                        >
                          {overallCfg.label}
                        </span>
                        {row.total_certificates > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <Award className="w-2.5 h-2.5" /> {row.total_certificates}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 truncate">{row.email}</p>

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
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all hover:shadow-sm cursor-pointer
                                  ${cfg.lightBg} ${cfg.darkBg} ${cfg.lightText} ${cfg.darkText}`}
                                style={{ borderColor: cfg.color + '30' }}
                              >
                                <SkillIcon className="w-3 h-3" />
                                <span className="max-w-[80px] truncate" title={col.course_title}>{col.course_title}</span>
                                {skill && skill.lesson_completion_pct > 0 && (
                                  <span className="text-[10px] opacity-70 font-mono">{skill.lesson_completion_pct.toFixed(0)}%</span>
                                )}
                                {skill && skill.total_errors > 0 && (
                                  <span className="w-4 h-4 rounded-full bg-[#EC0000] text-white text-[9px] font-bold flex items-center justify-center ml-0.5">
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
                        <span className="absolute text-xs font-mono font-bold text-gray-900 dark:text-white">{row.overall_completion_pct.toFixed(0)}%</span>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">{row.overall_avg_mpu?.toFixed(2) || '—'}</div>
                        <div className="text-[10px] text-gray-500 uppercase">MPU</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">{row.total_study_hours.toFixed(1)}h</div>
                        <div className="text-[10px] text-gray-500 uppercase">{t('knowledgeMatrix.time', 'Tempo')}</div>
                      </div>
                      <div className="text-gray-400">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Mobile metrics */}
                  <div className="flex md:hidden items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-1">
                      <CircularProgress value={row.overall_completion_pct} size={32} strokeWidth={2.5} color={overallCfg.color} />
                      <span className="text-xs font-mono font-bold text-gray-900 dark:text-white ml-1">{row.overall_completion_pct.toFixed(0)}%</span>
                    </div>
                    <div className="text-xs text-gray-500">MPU: <span className="text-gray-900 dark:text-white font-mono font-bold">{row.overall_avg_mpu?.toFixed(2) || '—'}</span></div>
                    <div className="text-xs text-gray-500">{t('knowledgeMatrix.time', 'Tempo')}: <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">{row.total_study_hours.toFixed(1)}h</span></div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* ── Expanded Detail Panel ── */}
                {isExpanded && (
                  <div className="overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="px-5 md:px-6 pb-5 pt-2 border-t border-gray-200 dark:border-gray-800">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-3">
                        {filteredColumns.map(col => {
                          const skill = row.skills[String(col.course_id)];
                          if (!skill) return null;
                          const cfg = levelConfig[skill.level];
                          const SkillIcon = cfg.icon;

                          return (
                            <div
                              key={col.course_id}
                              className={`rounded-2xl border p-4 ${cfg.lightBg} ${cfg.darkBg}`}
                              style={{ borderColor: cfg.color + '25' }}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-gray-900 dark:text-white font-bold text-sm truncate" title={col.course_title}>
                                    {col.course_title}
                                  </h4>
                                  {col.course_level && (
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                                      col.course_level === 'EXPERT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                      col.course_level === 'INTERMEDIATE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                    }`}>
                                      {col.course_level === 'EXPERT' ? <><Star className="w-2.5 h-2.5" /> {t('knowledgeMatrix.expert', 'Especialista')}</> :
                                       col.course_level === 'INTERMEDIATE' ? <><Shield className="w-2.5 h-2.5" /> {t('knowledgeMatrix.intermediate', 'Intermédio')}</> :
                                       <><TrendingUp className="w-2.5 h-2.5" /> {t('knowledgeMatrix.beginner', 'Iniciante')}</>}
                                    </span>
                                  )}
                                  {col.bank_name && (
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                      {col.bank_name}{col.product_name ? ` · ${col.product_name}` : ''}
                                    </p>
                                  )}
                                </div>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${cfg.lightBg} ${cfg.darkBg} ${cfg.lightText} ${cfg.darkText}`}>
                                  <SkillIcon className="w-3 h-3" />
                                  {cfg.label}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                  <CircularProgress value={skill.lesson_completion_pct} size={40} strokeWidth={3} color="#3b82f6" />
                                  <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('knowledgeMatrix.lessons', 'Aulas')}</div>
                                    <div className="text-xs text-gray-900 dark:text-white font-mono font-bold">{skill.lessons_completed}/{skill.lessons_total}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CircularProgress value={skill.challenge_approval_pct} size={40} strokeWidth={3} color="#10b981" />
                                  <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('knowledgeMatrix.challenges', 'Desafios')}</div>
                                    <div className="text-xs text-gray-900 dark:text-white font-mono font-bold">{skill.challenges_approved}/{skill.challenges_attempted}</div>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 text-center">
                                  <div className="text-[10px] text-gray-500">{t('knowledgeMatrix.mpu', 'MPU')}</div>
                                  <div className="text-sm font-mono font-bold text-gray-900 dark:text-white">{skill.avg_mpu?.toFixed(2) || '—'}</div>
                                </div>
                                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 text-center">
                                  <div className="text-[10px] text-gray-500">{t('knowledgeMatrix.time', 'Tempo')}</div>
                                  <div className="text-sm font-mono font-bold text-gray-900 dark:text-white">{skill.total_time_hours.toFixed(1)}h</div>
                                </div>
                                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 text-center">
                                  <div className="text-[10px] text-gray-500">{t('knowledgeMatrix.errors', 'Erros')}</div>
                                  <div className={`text-sm font-mono font-bold ${skill.total_errors > 0 ? 'text-[#EC0000]' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {skill.total_errors}
                                  </div>
                                </div>
                              </div>

                              {skill.total_errors > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                                  <div className="flex items-center gap-4 text-[11px]">
                                    {[
                                      { label: t('knowledgeMatrix.errorMethodologyShort', 'Met'), value: skill.error_methodology, color: '#EC0000' },
                                      { label: t('knowledgeMatrix.errorKnowledgeShort', 'Con'), value: skill.error_knowledge, color: '#f97316' },
                                      { label: t('knowledgeMatrix.errorDetailShort', 'Det'), value: skill.error_detail, color: '#eab308' },
                                      { label: t('knowledgeMatrix.errorProcedureShort', 'Proc'), value: skill.error_procedure, color: '#a855f7' },
                                    ].filter(e => e.value > 0).map(err => (
                                      <div key={err.label} className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: err.color }} />
                                        <span className="text-gray-500">{err.label}:</span>
                                        <span className="font-mono font-bold" style={{ color: err.color }}>{err.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">{t('knowledgeMatrix.noStudents', 'Nenhum formando encontrado')}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('knowledgeMatrix.adjustFilters', 'Tente ajustar os filtros')}</p>
        </div>
      )}

      {/* ═══════════════ LEGEND ═══════════════ */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-6 justify-center flex-wrap">
          {levelKeys.map(key => {
            const cfg = levelConfig[key];
            const Icon = cfg.icon;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${cfg.lightBg} ${cfg.darkBg}`}>
                  <Icon className={`w-3 h-3 ${cfg.lightText} ${cfg.darkText}`} />
                </div>
                <span className={`text-xs font-medium ${cfg.lightText} ${cfg.darkText}`}>{cfg.label}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                  {key === 'EXPERT' ? '≥ 85%' : key === 'INTERMEDIATE' ? '≥ 50%' : key === 'BEGINNER' ? '< 50%' : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════ FLOATING TOOLTIP ═══════════════ */}
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
          <div
            key="tooltip"
            style={tooltipStyle}
            className="w-80 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-2">
                  <h4 className="text-gray-900 dark:text-white font-bold text-sm truncate">{col.course_title}</h4>
                  {col.course_level && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                      col.course_level === 'EXPERT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      col.course_level === 'INTERMEDIATE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {col.course_level === 'EXPERT' ? t('knowledgeMatrix.expert', 'Experto') :
                       col.course_level === 'INTERMEDIATE' ? t('knowledgeMatrix.intermediate', 'Intermédio') :
                       t('knowledgeMatrix.beginner', 'Principiante')}
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${cfg.lightBg} ${cfg.darkBg} ${cfg.lightText} ${cfg.darkText}`}>
                  <SkillIcon className="w-3 h-3" />
                  {cfg.label}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{row.student_name}</p>
            </div>

            <div className="p-4 pt-3 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <CircularProgress value={skill.lesson_completion_pct} size={36} strokeWidth={2.5} color="#3b82f6" />
                <div>
                  <div className="text-[10px] text-gray-500">{t('knowledgeMatrix.lessons', 'Aulas')}</div>
                  <div className="text-xs text-gray-900 dark:text-white font-mono font-bold">{skill.lessons_completed}/{skill.lessons_total} ({skill.lesson_completion_pct.toFixed(0)}%)</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CircularProgress value={skill.challenge_approval_pct} size={36} strokeWidth={2.5} color="#10b981" />
                <div>
                  <div className="text-[10px] text-gray-500">{t('knowledgeMatrix.challengesApproved', 'Desafios Aprov.')}</div>
                  <div className="text-xs text-gray-900 dark:text-white font-mono font-bold">{skill.challenges_approved}/{skill.challenges_attempted} ({skill.challenge_approval_pct.toFixed(0)}%)</div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                <div className="text-[10px] text-gray-500">{t('knowledgeMatrix.mpuAvg', 'MPU Médio')}</div>
                <div className="text-sm font-mono font-bold text-gray-900 dark:text-white">{skill.avg_mpu?.toFixed(2) || '—'}</div>
                <div className="text-[9px] text-gray-400">{t('knowledgeMatrix.minPerOp', 'min/op')}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                <div className="text-[10px] text-gray-500">{t('knowledgeMatrix.studyTime', 'Tempo de Estudo')}</div>
                <div className="text-sm font-mono font-bold text-gray-900 dark:text-white">{skill.total_time_hours.toFixed(1)}h</div>
              </div>
            </div>

            {skill.total_errors > 0 && (
              <div className="px-4 pb-3">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                  <div className="text-[11px] text-[#EC0000] font-bold mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {skill.total_errors} {t('knowledgeMatrix.errorsIdentified', 'erros identificados')}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    {skill.error_methodology > 0 && <div className="text-gray-600 dark:text-gray-300">{t('knowledgeMatrix.errorMethodology', 'Metodologia')}: <span className="text-[#EC0000] font-bold">{skill.error_methodology}</span></div>}
                    {skill.error_knowledge > 0 && <div className="text-gray-600 dark:text-gray-300">{t('knowledgeMatrix.errorKnowledge', 'Conhecimento')}: <span className="text-orange-600 dark:text-orange-400 font-bold">{skill.error_knowledge}</span></div>}
                    {skill.error_detail > 0 && <div className="text-gray-600 dark:text-gray-300">{t('knowledgeMatrix.errorDetail', 'Detalhe')}: <span className="text-amber-600 dark:text-amber-400 font-bold">{skill.error_detail}</span></div>}
                    {skill.error_procedure > 0 && <div className="text-gray-600 dark:text-gray-300">{t('knowledgeMatrix.errorProcedure', 'Procedimento')}: <span className="text-purple-600 dark:text-purple-400 font-bold">{skill.error_procedure}</span></div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
