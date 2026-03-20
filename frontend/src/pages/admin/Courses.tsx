import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen, Plus, Users, GraduationCap, Calendar,
  Search, Building2, Package, Filter, ChevronDown,
  ChevronRight, Star, Shield, TrendingUp
} from 'lucide-react';
import api from '../../lib/axios';
import { getTranslatedProductName } from '../../utils/productTranslation';

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

const LEVEL: Record<string, { icon: typeof Star; label: string; cls: string }> = {
  EXPERT:       { icon: Star,       label: 'admin.levelExpert',       cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  INTERMEDIATE: { icon: Shield,     label: 'admin.levelIntermediate', cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  BEGINNER:     { icon: TrendingUp, label: 'admin.levelBeginner',     cls: 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400' },
};

export default function CoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [groupByProduct, setGroupByProduct] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [c, b, p] = await Promise.all([
          api.get('/api/admin/courses'),
          api.get('/api/admin/banks'),
          api.get('/api/admin/products'),
        ]);
        setCourses(c.data);
        setBanks(b.data);
        setProducts(p.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const uniqueProducts = useMemo(() => products.filter(p => p.id && p.name), [products]);
  const uniqueBanks = useMemo(() => banks.filter(b => b.id && b.code), [banks]);

  const filtered = useMemo(() => {
    return courses.filter(c => {
      const q = searchTerm.toLowerCase();
      const matchText = !q || c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.trainer_name?.toLowerCase().includes(q);
      const matchProd = !filterProduct || c.product_ids?.includes(parseInt(filterProduct));
      const matchBank = !filterBank || c.bank_ids?.includes(parseInt(filterBank));
      return matchText && matchProd && matchBank;
    });
  }, [courses, searchTerm, filterProduct, filterBank]);

  const grouped = useMemo(() => {
    if (!groupByProduct) return { all: filtered };
    const fpId = filterProduct ? parseInt(filterProduct) : null;
    const groups: Record<string, Course[]> = {};
    filtered.forEach(c => {
      let prods = c.products?.length ? c.products : [];
      if (fpId && prods.length) prods = prods.filter(p => p.id === fpId);
      if (prods.length) {
        prods.forEach(p => {
          const key = getTranslatedProductName(t, p.code, p.name);
          (groups[key] ??= []).push(c);
        });
      } else {
        (groups[t('common.noProduct', 'Sem Produto')] ??= []).push(c);
      }
    });
    return groups;
  }, [filtered, groupByProduct, filterProduct, t]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });

  const hasFilters = !!(searchTerm || filterProduct || filterBank);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-[3px] border-[#EC0000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ═══════════════ TOOLBAR ═══════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">

        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('navigation.courses')}
            </h1>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              ({filtered.length})
            </span>
          </div>
          <button
            onClick={() => navigate('/course/new')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('admin.newCourse')}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.searchCourses') || 'Pesquisar cursos...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/40 transition-colors"
            />
          </div>

          {/* Dropdowns + group toggle */}
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                value={filterProduct}
                onChange={e => setFilterProduct(e.target.value)}
                className="pl-3 pr-7 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white appearance-none min-w-[140px] focus:ring-2 focus:ring-[#EC0000]/20 transition-colors"
              >
                <option value="">{t('admin.allProducts') || 'Produto'}</option>
                {uniqueProducts.map(p => (
                  <option key={p.id} value={p.id}>{getTranslatedProductName(t, p.code, p.name)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filterBank}
                onChange={e => setFilterBank(e.target.value)}
                className="pl-3 pr-7 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white appearance-none min-w-[140px] focus:ring-2 focus:ring-[#EC0000]/20 transition-colors"
              >
                <option value="">{t('admin.allBanks') || 'Banco'}</option>
                {uniqueBanks.map(b => (
                  <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            <button
              onClick={() => setGroupByProduct(!groupByProduct)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                groupByProduct
                  ? 'bg-[#EC0000] text-white'
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('admin.groupByProduct') || 'Agrupar'}</span>
            </button>
          </div>
        </div>

        {/* Active filters */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-0.5 hover:text-[#EC0000]">×</button>
              </span>
            )}
            {filterProduct && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 rounded text-xs">
                <Package className="w-3 h-3" />{uniqueProducts.find(p => p.id === parseInt(filterProduct))?.name}
                <button onClick={() => setFilterProduct('')} className="ml-0.5 hover:text-[#EC0000]">×</button>
              </span>
            )}
            {filterBank && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded text-xs">
                <Building2 className="w-3 h-3" />{uniqueBanks.find(b => b.id === parseInt(filterBank))?.code}
                <button onClick={() => setFilterBank('')} className="ml-0.5 hover:text-[#EC0000]">×</button>
              </span>
            )}
            <button
              onClick={() => { setSearchTerm(''); setFilterProduct(''); setFilterBank(''); }}
              className="text-xs text-[#EC0000] hover:underline ml-1"
            >
              {t('common.clearAll') || 'Limpar'}
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════ COURSE LIST ═══════════════ */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {searchTerm ? (t('admin.noCoursesFound') || 'Nenhum curso encontrado') : t('admin.noCourses')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            {searchTerm ? (t('admin.tryDifferentSearch') || 'Tente outra pesquisa') : t('admin.createFirstCourse')}
          </p>
          {!searchTerm && (
            <button
              onClick={() => navigate('/course/new')}
              className="text-sm text-[#EC0000] hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />{t('admin.newCourse')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([productName, productCourses]) => (
            <section key={productName}>
              {/* Group header */}
              {groupByProduct && productName !== 'all' && (
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-lg text-xs font-semibold">
                    <Package className="w-3.5 h-3.5" />
                    {productName}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {productCourses.length}
                  </span>
                </div>
              )}

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {productCourses.map(course => {
                  const lvl = course.level ? LEVEL[course.level] || LEVEL.BEGINNER : null;
                  const LvlIcon = lvl?.icon;
                  return (
                    <div
                      key={course.id}
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer group"
                    >
                      {/* Title + level */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#EC0000] transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        {lvl && LvlIcon && (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${lvl.cls}`}>
                            <LvlIcon className="w-2.5 h-2.5" />{t(lvl.label)}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mb-3 min-h-[32px]">
                        {course.description || t('admin.noDescription')}
                      </p>

                      {/* Tags: banks + products */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {course.banks?.slice(0, 2).map(b => (
                          <span key={b.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[10px] font-medium">
                            <Building2 className="w-2.5 h-2.5" />{b.name}
                          </span>
                        ))}
                        {(course.banks?.length || 0) > 2 && (
                          <span className="text-[10px] text-gray-400">+{course.banks.length - 2}</span>
                        )}
                        {!groupByProduct && course.products?.slice(0, 2).map(p => (
                          <span key={p.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded text-[10px] font-medium">
                            <Package className="w-2.5 h-2.5" />{getTranslatedProductName(t, p.code, p.name)}
                          </span>
                        ))}
                      </div>

                      {/* Footer meta */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-700/50 text-[11px] text-gray-400 dark:text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 truncate max-w-[120px]">
                            <GraduationCap className="w-3 h-3 flex-shrink-0" />{course.trainer_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />{course.total_students}
                          </span>
                          <span className="hidden sm:flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{fmtDate(course.created_at)}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-[#EC0000] transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
