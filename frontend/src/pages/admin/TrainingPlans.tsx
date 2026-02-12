import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Plus, 
  Users, 
  BookOpen, 
  Clock, 
  PlayCircle,
  Search,
  LayoutGrid,
  List,
  Building2,
  Package,
  Filter,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import TrainingPlanCard from '../../components/plans/TrainingPlanCard';
import { PremiumHeader, AnimatedStatCard, FloatingOrbs } from '../../components/premium';
import { useTheme } from '../../contexts/ThemeContext';
import { getTranslatedProductName } from '../../utils/productTranslation';

interface TrainingPlan {
  id: number;
  title: string;
  description: string;
  trainer_name: string;
  total_courses: number;
  total_students: number;
  total_duration_hours: number;
  created_at: string;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
  status?: string;
  is_delayed?: boolean;
  bank_id?: number;
  bank_code?: string;
  bank_name?: string;
  product_id?: number;
  product_name?: string;
  product_code?: string;
  student?: {
    id: number;
    full_name: string;
    email: string;
  };
  trainer?: {
    id: number;
    full_name: string;
  };
  trainers?: Array<{
    id: number;
    full_name: string;
    email?: string;
    is_primary?: boolean;
  }>;
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

export default function TrainingPlans() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { isDark } = useTheme();

  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & View
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [filterBank, setFilterBank] = useState<string>('');
  const [groupByProduct, setGroupByProduct] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }

    fetchData();
  }, [token, user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, banksRes, productsRes] = await Promise.all([
        api.get('/api/training-plans/'),
        api.get('/api/admin/banks'),
        api.get('/api/admin/products')
      ]);
      console.log('Training plans response:', plansRes.data);
      setPlans(plansRes.data);
      setBanks(banksRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load training plans');
    } finally {
      setLoading(false);
    }
  };

  // Get unique products and banks from fetched lists
  const uniqueProducts = useMemo(() => {
    return products.filter(p => p.id && p.name);
  }, [products]);

  const uniqueBanks = useMemo(() => {
    return banks.filter(b => b.id && b.code);
  }, [banks]);

  // Filter plans
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const searchLower = searchTerm.toLowerCase();
      const matchesTrainers = plan.trainers?.some(t => 
        t.full_name?.toLowerCase().includes(searchLower)
      ) || plan.trainer?.full_name?.toLowerCase().includes(searchLower);
      
      const matchesSearch = 
        plan.title.toLowerCase().includes(searchLower) ||
        plan.description?.toLowerCase().includes(searchLower) ||
        plan.student?.full_name?.toLowerCase().includes(searchLower) ||
        matchesTrainers;
      
      const matchesProduct = !filterProduct || plan.product_id === parseInt(filterProduct);
      const matchesBank = !filterBank || plan.bank_id === parseInt(filterBank);
      
      return matchesSearch && matchesProduct && matchesBank;
    });
  }, [plans, searchTerm, filterProduct, filterBank]);

  // Group plans by product
  const groupedPlans = useMemo(() => {
    if (!groupByProduct) return { 'all': filteredPlans };
    
    const groups: Record<string, TrainingPlan[]> = {};
    filteredPlans.forEach(plan => {
      const key = plan.product_code 
        ? getTranslatedProductName(t, plan.product_code, plan.product_name || '') 
        : (plan.product_name || t('common.noProduct', 'Sem Produto'));
      if (!groups[key]) groups[key] = [];
      groups[key].push(plan);
    });
    return groups;
  }, [filteredPlans, groupByProduct, t]);

  // Calculate stats
  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.is_active !== false).length;
  // Contar formandos únicos atribuídos aos planos
  const uniqueStudentIds = new Set(plans.filter(p => p.student?.id).map(p => p.student.id));
  const totalStudents = uniqueStudentIds.size;
  const totalCourses = plans.reduce((acc, p) => acc + (p.total_courses || 0), 0);
  const totalHours = plans.reduce((acc, p) => acc + (p.total_duration_hours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <PremiumHeader
        icon={GraduationCap}
        title={t('navigation.trainingPlans')}
        subtitle={t('trainingPlan.manageAllPlans')}
        badge={t('admin.trainingManagement')}
        iconColor="from-indigo-500 to-indigo-700"
        actions={
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/training-plan/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            {t('trainingPlan.createPlan')}
          </motion.button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <AnimatedStatCard
          icon={GraduationCap}
          label={t('trainingPlan.totalPlans') || 'Total de Planos'}
          value={totalPlans}
          color="from-indigo-500 to-indigo-700"
          delay={0}
        />
        <AnimatedStatCard
          icon={PlayCircle}
          label={t('trainingPlan.activePlans') || 'Planos Ativos'}
          value={activePlans}
          color="from-green-500 to-emerald-600"
          delay={0.1}
        />
        <AnimatedStatCard
          icon={Users}
          label={t('navigation.students') || 'Formandos'}
          value={totalStudents}
          color="from-blue-500 to-blue-700"
          delay={0.2}
        />
        <AnimatedStatCard
          icon={BookOpen}
          label={t('navigation.courses') || 'Cursos'}
          value={totalCourses}
          color="from-purple-500 to-purple-700"
          delay={0.3}
        />
        <AnimatedStatCard
          icon={Clock}
          label={t('trainingPlan.totalHours') || 'Horas Totais'}
          value={totalHours}
          suffix="h"
          color="from-orange-500 to-orange-700"
          delay={0.4}
        />
      </div>

      {/* Search and Filter Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} p-4`}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.searchPlans') || 'Pesquisar planos...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400`}
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
                className={`pl-9 pr-8 py-2.5 ${isDark ? 'bg-gray-900/80 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none min-w-[160px]`}
              >
                <option value="">{t('admin.allProducts') || 'Todos Produtos'}</option>
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
                className={`pl-9 pr-8 py-2.5 ${isDark ? 'bg-gray-900/80 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none min-w-[160px]`}
              >
                <option value="">{t('admin.allBanks') || 'Todos Bancos'}</option>
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
                  : isDark 
                    ? 'bg-white/5 text-gray-400 hover:bg-white/10' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              {t('admin.groupByProduct') || 'Agrupar por Produto'}
            </button>
            
            {/* View Mode */}
            <div className={`flex items-center gap-1 ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-1`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Active Filters */}
        {(filterProduct || filterBank || searchTerm) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
            <span className="text-sm text-gray-500">{t('admin.activeFilters') || 'Filtros ativos'}:</span>
            {searchTerm && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'} rounded-lg text-xs`}>
                <Search className="w-3 h-3" />
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-red-500">×</button>
              </span>
            )}
            {filterProduct && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 ${isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'} rounded-lg text-xs`}>
                <Package className="w-3 h-3" />
                {uniqueProducts.find(p => p.id === parseInt(filterProduct))?.name}
                <button onClick={() => setFilterProduct('')} className="ml-1 hover:text-red-500">×</button>
              </span>
            )}
            {filterBank && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'} rounded-lg text-xs`}>
                <Building2 className="w-3 h-3" />
                {uniqueBanks.find(b => b.id === parseInt(filterBank))?.code}
                <button onClick={() => setFilterBank('')} className="ml-1 hover:text-red-500">×</button>
              </span>
            )}
            <button 
              onClick={() => { setSearchTerm(''); setFilterProduct(''); setFilterBank(''); }}
              className="text-xs text-indigo-500 hover:text-indigo-600 ml-2"
            >
              {t('common.clearAll') || 'Limpar todos'}
            </button>
          </div>
        )}
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
            />
          </div>
        ) : filteredPlans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden ${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} p-12 text-center`}
          >
            <FloatingOrbs variant="subtle" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, delay: 0.2 }}
            >
              <GraduationCap className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            </motion.div>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              {searchTerm || filterProduct || filterBank 
                ? t('admin.noPlansFound') || 'Nenhum plano encontrado'
                : t('trainingPlan.noPlan')}
            </h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
              {searchTerm || filterProduct || filterBank 
                ? t('admin.tryDifferentSearch') || 'Tente uma pesquisa diferente'
                : t('trainingPlan.createFirstPlan')}
            </p>
            {!searchTerm && !filterProduct && !filterBank && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/training-plan/new')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-600/30 transition-all"
              >
                <Plus className="w-5 h-5" />
                {t('trainingPlan.createPlan')}
              </motion.button>
            )}
          </motion.div>
        ) : (
          /* Grouped Content */
          <div className="space-y-8">
            {Object.entries(groupedPlans).map(([productName, productPlans]) => (
              <div key={productName}>
                {/* Product Group Header */}
                {groupByProduct && productName !== 'all' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 mb-4"
                  >
                    <div className={`p-2 ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'} rounded-lg`}>
                      <Package className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {productName}
                      </h2>
                      <span className={`px-2 py-0.5 ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-600'} rounded-full text-sm`}>
                        {productPlans.length} {productPlans.length === 1 ? 'plano' : 'planos'}
                      </span>
                    </div>
                    <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                  </motion.div>
                )}
                
                {/* Plans Grid/List */}
                {viewMode === 'grid' ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {productPlans.map((plan) => (
                      <motion.div
                        key={plan.id}
                        variants={cardVariants}
                        whileHover={{ y: -4 }}
                      >
                        <TrainingPlanCard plan={plan} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {productPlans.map((plan) => (
                      <motion.div
                        key={plan.id}
                        variants={cardVariants}
                        whileHover={{ x: 4 }}
                        onClick={() => navigate(`/training-plan/${plan.id}`)}
                        className={`flex items-center gap-4 p-4 ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-white hover:bg-gray-50 border-gray-200'} border rounded-xl cursor-pointer transition-all`}
                      >
                        <div className={`p-3 ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'} rounded-xl`}>
                          <GraduationCap className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>{plan.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            {plan.student && (
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                                <Users className="w-3 h-3" />
                                {plan.student.full_name}
                              </span>
                            )}
                            {plan.bank_code && (
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                                <Building2 className="w-3 h-3" />
                                {plan.bank_code}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.total_courses} cursos</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{plan.total_duration_hours}h</p>
                          </div>
                          <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            plan.status === 'COMPLETED' 
                              ? 'bg-green-500/20 text-green-400' 
                              : plan.status === 'DELAYED' 
                                ? 'bg-red-500/20 text-red-400'
                                : plan.status === 'IN_PROGRESS'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {plan.status || 'PENDING'}
                          </div>
                          <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
