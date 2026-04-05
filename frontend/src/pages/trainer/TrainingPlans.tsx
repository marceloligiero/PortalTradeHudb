import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import TrainingPlanCard from '../../components/plans/TrainingPlanCard';
import { getTranslatedProductName } from '../../utils/productTranslation';

interface TrainingPlan {
  id: number;
  title: string;
  description: string;
  trainer_id: number;
  trainer: { id: number; full_name: string } | null;
  trainers: { id: number; full_name: string; email: string; is_primary: boolean }[];
  student: { id: number; full_name: string; email: string } | null;
  total_courses: number;
  total_duration_hours: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  is_active?: boolean;
  status: string;
  progress_percentage: number;
  days_remaining: number | null;
  days_delayed: number | null;
  is_delayed: boolean;
  bank_id?: number;
  bank_code?: string;
  bank_name?: string;
  product_id?: number;
  product_name?: string;
  product_code?: string;
  product_ids?: number[];
  bank_ids?: number[];
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

export default function TrainingPlans() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

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
      setPlans(plansRes.data);
      setBanks(banksRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(t('messages.error') || 'Failed to load training plans');
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

      const fpId = parseInt(filterProduct);
      const matchesProduct = !filterProduct || plan.product_id === fpId || (plan.product_ids?.includes(fpId) ?? false);
      const fbId = parseInt(filterBank);
      const matchesBank = !filterBank || plan.bank_id === fbId || (plan.bank_ids?.includes(fbId) ?? false);

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
        : (plan.product_name || t('common.noProduct', 'Sem Serviço'));
      if (!groups[key]) groups[key] = [];
      groups[key].push(plan);
    });
    return groups;
  }, [filteredPlans, groupByProduct, t]);

  // Calculate stats
  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.is_active !== false).length;
  const totalStudents = new Set(plans.filter(p => p.student?.id).map(p => p.student!.id)).size;
  const totalCourses = plans.reduce((acc, p) => acc + (p.total_courses || 0), 0);
  const totalHours = plans.reduce((acc, p) => acc + (p.total_duration_hours || 0), 0);

  /* ── Loading ─────────────────────────────────────────── */
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

      {/* ── Header ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-[#EC0000]" />
            </div>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
                {t('trainingPlan.management')}
              </p>
              <h1 className="font-headline text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {t('navigation.trainingPlans')}
              </h1>
              <p className="font-body text-gray-500 dark:text-gray-400 mt-1 max-w-xl text-sm">
                {t('trainingPlan.managePlansDescription')}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/training-plan/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-sm transition-colors shrink-0"
          >
            <Plus className="w-5 h-5" />
            {t('trainingPlan.createNew')}
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {[
            { icon: GraduationCap, value: totalPlans, label: t('trainingPlan.totalPlans') || 'Total de Planos' },
            { icon: PlayCircle, value: activePlans, label: t('trainingPlan.activePlans') || 'Planos Ativos' },
            { icon: Users, value: totalStudents, label: t('navigation.students') || 'Formandos' },
            { icon: BookOpen, value: totalCourses, label: t('navigation.courses') || 'Cursos' },
            { icon: Clock, value: `${totalHours}h`, label: t('trainingPlan.totalHours') || 'Horas Totais' },
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

      {/* ── Filter Bar ─────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.searchPlans') || 'Pesquisar planos...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#EC0000]/30 focus:border-[#EC0000]/30 transition-all placeholder-gray-400 font-body text-sm"
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
                className="pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#EC0000]/30 focus:border-[#EC0000]/30 transition-all appearance-none min-w-[160px] font-body text-sm"
              >
                <option value="">{t('admin.allProducts') || 'Todos Serviços'}</option>
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
                className="pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#EC0000]/30 focus:border-[#EC0000]/30 transition-all appearance-none min-w-[160px] font-body text-sm"
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-body font-bold text-sm transition-colors ${
                groupByProduct
                  ? 'bg-[#EC0000] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              {t('admin.groupByProduct') || 'Agrupar por Serviço'}
            </button>

            {/* View Mode */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#EC0000] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#EC0000] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(filterProduct || filterBank || searchTerm) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className="font-body text-sm text-gray-500">{t('admin.activeFilters') || 'Filtros ativos'}:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-body">
                <Search className="w-3 h-3" />
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-red-500">×</button>
              </span>
            )}
            {filterProduct && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-body">
                <Package className="w-3 h-3" />
                {uniqueProducts.find(p => p.id === parseInt(filterProduct))?.name}
                <button onClick={() => setFilterProduct('')} className="ml-1 hover:text-red-500">×</button>
              </span>
            )}
            {filterBank && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-body">
                <Building2 className="w-3 h-3" />
                {uniqueBanks.find(b => b.id === parseInt(filterBank))?.code}
                <button onClick={() => setFilterBank('')} className="ml-1 hover:text-red-500">×</button>
              </span>
            )}
            <button
              onClick={() => { setSearchTerm(''); setFilterProduct(''); setFilterBank(''); }}
              className="text-xs text-[#EC0000] hover:text-[#CC0000] font-body font-bold ml-2"
            >
              {t('common.clearAll') || 'Limpar todos'}
            </button>
          </div>
        )}
      </div>

      {/* ── Error Message ──────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-l-4 border-l-red-500 border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="font-body text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────── */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="font-headline text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">
            {searchTerm || filterProduct || filterBank
              ? t('admin.noPlansFound') || 'Nenhum plano encontrado'
              : t('trainingPlan.noPlans')}
          </h3>
          <p className="font-body text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto mb-6">
            {searchTerm || filterProduct || filterBank
              ? t('admin.tryDifferentSearch') || 'Tente uma pesquisa diferente'
              : t('trainingPlan.createFirstPlan')}
          </p>
          {!searchTerm && !filterProduct && !filterBank && (
            <button
              onClick={() => navigate('/training-plan/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-sm transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('trainingPlan.createNew')}
            </button>
          )}
        </div>
      ) : (
        /* Grouped Content */
        <div className="space-y-8">
          {Object.entries(groupedPlans).map(([productName, productPlans]) => (
            <div key={productName}>
              {/* Product Group Header */}
              {groupByProduct && productName !== 'all' && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <Package className="w-5 h-5 text-[#EC0000]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline text-lg font-bold text-gray-900 dark:text-white">
                      {productName}
                    </h2>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full font-mono text-sm">
                      {productPlans.length} {productPlans.length === 1
                        ? (t('planCard.plan') || 'plano')
                        : (t('planCard.plans') || 'planos')}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                </div>
              )}

              {/* Plans Grid/List */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productPlans.map((plan) => (
                    <TrainingPlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {productPlans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => navigate(`/trainer/training-plan/${plan.id}`)}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-[#EC0000]/30 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <GraduationCap className="w-6 h-6 text-[#EC0000]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-headline font-bold text-sm text-gray-900 dark:text-white truncate">{plan.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          {plan.student && (
                            <span className="font-body text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {plan.student.full_name}
                            </span>
                          )}
                          {(plan.bank_name || plan.bank_code) && (
                            <span className="font-body text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {plan.bank_name || plan.bank_code}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                            {plan.total_courses} {t('planCard.courses')}
                          </p>
                          <p className="font-mono text-xs text-gray-400 dark:text-gray-500">{plan.total_duration_hours}h</p>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          plan.status === 'COMPLETED'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : plan.status === 'DELAYED'
                              ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                              : plan.status === 'IN_PROGRESS'
                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          {plan.status === 'IN_PROGRESS' ? t('planStatus.inProgress')
                            : plan.status === 'COMPLETED' ? t('planStatus.completed')
                            : plan.status === 'DELAYED' ? t('planStatus.delayed')
                            : plan.status === 'NOT_STARTED' ? t('planStatus.notStarted')
                            : t('planStatus.pending')}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
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
