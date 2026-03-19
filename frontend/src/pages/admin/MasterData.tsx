import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, Package, Users, FolderTree, MessageCircle,
  Plus, Pencil, Trash2, X, CheckCircle2, XCircle, AlertTriangle,
  Search, Sparkles, Save, Loader2, Zap, Globe, Eye, Building, Activity,
  ChevronRight, UserPlus, Link2, Unlink,
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface Bank {
  id: number; code: string; name: string; country: string;
  is_active: boolean; created_at: string;
}
interface Product {
  id: number; code: string; name: string; description: string | null;
  is_active: boolean; created_at: string;
}
interface Team {
  id: number; name: string; description: string | null;
  product_id: number | null; manager_id: number | null;
  is_active: boolean; created_at: string;
  manager_name?: string | null;
  product_name?: string | null;
  manager?: { id: number; full_name: string; email: string };
  product?: { id: number; name: string };
  members_count?: number;
  services?: { id: number; name: string | null }[];
  team_members?: { id: number; full_name: string; email: string; role: string; team_role?: string }[];
}
interface ErrorCategory {
  id: number; name: string; description: string | null;
  parent_id: number | null; origin_id?: number | null; is_active: boolean; created_at: string;
}
interface ChatFAQ {
  id: number; keywords_pt: string; keywords_es: string | null; keywords_en: string | null;
  answer_pt: string; answer_es: string | null; answer_en: string | null;
  support_url: string | null; support_label: string | null;
  role_filter: string | null; priority: number;
  is_active: boolean; created_at: string;
}
interface LookupItem {
  id: number; name: string; description: string | null; is_active: boolean;
  bank_id?: number | null; department_id?: number | null;
  activity_id?: number | null; origin_id?: number | null;
  bank_name?: string | null; department_name?: string | null;
  activity_name?: string | null; origin_name?: string | null;
}

type TabKey = 'banks' | 'products' | 'teams' | 'categories' | 'faqs' | 'impacts' | 'origins' | 'detected_by' | 'departments' | 'activities' | 'error_types';

const LOOKUP_TABS: TabKey[] = ['impacts', 'origins', 'detected_by', 'departments', 'activities', 'error_types'];
const LOOKUP_API: Record<string, string> = {
  impacts: '/api/admin/master/impacts',
  origins: '/api/admin/master/origins',
  detected_by: '/api/admin/master/detected-by',
  departments: '/api/admin/master/departments',
  activities: '/api/admin/master/activities',
  error_types: '/api/admin/master/error-types',
};

/* Tabs that need dependency selectors */
const DEP_TABS: TabKey[] = ['activities', 'error_types', 'categories'];

const TAB_CONFIG: Record<TabKey, { icon: any; titleKey: string }> = {
  banks:      { icon: Building2,     titleKey: 'masterData.banks' },
  products:   { icon: Package,       titleKey: 'masterData.products' },
  teams:      { icon: Users,         titleKey: 'masterData.teams' },
  categories: { icon: FolderTree,    titleKey: 'masterData.categories' },
  impacts:    { icon: Zap,           titleKey: 'masterData.impacts' },
  origins:    { icon: Globe,         titleKey: 'masterData.origins' },
  detected_by:{ icon: Eye,           titleKey: 'masterData.detectedBy' },
  departments:{ icon: Building,      titleKey: 'masterData.departments' },
  activities:  { icon: Activity,      titleKey: 'masterData.events' },
  error_types: { icon: AlertTriangle,  titleKey: 'masterData.errorTypes' },
  faqs:        { icon: MessageCircle, titleKey: 'masterData.faqs' },
};

/* ─── Modal Shell ───────────────────────────────────────────────────── */
function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#EC0000]" />
            </div>
            <h3 className="text-lg font-headline font-bold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ─── Delete Confirmation ───────────────────────────────────────────── */
