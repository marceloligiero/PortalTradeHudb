import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen, Plus, Target, Users, GraduationCap, Calendar,
  Search, LayoutGrid, List, ChevronRight, Building2, Package,
  Filter, ChevronDown, Star, Shield, TrendingUp
} from 'lucide-react';
import api from '../../lib/axios';
import { getTranslatedProductName } from '../../utils/productTranslation';
import { useTheme } from '../../contexts/ThemeContext';

interface Course {
  id: number;
  title: string;
  description: string;
  level?: string;
  bank_id: number;
  bank_ids: number[];
  banks: { id: number; code: string; name: string }[];
  product_id: number;
  product_ids: number[];
  products: { id: number; code: string; name: string }[];
  trainer_id: number;
  trainer_name: string;
  total_students: number;
  created_at: string;
}

interface Bank { id: number; code: string; name: string }
interface Product { id: number; code: string; name: string }

export default function CoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [filterBank, setFilterBank] = useState<string>('');
  const [groupByProduct, setGroupByProduct] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesResp, banksResp, productsResp] = await Promise.all([
        api.get('/api/admin/courses'),
        api.get('/api/admin/banks'),
        api.get('/api/admin/products'),
      ]);
      setCourses(coursesResp.data);
      setBanks(banksResp.data);
      setProducts(productsResp.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueProducts = useMemo(() => products.filter(p => p.id && p.name), [products]);
  const uniqueBanks = useMemo(() => banks.filter(b => b.id && b.code), [banks]);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.trainer_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProduct = !filterProduct || course.product_ids?.includes(parseInt(filterProduct));
      const matchesBank = !filterBank || course.bank_ids?.includes(parseInt(filterBank));
      return matchesSearch && matchesProduct && matchesBank;
    });
  }, [courses, searchTerm, filterProduct, filterBank]);

  const groupedCourses = useMemo(() => {
    if (!groupByProduct) return { all: filteredCourses };
    const fpId = filterProduct ? parseInt(filterProduct) : null;
    const groups: Record<string, Course[]> = {};
    filteredCourses.forEach(course => {
      let courseProducts = course.products?.length > 0 ? course.products : [];
      if (fpId && courseProducts.length > 0) courseProducts = courseProducts.filter(p => p.id === fpId);
      if (courseProducts.length > 0) {
        courseProducts.forEach(product => {
          const key = getTranslatedProductName(t, product.code, product.name);
          if (!groups[key]) groups[key] = [];
          groups[key].push(course);
        });
      } else {
        const key = t('common.noProduct', 'Sem Produto');
        if (!groups[key]) groups[key] = [];
        groups[key].push(course);
      }
    });
    return groups;
  }, [filteredCourses, groupByProduct, filterProduct, t]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });

  const LevelBadge = ({ level }: { level?: string }) => {
    if (!level) return null;
    const cfg =
      level === 'EXPERT' ? { icon: Star, label: t('admin.levelExpert', 'Especialista'), color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' } :
      level === 'INTERMEDIATE' ? { icon: Shield, label: t('admin.levelIntermediate', 'Intermédio'), color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' } :
      { icon: TrendingUp, label: t('admin.levelBeginner', 'Iniciante'), color: 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${cfg.color}`}>
        <cfg.icon className="w-3 h-3" /> {cfg.label}
      </span>
    );
  };

  /* ── Loading ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin mx-auto" />
          <p className="font-body text-sm text-gray-500 dark:text-gray-400 mt-4">{t('messages.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-[#EC0000]" />
            </div>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
                {t('admin.courseManagement') || 'Gestão de Cursos'}
              </p>
              <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {t('navigation.courses')}
              </h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/course/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-bold text-sm transition-colors shrink-0"
          >
            <Plus className="w-5 h-5" />
            {t('admin.newCourse')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {[
            { icon: BookOpen, value: courses.length, label: t('admin.totalCourses'), accent: 'text-[#EC0000]' },
            { icon: Users, value: courses.reduce((s, c) => s + c.total_students, 0), label: t('admin.totalEnrollments'), accent: 'text-blue-500' },
            { icon: GraduationCap, value: new Set(courses.map(c => c.trainer_id)).size, label: t('admin.activeTrainers'), accent: 'text-emerald-500' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.accent} shrink-0`} />
              <div>
                <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="font-body text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.searchCourses') || 'Pesquisar por nome do curso...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#EC0000]/30 focus:border-[#EC0000]/50 transition-colors"
            />
          </div>

          {/* Filter selects */}
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={filterProduct}
                onChange={e => setFilterProduct(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white appearance-none min-w-[160px] focus:ring-2 focus:ring-[#EC0000]/30 transition-colors"
                style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}
              >
                <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('admin.allProducts') || 'Todos Produtos'}</option>
                {uniqueProducts.map(p => (
                  <option key={p.id} value={p.id} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{getTranslatedProductName(t, p.code, p.name)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={filterBank}
                onChange={e => setFilterBank(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white appearance-none min-w-[160px] focus:ring-2 focus:ring-[#EC0000]/30 transition-colors"
                style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}
              >
                <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('admin.allBanks') || 'Todos Bancos'}</option>
                {uniqueBanks.map(b => (
                  <option key={b.id} value={b.id} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{b.code} - {b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <button
              onClick={() => setGroupByProduct(!groupByProduct)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                groupByProduct
                  ? 'bg-[#EC0000] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              {t('admin.groupByProduct') || 'Agrupar por Produto'}
            </button>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#EC0000] text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#EC0000] text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active filters */}
        {(filterProduct || filterBank || searchTerm) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400">{t('admin.activeFilters') || 'Filtros ativos'}:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs">
                <Search className="w-3 h-3" /> "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-red-500">×</button>
              </span>
            )}
            {filterProduct && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 rounded-lg text-xs">
                <Package className="w-3 h-3" /> {uniqueProducts.find(p => p.id === parseInt(filterProduct))?.name}
                <button onClick={() => setFilterProduct('')} className="ml-1 hover:text-red-500">×</button>
              </span>
            )}
            {filterBank && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
                <Building2 className="w-3 h-3" /> {uniqueBanks.find(b => b.id === parseInt(filterBank))?.code}
                <button onClick={() => setFilterBank('')} className="ml-1 hover:text-red-500">×</button>
              </span>
            )}
            <button onClick={() => { setSearchTerm(''); setFilterProduct(''); setFilterBank(''); }} className="text-xs text-[#EC0000] hover:underline ml-2">
              {t('common.clearAll') || 'Limpar todos'}
            </button>
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="font-headline text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">
            {searchTerm ? t('admin.noCoursesFound') || 'Nenhum curso encontrado' : t('admin.noCourses')}
          </h3>
          <p className="font-body text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto mb-6">
            {searchTerm ? t('admin.tryDifferentSearch') || 'Tente uma pesquisa diferente' : t('admin.createFirstCourse')}
          </p>
          {!searchTerm && (
            <button
              onClick={() => navigate('/course/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-bold text-sm transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('admin.newCourse')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedCourses).map(([productName, productCourses]) => (
            <div key={productName}>
              {/* Product group header */}
              {groupByProduct && productName !== 'all' && (
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 rounded-lg text-sm font-bold">
                    <Package className="w-4 h-4" />
                    {productName}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    {productCourses.length} {productCourses.length === 1 ? 'curso' : 'cursos'}
                  </span>
                </div>
              )}

              {viewMode === 'grid' ? (
                /* ── Grid View ──────────────────────────── */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productCourses.map(course => (
                    <div
                      key={course.id}
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-[#EC0000]/30 transition-colors duration-200 cursor-pointer group"
                    >
                      {/* Red accent top bar */}
                      <div className="h-1 bg-[#EC0000]" />

                      <div className="p-5">
                        {/* Top row: icon + banks */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-[#EC0000]" />
                          </div>
                          <div className="flex flex-col items-end gap-1 max-w-[120px]">
                            {course.banks?.slice(0, 2).map(bank => (
                              <span key={bank.id} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded text-[10px] font-bold flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5" /> {bank.name}
                              </span>
                            ))}
                            {course.banks?.length > 2 && (
                              <span className="text-[10px] text-gray-400">+{course.banks.length - 2}</span>
                            )}
                          </div>
                        </div>

                        {/* Title + level */}
                        <h3 className="font-headline text-base font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-[#EC0000] transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <LevelBadge level={course.level} />

                        <p className="font-body text-sm text-gray-500 dark:text-gray-400 mt-2 mb-3 line-clamp-2 min-h-[40px]">
                          {course.description || t('admin.noDescription')}
                        </p>

                        {/* Trainer */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-2">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>{course.trainer_name}</span>
                        </div>

                        {/* Products */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {course.products?.slice(0, 2).map(product => (
                            <span key={product.id} className="px-2 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded text-[10px] font-bold flex items-center gap-1">
                              <Package className="w-2.5 h-2.5" />
                              {getTranslatedProductName(t, product.code, product.name)}
                            </span>
                          ))}
                          {course.products?.length > 2 && (
                            <span className="text-[10px] text-gray-400">+{course.products.length - 2}</span>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {course.total_students}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(course.created_at)}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-[#EC0000] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="px-5 pb-4 pt-0 flex gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/courses/${course.id}/challenges/new`); }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-lg font-bold text-xs hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                        >
                          <Target className="w-3.5 h-3.5" /> {t('challenges.createNew')}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/courses/${course.id}/lessons/new`); }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> {t('trainingPlan.newLesson')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ── List View ──────────────────────────── */
                <div className="space-y-2">
                  {productCourses.map(course => (
                    <div
                      key={course.id}
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-[#EC0000]/30 transition-colors duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-[#EC0000]" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-headline font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#EC0000] transition-colors truncate">
                              {course.title}
                            </h3>
                            <LevelBadge level={course.level} />
                            {course.banks?.slice(0, 2).map(bank => (
                              <span key={bank.id} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded text-[10px] font-bold shrink-0 flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5" /> {bank.name}
                              </span>
                            ))}
                            {course.banks?.length > 2 && <span className="text-[10px] text-gray-400">+{course.banks.length - 2}</span>}
                          </div>
                          <p className="font-body text-xs text-gray-400 dark:text-gray-500 truncate">
                            {course.description || t('admin.noDescription')}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {course.products?.slice(0, 3).map(product => (
                              <span key={product.id} className="px-2 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded text-[10px] font-bold flex items-center gap-1">
                                <Package className="w-2.5 h-2.5" /> {getTranslatedProductName(t, product.code, product.name)}
                              </span>
                            ))}
                            {course.products?.length > 3 && <span className="text-[10px] text-gray-400">+{course.products.length - 3}</span>}
                          </div>
                        </div>

                        <div className="hidden md:flex items-center gap-5 text-xs text-gray-400 dark:text-gray-500 shrink-0">
                          <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {course.trainer_name}</span>
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {course.total_students}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(course.created_at)}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/courses/${course.id}/challenges/new`); }}
                            className="p-2 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                            title={t('challenges.createNew')}
                          >
                            <Target className="w-4 h-4" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/courses/${course.id}/lessons/new`); }}
                            className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                            title={t('trainingPlan.newLesson')}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-[#EC0000] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
