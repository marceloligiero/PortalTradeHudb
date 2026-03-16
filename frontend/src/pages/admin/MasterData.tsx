import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Package, Users, FolderTree, MessageCircle,
  Plus, Pencil, Trash2, X, CheckCircle2, XCircle, AlertTriangle,
  Search, Sparkles, Save, Loader2, Zap, Globe, Eye, Building, Activity,
  ChevronRight, UserPlus, Link2, Unlink,
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

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

/* ─── Animations ────────────────────────────────────────────────────── */
const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const row = { hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0 } };

/* ─── Modal Shell ───────────────────────────────────────────────────── */
function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          onClick={onClose}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-[#111118] rounded-2xl border border-gray-200/80 dark:border-white/[0.08] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] overflow-hidden">
            {/* Header with accent bar */}
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-red-400 to-orange-400" />
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-200 group">
                  <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors" />
                </button>
              </div>
            </div>
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{t('masterData.deleteWarning', { name })}</p>
        </div>
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-300">{error}</p>
          </div>
        )}
        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-300 font-semibold text-sm border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all duration-200">
            {t('common.cancel', 'Cancelar')}
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25 text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2">
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
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 group-focus-within:text-red-500 transition-colors duration-200">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}
const inputCls = "w-full px-4 py-3 bg-gray-50/80 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/15 focus:bg-white dark:focus:bg-white/[0.06] transition-all duration-200 outline-none text-sm shadow-sm";
const selectCls = inputCls + " appearance-none cursor-pointer";

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export default function MasterDataPage({ tab = 'banks' as TabKey }: { tab?: TabKey }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDark } = useTheme();
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
          // Lookup tables (impacts, origins, detected_by, departments, activities, error_types)
          if (LOOKUP_API[tab]) {
            const r = await api.get(LOOKUP_API[tab]);
            setLookupItems(Array.isArray(r.data) ? r.data : []);
          }
          // Load auxiliary data for dependency tabs
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
          // Sync services: remove old, add new
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
          // Lookup tables
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
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
      {active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {active ? t('masterData.active') : t('masterData.inactive')}
    </span>
  );

  /* ── Action buttons ─────────────────────────────────────────────── */
  const Actions = ({ item }: { item: any }) => (
    isAdmin ? (
    <div className="flex items-center gap-1">
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)}
        className="p-2 rounded-lg hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 transition-all">
        <Pencil className="w-4 h-4" />
      </motion.button>
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openDelete(item)}
        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all">
        <Trash2 className="w-4 h-4" />
      </motion.button>
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
          <currentConfig.icon className="w-6 h-6 text-red-500" />
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t(currentConfig.titleKey)}</h1>
        </div>
        {isAdmin && (
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-red-500/25 transition-all">
          <Plus className="w-4 h-4" />
          {t('masterData.create')}
        </motion.button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('masterData.search')}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all" />
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
          </div>
        ) : (
          <>
            {/* ── BANKS ──────────────────────────────────────── */}
            {tab === 'banks' && (
              <>
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-100 dark:border-white/5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span>{t('masterData.name')}</span>
                  <span>{t('masterData.code')}</span>
                  <span>{t('masterData.status')}</span>
                  <span>{t('masterData.actions')}</span>
                </div>
                <motion.div variants={container} initial="hidden" animate="visible">
                  {filteredBanks.map(b => (
                    <motion.div key={b.id} variants={row}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 border-b border-gray-50 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{b.name}</p>
                        <p className="text-xs text-gray-400">{b.country}</p>
                      </div>
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg">{b.code}</span>
                      <Status active={b.is_active} />
                      <Actions item={b} />
                    </motion.div>
                  ))}
                  {filteredBanks.length === 0 && <EmptyState />}
                </motion.div>
              </>
            )}

            {/* ── PRODUCTS ───────────────────────────────────── */}
            {tab === 'products' && (
              <>
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-100 dark:border-white/5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span>{t('masterData.name')}</span>
                  <span>{t('masterData.code')}</span>
                  <span>{t('masterData.status')}</span>
                  <span>{t('masterData.actions')}</span>
                </div>
                <motion.div variants={container} initial="hidden" animate="visible">
                  {filteredProducts.map(p => (
                    <motion.div key={p.id} variants={row}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 border-b border-gray-50 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>}
                      </div>
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg">{p.code}</span>
                      <Status active={p.is_active} />
                      <Actions item={p} />
                    </motion.div>
                  ))}
                  {filteredProducts.length === 0 && <EmptyState />}
                </motion.div>
              </>
            )}

            {/* ── TEAMS ──────────────────────────────────────── */}
            {tab === 'teams' && (
              <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-1 gap-4 p-4">
                {filteredTeams.map(tm => (
                  <motion.div key={tm.id} variants={row}
                    className="group relative bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-200/80 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">

                    {/* Accent bar */}
                    <div className={`absolute top-0 left-0 right-0 h-[2px] transition-all duration-300 ${tm.is_active ? 'bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500' : 'bg-gray-300 dark:bg-white/10'}`} />

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
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-all duration-300 ${expandedTeamId === tm.id ? 'bg-gradient-to-br from-blue-500 to-violet-500 shadow-blue-500/20' : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/[0.06] dark:to-white/[0.03]'}`}>
                            <Users className={`w-5 h-5 transition-colors ${expandedTeamId === tm.id ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{tm.name}</h3>
                              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-300 flex-shrink-0 ${expandedTeamId === tm.id ? 'rotate-90' : ''}`} />
                            </div>
                            {tm.description && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{tm.description}</p>
                            )}
                            {/* Service badges */}
                            {tm.services && tm.services.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {tm.services.map(s => (
                                  <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/15 dark:border-emerald-500/20">
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
                          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-white">{(tm.manager_name || tm.manager?.full_name || '?')[0].toUpperCase()}</span>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[100px] truncate">{tm.manager_name || tm.manager?.full_name || '—'}</span>
                          </div>
                          {/* Members count */}
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/15">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{tm.members_count || 0}</span>
                          </div>
                          {/* Status */}
                          <Status active={tm.is_active} />
                          {/* Actions */}
                          <div onClick={e => e.stopPropagation()}><Actions item={tm} /></div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {expandedTeamId === tm.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden">
                          <div className="px-5 pb-5">
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent mb-5" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                              {/* ── MEMBROS ── */}
                              <div className="bg-gray-50/80 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/[0.05] p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                      <Users className="w-3.5 h-3.5 text-blue-500" />
                                    </div>
                                    {t('masterData.teamMembers')}
                                    <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full">{(tm.team_members || []).length}</span>
                                  </h4>
                                  {isAdmin && (
                                    <button onClick={() => setAddingMember(!addingMember)}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${addingMember ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/25' : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'}`}>
                                      <UserPlus className="w-3.5 h-3.5" /> {addingMember ? t('masterData.closeMember') : t('masterData.addMember')}
                                    </button>
                                  )}
                                </div>

                                {addingMember && (
                                  <div className="mb-3">
                                    <select className={selectCls + ' text-xs !py-2.5'} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}
                                      onChange={async (e) => {
                                        const uid = parseInt(e.target.value);
                                        if (!uid) return;
                                        try {
                                          await api.post(`/api/teams/${tm.id}/members`, { user_id: uid });
                                          e.target.value = '';
                                          fetchTab();
                                        } catch (err: any) { alert(err.response?.data?.detail || 'Erro'); }
                                      }}>
                                      <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('masterData.selectUser')}</option>
                                      {availableUsers
                                        .filter(u => u.id !== tm.manager_id && !(tm.team_members || []).some(m => m.id === u.id))
                                        .map(u => <option key={u.id} value={u.id} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{u.full_name} ({u.role})</option>)}
                                    </select>
                                  </div>
                                )}

                                {(tm.team_members && tm.team_members.length > 0) ? (
                                  <div className="space-y-2">
                                    {tm.team_members.map(m => (
                                      <div key={m.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] hover:border-gray-200 dark:hover:border-white/[0.08] transition-all group/member">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
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
                                            className="p-1.5 rounded-lg opacity-0 group-hover/member:opacity-100 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center py-6 text-center">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mb-2">
                                      <Users className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <p className="text-xs text-gray-400">{t('masterData.noMembers')}</p>
                                  </div>
                                )}
                              </div>

                              {/* ── SERVIÇOS ── */}
                              <div className="bg-gray-50/80 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/[0.05] p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                      <Package className="w-3.5 h-3.5 text-emerald-500" />
                                    </div>
                                    {t('masterData.linkedServices')}
                                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">{(tm.services || []).length}</span>
                                  </h4>
                                  {isAdmin && (
                                    <button onClick={() => setAddingService(!addingService)}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${addingService ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}>
                                      <Link2 className="w-3.5 h-3.5" /> {addingService ? t('masterData.closeService') : t('masterData.linkService')}
                                    </button>
                                  )}
                                </div>

                                {addingService && (
                                  <div className="mb-3">
                                    <select className={selectCls + ' text-xs !py-2.5'} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}
                                      onChange={async (e) => {
                                        const pid = parseInt(e.target.value);
                                        if (!pid) return;
                                        try {
                                          await api.post(`/api/teams/${tm.id}/services`, { product_id: pid });
                                          e.target.value = '';
                                          fetchTab();
                                        } catch (err: any) { alert(err.response?.data?.detail || 'Erro'); }
                                      }}>
                                      <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('masterData.selectService')}</option>
                                      {products
                                        .filter(p => p.is_active && !(tm.services || []).some(s => s.id === p.id))
                                        .map(p => <option key={p.id} value={p.id} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{p.name}</option>)}
                                    </select>
                                  </div>
                                )}

                                {(tm.services && tm.services.length > 0) ? (
                                  <div className="space-y-2">
                                    {tm.services.map(s => (
                                      <div key={s.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] hover:border-gray-200 dark:hover:border-white/[0.08] transition-all group/service">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                                            <Package className="w-3.5 h-3.5 text-white" />
                                          </div>
                                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</p>
                                        </div>
                                        {isAdmin && (
                                          <button onClick={async () => {
                                            try { await api.delete(`/api/teams/${tm.id}/services/${s.id}`); fetchTab(); }
                                            catch (err: any) { alert(err.response?.data?.detail || 'Erro'); }
                                          }}
                                            className="p-1.5 rounded-lg opacity-0 group-hover/service:opacity-100 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all">
                                            <Unlink className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center py-6 text-center">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mb-2">
                                      <Package className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <p className="text-xs text-gray-400">{t('masterData.noLinkedServices')}</p>
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
                {filteredTeams.length === 0 && <EmptyState />}
              </motion.div>
            )}

            {/* ── CATEGORIES ─────────────────────────────────── */}
            {tab === 'categories' && (
              <>
                <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-100 dark:border-white/5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span>{t('masterData.name')}</span>
                  <span>{t('masterData.description')}</span>
                  <span>{t('masterData.origin')}</span>
                  <span>{t('masterData.status')}</span>
                  <span>{t('masterData.actions')}</span>
                </div>
                <motion.div variants={container} initial="hidden" animate="visible">
                  {filteredCategories.map(c => (
                    <motion.div key={c.id} variants={row}
                      className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-6 py-4 border-b border-gray-50 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors items-center">
                      <div className="flex items-center gap-2">
                        {c.parent_id && <span className="text-xs text-gray-500">↳</span>}
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.name}</p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{c.description || '—'}</p>
                      <p className="text-xs text-gray-400">{c.origin_id ? auxOrigins.find(o => o.id === c.origin_id)?.name || '—' : '—'}</p>
                      <Status active={c.is_active} />
                      <Actions item={c} />
                    </motion.div>
                  ))}
                  {filteredCategories.length === 0 && <EmptyState />}
                </motion.div>
              </>
            )}

            {/* ── FAQS ───────────────────────────────────────── */}
            {tab === 'faqs' && (
              <>
                <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-100 dark:border-white/5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span>{t('masterData.keywords')}</span>
                  <span>{t('masterData.answer')}</span>
                  <span>{t('masterData.priority')}</span>
                  <span>{t('masterData.status')}</span>
                  <span>{t('masterData.actions')}</span>
                </div>
                <motion.div variants={container} initial="hidden" animate="visible">
                  {filteredFaqs.map(f => (
                    <motion.div key={f.id} variants={row}
                      className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-6 py-4 border-b border-gray-50 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors items-center">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{f.keywords_pt}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{f.answer_pt}</p>
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg">{f.priority}</span>
                      <Status active={f.is_active} />
                      <Actions item={f} />
                    </motion.div>
                  ))}
                  {filteredFaqs.length === 0 && <EmptyState />}
                </motion.div>
              </>
            )}

            {/* ── LOOKUP TABLES (Impactos, Origens, etc.) ──── */}
            {LOOKUP_TABS.includes(tab) && (
              <>
                <div className={`grid gap-4 px-6 py-3 border-b border-gray-100 dark:border-white/5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${DEP_TABS.includes(tab) ? 'grid-cols-[1fr_1fr_1fr_auto_auto]' : 'grid-cols-[1fr_1fr_auto_auto]'}`}>
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
                <motion.div variants={container} initial="hidden" animate="visible">
                  {filteredLookup.map(item => (
                    <motion.div key={item.id} variants={row}
                      className={`grid gap-4 px-6 py-4 border-b border-gray-50 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors items-center ${DEP_TABS.includes(tab) ? 'grid-cols-[1fr_1fr_1fr_auto_auto]' : 'grid-cols-[1fr_1fr_auto_auto]'}`}>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                      {DEP_TABS.includes(tab) && (
                        <div className="text-xs text-gray-400 space-y-0.5">
                          {tab === 'activities' && (
                            <>
                              {item.bank_name && <p><span className="text-gray-500">🏦</span> {item.bank_name}</p>}
                              {item.department_name && <p><span className="text-gray-500">🏢</span> {item.department_name}</p>}
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
                    </motion.div>
                  ))}
                  {filteredLookup.length === 0 && <EmptyState />}
                </motion.div>
              </>
            )}
          </>
        )}
      </motion.div>

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
                <select className={selectCls} value={bankForm.country} onChange={e => setBankForm(p => ({ ...p, country: e.target.value }))} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>
                  <option value="PT" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>Portugal</option>
                  <option value="ES" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>España</option>
                  <option value="BR" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>Brasil</option>
                  <option value="US" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>USA</option>
                  <option value="UK" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>UK</option>
                  <option value="FR" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>France</option>
                  <option value="DE" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>Deutschland</option>
                  <option value="IT" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>Italia</option>
                </select>
              </Field>
              {editItem && (
                <Field label={t('masterData.status')}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={bankForm.is_active} onChange={e => setBankForm(p => ({ ...p, is_active: e.target.checked }))}
                      className="w-4 h-4 accent-red-500" />
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
                      className="w-4 h-4 accent-red-500" />
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
                <select className={selectCls} value={teamForm.manager_id} onChange={e => setTeamForm(p => ({ ...p, manager_id: e.target.value }))} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>
                  <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>— {t('masterData.noManager')} —</option>
                  {managers.map(m => <option key={m.id} value={m.id} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{m.full_name}</option>)}
                </select>
              </Field>
              <Field label={t('masterData.servicesLabel')} hint={t('masterData.servicesHint')}>
                <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.02]">
                  {products.filter(p => p.is_active).map((p, i) => (
                    <label key={p.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white dark:hover:bg-white/[0.04] transition-all duration-150 ${i > 0 ? 'border-t border-gray-100 dark:border-white/[0.04]' : ''}`}>
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
                        <div className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-white/20 peer-checked:border-red-500 peer-checked:bg-red-500 transition-all duration-200 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{p.name}</span>
                      </div>
                      {teamForm.service_ids.includes(p.id) && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full flex-shrink-0">{t('masterData.activeTag')}</span>
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
                <select className={selectCls} value={categoryForm.parent_id} onChange={e => setCategoryForm(p => ({ ...p, parent_id: e.target.value }))} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>
                  <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>— {t('masterData.noParent')} —</option>
                  {categories.filter(c => !editItem || c.id !== editItem.id).map(c => (
                    <option key={c.id} value={c.id} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('masterData.origin')}>
                <select className={selectCls} value={categoryForm.origin_id} onChange={e => setCategoryForm(p => ({ ...p, origin_id: e.target.value }))} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>
                  <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>— {t('masterData.noOrigin')} —</option>
                  {auxOrigins.map(o => <option key={o.id} value={o.id} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{o.name}</option>)}
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
                  <select className={selectCls} value={faqForm.role_filter} onChange={e => setFaqForm(p => ({ ...p, role_filter: e.target.value }))} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>
                    <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('masterData.allRoles')}</option>
                    <option value="TRAINEE" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('masterData.roleTraineeOption')}</option>
                    <option value="TRAINER" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('masterData.roleTrainerOption')}</option>
                    <option value="ADMIN" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>Administrador</option>
                    <option value="MANAGER" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>Coordenador</option>
                  </select>
                </Field>
                <Field label={t('masterData.priority')}>
                  <input type="number" className={inputCls} value={faqForm.priority} onChange={e => setFaqForm(p => ({ ...p, priority: parseInt(e.target.value) || 0 }))} />
                </Field>
              </div>
            </>
          )}

          {/* LOOKUP FORM (Impactos, Origens, DetectadoPor, Departamentos, Actividades, Tipos de Erro) */}
          {LOOKUP_TABS.includes(tab) && (
            <>
              <Field label={t('masterData.name')}>
                <input className={inputCls} value={lookupForm.name} onChange={e => setLookupForm(p => ({ ...p, name: e.target.value }))} placeholder={t('masterData.namePlaceholder')} />
              </Field>
              <Field label={t('masterData.description')}>
                <textarea className={inputCls + ' resize-none'} rows={3} value={lookupForm.description} onChange={e => setLookupForm(p => ({ ...p, description: e.target.value }))} placeholder={t('masterData.descriptionOptionalPlaceholder')} />
              </Field>

              {/* Dependency: Activities → Bank + Department */}
              {tab === 'activities' && (
                <>
                  <Field label={t('masterData.bank')}>
                    <select className={selectCls} value={lookupForm.bank_id} onChange={e => setLookupForm(p => ({ ...p, bank_id: e.target.value }))} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>
                      <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>— {t('masterData.noBank')} —</option>
                      {auxBanks.map(b => <option key={b.id} value={b.id} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{b.name}</option>)}
                    </select>
                  </Field>
                  <Field label={t('masterData.department')}>
                    <select className={selectCls} value={lookupForm.department_id} onChange={e => setLookupForm(p => ({ ...p, department_id: e.target.value }))} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>
                      <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>— {t('masterData.noDepartment')} —</option>
                      {auxDepts.map(d => <option key={d.id} value={d.id} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{d.name}</option>)}
                    </select>
                  </Field>
                </>
              )}

              {/* Dependency: Error Types → Activity */}
              {tab === 'error_types' && (
                <Field label={t('masterData.activity')}>
                  <select className={selectCls} value={lookupForm.activity_id} onChange={e => setLookupForm(p => ({ ...p, activity_id: e.target.value }))} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>
                    <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>— {t('masterData.noActivity')} —</option>
                    {auxActivities.map(a => <option key={a.id} value={a.id} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{a.name}</option>)}
                  </select>
                </Field>
              )}
            </>
          )}


          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-300 font-semibold text-sm border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all duration-200">
              {t('common.cancel', 'Cancelar')}
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-sm transition-all duration-200 hover:from-red-700 hover:to-red-600 hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2">
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
      <Sparkles className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('masterData.empty')}</p>
    </div>
  );
}
