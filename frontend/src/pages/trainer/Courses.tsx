import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen, Users, GraduationCap, Calendar, Search, LayoutGrid, List,
  ChevronRight, Building2, Package, Filter, ChevronDown, Eye
} from 'lucide-react';
import api from '../../lib/axios';
import { getTranslatedProductName } from '../../utils/productTranslation';

interface Course {
  id: number;
  title: string;
  description: string;
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

interface Bank { id: number; code: string; name: string; }
interface Product { id: number; code: string; name: string; }

export default function TrainerCoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allBanks, setAllBanks] = useState<Bank[]>([]);
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
      const [coursesRes, productsRes, banksRes] = await Promise.all([
        api.get('/api/trainer/courses/all'),
        api.get('/api/admin/products'),
        api.get('/api/admin/banks'),
      ]);
      setCourses(coursesRes.data);
      setAllProducts(productsRes.data);
      setAllBanks(banksRes.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueProducts = useMemo(() => allProducts, [allProducts]);
  const uniqueBanks = useMemo(() => allBanks, [allBanks]);

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
    if (!groupByProduct) return { 'all': filteredCourses };
    const groups: Record<string, Course[]> = {};
    filteredCourses.forEach(course => {
      if (course.products && course.products.length > 0) {
        course.products.forEach(product => {
          const key = getTranslatedProductName(t, product.code, product.name);
          if (!groups[key]) groups[key] = [];
          groups[key].push(course);
        });
      } else {
        const key = t('admin.noProduct', 'Sem Produto');
        if (!groups[key]) groups[key] = [];
        groups[key].push(course);
      }
    });
    return groups;
  }, [filteredCourses, groupByProduct, t]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });

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
            <BookOpen className="w-6 h-6 text-[#EC0000]" />
          </div>
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
              {t('trainer.courseCatalog', 'Catálogo de Cursos')}
            </p>
            <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {t('navigation.courses')}
            </h1>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {[
            { icon: BookOpen,     value: courses.length,                                         label: t('admin.totalCourses', 'Total de Cursos') },
            { icon: Users,        value: courses.reduce((s, c) => s + (c.total_students || 0), 0), label: t('admin.totalEnrollments', 'Total de Inscrições') },
            { icon: GraduationCap,value: new Set(courses.map(c => c.trainer_id)).size,           label: t('admin.activeTrainers', 'Formadores Ativos') },
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
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.searchCourses', 'Pesquisar por nome do curso...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#EC0000]/30 focus:border-[#EC0000]/30 transition-all placeholder-gray-400 font-body text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Product Filter */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2"><Package className="w-4 h-4 text-gray-400" /></div>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#EC0000]/30 focus:border-[#EC0000]/30 transition-all appearance-none min-w-[160px] font-body text-sm"
              >
                <option value="">{t('admin.allProducts', 'Todos Serviços')}</option>
                {uniqueProducts.map(p => <option key={p.id} value={p.id}>{getTranslatedProductName(t, p.code, p.name)}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {/* Bank Filter */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2"><Building2 className="w-4 h-4 text-gray-400" /></div>
              <select
                value={filterBank}
                onChange={(e) => setFilterBank(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#EC0000]/30 focus:border-[#EC0000]/30 transition-all appearance-none min-w-[160px] font-body text-sm"
              >
                <option value="">{t('admin.allBanks', 'Todos Bancos')}</option>
                {uniqueBanks.map(b => <option key={b.id} value={b.id}>{b.code} - {b.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {/* Group Toggle */}
            <button
              onClick={() => setGroupByProduct(!groupByProduct)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-body font-bold text-sm transition-colors ${
                groupByProduct ? 'bg-[#EC0000] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              {t('admin.groupByProduct', 'Agrupar por Serviço')}
            </button>
            {/* View Mode */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#EC0000] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#EC0000] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(filterProduct || filterBank || searchTerm) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className="font-body text-sm text-gray-500">{t('admin.activeFilters', 'Filtros ativos')}:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-body text-xs">
                <Search className="w-3 h-3" />"{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-[#EC0000]">×</button>
              </span>
            )}
            {filterProduct && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-lg font-body text-xs">
                <Package className="w-3 h-3" />
                {uniqueProducts.find(p => p.id === parseInt(filterProduct))?.name}
                <button onClick={() => setFilterProduct('')} className="ml-1 hover:text-[#EC0000]">×</button>
              </span>
            )}
            {filterBank && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg font-body text-xs">
                <Building2 className="w-3 h-3" />
                {uniqueBanks.find(b => b.id === parseInt(filterBank))?.code}
                <button onClick={() => setFilterBank('')} className="ml-1 hover:text-[#EC0000]">×</button>
              </span>
            )}
            <button onClick={() => { setSearchTerm(''); setFilterProduct(''); setFilterBank(''); }} className="font-body text-xs text-[#EC0000] hover:text-[#CC0000] ml-2">
              {t('common.clearAll', 'Limpar todos')}
            </button>
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="font-headline text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            {searchTerm ? t('admin.noCoursesFound', 'Nenhum curso encontrado') : t('admin.noCourses', 'Nenhum curso disponível')}
          </h3>
          <p className="font-body text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm">
            {searchTerm ? t('admin.tryDifferentSearch', 'Tente uma pesquisa diferente') : t('trainer.coursesWillAppear', 'Os cursos serão adicionados pelo administrador')}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedCourses).map(([productName, productCourses]) => (
            <div key={productName}>
              {/* Product Group Header */}
              {groupByProduct && productName !== 'all' && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#EC0000] text-white rounded-xl">
                    <Package className="w-5 h-5" />
                    <span className="font-body font-bold text-sm">{productName}</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-red-200 to-transparent dark:from-red-500/20" />
                  <span className="font-body text-sm text-gray-500 dark:text-gray-400">
                    {productCourses.length} {productCourses.length === 1 ? t('common.course', 'curso') : t('common.courses', 'cursos')}
                  </span>
                </div>
              )}

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productCourses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-[#EC0000]/30 transition-colors cursor-pointer group"
                    >
                      <div className="h-1 bg-[#EC0000]" />
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <BookOpen className="w-7 h-7 text-[#EC0000]" />
                          </div>
                          <div className="flex flex-col items-end gap-1 max-w-[120px]">
                            {course.banks?.slice(0, 2).map(bank => (
                              <span key={bank.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded font-body text-xs font-semibold flex items-center gap-1">
                                <Building2 className="w-3 h-3" />{bank.name}
                              </span>
                            ))}
                            {course.banks?.length > 2 && <span className="font-body text-xs text-gray-500">+{course.banks.length - 2}</span>}
                          </div>
                        </div>
                        <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#EC0000] transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="font-body text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                          {course.description || t('admin.noDescription', 'Sem descrição')}
                        </p>
                        <div className="flex items-center gap-2 mb-2 font-body text-sm text-gray-500 dark:text-gray-400">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          <span>{course.trainer_name || 'N/A'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {course.products?.slice(0, 2).map(product => (
                            <span key={product.id} className="px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded font-body text-xs font-medium flex items-center gap-1">
                              <Package className="w-3 h-3" />{getTranslatedProductName(t, product.code, product.name)}
                            </span>
                          ))}
                          {course.products?.length > 2 && <span className="font-body text-xs text-gray-500">+{course.products.length - 2}</span>}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-4 font-body text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1"><Users className="w-4 h-4" /><span>{course.total_students || 0}</span></div>
                            <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>{formatDate(course.created_at)}</span></div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#EC0000] group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                      <div className="px-6 pb-6">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course.id}`); }}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-[#EC0000] rounded-lg font-body font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          {t('common.viewDetails', 'Ver Detalhes')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-3">
                  {productCourses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-[#EC0000]/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                          <BookOpen className="w-6 h-6 text-[#EC0000]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-body font-bold text-gray-900 dark:text-white group-hover:text-[#EC0000] transition-colors truncate">
                              {course.title}
                            </h3>
                            {course.banks?.slice(0, 2).map(bank => (
                              <span key={bank.id} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded font-body text-xs font-medium shrink-0 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />{bank.name}
                              </span>
                            ))}
                            {course.banks?.length > 2 && <span className="font-body text-xs text-gray-500">+{course.banks.length - 2}</span>}
                          </div>
                          <p className="font-body text-gray-500 dark:text-gray-400 text-sm truncate">
                            {course.description || t('admin.noDescription', 'Sem descrição')}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {course.products?.slice(0, 3).map(product => (
                              <span key={product.id} className="px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded font-body text-xs font-medium flex items-center gap-1">
                                <Package className="w-3 h-3" />{getTranslatedProductName(t, product.code, product.name)}
                              </span>
                            ))}
                            {course.products?.length > 3 && <span className="font-body text-xs text-gray-500">+{course.products.length - 3}</span>}
                          </div>
                        </div>
                        <div className="hidden md:flex items-center gap-6 font-body text-sm text-gray-500 dark:text-gray-400 shrink-0">
                          <div className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /><span>{course.trainer_name || 'N/A'}</span></div>
                          <div className="flex items-center gap-1"><Users className="w-4 h-4" /><span>{course.total_students || 0}</span></div>
                          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>{formatDate(course.created_at)}</span></div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course.id}`); }}
                            className="p-2 bg-red-50 dark:bg-red-900/20 text-[#EC0000] rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            title={t('common.viewDetails', 'Ver Detalhes')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#EC0000] group-hover:translate-x-1 transition-all" />
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
