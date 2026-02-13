import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Brain, Users, BookOpen, Target, Award, Clock, AlertTriangle,
  TrendingUp, ArrowUp, ArrowDown, ChevronDown, ChevronRight,
  Search, Filter, Download, RefreshCw, Eye, BarChart3,
  CheckCircle2, XCircle, Minus, Star, Zap, Shield
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
  students_advanced: number;
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

const levelConfig: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  cellBg: string;
  icon: typeof Star;
  gradient: string;
}> = {
  EXPERT: {
    label: 'Expert',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    cellBg: 'bg-emerald-500/15',
    icon: Star,
    gradient: 'from-emerald-600 to-emerald-400',
  },
  ADVANCED: {
    label: 'Avançado',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    cellBg: 'bg-blue-500/15',
    icon: Zap,
    gradient: 'from-blue-600 to-blue-400',
  },
  INTERMEDIATE: {
    label: 'Intermédio',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    cellBg: 'bg-amber-500/15',
    icon: Shield,
    gradient: 'from-amber-600 to-amber-400',
  },
  BEGINNER: {
    label: 'Iniciante',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    cellBg: 'bg-orange-500/15',
    icon: TrendingUp,
    gradient: 'from-orange-600 to-orange-400',
  },
  NOT_STARTED: {
    label: 'Não Iniciado',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    cellBg: 'bg-gray-500/5',
    icon: Minus,
    gradient: 'from-gray-600 to-gray-400',
  },
};

// ============ COMPONENT ============

