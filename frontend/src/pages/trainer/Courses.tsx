import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Calendar,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  ChevronRight,
  Building2,
  Package,
  Filter,
  ChevronDown,
  Eye
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

interface Bank {
  id: number;
  code: string;
  name: string;
}

interface Product {
  id: number;
  code: string;
  name: string;
}

export default function TrainerCoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [filterBank, setFilterBank] = useState<string>('');
  const [groupByProduct, setGroupByProduct] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/trainer/courses/all');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique products and banks from courses data
  const uniqueProducts = useMemo(() => {
    const map = new Map<number, Product>();
    courses.forEach(c => c.products?.forEach(p => map.set(p.id, p)));
    return Array.from(map.values());
  }, [courses]);

  const uniqueBanks = useMemo(() => {
    const map = new Map<number, Bank>();
    courses.forEach(c => c.banks?.forEach(b => map.set(b.id, b)));
    return Array.from(map.values());
  }, [courses]);

  // Filter courses
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

  // Group courses by product
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-white dark:bg-gradient-to-r dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-transparent shadow-lg dark:shadow-none"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 hidden dark:block">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Floating orbs */}
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl hidden dark:block"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl hidden dark:block"
        />

        <div className="relative px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-lg shadow-indigo-600/30"
              >
                <BookOpen className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mb-1"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                    {t('trainer.courseCatalog', 'Catálogo de Cursos')}
                  </span>
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('navigation.courses')}
                </h1>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <BookOpen className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{courses.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin.totalCourses', 'Total de Cursos')}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {courses.reduce((sum, c) => sum + (c.total_students || 0), 0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin.totalEnrollments', 'Total de Inscrições')}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-green-500 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {new Set(courses.map(c => c.trainer_id)).size}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin.activeTrainers', 'Formadores Ativos')}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filter Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-white/10 p-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.searchCourses', 'Pesquisar por nome do curso...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Product Filter */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Package className="w-4 h-4 text-gray-400" />
              </div>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 dark:text-white appearance-none min-w-[160px]"
              >
                <option value="">{t('admin.allProducts', 'Todos Serviços')}</option>
                {uniqueProducts.map(product => (
                  <option key={product.id} value={product.id}>{getTranslatedProductName(t, product.code, product.name)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Bank Filter */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Building2 className="w-4 h-4 text-gray-400" />
              </div>
              <select
                value={filterBank}
                onChange={(e) => setFilterBank(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 dark:text-white appearance-none min-w-[160px]"
              >
                <option value="">{t('admin.allBanks', 'Todos Bancos')}</option>
                {uniqueBanks.map(bank => (
                  <option key={bank.id} value={bank.id}>{bank.code} - {bank.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Group Toggle */}
            <button
              onClick={() => setGroupByProduct(!groupByProduct)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                groupByProduct 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              {t('admin.groupByProduct', 'Agrupar por Serviço')}
            </button>
            
            {/* View Mode */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Active Filters */}
        {(filterProduct || filterBank || searchTerm) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
            <span className="text-sm text-gray-500">{t('admin.activeFilters', 'Filtros ativos')}:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-xs">
                <Search className="w-3 h-3" />
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-indigo-500">×</button>
              </span>
            )}
            {filterProduct && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-lg text-xs">
                <Package className="w-3 h-3" />
                {uniqueProducts.find(p => p.id === parseInt(filterProduct))?.name}
                <button onClick={() => setFilterProduct('')} className="ml-1 hover:text-indigo-500">×</button>
              </span>
            )}
            {filterBank && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
                <Building2 className="w-3 h-3" />
                {uniqueBanks.find(b => b.id === parseInt(filterBank))?.code}
                <button onClick={() => setFilterBank('')} className="ml-1 hover:text-indigo-500">×</button>
              </span>
            )}
            <button 
              onClick={() => { setSearchTerm(''); setFilterProduct(''); setFilterBank(''); }}
              className="text-xs text-indigo-500 hover:text-indigo-600 ml-2"
            >
              {t('common.clearAll', 'Limpar todos')}
            </button>
          </div>
        )}
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full mx-auto"
              />
              <BookOpen className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-500 mt-4 font-medium">{t('messages.loading')}</p>
          </motion.div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-12 text-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full mb-6"
          >
            <BookOpen className="w-10 h-10 text-gray-400" />
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-2">
            {searchTerm ? t('admin.noCoursesFound', 'Nenhum curso encontrado') : t('admin.noCourses', 'Nenhum curso disponível')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {searchTerm ? t('admin.tryDifferentSearch', 'Tente uma pesquisa diferente') : t('trainer.coursesWillAppear', 'Os cursos serão adicionados pelo administrador')}
          </p>
        </motion.div>
      ) : (
        /* Grouped Content */
        <div className="space-y-8">
          {Object.entries(groupedCourses).map(([productName, productCourses]) => (
            <div key={productName}>
              {/* Product Group Header */}
              {groupByProduct && productName !== 'all' && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl">
                    <Package className="w-5 h-5" />
                    <span className="font-semibold">{productName}</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent dark:from-orange-500/20" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {productCourses.length} {productCourses.length === 1 ? t('common.course', 'curso') : t('common.courses', 'cursos')}
                  </span>
                </div>
              )}
              
              {viewMode === 'grid' ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {productCourses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden hover:shadow-xl hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 cursor-pointer group"
                    >
                      {/* Card Header */}
                      <div className="h-2 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700" />
                      
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-600/20"
                          >
                            <BookOpen className="w-7 h-7 text-white" />
                          </motion.div>
                          <div className="flex flex-col items-end gap-1 max-w-[120px]">
                            {course.banks?.slice(0, 2).map(bank => (
                              <span key={bank.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {bank.code}
                              </span>
                            ))}
                            {course.banks?.length > 2 && (
                              <span className="text-xs text-gray-500">+{course.banks.length - 2}</span>
                            )}
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                          {course.description || t('admin.noDescription', 'Sem descrição')}
                        </p>
                        
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          <span>{course.trainer_name || 'N/A'}</span>
                        </div>
                        
                        {/* Products badges */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {course.products?.slice(0, 2).map(product => (
                            <span key={product.id} className="px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded text-xs font-medium flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {getTranslatedProductName(t, product.code, product.name)}
                            </span>
                          ))}
                          {course.products?.length > 2 && (
                            <span className="text-xs text-gray-500">+{course.products.length - 2}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{course.total_students || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(course.created_at)}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>

                      {/* Action Button - View Only */}
                      <div className="px-6 pb-6 pt-0">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course.id}`); }}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          {t('common.viewDetails', 'Ver Detalhes')}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                /* List View */
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {productCourses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="bg-white dark:bg-white/5 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-4 hover:shadow-lg hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-600/20 flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                              {course.title}
                            </h3>
                            {course.banks?.slice(0, 2).map(bank => (
                              <span key={bank.id} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium flex-shrink-0 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {bank.code}
                              </span>
                            ))}
                            {course.banks?.length > 2 && (
                              <span className="text-xs text-gray-500">+{course.banks.length - 2}</span>
                            )}
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-sm truncate">
                            {course.description || t('admin.noDescription', 'Sem descrição')}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {course.products?.slice(0, 3).map(product => (
                              <span key={product.id} className="px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded text-xs font-medium flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {getTranslatedProductName(t, product.code, product.name)}
                              </span>
                            ))}
                            {course.products?.length > 3 && (
                              <span className="text-xs text-gray-500">+{course.products.length - 3}</span>
                            )}
                          </div>
                        </div>

                        <div className="hidden md:flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4" />
                            <span>{course.trainer_name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{course.total_students || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(course.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course.id}`); }}
                            className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"
                            title={t('common.viewDetails', 'Ver Detalhes')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
