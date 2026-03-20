import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  GraduationCap, Plus, Search, Building2, Package,
  Filter, ChevronDown, AlertCircle
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import TrainingPlanCard from '../../components/plans/TrainingPlanCard';
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
  product_ids?: number[];
  bank_ids?: number[];
  banks?: Array<{ id: number; code: string; name: string }>;
  products?: Array<{ id: number; code: string; name: string }>;
  student?: { id: number; full_name: string; email: string };
  trainer?: { id: number; full_name: string };
  trainers?: Array<{ id: number; full_name: string; email?: string; is_primary?: boolean }>;
}

interface Bank { id: number; code: string; name: string }
interface Product { id: number; code: string; name: string }

export default function TrainingPlans() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [groupByProduct, setGroupByProduct] = useState(true);

  useEffect(() => {
    if (!token || !user) { navigate('/login'); return; }
    fetchData();
  }, [token, user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, banksRes, productsRes] = await Promise.all([
        api.get('/api/training-plans/'),
        api.get('/api/admin/banks'),
        api.get('/api/admin/products'),
      ]);
      setPlans(plansRes.data);
      setBanks(banksRes.data);
      setProducts(productsRes.data);
    } catch {
      setError('Failed to load training plans');
    } finally {
      setLoading(false);
    }
  };

  const uniqueProducts = useMemo(() => products.filter(p => p.id && p.name), [products]);
  const uniqueBanks = useMemo(() => banks.filter(b => b.id && b.code), [banks]);

  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const s = searchTerm.toLowerCase();
      const matchesTrainers = plan.trainers?.some(t => t.full_name?.toLowerCase().includes(s))
        || plan.trainer?.full_name?.toLowerCase().includes(s);
      const matchesSearch = plan.title.toLowerCase().includes(s)
        || plan.description?.toLowerCase().includes(s)
        || plan.student?.full_name?.toLowerCase().includes(s)
        || matchesTrainers;

      const fpId = parseInt(filterProduct);
      const matchesProduct = !filterProduct || plan.product_id === fpId || (plan.product_ids?.includes(fpId) ?? false);
      const fbId = parseInt(filterBank);
      const matchesBank = !filterBank || plan.bank_id === fbId || (plan.bank_ids?.includes(fbId) ?? false);

      return matchesSearch && matchesProduct && matchesBank;
    });
  }, [plans, searchTerm, filterProduct, filterBank]);

  const groupedPlans = useMemo(() => {
    if (!groupByProduct) return { all: filteredPlans };
    const fpId = filterProduct ? parseInt(filterProduct) : null;
    const groups: Record<string, TrainingPlan[]> = {};
    filteredPlans.forEach(plan => {
      let planProducts = plan.products?.length
        ? plan.products
        : plan.product_code
          ? [{ id: plan.product_id || 0, code: plan.product_code, name: plan.product_name || '' }]
          : [];
      if (fpId && planProducts.length) planProducts = planProducts.filter(p => p.id === fpId);
      if (!planProducts.length) {
        const key = t('common.noProduct', 'Sem Produto');
        if (!groups[key]) groups[key] = [];
        groups[key].push(plan);
      } else {
        planProducts.forEach(prod => {
          const key = getTranslatedProductName(t, prod.code, prod.name);
          if (!groups[key]) groups[key] = [];
          if (!groups[key].some(p => p.id === plan.id)) groups[key].push(plan);
        });
      }
    });
    return groups;
  }, [filteredPlans, groupByProduct, filterProduct, t]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[#EC0000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasFilters = searchTerm || filterProduct || filterBank;

  return (
    <div className="max-w-7xl mx-auto space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('admin.searchPlans', 'Pesquisar planos...')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/40 transition-colors"
          />
        </div>

        {/* Product filter */}
        <div className="relative">
          <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterProduct}
            onChange={e => setFilterProduct(e.target.value)}
            className="pl-8 pr-7 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white appearance-none min-w-[140px] focus:ring-2 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/40 transition-colors"
          >
            <option value="">{t('admin.allProducts', 'Todos Produtos')}</option>
            {uniqueProducts.map(p => (
              <option key={p.id} value={p.id}>{getTranslatedProductName(t, p.code, p.name)}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Bank filter */}
        <div className="relative">
          <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterBank}
            onChange={e => setFilterBank(e.target.value)}
            className="pl-8 pr-7 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white appearance-none min-w-[140px] focus:ring-2 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/40 transition-colors"
          >
            <option value="">{t('admin.allBanks', 'Todos Bancos')}</option>
            {uniqueBanks.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Group toggle */}
        <button
          onClick={() => setGroupByProduct(!groupByProduct)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
            groupByProduct
              ? 'bg-[#EC0000] text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          {t('admin.groupByProduct', 'Agrupar')}
        </button>

        {/* New plan */}
        <button
          onClick={() => navigate('/training-plan/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-lg text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('trainingPlan.createPlan')}
        </button>
      </div>

      {/* Active filters chips */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">{t('admin.activeFilters', 'Filtros')}:</span>
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs">
              "{searchTerm}"
              <button onClick={() => setSearchTerm('')} className="ml-0.5 hover:text-red-500">×</button>
            </span>
          )}
          {filterProduct && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded text-xs">
              <Package className="w-3 h-3" />
              {uniqueProducts.find(p => p.id === parseInt(filterProduct))?.name}
              <button onClick={() => setFilterProduct('')} className="ml-0.5 hover:text-red-500">×</button>
            </span>
          )}
          {filterBank && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded text-xs">
              <Building2 className="w-3 h-3" />
              {uniqueBanks.find(b => b.id === parseInt(filterBank))?.name}
              <button onClick={() => setFilterBank('')} className="ml-0.5 hover:text-red-500">×</button>
            </span>
          )}
          <button
            onClick={() => { setSearchTerm(''); setFilterProduct(''); setFilterBank(''); }}
            className="text-xs text-[#EC0000] hover:text-[#CC0000] font-bold"
          >
            {t('common.clearAll', 'Limpar')}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Content ── */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {hasFilters ? t('admin.noPlansFound', 'Nenhum plano encontrado') : t('trainingPlan.noPlan')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            {hasFilters ? t('admin.tryDifferentSearch', 'Tente uma pesquisa diferente') : t('trainingPlan.createFirstPlan')}
          </p>
          {!hasFilters && (
            <button
              onClick={() => navigate('/training-plan/new')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-lg text-sm font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('trainingPlan.createPlan')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPlans).map(([productName, productPlans]) => (
            <div key={productName}>
              {groupByProduct && productName !== 'all' && (
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-[#EC0000]" />
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">{productName}</h2>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">({productPlans.length})</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productPlans.map(plan => (
                  <TrainingPlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