function DeleteConfirm({ open, onClose, onConfirm, name, error }: {
  open: boolean; onClose: () => void; onConfirm: () => void; name: string; error: string;
}) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} title={t('masterData.confirmDelete')}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-5 h-5 text-[#EC0000] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{t('masterData.deleteWarning', { name })}</p>
        </div>
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
          </div>
        )}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            {t('common.cancel', 'Cancelar')}
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-[#EC0000] hover:bg-[#CC0000] text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> {t('common.delete', 'Eliminar')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Form Field ────────────────────────────────────────────────────── */
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="group">
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 group-focus-within:text-[#EC0000] transition-colors">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}
const inputCls = "w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#EC0000]/40 focus:ring-2 focus:ring-[#EC0000]/10 transition-all outline-none text-sm";
const selectCls = inputCls + " appearance-none cursor-pointer";

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export default function MasterDataPage({ tab = 'banks' as TabKey }: { tab?: TabKey }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [search, setSearch] = useState('');

  /* ── Data states ────────────────────────────────────────────────── */
  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [categories, setCategories] = useState<ErrorCategory[]>([]);
  const [faqs, setFaqs] = useState<ChatFAQ[]>([]);
  const [lookupItems, setLookupItems] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);

  /* ── Modal states ───────────────────────────────────────────────── */
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleteError, setDeleteError] = useState('');
  const [saving, setSaving] = useState(false);

  /* ── Form data per tab ──────────────────────────────────────────── */
  const [bankForm, setBankForm] = useState({ name: '', country: 'PT', is_active: true });
  const [productForm, setProductForm] = useState({ code: '', name: '', description: '', is_active: true });
  const [teamForm, setTeamForm] = useState({ name: '', description: '', service_ids: [] as number[], manager_id: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', parent_id: '', origin_id: '' });
  const [faqForm, setFaqForm] = useState({
    keywords_pt: '', keywords_es: '', keywords_en: '',
    answer_pt: '', answer_es: '', answer_en: '',
    support_url: '', support_label: '', role_filter: '', priority: 0,
  });
  const [lookupForm, setLookupForm] = useState({ name: '', description: '', bank_id: '', department_id: '', activity_id: '', origin_id: '' });

  /* ── Aux data ───────────────────────────────────────────────────── */
  const [managers, setManagers] = useState<{ id: number; full_name: string }[]>([]);
  const [auxBanks, setAuxBanks] = useState<{ id: number; name: string }[]>([]);
  const [auxDepts, setAuxDepts] = useState<{ id: number; name: string }[]>([]);
  const [auxActivities, setAuxActivities] = useState<{ id: number; name: string }[]>([]);
  const [auxOrigins, setAuxOrigins] = useState<{ id: number; name: string }[]>([]);

  /* ── Team detail states ─────────────────────────────────────────── */
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; full_name: string; email: string; role: string }[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [addingService, setAddingService] = useState(false);

  /* ── Fetch ──────────────────────────────────────────────────────── */
  useEffect(() => { fetchTab(); }, [tab]);

  const fetchTab = async () => {
    setLoading(true);
    setSearch('');
    try {
      switch (tab) {
        case 'banks': {
          const r = await api.get('/api/admin/banks');
          setBanks(r.data);
          break;
        }
        case 'products': {
          const r = await api.get('/api/admin/products');
          setProducts(r.data);
          break;
        }
        case 'teams': {
          const r = await api.get('/api/teams');
          setTeams(r.data);
          try {
            const p = await api.get('/api/admin/products');
            setProducts(p.data);
          } catch (e) { console.error('Failed to load products for teams', e); }
          try {
            const m = await api.get('/api/tutoria/team');
            const allUsers = Array.isArray(m.data) ? m.data : [];
            setManagers(allUsers.filter((u: any) => u.role === 'MANAGER' || u.role === 'ADMIN'));
          } catch (e) { console.error('Failed to load managers for teams', e); }
          break;
        }
        case 'categories': {
          const r = await api.get('/api/tutoria/categories');
          setCategories(r.data);
          try {
            const oRes = await api.get('/api/admin/master/origins');
            setAuxOrigins(Array.isArray(oRes.data) ? oRes.data : []);
          } catch (e) { console.error('Failed to load origins for categories', e); }
          break;
        }
        case 'faqs': {
          const r = await api.get('/api/chat/faqs');
          setFaqs(r.data);
          break;
        }
        default: {
          if (LOOKUP_API[tab]) {
            const r = await api.get(LOOKUP_API[tab]);
            setLookupItems(Array.isArray(r.data) ? r.data : []);
          }
          if (DEP_TABS.includes(tab)) {
            try {
              const [bRes, dRes, aRes, oRes] = await Promise.all([
                api.get('/api/admin/banks'),
                api.get('/api/admin/master/departments'),
                api.get('/api/admin/master/activities'),
                api.get('/api/admin/master/origins'),
              ]);
              setAuxBanks(Array.isArray(bRes.data) ? bRes.data : []);
              setAuxDepts(Array.isArray(dRes.data) ? dRes.data : []);
              setAuxActivities(Array.isArray(aRes.data) ? aRes.data : []);
              setAuxOrigins(Array.isArray(oRes.data) ? oRes.data : []);
            } catch (e) { console.error('Failed to load aux data', e); }
          }
          break;
        }
      }
    } catch (e) { console.error('Fetch error', e); }
    finally { setLoading(false); }
  };

  /* ── Counts ─────────────────────────────────────────────────────── */
  const currentConfig = TAB_CONFIG[tab];

  /* ── Open create ────────────────────────────────────────────────── */
  const openCreate = () => {
    setEditItem(null);
    switch (tab) {
      case 'banks': setBankForm({ name: '', country: 'PT', is_active: true }); break;
      case 'products': setProductForm({ code: '', name: '', description: '', is_active: true }); break;
      case 'teams': setTeamForm({ name: '', description: '', service_ids: [], manager_id: '' }); break;
      case 'categories': setCategoryForm({ name: '', description: '', parent_id: '', origin_id: '' }); break;
      case 'faqs': setFaqForm({ keywords_pt: '', keywords_es: '', keywords_en: '', answer_pt: '', answer_es: '', answer_en: '', support_url: '', support_label: '', role_filter: '', priority: 0 }); break;
      default: setLookupForm({ name: '', description: '', bank_id: '', department_id: '', activity_id: '', origin_id: '' }); break;
    }
    setShowForm(true);
  };

  /* ── Open edit ──────────────────────────────────────────────────── */
  const openEdit = (item: any) => {
    setEditItem(item);
    switch (tab) {
      case 'banks': setBankForm({ name: item.name, country: item.country, is_active: item.is_active }); break;
      case 'products': setProductForm({ code: item.code, name: item.name, description: item.description || '', is_active: item.is_active }); break;
      case 'teams': setTeamForm({ name: item.name, description: item.description || '', service_ids: (item.services || []).map((s: any) => s.id), manager_id: item.manager_id?.toString() || '' }); break;
      case 'categories': setCategoryForm({ name: item.name, description: item.description || '', parent_id: item.parent_id?.toString() || '', origin_id: item.origin_id?.toString() || '' }); break;
      case 'faqs': setFaqForm({
        keywords_pt: item.keywords_pt || '', keywords_es: item.keywords_es || '', keywords_en: item.keywords_en || '',
        answer_pt: item.answer_pt || '', answer_es: item.answer_es || '', answer_en: item.answer_en || '',
        support_url: item.support_url || '', support_label: item.support_label || '',
        role_filter: item.role_filter || '', priority: item.priority || 0,
      }); break;
      default: setLookupForm({
        name: item.name || '', description: item.description || '',
        bank_id: item.bank_id?.toString() || '', department_id: item.department_id?.toString() || '',
        activity_id: item.activity_id?.toString() || '', origin_id: item.origin_id?.toString() || '',
      }); break;
    }
    setShowForm(true);
  };

  /* ── Save (create / update) ─────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    try {
      switch (tab) {
        case 'banks': {
          if (editItem) await api.put(`/api/admin/banks/${editItem.id}`, bankForm);
          else await api.post('/api/admin/banks', bankForm);
          break;
        }
        case 'products': {
          if (editItem) await api.put(`/api/admin/products/${editItem.id}`, productForm);
          else await api.post('/api/admin/products', productForm);
          break;
        }
        case 'teams': {
          const payload: any = { name: teamForm.name, description: teamForm.description || null };
          if (teamForm.manager_id) payload.manager_id = parseInt(teamForm.manager_id);
          let teamId = editItem?.id;
          if (editItem) {
            await api.patch(`/api/teams/${editItem.id}`, payload);
          } else {
            const res = await api.post('/api/teams', payload);
            teamId = res.data.id;
          }
          if (teamId) {
            const currentServices: number[] = (editItem?.services || []).map((s: any) => s.id);
            const toRemove = currentServices.filter(id => !teamForm.service_ids.includes(id));
            const toAdd = teamForm.service_ids.filter(id => !currentServices.includes(id));
            await Promise.all([
              ...toRemove.map(pid => api.delete(`/api/teams/${teamId}/services/${pid}`)),
              ...toAdd.map(pid => api.post(`/api/teams/${teamId}/services`, { product_id: pid })),
            ]);
          }
          break;
        }
        case 'categories': {
          const payload: any = { name: categoryForm.name, description: categoryForm.description || null };
          if (categoryForm.parent_id) payload.parent_id = parseInt(categoryForm.parent_id);
          if (categoryForm.origin_id) payload.origin_id = parseInt(categoryForm.origin_id);
          if (editItem) await api.patch(`/api/tutoria/categories/${editItem.id}`, payload);
          else await api.post('/api/tutoria/categories', payload);
          break;
        }
        case 'faqs': {
          const payload = { ...faqForm, priority: Number(faqForm.priority) || 0 };
          if (editItem) await api.patch(`/api/chat/faqs/${editItem.id}`, payload);
          else await api.post('/api/chat/faqs', payload);
          break;
        }
        default: {
          const base = LOOKUP_API[tab];
          if (base) {
            const payload: any = { name: lookupForm.name, description: lookupForm.description || null };
            if (lookupForm.bank_id) payload.bank_id = parseInt(lookupForm.bank_id);
            if (lookupForm.department_id) payload.department_id = parseInt(lookupForm.department_id);
            if (lookupForm.activity_id) payload.activity_id = parseInt(lookupForm.activity_id);
            if (lookupForm.origin_id) payload.origin_id = parseInt(lookupForm.origin_id);
            if (editItem) await api.put(`${base}/${editItem.id}`, payload);
            else await api.post(base, payload);
          }
          break;
        }
      }
      setShowForm(false);
      fetchTab();
    } catch (e: any) {
      console.error('Save error', e);
      alert(e.response?.data?.detail || 'Erro ao guardar');
    } finally { setSaving(false); }
  };

  /* ── Delete ─────────────────────────────────────────────────────── */
  const openDelete = (item: any) => { setDeleteItem(item); setDeleteError(''); setShowDelete(true); };
  const handleDelete = async () => {
    try {
      switch (tab) {
        case 'banks': await api.delete(`/api/admin/banks/${deleteItem.id}`); break;
        case 'products': await api.delete(`/api/admin/products/${deleteItem.id}`); break;
        case 'teams': await api.delete(`/api/teams/${deleteItem.id}`); break;
        case 'categories': await api.delete(`/api/tutoria/categories/${deleteItem.id}`); break;
        case 'faqs': await api.delete(`/api/chat/faqs/${deleteItem.id}`); break;
        default: {
          const base = LOOKUP_API[tab];
          if (base) await api.delete(`${base}/${deleteItem.id}`);
          break;
        }
      }
      setShowDelete(false);
      fetchTab();
    } catch (e: any) {
      setDeleteError(e.response?.data?.detail || 'Erro ao eliminar');
    }
  };

  /* ── Filter ─────────────────────────────────────────────────────── */
  const q = search.toLowerCase();
  const filteredBanks = banks.filter(b => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(q));
  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(q));
  const filteredFaqs = faqs.filter(f => f.keywords_pt.toLowerCase().includes(q) || f.answer_pt.toLowerCase().includes(q));
  const filteredLookup = lookupItems.filter(i => i.name.toLowerCase().includes(q));

  /* ── Status badge ───────────────────────────────────────────────── */
  const Status = ({ active }: { active: boolean }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
      {active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {active ? t('masterData.active') : t('masterData.inactive')}
    </span>
  );

  /* ── Action buttons ─────────────────────────────────────────────── */
  const Actions = ({ item }: { item: any }) => (
    isAdmin ? (
    <div className="flex items-center gap-1">
      <button onClick={() => openEdit(item)}
        className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        <Pencil className="w-4 h-4" />
      </button>
      <button onClick={() => openDelete(item)}
        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
    ) : null
  );

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* Title bar + Create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <currentConfig.icon className="w-5 h-5 text-[#EC0000]" />
          </div>
          <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">{t(currentConfig.titleKey)}</h1>
        </div>
        {isAdmin && (
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EC0000] hover:bg-[#CC0000] text-white font-bold text-sm transition-colors">
          <Plus className="w-4 h-4" />
          {t('masterData.create')}
        </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('masterData.search')}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#EC0000]/40 focus:ring-2 focus:ring-[#EC0000]/10 transition-all" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden animate-in fade-in duration-300">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#EC0000]" />
          </div>
        ) : (
          <>
            {/* ── BANKS ──────────────────────────────────────── */}
            {tab === 'banks' && (
              <>
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                  <span>{t('masterData.name')}</span>
                  <span>{t('masterData.code')}</span>
                  <span>{t('masterData.status')}</span>
                  <span>{t('masterData.actions')}</span>
                </div>
                <div>
                  {filteredBanks.map(b => (
                    <div key={b.id}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{b.name}</p>
                        <p className="text-xs text-gray-400">{b.country}</p>
                      </div>
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">{b.code}</span>
                      <Status active={b.is_active} />
                      <Actions item={b} />
                    </div>
                  ))}
                  {filteredBanks.length === 0 && <EmptyState />}
                </div>
              </>
            )}

            {/* ── PRODUCTS ───────────────────────────────────── */}
            {tab === 'products' && (
              <>
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                  <span>{t('masterData.name')}</span>
                  <span>{t('masterData.code')}</span>
                  <span>{t('masterData.status')}</span>
                  <span>{t('masterData.actions')}</span>
                </div>
                <div>
                  {filteredProducts.map(p => (
                    <div key={p.id}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>}
                      </div>
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">{p.code}</span>
                      <Status active={p.is_active} />
                      <Actions item={p} />
                    </div>
                  ))}
                  {filteredProducts.length === 0 && <EmptyState />}
                </div>
              </>
            )}

            {/* ── TEAMS ──────────────────────────────────────── */}
            {tab === 'teams' && (
              <div className="grid grid-cols-1 gap-4 p-4">
                {filteredTeams.map(tm => (
                  <div key={tm.id}
                    className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all overflow-hidden">

                    {/* Accent bar */}
                    <div className={`absolute top-0 left-0 right-0 h-[2px] ${tm.is_active ? 'bg-[#EC0000]' : 'bg-gray-300 dark:bg-gray-700'}`} />

                    {/* Main row */}
                    <div className="px-5 pt-5 pb-4 cursor-pointer"
                      onClick={() => {
                        if (expandedTeamId === tm.id) { setExpandedTeamId(null); return; }
                        setExpandedTeamId(tm.id);
                        api.get('/api/users/unassigned').then(r => setAvailableUsers(r.data)).catch(() => {});
                        if (products.length === 0) api.get('/api/admin/products').then(r => setProducts(r.data)).catch(() => {});
                      }}>

                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Team info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${expandedTeamId === tm.id ? 'bg-[#EC0000] text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            <Users className={`w-5 h-5 ${expandedTeamId === tm.id ? '' : 'text-gray-500 dark:text-gray-400'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{tm.name}</h3>
                              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expandedTeamId === tm.id ? 'rotate-90' : ''}`} />
                            </div>
                            {tm.description && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{tm.description}</p>
                            )}
                            {/* Service badges */}
                            {tm.services && tm.services.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {tm.services.map(s => (
                                  <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                    <Package className="w-2.5 h-2.5" />
                                    {s.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Stats + Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Manager */}
                          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <div className="w-5 h-5 rounded-full bg-[#EC0000] flex items-center justify-center">
                              <span className="text-[9px] font-bold text-white">{(tm.manager_name || tm.manager?.full_name || '?')[0].toUpperCase()}</span>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[100px] truncate">{tm.manager_name || tm.manager?.full_name || '—'}</span>
                          </div>
                          {/* Members count */}
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                            <Users className="w-3.5 h-3.5 text-[#EC0000]" />
                            <span className="text-xs font-bold text-[#EC0000]">{tm.members_count || 0}</span>
                          </div>
                          {/* Status */}
                          <Status active={tm.is_active} />
                          {/* Actions */}
                          <div onClick={e => e.stopPropagation()}><Actions item={tm} /></div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {expandedTeamId === tm.id && (
                      <div className="overflow-hidden animate-in slide-in-from-top-2 duration-200">
                        <div className="px-5 pb-5">
                          <div className="h-px bg-gray-200 dark:bg-gray-800 mb-5" />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* ── MEMBROS ── */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                    <Users className="w-3.5 h-3.5 text-[#EC0000]" />
                                  </div>
                                  {t('masterData.teamMembers')}
                                  <span className="text-[10px] font-bold text-[#EC0000] bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">{(tm.team_members || []).length}</span>
                                </h4>
                                {isAdmin && (
                                  <button onClick={() => setAddingMember(!addingMember)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${addingMember ? 'bg-[#EC0000] text-white' : 'bg-red-50 dark:bg-red-900/20 text-[#EC0000] hover:bg-red-100 dark:hover:bg-red-900/30'}`}>
                                    <UserPlus className="w-3.5 h-3.5" /> {addingMember ? t('masterData.closeMember') : t('masterData.addMember')}
                                  </button>
                                )}
                              </div>

                              {addingMember && (
                                <div className="mb-3">
                                  <select className={selectCls + ' text-xs !py-2.5'}
                                    onChange={async (e) => {
                                      const uid = parseInt(e.target.value);
                                      if (!uid) return;
                                      try {
                                        await api.post(`/api/teams/${tm.id}/members`, { user_id: uid });
                                        e.target.value = '';
                                        fetchTab();
                                      } catch (err: any) { alert(err.response?.data?.detail || 'Erro'); }
                                    }}>
                                    <option value="">{t('masterData.selectUser')}</option>
                                    {availableUsers
                                      .filter(u => u.id !== tm.manager_id && !(tm.team_members || []).some(m => m.id === u.id))
                                      .map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
                                  </select>
                                </div>
                              )}

                              {(tm.team_members && tm.team_members.length > 0) ? (
                                <div className="space-y-2">
                                  {tm.team_members.map(m => (
                                    <div key={m.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors group/member">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#EC0000] flex items-center justify-center">
                                          <span className="text-[10px] font-bold text-white">{m.full_name[0].toUpperCase()}</span>
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.full_name}</p>
                                          <p className="text-[10px] text-gray-400">{m.email} · <span className="font-semibold text-gray-500">{m.role}</span></p>
                                        </div>
                                      </div>
                                      {isAdmin && (
                                        <button onClick={async () => {
                                          try { await api.delete(`/api/teams/${tm.id}/members/${m.id}`); fetchTab(); }
                                          catch (err: any) { alert(err.response?.data?.detail || 'Erro'); }
                                        }}
                                          className="p-1.5 rounded-lg opacity-0 group-hover/member:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all">
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center py-6 text-center">
                                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                                    <Users className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                                  </div>
                                  <p className="text-xs text-gray-400">{t('masterData.noMembers')}</p>
                                </div>
                              )}
                            </div>

                            {/* ── SERVIÇOS ── */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                    <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  </div>
                                  {t('masterData.linkedServices')}
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">{(tm.services || []).length}</span>
                                </h4>
                                {isAdmin && (
                                  <button onClick={() => setAddingService(!addingService)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${addingService ? 'bg-emerald-600 text-white' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'}`}>
                                    <Link2 className="w-3.5 h-3.5" /> {addingService ? t('masterData.closeService') : t('masterData.linkService')}
                                  </button>
                                )}
                              </div>

                              {addingService && (
                                <div className="mb-3">
                                  <select className={selectCls + ' text-xs !py-2.5'}
                                    onChange={async (e) => {
                                      const pid = parseInt(e.target.value);
                                      if (!pid) return;
                                      try {
                                        await api.post(`/api/teams/${tm.id}/services`, { product_id: pid });
                                        e.target.value = '';
                                        fetchTab();
                                      } catch (err: any) { alert(err.response?.data?.detail || 'Erro'); }
                                    }}>
                                    <option value="">{t('masterData.selectService')}</option>
                                    {products
                                      .filter(p => p.is_active && !(tm.services || []).some(s => s.id === p.id))
                                      .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                  </select>
                                </div>
                              )}

                              {(tm.services && tm.services.length > 0) ? (
                                <div className="space-y-2">
                                  {tm.services.map(s => (
                                    <div key={s.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors group/service">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                          <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</p>
                                      </div>
                                      {isAdmin && (
                                        <button onClick={async () => {
                                          try { await api.delete(`/api/teams/${tm.id}/services/${s.id}`); fetchTab(); }
                                          catch (err: any) { alert(err.response?.data?.detail || 'Erro'); }
                                        }}
                                          className="p-1.5 rounded-lg opacity-0 group-hover/service:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all">
                                          <Unlink className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center py-6 text-center">
                                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                                    <Package className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                                  </div>
                                  <p className="text-xs text-gray-400">{t('masterData.noLinkedServices')}</p>
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {filteredTeams.length === 0 && <EmptyState />}
              </div>
            )}

            {/* ── CATEGORIES ─────────────────────────────────── */}
            {tab === 'categories' && (
              <>
                <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                  <span>{t('masterData.name')}</span>
                  <span>{t('masterData.description')}</span>
                  <span>{t('masterData.origin')}</span>
                  <span>{t('masterData.status')}</span>
                  <span>{t('masterData.actions')}</span>
                </div>
                <div>
                  {filteredCategories.map(c => (
                    <div key={c.id}
                      className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors items-center">
                      <div className="flex items-center gap-2">
                        {c.parent_id && <span className="text-xs text-gray-500">↳</span>}
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.name}</p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{c.description || '—'}</p>
                      <p className="text-xs text-gray-400">{c.origin_id ? auxOrigins.find(o => o.id === c.origin_id)?.name || '—' : '—'}</p>
                      <Status active={c.is_active} />
                      <Actions item={c} />
                    </div>
                  ))}
                  {filteredCategories.length === 0 && <EmptyState />}
                </div>
              </>
            )}

            {/* ── FAQS ───────────────────────────────────────── */}
            {tab === 'faqs' && (
              <>
                <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                  <span>{t('masterData.keywords')}</span>
                  <span>{t('masterData.answer')}</span>
                  <span>{t('masterData.priority')}</span>
                  <span>{t('masterData.status')}</span>
                  <span>{t('masterData.actions')}</span>
                </div>
                <div>
                  {filteredFaqs.map(f => (
                    <div key={f.id}
                      className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors items-center">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{f.keywords_pt}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{f.answer_pt}</p>
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">{f.priority}</span>
                      <Status active={f.is_active} />
                      <Actions item={f} />
                    </div>
                  ))}
                  {filteredFaqs.length === 0 && <EmptyState />}
                </div>
              </>
            )}

            {/* ── LOOKUP TABLES (Impactos, Origens, etc.) ──── */}
            {LOOKUP_TABS.includes(tab) && (
              <>
                <div className={`grid gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50 ${DEP_TABS.includes(tab) ? 'grid-cols-[1fr_1fr_1fr_auto_auto]' : 'grid-cols-[1fr_1fr_auto_auto]'}`}>
                  <span>{t('masterData.name')}</span>
                  {DEP_TABS.includes(tab) && (
                    <span>
                      {tab === 'activities' && `${t('masterData.bank')} / ${t('masterData.department')}`}
                      {tab === 'error_types' && t('masterData.activity')}
                    </span>
                  )}
                  <span>{t('masterData.description')}</span>
                  <span>{t('masterData.status')}</span>
                  <span>{t('masterData.actions')}</span>
                </div>
                <div>
                  {filteredLookup.map(item => (
                    <div key={item.id}
                      className={`grid gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors items-center ${DEP_TABS.includes(tab) ? 'grid-cols-[1fr_1fr_1fr_auto_auto]' : 'grid-cols-[1fr_1fr_auto_auto]'}`}>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                      {DEP_TABS.includes(tab) && (
                        <div className="text-xs text-gray-400 space-y-0.5">
                          {tab === 'activities' && (
                            <>
                              {item.bank_name && <p><Building2 className="w-3 h-3 inline mr-1 text-gray-400" />{item.bank_name}</p>}
                              {item.department_name && <p><Building className="w-3 h-3 inline mr-1 text-gray-400" />{item.department_name}</p>}
                              {!item.bank_name && !item.department_name && <p>—</p>}
                            </>
                          )}
                          {tab === 'error_types' && (
                            <p>{item.activity_name || '—'}</p>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.description || '—'}</p>
                      <Status active={item.is_active} />
                      <Actions item={item} />
                    </div>
                  ))}
                  {filteredLookup.length === 0 && <EmptyState />}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Form Modal ────────────────────────────────────────────────── */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editItem ? t('masterData.edit') : t('masterData.createNew')}>
        <div className="space-y-5">

          {/* BANK FORM */}
          {tab === 'banks' && (
            <>
              <Field label={t('masterData.name')}>
                <input className={inputCls} value={bankForm.name} onChange={e => setBankForm(p => ({ ...p, name: e.target.value }))} />
              </Field>
              <Field label={t('masterData.country')}>
                <select className={selectCls} value={bankForm.country} onChange={e => setBankForm(p => ({ ...p, country: e.target.value }))}>
                  <option value="PT">Portugal</option>
                  <option value="ES">España</option>
                  <option value="BR">Brasil</option>
                  <option value="US">USA</option>
                  <option value="UK">UK</option>
                  <option value="FR">France</option>
                  <option value="DE">Deutschland</option>
                  <option value="IT">Italia</option>
                </select>
              </Field>
              {editItem && (
                <Field label={t('masterData.status')}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={bankForm.is_active} onChange={e => setBankForm(p => ({ ...p, is_active: e.target.checked }))}
                      className="w-4 h-4 accent-[#EC0000]" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t('masterData.active')}</span>
                  </label>
                </Field>
              )}
            </>
          )}

          {/* PRODUCT FORM */}
          {tab === 'products' && (
            <>
              {!editItem && (
                <Field label={t('masterData.code') + ' (' + t('masterData.optional') + ')'}>
                  <input className={inputCls} value={productForm.code} onChange={e => setProductForm(p => ({ ...p, code: e.target.value }))} placeholder="PROD001" />
                </Field>
              )}
              <Field label={t('masterData.name')}>
                <input className={inputCls} value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} />
              </Field>
              <Field label={t('masterData.description')}>
                <textarea className={inputCls + ' resize-none'} rows={3} value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} />
              </Field>
              {editItem && (
                <Field label={t('masterData.status')}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={productForm.is_active} onChange={e => setProductForm(p => ({ ...p, is_active: e.target.checked }))}
                      className="w-4 h-4 accent-[#EC0000]" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t('masterData.active')}</span>
                  </label>
                </Field>
              )}
            </>
          )}

          {/* TEAM FORM */}
          {tab === 'teams' && (
            <>
              <Field label={t('masterData.name')}>
                <input className={inputCls} value={teamForm.name} onChange={e => setTeamForm(p => ({ ...p, name: e.target.value }))} />
              </Field>
              <Field label={t('masterData.description')}>
                <textarea className={inputCls + ' resize-none'} rows={2} value={teamForm.description} onChange={e => setTeamForm(p => ({ ...p, description: e.target.value }))} />
              </Field>
              <Field label={t('masterData.manager')}>
                <select className={selectCls} value={teamForm.manager_id} onChange={e => setTeamForm(p => ({ ...p, manager_id: e.target.value }))}>
                  <option value="">— {t('masterData.noManager')} —</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </Field>
              <Field label={t('masterData.servicesLabel')} hint={t('masterData.servicesHint')}>
                <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  {products.filter(p => p.is_active).map((p, i) => (
                    <label key={p.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors ${i > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
                      <div className="relative flex items-center">
                        <input type="checkbox"
                          className="peer sr-only"
                          checked={teamForm.service_ids.includes(p.id)}
                          onChange={(e) => {
                            setTeamForm(prev => ({
                              ...prev,
                              service_ids: e.target.checked
                                ? [...prev.service_ids, p.id]
                                : prev.service_ids.filter(id => id !== p.id)
                            }));
                          }} />
                        <div className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 peer-checked:border-[#EC0000] peer-checked:bg-[#EC0000] transition-colors flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{p.name}</span>
                      </div>
                      {teamForm.service_ids.includes(p.id) && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#EC0000] bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full flex-shrink-0">{t('masterData.activeTag')}</span>
                      )}
                    </label>
                  ))}
                  {products.filter(p => p.is_active).length === 0 && (
                    <p className="text-xs text-gray-400 px-4 py-3 text-center">{t('masterData.noServicesAvailable')}</p>
                  )}
                </div>
              </Field>
            </>
          )}

          {/* CATEGORY FORM */}
          {tab === 'categories' && (
            <>
              <Field label={t('masterData.name')}>
                <input className={inputCls} value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))} />
              </Field>
              <Field label={t('masterData.description')}>
                <textarea className={inputCls + ' resize-none'} rows={2} value={categoryForm.description} onChange={e => setCategoryForm(p => ({ ...p, description: e.target.value }))} />
              </Field>
              <Field label={t('masterData.parentCategory')}>
                <select className={selectCls} value={categoryForm.parent_id} onChange={e => setCategoryForm(p => ({ ...p, parent_id: e.target.value }))}>
                  <option value="">— {t('masterData.noParent')} —</option>
                  {categories.filter(c => !editItem || c.id !== editItem.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('masterData.origin')}>
                <select className={selectCls} value={categoryForm.origin_id} onChange={e => setCategoryForm(p => ({ ...p, origin_id: e.target.value }))}>
                  <option value="">— {t('masterData.noOrigin')} —</option>
                  {auxOrigins.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </Field>
            </>
          )}

          {/* FAQ FORM */}
          {tab === 'faqs' && (
            <>
              <div className="grid grid-cols-1 gap-3">
                <Field label={t('masterData.keywordsPT')}>
                  <input className={inputCls} value={faqForm.keywords_pt} onChange={e => setFaqForm(p => ({ ...p, keywords_pt: e.target.value }))} placeholder="palavra1, palavra2" />
                </Field>
                <Field label={t('masterData.answerPT')}>
                  <textarea className={inputCls + ' resize-none'} rows={3} value={faqForm.answer_pt} onChange={e => setFaqForm(p => ({ ...p, answer_pt: e.target.value }))} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('masterData.keywordsES')}>
                  <input className={inputCls} value={faqForm.keywords_es} onChange={e => setFaqForm(p => ({ ...p, keywords_es: e.target.value }))} />
                </Field>
                <Field label={t('masterData.keywordsEN')}>
                  <input className={inputCls} value={faqForm.keywords_en} onChange={e => setFaqForm(p => ({ ...p, keywords_en: e.target.value }))} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('masterData.answerES')}>
                  <textarea className={inputCls + ' resize-none'} rows={2} value={faqForm.answer_es} onChange={e => setFaqForm(p => ({ ...p, answer_es: e.target.value }))} />
                </Field>
                <Field label={t('masterData.answerEN')}>
                  <textarea className={inputCls + ' resize-none'} rows={2} value={faqForm.answer_en} onChange={e => setFaqForm(p => ({ ...p, answer_en: e.target.value }))} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('masterData.supportUrl')}>
                  <input className={inputCls} value={faqForm.support_url} onChange={e => setFaqForm(p => ({ ...p, support_url: e.target.value }))} placeholder="https://..." />
                </Field>
                <Field label={t('masterData.supportLabel')}>
                  <input className={inputCls} value={faqForm.support_label} onChange={e => setFaqForm(p => ({ ...p, support_label: e.target.value }))} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('masterData.roleFilter')}>
                  <select className={selectCls} value={faqForm.role_filter} onChange={e => setFaqForm(p => ({ ...p, role_filter: e.target.value }))}>
                    <option value="">{t('masterData.allRoles')}</option>
                    <option value="TRAINEE">{t('masterData.roleTraineeOption')}</option>
                    <option value="TRAINER">{t('masterData.roleTrainerOption')}</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="MANAGER">Coordenador</option>
                  </select>
                </Field>
                <Field label={t('masterData.priority')}>
                  <input type="number" className={inputCls} value={faqForm.priority} onChange={e => setFaqForm(p => ({ ...p, priority: parseInt(e.target.value) || 0 }))} />
                </Field>
              </div>
            </>
          )}

          {/* LOOKUP FORM */}
          {LOOKUP_TABS.includes(tab) && (
            <>
              <Field label={t('masterData.name')}>
                <input className={inputCls} value={lookupForm.name} onChange={e => setLookupForm(p => ({ ...p, name: e.target.value }))} placeholder={t('masterData.namePlaceholder')} />
              </Field>
              <Field label={t('masterData.description')}>
                <textarea className={inputCls + ' resize-none'} rows={3} value={lookupForm.description} onChange={e => setLookupForm(p => ({ ...p, description: e.target.value }))} placeholder={t('masterData.descriptionOptionalPlaceholder')} />
              </Field>

              {tab === 'activities' && (
                <>
                  <Field label={t('masterData.bank')}>
                    <select className={selectCls} value={lookupForm.bank_id} onChange={e => setLookupForm(p => ({ ...p, bank_id: e.target.value }))}>
                      <option value="">— {t('masterData.noBank')} —</option>
                      {auxBanks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </Field>
                  <Field label={t('masterData.department')}>
                    <select className={selectCls} value={lookupForm.department_id} onChange={e => setLookupForm(p => ({ ...p, department_id: e.target.value }))}>
                      <option value="">— {t('masterData.noDepartment')} —</option>
                      {auxDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </Field>
                </>
              )}

              {tab === 'error_types' && (
                <Field label={t('masterData.activity')}>
                  <select className={selectCls} value={lookupForm.activity_id} onChange={e => setLookupForm(p => ({ ...p, activity_id: e.target.value }))}>
                    <option value="">— {t('masterData.noActivity')} —</option>
                    {auxActivities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </Field>
              )}
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              {t('common.cancel', 'Cancelar')}
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#EC0000] hover:bg-[#CC0000] text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('common.save', 'Guardar')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <DeleteConfirm
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        name={deleteItem?.name || deleteItem?.keywords_pt || ''}
        error={deleteError}
      />
    </div>
  );
}

/* ── Empty State ────────────────────────────────────────────────────── */
function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
        <Search className="w-6 h-6 text-gray-300 dark:text-gray-600" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('masterData.empty')}</p>
    </div>
  );
}