export default function KnowledgeMatrix() {
  const { t } = useTranslation();
  const [data, setData] = useState<KnowledgeMatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());
  const [selectedCell, setSelectedCell] = useState<{ studentId: number; courseId: number } | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | 'details'>('matrix');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/knowledge-matrix');
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar a Matriz de Conhecimento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ============ FILTERING ============
  const filteredRows = useMemo(() => {
    if (!data) return [];
    let rows = data.rows;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      rows = rows.filter(r =>
        r.student_name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term)
      );
    }

    if (levelFilter !== 'ALL') {
      rows = rows.filter(r => r.overall_level === levelFilter);
    }

    return rows;
  }, [data, searchTerm, levelFilter]);

  const toggleStudent = (id: number) => {
    setExpandedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ============ EXPORT CSV ============
  const exportCSV = () => {
    if (!data) return;
    const headers = ['Formando', 'Email', 'Nível Global', 'Conclusão %', 'MPU Médio', 'Horas', 'Certificados'];
    data.columns.forEach(c => headers.push(c.course_title + ' (Nível)', c.course_title + ' (%)'));

    const csvRows = [headers.join(';')];
    filteredRows.forEach(row => {
      const cols = [
        row.student_name,
        row.email,
        levelConfig[row.overall_level]?.label || row.overall_level,
        row.overall_completion_pct.toFixed(1),
        row.overall_avg_mpu?.toFixed(2) || 'N/A',
        row.total_study_hours.toFixed(1),
        row.total_certificates.toString(),
      ];
      data.columns.forEach(c => {
        const skill = row.skills[String(c.course_id)];
        if (skill) {
          cols.push(levelConfig[skill.level]?.label || skill.level);
          cols.push(skill.lesson_completion_pct.toFixed(1));
        } else {
          cols.push('N/A', '0');
        }
      });
      csvRows.push(cols.join(';'));
    });

    const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `matriz_conhecimento_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ============ RENDER LEVEL BADGE ============
  const LevelBadge = ({ level, size = 'sm' }: { level: string; size?: 'sm' | 'md' | 'lg' }) => {
    const cfg = levelConfig[level] || levelConfig.NOT_STARTED;
    const Icon = cfg.icon;
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-3 py-1 text-sm gap-1.5',
      lg: 'px-4 py-1.5 text-sm gap-2',
    };
    return (
      <span className={`inline-flex items-center rounded-full font-semibold ${cfg.bgColor} ${cfg.color} border ${cfg.borderColor} ${sizeClasses[size]}`}>
        <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        {cfg.label}
      </span>
    );
  };

  // ============ RENDER CELL TOOLTIP ============
  const CellDetail = ({ skill, courseName }: { skill: StudentSkillCell; courseName: string }) => {
    const cfg = levelConfig[skill.level] || levelConfig.NOT_STARTED;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute z-50 w-80 p-4 bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl -translate-x-1/2 left-1/2 top-full mt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-white text-sm">{courseName}</h4>
          <LevelBadge level={skill.level} size="sm" />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-gray-400">Aulas</div>
            <div className="text-white font-bold">{skill.lessons_completed}/{skill.lessons_total}</div>
            <div className={`${skill.lesson_completion_pct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {skill.lesson_completion_pct.toFixed(0)}%
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-gray-400">Desafios</div>
            <div className="text-white font-bold">{skill.challenges_approved}/{skill.challenges_attempted}</div>
            <div className={`${skill.challenge_approval_pct >= 80 ? 'text-emerald-400' : skill.challenge_approval_pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {skill.challenge_approval_pct.toFixed(0)}% aprovados
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-gray-400">MPU Médio</div>
            <div className="text-white font-bold">{skill.avg_mpu?.toFixed(2) || '—'}</div>
            <div className="text-gray-500">min/op</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-gray-400">Tempo</div>
            <div className="text-white font-bold">{skill.total_time_hours.toFixed(1)}h</div>
          </div>
        </div>

        {skill.total_errors > 0 && (
          <div className="mt-3 bg-red-500/10 rounded-lg p-2">
            <div className="text-xs text-red-400 font-semibold mb-1">Erros ({skill.total_errors})</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {skill.error_methodology > 0 && <div className="text-gray-300">Metodologia: <span className="text-red-400">{skill.error_methodology}</span></div>}
              {skill.error_knowledge > 0 && <div className="text-gray-300">Conhecimento: <span className="text-red-400">{skill.error_knowledge}</span></div>}
              {skill.error_detail > 0 && <div className="text-gray-300">Detalhe: <span className="text-red-400">{skill.error_detail}</span></div>}
              {skill.error_procedure > 0 && <div className="text-gray-300">Procedimento: <span className="text-red-400">{skill.error_procedure}</span></div>}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // ============ LOADING / ERROR ============
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-red-400">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, columns } = data;

  return (
    <div className="p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-500" />
            {t('knowledgeMatrix.title', 'Matriz de Conhecimento')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('knowledgeMatrix.subtitle', 'Visão completa das competências e evolução dos formandos')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.refresh', 'Atualizar')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <SummaryCard
          icon={Users}
          label={t('knowledgeMatrix.totalStudents', 'Total Formandos')}
          value={summary.total_students}
          color="blue"
        />
        <SummaryCard
          icon={BookOpen}
          label={t('knowledgeMatrix.totalCourses', 'Cursos')}
          value={summary.total_courses}
          color="purple"
        />
        <SummaryCard
          icon={Target}
          label={t('knowledgeMatrix.avgCompletion', 'Conclusão Média')}
          value={`${summary.avg_completion.toFixed(1)}%`}
          color="emerald"
        />
        <SummaryCard
          icon={Clock}
          label={t('knowledgeMatrix.totalHours', 'Horas Totais')}
          value={`${summary.total_study_hours.toFixed(1)}h`}
          color="amber"
        />
        <SummaryCard
          icon={BarChart3}
          label={t('knowledgeMatrix.avgMPU', 'MPU Médio')}
          value={summary.avg_mpu ? `${summary.avg_mpu.toFixed(2)}` : 'N/A'}
          color="cyan"
        />
        <SummaryCard
          icon={AlertTriangle}
          label={t('knowledgeMatrix.topError', 'Erro Principal')}
          value={summary.top_error_type || 'Nenhum'}
          color="red"
        />
      </div>

      {/* Level Distribution */}
      <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          {t('knowledgeMatrix.levelDistribution', 'Distribuição por Nível')}
        </h3>
        <div className="flex flex-wrap gap-4">
          {[
            { key: 'EXPERT', count: summary.students_expert },
            { key: 'ADVANCED', count: summary.students_advanced },
            { key: 'INTERMEDIATE', count: summary.students_intermediate },
            { key: 'BEGINNER', count: summary.students_beginner },
            { key: 'NOT_STARTED', count: summary.students_not_started },
          ].map(item => {
            const cfg = levelConfig[item.key];
            const pct = summary.total_students > 0 ? (item.count / summary.total_students * 100) : 0;
            return (
              <div key={item.key} className="flex-1 min-w-[150px]">
                <div className="flex items-center justify-between mb-2">
                  <LevelBadge level={item.key} size="md" />
                  <span className="text-white font-bold text-lg">{item.count}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${cfg.gradient}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{pct.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('knowledgeMatrix.searchStudent', 'Pesquisar formando...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl text-white px-3 py-2 focus:outline-none focus:border-purple-500/50"
          >
            <option value="ALL">{t('knowledgeMatrix.allLevels', 'Todos os Níveis')}</option>
            <option value="EXPERT">Expert</option>
            <option value="ADVANCED">Avançado</option>
            <option value="INTERMEDIATE">Intermédio</option>
            <option value="BEGINNER">Iniciante</option>
            <option value="NOT_STARTED">Não Iniciado</option>
          </select>
        </div>
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${viewMode === 'matrix' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Matriz
          </button>
          <button
            onClick={() => setViewMode('details')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${viewMode === 'details' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Lista Detalhada
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-400">
        {filteredRows.length} de {data.rows.length} formandos
      </div>

      {/* MATRIX VIEW */}
      {viewMode === 'matrix' ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="sticky left-0 z-20 bg-[#0a0a1a] px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[250px]">
                    Formando
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[100px]">
                    Nível
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[80px]">
                    %
                  </th>
                  {columns.map(col => (
                    <th key={col.course_id} className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="truncate max-w-[110px]" title={col.course_title}>{col.course_title}</span>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span>{col.total_lessons} aulas</span>
                          <span>{col.total_challenges} desaf.</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <motion.tr
                    key={row.student_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => toggleStudent(row.student_id)}
                  >
                    <td className="sticky left-0 z-10 bg-[#0a0a1a] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {row.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{row.student_name}</div>
                          <div className="text-gray-500 text-xs">{row.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <LevelBadge level={row.overall_level} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-sm font-bold ${
                        row.overall_completion_pct >= 80 ? 'text-emerald-400' :
                        row.overall_completion_pct >= 50 ? 'text-amber-400' :
                        row.overall_completion_pct > 0 ? 'text-orange-400' : 'text-gray-500'
                      }`}>
                        {row.overall_completion_pct.toFixed(0)}%
                      </span>
                    </td>
                    {columns.map(col => {
                      const skill = row.skills[String(col.course_id)];
                      if (!skill) {
                        return (
                          <td key={col.course_id} className="px-3 py-3 text-center">
                            <div className="w-6 h-6 mx-auto rounded bg-gray-800/50 flex items-center justify-center">
                              <Minus className="w-3 h-3 text-gray-600" />
                            </div>
                          </td>
                        );
                      }
                      const cfg = levelConfig[skill.level];
                      return (
                        <td key={col.course_id} className="px-3 py-3 text-center relative group">
                          <div
                            className={`relative w-10 h-10 mx-auto rounded-lg ${cfg.cellBg} border ${cfg.borderColor} flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCell(
                                selectedCell?.studentId === row.student_id && selectedCell?.courseId === col.course_id
                                  ? null
                                  : { studentId: row.student_id, courseId: col.course_id }
                              );
                            }}
                          >
                            {skill.level === 'EXPERT' && <Star className={`w-4 h-4 ${cfg.color}`} />}
                            {skill.level === 'ADVANCED' && <Zap className={`w-4 h-4 ${cfg.color}`} />}
                            {skill.level === 'INTERMEDIATE' && <Shield className={`w-4 h-4 ${cfg.color}`} />}
                            {skill.level === 'BEGINNER' && <TrendingUp className={`w-4 h-4 ${cfg.color}`} />}
                            {skill.level === 'NOT_STARTED' && <Minus className={`w-3 h-3 ${cfg.color}`} />}
                            
                            {skill.total_errors > 0 && (
                              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-[8px] text-white font-bold">{skill.total_errors > 9 ? '9+' : skill.total_errors}</span>
                              </div>
                            )}
                          </div>
                          
                          <AnimatePresence>
                            {selectedCell?.studentId === row.student_id && selectedCell?.courseId === col.course_id && (
                              <CellDetail skill={skill} courseName={col.course_title} />
                            )}
                          </AnimatePresence>
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DETAILS VIEW */
        <div className="space-y-4">
          {filteredRows.map((row, idx) => (
            <motion.div
              key={row.student_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
            >
              {/* Student Header */}
              <div
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleStudent(row.student_id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-lg font-bold">
                    {row.student_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{row.student_name}</h3>
                    <p className="text-gray-400 text-sm">{row.email}</p>
                  </div>
                  <LevelBadge level={row.overall_level} size="lg" />
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Conclusão</div>
                    <div className={`text-lg font-bold ${
                      row.overall_completion_pct >= 80 ? 'text-emerald-400' :
                      row.overall_completion_pct >= 50 ? 'text-amber-400' : 'text-gray-400'
                    }`}>{row.overall_completion_pct.toFixed(1)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">MPU</div>
                    <div className="text-lg font-bold text-white">{row.overall_avg_mpu?.toFixed(2) || '—'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Horas</div>
                    <div className="text-lg font-bold text-blue-400">{row.total_study_hours.toFixed(1)}h</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Certif.</div>
                    <div className="text-lg font-bold text-amber-400">{row.total_certificates}</div>
                  </div>
                  {expandedStudents.has(row.student_id) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedStudents.has(row.student_id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 border-t border-white/10 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {columns.map(col => {
                          const skill = row.skills[String(col.course_id)];
                          if (!skill) return null;
                          const cfg = levelConfig[skill.level];
                          return (
                            <div key={col.course_id} className={`rounded-xl border ${cfg.borderColor} ${cfg.cellBg} p-4`}>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-white font-semibold text-sm truncate max-w-[60%]" title={col.course_title}>
                                  {col.course_title}
                                </h4>
                                <LevelBadge level={skill.level} />
                              </div>
                              
                              {col.bank_name && (
                                <div className="text-xs text-gray-500 mb-2">
                                  🏦 {col.bank_name} {col.product_name ? `· ${col.product_name}` : ''}
                                </div>
                              )}

                              {/* Progress bars */}
                              <div className="space-y-2 mb-3">
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-400">Aulas</span>
                                    <span className="text-white">{skill.lessons_completed}/{skill.lessons_total}</span>
                                  </div>
                                  <div className="w-full bg-white/5 rounded-full h-1.5">
                                    <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: `${Math.min(skill.lesson_completion_pct, 100)}%` }} />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-400">Desafios aprovados</span>
                                    <span className="text-white">{skill.challenges_approved}/{skill.challenges_attempted}</span>
                                  </div>
                                  <div className="w-full bg-white/5 rounded-full h-1.5">
                                    <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${Math.min(skill.challenge_approval_pct, 100)}%` }} />
                                  </div>
                                </div>
                              </div>

                              {/* Metrics */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white/5 rounded-lg p-2 text-center">
                                  <div className="text-gray-500">MPU</div>
                                  <div className="text-white font-bold">{skill.avg_mpu?.toFixed(2) || '—'}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-2 text-center">
                                  <div className="text-gray-500">Tempo</div>
                                  <div className="text-white font-bold">{skill.total_time_hours.toFixed(1)}h</div>
                                </div>
                              </div>

                              {/* Errors */}
                              {skill.total_errors > 0 && (
                                <div className="mt-2 pt-2 border-t border-white/5">
                                  <div className="text-xs text-red-400 font-semibold mb-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {skill.total_errors} erros
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {skill.error_methodology > 0 && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">Met: {skill.error_methodology}</span>
                                    )}
                                    {skill.error_knowledge > 0 && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded">Con: {skill.error_knowledge}</span>
                                    )}
                                    {skill.error_detail > 0 && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">Det: {skill.error_detail}</span>
                                    )}
                                    {skill.error_procedure > 0 && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded">Proc: {skill.error_procedure}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {filteredRows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Users className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg">{t('knowledgeMatrix.noStudents', 'Nenhum formando encontrado')}</p>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Legenda dos Níveis</h4>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {Object.entries(levelConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={key} className={`flex items-center gap-2 p-2 rounded-lg ${cfg.bgColor} border ${cfg.borderColor}`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
                <div>
                  <div className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</div>
                  <div className="text-[10px] text-gray-500">
                    {key === 'EXPERT' && '≥85% competência'}
                    {key === 'ADVANCED' && '≥65% competência'}
                    {key === 'INTERMEDIATE' && '≥40% competência'}
                    {key === 'BEGINNER' && '<40% competência'}
                    {key === 'NOT_STARTED' && 'Sem atividade'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ SUMMARY CARD COMPONENT ============

function SummaryCard({ icon: Icon, label, value, color }: {
  icon: typeof Users;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-600 to-blue-400 shadow-blue-500/20',
    purple: 'from-purple-600 to-purple-400 shadow-purple-500/20',
    emerald: 'from-emerald-600 to-emerald-400 shadow-emerald-500/20',
    amber: 'from-amber-600 to-amber-400 shadow-amber-500/20',
    cyan: 'from-cyan-600 to-cyan-400 shadow-cyan-500/20',
    red: 'from-red-600 to-red-400 shadow-red-500/20',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colorMap[color]} p-4 rounded-2xl shadow-lg`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/80" />
        <span className="text-xs text-white/80 font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </motion.div>
  );
}
