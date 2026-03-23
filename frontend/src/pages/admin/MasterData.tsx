import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, Package, Users, FolderTree, MessageCircle,
  Plus, Pencil, Trash2, X, CheckCircle2, XCircle, AlertTriangle,
  Search, Sparkles, Save, Loader2, Zap, Globe, Eye, Building, Activity,
  ChevronRight, UserPlus, Link2, Unlink, User, Info, Crown,
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
  node_id?: number | null;
  is_active: boolean; created_at: string;
  manager_name?: string | null;
  product_name?: string | null;
  manager?: { id: number; full_name: string; email: string };
  product?: { id: number; name: string };
  members_count?: number;
  services?: { id: number; name: string | null }[];
  team_members?: { id: number; full_name: string; email: string; role: string; team_role?: string }[];
}
interface OrgNode {
  id: number; name: string; parent_id: number | null; position: number;
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
  level?: string | null; image_url?: string | null;
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
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Red accent top bar */}
        <div className="h-1 bg-gradient-to-r from-[#EC0000] to-[#CC0000]" />
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EC0000] flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-headline font-bold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
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
function Field({ label, children, hint, required }: { label: string; children: React.ReactNode; hint?: string; required?: boolean }) {
  return (
    <div className="group">
      <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 group-focus-within:text-[#EC0000] transition-colors">
        {label}
        {required && <span className="text-[#EC0000] font-bold">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

/* ─── Status Toggle Button ──────────────────────────────────────────── */
function StatusToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
        value
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
      }`}
    >
      <div className={`w-8 h-5 rounded-full relative transition-colors flex items-center ${value ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <div className={`w-3.5 h-3.5 rounded-full bg-white absolute transition-transform shadow-sm ${value ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
      </div>
      {value ? t('masterData.active') : t('masterData.inactive')}
    </button>
  );
}

const inputCls = "w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#EC0000]/50 focus:ring-2 focus:ring-[#EC0000]/10 transition-all outline-none text-sm";
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
  const [teamForm, setTeamForm] = useState({ name: '', description: '', service_ids: [] as number[], manager_id: '', node_id: '', is_active: true });
  const [teamFormErrors, setTeamFormErrors] = useState({ name: '', manager_id: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', parent_id: '', origin_id: '' });
  const [faqForm, setFaqForm] = useState({
    keywords_pt: '', keywords_es: '', keywords_en: '',
    answer_pt: '', answer_es: '', answer_en: '',
    support_url: '', support_label: '', role_filter: '', priority: 0,
  });
  const [lookupForm, setLookupForm] = useState({ name: '', description: '', bank_id: '', department_id: '', activity_id: '', origin_id: '', level: '', image_url: '', is_active: true });

  /* ── Aux data ───────────────────────────────────────────────────── */
  const [managers, setManagers] = useState<{ id: number; full_name: string }[]>([]);
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>([]);
  const [auxBanks, setAuxBanks] = useState<{ id: number; name: string }[]>([]);
  const [auxDepts, setAuxDepts] = useState<{ id: number; name: string }[]>([]);
  const [auxActivities, setAuxActivities] = useState<{ id: number; name: string }[]>([]);
  const [auxOrigins, setAuxOrigins] = useState<{ id: number; name: string }[]>([]);

  /* ── Team detail states ─────────────────────────────────────────── */
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
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
          try {
            const n = await api.get('/api/org/nodes');
            setOrgNodes(Array.isArray(n.data) ? n.data : []);
          } catch (e) { console.error('Failed to load org nodes', e); }
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
      case 'teams': setTeamForm({ name: '', description: '', service_ids: [], manager_id: '', node_id: '', is_active: true }); setTeamFormErrors({ name: '', manager_id: '' }); break;
      case 'categories': setCategoryForm({ name: '', description: '', parent_id: '', origin_id: '' }); break;
      case 'faqs': setFaqForm({ keywords_pt: '', keywords_es: '', keywords_en: '', answer_pt: '', answer_es: '', answer_en: '', support_url: '', support_label: '', role_filter: '', priority: 0 }); break;
      default: setLookupForm({ name: '', description: '', bank_id: '', department_id: '', activity_id: '', origin_id: '', level: '', image_url: '', is_active: true }); break;
    }
    setShowForm(true);
  };

  /* ── Open edit ──────────────────────────────────────────────────── */
  const openEdit = (item: any) => {
    setEditItem(item);
    switch (tab) {
      case 'banks': setBankForm({ name: item.name, country: item.country, is_active: item.is_active }); break;
      case 'products': setProductForm({ code: item.code, name: item.name, description: item.description || '', is_active: item.is_active }); break;
      case 'teams': setTeamForm({ name: item.name, description: item.description || '', service_ids: (item.services || []).map((s: any) => s.id), manager_id: item.manager_id?.toString() || '', node_id: item.node_id?.toString() || '', is_active: item.is_active ?? true }); setTeamFormErrors({ name: '', manager_id: '' }); break;
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
        level: item.level || '', image_url: item.image_url || '', is_active: item.is_active ?? true,
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
          const errs = {
            name: !teamForm.name.trim() ? t('masterData.fieldRequired', 'Campo obrigatório') : '',
            manager_id: !teamForm.manager_id ? t('masterData.teamChiefRequired', 'Selecionar o chefe de equipa é obrigatório') : '',
          };
          if (errs.name || errs.manager_id) {
            setTeamFormErrors(errs);
            setSaving(false);
            return;
          }
          const payload: any = { name: teamForm.name.trim(), description: teamForm.description || null };
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
            // Handle sector (org node) linking
            const prevNodeId = editItem?.node_id;
            const newNodeId = teamForm.node_id ? parseInt(teamForm.node_id) : null;
            if (prevNodeId && prevNodeId !== newNodeId) {
              try { await api.delete(`/api/org/nodes/${prevNodeId}/link-team/${teamId}`); } catch {}
            }
            if (newNodeId && newNodeId !== prevNodeId) {
              try { await api.post(`/api/org/nodes/${newNodeId}/link-team/${teamId}`); } catch {}
            }
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
            if (lookupForm.level) payload.level = lookupForm.level;
            if (lookupForm.image_url) payload.image_url = lookupForm.image_url;
            payload.is_active = lookupForm.is_active;
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

  /* ── Lookup pagination ──────────────────────────────────────────── */
  const LOOKUP_PAGE_SIZE = 20;
  const [lookupPage, setLookupPage] = useState(1);
  // reset page when tab or search changes
  useEffect(() => { setLookupPage(1); }, [tab, search]);
  const lookupTotalPages = Math.ceil(filteredLookup.length / LOOKUP_PAGE_SIZE);
  const pagedLookup = filteredLookup.slice((lookupPage - 1) * LOOKUP_PAGE_SIZE, lookupPage * LOOKUP_PAGE_SIZE);

  /* ── Status badge ───────────────────────────────────────────────── */
  const Status = ({ active }: { active: boolean }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
      {active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {active ? t('masterData.active') : t('masterData.inactive')}
    </span>
  );

  /* ── Action buttons — always renders a div to keep CSS Grid columns aligned ── */
  const Actions = ({ item }: { item: any }) => (
    <div className="flex items-center gap-1 w-[72px]">
      {isAdmin && (
        <>
          <button onClick={() => openEdit(item)}
            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => openDelete(item)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
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
                <div className="grid grid-cols-[1fr_72px] gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                  <span>{t('masterData.name')}</span>
                  <span />
                </div>
                <div>
                  {filteredBanks.map(b => (
                    <div key={b.id}
                      className="grid grid-cols-[1fr_72px] gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{b.name}</p>
                        <p className="text-xs text-gray-400">{b.country}</p>
                      </div>
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
                <div className="grid grid-cols-[1fr_72px] gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                  <span>{t('masterData.name')}</span>
                  <span />
                </div>
                <div>
                  {filteredProducts.map(p => (
                    <div key={p.id}
                      className="grid grid-cols-[1fr_72px] gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>}
                      </div>
                      <Actions item={p} />
                    </div>
                  ))}
                  {filteredProducts.length === 0 && <EmptyState />}
                </div>
              </>
            )}

            {/* ── TEAMS ──────────────────────────────────────── */}
            {tab === 'teams' && (
              <div className="p-6">
                {filteredTeams.length === 0 ? <EmptyState /> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTeams.map(tm => {
                      const chief = tm.manager_name || tm.manager?.full_name;
                      const members = tm.team_members || [];
                      const services = tm.services || [];
                      return (
                        <div key={tm.id}
                          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-[#EC0000]/30 hover:shadow-md dark:hover:shadow-none transition-all duration-200 flex flex-col cursor-pointer"
                          onClick={() => {
                            setSelectedTeam(tm);
                            api.get('/api/users/unassigned').then(r => setAvailableUsers(r.data)).catch(() => {});
                            if (products.length === 0) api.get('/api/admin/products').then(r => setProducts(r.data)).catch(() => {});
                          }}
                        >

                          {/* Card header */}
                          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-[#EC0000] flex items-center justify-center flex-shrink-0 shadow-sm">
                                <span className="text-sm font-bold text-white">{tm.name[0].toUpperCase()}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{tm.name}</p>
                                {tm.description && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{tm.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                              <Actions item={tm} />
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="mx-5 border-t border-gray-100 dark:border-gray-800" />

                          {/* Card body */}
                          <div className="px-5 py-4 space-y-3 flex-1">

                            {/* Chief */}
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                                <User className="w-3.5 h-3.5 text-amber-500" />
                              </div>
                              {chief ? (
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-5 h-5 rounded-full bg-[#EC0000] flex items-center justify-center flex-shrink-0">
                                    <span className="text-[9px] font-bold text-white">{chief[0].toUpperCase()}</span>
                                  </div>
                                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">{chief}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">{t('masterData.noChief', 'Sem chefe atribuído')}</span>
                              )}
                            </div>

                            {/* Members */}
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                                <Users className="w-3.5 h-3.5 text-[#EC0000]" />
                              </div>
                              {members.length > 0 ? (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="flex -space-x-1.5">
                                    {members.slice(0, 4).map(m => (
                                      <div key={m.id} title={m.full_name}
                                        className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-gray-600 dark:text-gray-300">{m.full_name[0].toUpperCase()}</span>
                                      </div>
                                    ))}
                                    {members.length > 4 && (
                                      <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-gray-500">+{members.length - 4}</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{members.length} {t('masterData.teamMembersLabel', 'membros')}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">{t('masterData.noMembers', 'Sem membros')}</span>
                              )}
                            </div>

                            {/* Services */}
                            {services.length > 0 && (
                              <div className="flex items-start gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="flex flex-wrap gap-1 min-w-0">
                                  {services.slice(0, 3).map(s => (
                                    <span key={s.id} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                                      {s.name}
                                    </span>
                                  ))}
                                  {services.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500">
                                      +{services.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Footer — edit hint */}
                          <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                              {t('masterData.clickToViewDetails', 'Clique no card para ver detalhes')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── CATEGORIES ─────────────────────────────────── */}
            {tab === 'categories' && (
              <>
                <div className="grid grid-cols-[1fr_1fr_150px_72px] gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                  <span>{t('masterData.name')}</span>
                  <span>{t('masterData.description')}</span>
                  <span>{t('masterData.origin')}</span>
                  <span />
                </div>
                <div>
                  {filteredCategories.map(c => (
                    <div key={c.id}
                      className="grid grid-cols-[1fr_1fr_150px_72px] gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors items-center">
                      <div className="flex items-center gap-2 min-w-0">
                        {c.parent_id && <span className="text-gray-400 flex-shrink-0">↳</span>}
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{c.description || '—'}</p>
                      <p className="text-xs text-gray-400 truncate">{c.origin_id ? auxOrigins.find(o => o.id === c.origin_id)?.name || '—' : '—'}</p>
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
                <div className="grid grid-cols-[1fr_1fr_80px_72px] gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                  <span>{t('masterData.keywords')}</span>
                  <span>{t('masterData.answer')}</span>
                  <span className="text-center">{t('masterData.priority')}</span>
                  <span />
                </div>
                <div>
                  {filteredFaqs.map(f => (
                    <div key={f.id}
                      className="grid grid-cols-[1fr_1fr_80px_72px] gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors items-center">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{f.keywords_pt}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{f.answer_pt}</p>
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg text-center block">{f.priority}</span>
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
                <div className={`grid gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50 ${DEP_TABS.includes(tab) ? 'grid-cols-[1fr_1fr_1fr_72px]' : 'grid-cols-[1fr_1fr_72px]'}`}>
                  <span>{t('masterData.name')}</span>
                  {DEP_TABS.includes(tab) && (
                    <span>
                      {tab === 'activities' && `${t('masterData.bank')} / ${t('masterData.department')}`}
                      {tab === 'error_types' && t('masterData.activity')}
                    </span>
                  )}
                  <span>{t('masterData.description')}</span>
                  <span />
                </div>
                <div>
                  {pagedLookup.map(item => (
                    <div key={item.id}
                      className={`grid gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors items-center ${DEP_TABS.includes(tab) ? 'grid-cols-[1fr_1fr_1fr_72px]' : 'grid-cols-[1fr_1fr_72px]'}`}>
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
                      <Actions item={item} />
                    </div>
                  ))}
                  {pagedLookup.length === 0 && <EmptyState />}
                </div>

                {/* Pagination */}
                {lookupTotalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    <span className="text-xs text-gray-400">
                      {(lookupPage - 1) * LOOKUP_PAGE_SIZE + 1}–{Math.min(lookupPage * LOOKUP_PAGE_SIZE, filteredLookup.length)} de {filteredLookup.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setLookupPage(p => Math.max(1, p - 1))}
                        disabled={lookupPage === 1}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                      {Array.from({ length: lookupTotalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === lookupTotalPages || Math.abs(p - lookupPage) <= 1)
                        .reduce<(number | '...')[]>((acc, p, i, arr) => {
                          if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, i) => p === '...'
                          ? <span key={`e${i}`} className="px-1 text-gray-400 text-xs">…</span>
                          : <button key={p} onClick={() => setLookupPage(p as number)}
                              className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${lookupPage === p ? 'bg-[#EC0000] text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                              {p}
                            </button>
                        )}
                      <button
                        onClick={() => setLookupPage(p => Math.min(lookupTotalPages, p + 1))}
                        disabled={lookupPage === lookupTotalPages}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
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
            <div className="space-y-4">
              <Field label={t('masterData.name')} required>
                <input className={inputCls} value={bankForm.name} onChange={e => setBankForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Banco Santander" />
              </Field>
              <Field label={t('masterData.country')}>
                <select className={selectCls} value={bankForm.country} onChange={e => setBankForm(p => ({ ...p, country: e.target.value }))}>
                  <option value="PT">🇵🇹 Portugal</option>
                  <option value="ES">🇪🇸 España</option>
                  <option value="BR">🇧🇷 Brasil</option>
                  <option value="US">🇺🇸 USA</option>
                  <option value="UK">🇬🇧 UK</option>
                  <option value="FR">🇫🇷 France</option>
                  <option value="DE">🇩🇪 Deutschland</option>
                  <option value="IT">🇮🇹 Italia</option>
                </select>
              </Field>
              {editItem && (
                <Field label={t('masterData.status')}>
                  <StatusToggle value={bankForm.is_active} onChange={v => setBankForm(p => ({ ...p, is_active: v }))} />
                </Field>
              )}
            </div>
          )}

          {/* PRODUCT FORM */}
          {tab === 'products' && (
            <div className="space-y-4">
              <Field label={t('masterData.name')} required>
                <input className={inputCls} value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Crédito Habitação" />
              </Field>
              <Field label={t('masterData.description')}>
                <textarea className={inputCls + ' resize-none'} rows={3} value={productForm.description}
                  onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                  placeholder={t('masterData.descriptionOptionalPlaceholder', 'Descrição do produto...')} />
              </Field>
              {editItem && (
                <Field label={t('masterData.status')}>
                  <StatusToggle value={productForm.is_active} onChange={v => setProductForm(p => ({ ...p, is_active: v }))} />
                </Field>
              )}
            </div>
          )}

          {/* TEAM FORM */}
          {tab === 'teams' && (
            <div className="space-y-4">
              {/* Row 1: Name + Chief */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Field label={t('masterData.name')} required>
                    <input
                      className={`${inputCls} ${teamFormErrors.name ? 'border-red-400 dark:border-red-500' : ''}`}
                      placeholder={t('masterData.teamNamePlaceholder', 'Ex: Equipa de Trading')}
                      value={teamForm.name}
                      onChange={e => { setTeamForm(p => ({ ...p, name: e.target.value })); if (e.target.value.trim()) setTeamFormErrors(p => ({ ...p, name: '' })); }}
                      onBlur={() => { if (!teamForm.name.trim()) setTeamFormErrors(p => ({ ...p, name: t('masterData.fieldRequired', 'Obrigatório') })); }}
                    />
                    {teamFormErrors.name && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{teamFormErrors.name}</p>}
                  </Field>
                </div>
                <div>
                  <Field label={t('masterData.teamChief', 'Chefe de Equipa')} required>
                    <select
                      className={`${selectCls} ${teamFormErrors.manager_id ? 'border-red-400 dark:border-red-500' : ''}`}
                      value={teamForm.manager_id}
                      onChange={e => { setTeamForm(p => ({ ...p, manager_id: e.target.value })); if (e.target.value) setTeamFormErrors(p => ({ ...p, manager_id: '' })); }}
                      onBlur={() => { if (!teamForm.manager_id) setTeamFormErrors(p => ({ ...p, manager_id: t('masterData.teamChiefRequired', 'Selecionar o chefe') })); }}
                    >
                      <option value="">— {t('masterData.selectChief', 'Selecionar')} —</option>
                      {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                    </select>
                    {teamFormErrors.manager_id && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{teamFormErrors.manager_id}</p>}
                  </Field>
                </div>
              </div>

              {/* Row 2: Sector */}
              <Field label={t('masterData.teamSector', 'Sector / Departamento')}>
                <select
                  className={selectCls}
                  value={teamForm.node_id}
                  onChange={e => setTeamForm(p => ({ ...p, node_id: e.target.value }))}
                >
                  <option value="">— {t('masterData.noSector', 'Sem sector')} —</option>
                  {orgNodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </Field>

              {/* Row 3: Description */}
              <Field label={t('masterData.description')}>
                <textarea
                  className={inputCls + ' resize-none'}
                  rows={2}
                  placeholder={t('masterData.teamDescPlaceholder', 'Descrição da equipa, área de atuação...')}
                  value={teamForm.description}
                  onChange={e => setTeamForm(p => ({ ...p, description: e.target.value }))}
                />
              </Field>

              {/* Row 3: Services — chips toggle, no scroll */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('masterData.servicesLabel', 'Produtos / Serviços')}
                  </label>
                  {teamForm.service_ids.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                      {teamForm.service_ids.length} {t('masterData.selectedCount', 'selecionados')}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 min-h-[42px]">
                  {products.filter(p => p.is_active).length === 0 && (
                    <p className="text-xs text-gray-400 self-center">{t('masterData.noServicesAvailable')}</p>
                  )}
                  {products.filter(p => p.is_active).map(p => {
                    const selected = teamForm.service_ids.includes(p.id);
                    return (
                      <button key={p.id} type="button"
                        onClick={() => setTeamForm(prev => ({
                          ...prev,
                          service_ids: selected ? prev.service_ids.filter(id => id !== p.id) : [...prev.service_ids, p.id]
                        }))}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          selected
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-700'
                        }`}>
                        {selected && <CheckCircle2 className="w-3 h-3" />}
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY FORM */}
          {tab === 'categories' && (
            <div className="space-y-4">
              <Field label={t('masterData.name')} required>
                <input className={inputCls} value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Erros de Processamento" />
              </Field>
              <Field label={t('masterData.description')}>
                <textarea className={inputCls + ' resize-none'} rows={2} value={categoryForm.description}
                  onChange={e => setCategoryForm(p => ({ ...p, description: e.target.value }))}
                  placeholder={t('masterData.descriptionOptionalPlaceholder', 'Descrição da categoria...')} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
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
              </div>
            </div>
          )}

          {/* FAQ FORM */}
          {tab === 'faqs' && (
            <div className="space-y-5">
              {/* PT — Primary */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-sm">🇵🇹</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">Português</span>
                  <span className="ml-auto text-[10px] text-[#EC0000] font-bold">* Obrigatório</span>
                </div>
                <div className="p-4 space-y-3">
                  <Field label={t('masterData.keywordsPT')} required>
                    <input className={inputCls} value={faqForm.keywords_pt} onChange={e => setFaqForm(p => ({ ...p, keywords_pt: e.target.value }))} placeholder="palavra1, palavra2, ..." />
                  </Field>
                  <Field label={t('masterData.answerPT')} required>
                    <textarea className={inputCls + ' resize-none'} rows={3} value={faqForm.answer_pt} onChange={e => setFaqForm(p => ({ ...p, answer_pt: e.target.value }))} placeholder="Resposta em português..." />
                  </Field>
                </div>
              </div>

              {/* ES + EN */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/10 border-b border-gray-200 dark:border-gray-800">
                    <span className="text-sm">🇪🇸</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-yellow-700 dark:text-yellow-400">Español</span>
                  </div>
                  <div className="p-3 space-y-3">
                    <Field label={t('masterData.keywordsES')}>
                      <input className={inputCls} value={faqForm.keywords_es} onChange={e => setFaqForm(p => ({ ...p, keywords_es: e.target.value }))} />
                    </Field>
                    <Field label={t('masterData.answerES')}>
                      <textarea className={inputCls + ' resize-none'} rows={2} value={faqForm.answer_es} onChange={e => setFaqForm(p => ({ ...p, answer_es: e.target.value }))} />
                    </Field>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/10 border-b border-gray-200 dark:border-gray-800">
                    <span className="text-sm">🇬🇧</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">English</span>
                  </div>
                  <div className="p-3 space-y-3">
                    <Field label={t('masterData.keywordsEN')}>
                      <input className={inputCls} value={faqForm.keywords_en} onChange={e => setFaqForm(p => ({ ...p, keywords_en: e.target.value }))} />
                    </Field>
                    <Field label={t('masterData.answerEN')}>
                      <textarea className={inputCls + ' resize-none'} rows={2} value={faqForm.answer_en} onChange={e => setFaqForm(p => ({ ...p, answer_en: e.target.value }))} />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Config row */}
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
                  <input type="number" min={0} className={inputCls} value={faqForm.priority} onChange={e => setFaqForm(p => ({ ...p, priority: parseInt(e.target.value) || 0 }))} />
                </Field>
              </div>

              {/* Support link */}
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('masterData.supportUrl')}>
                  <input className={inputCls} value={faqForm.support_url} onChange={e => setFaqForm(p => ({ ...p, support_url: e.target.value }))} placeholder="https://..." />
                </Field>
                <Field label={t('masterData.supportLabel')}>
                  <input className={inputCls} value={faqForm.support_label} onChange={e => setFaqForm(p => ({ ...p, support_label: e.target.value }))} />
                </Field>
              </div>
            </div>
          )}

          {/* LOOKUP FORM */}
          {LOOKUP_TABS.includes(tab) && (
            <div className="space-y-4">
              <Field label={t('masterData.name')} required>
                <input className={inputCls} value={lookupForm.name} onChange={e => setLookupForm(p => ({ ...p, name: e.target.value }))} placeholder={t('masterData.namePlaceholder')} />
              </Field>
              <Field label={t('masterData.description')}>
                <textarea className={inputCls + ' resize-none'} rows={2} value={lookupForm.description} onChange={e => setLookupForm(p => ({ ...p, description: e.target.value }))} placeholder={t('masterData.descriptionOptionalPlaceholder')} />
              </Field>

              {tab === 'activities' && (
                <div className="grid grid-cols-2 gap-3">
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
                </div>
              )}

              {tab === 'error_types' && (
                <Field label={t('masterData.activity')}>
                  <select className={selectCls} value={lookupForm.activity_id} onChange={e => setLookupForm(p => ({ ...p, activity_id: e.target.value }))}>
                    <option value="">— {t('masterData.noActivity')} —</option>
                    {auxActivities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </Field>
              )}

              {tab === 'impacts' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('masterData.level', 'Nível')}>
                    <select className={selectCls} value={lookupForm.level} onChange={e => setLookupForm(p => ({ ...p, level: e.target.value }))}>
                      <option value="">— {t('masterData.selectLevel', 'Selecionar nível')} —</option>
                      <option value="LOW">{t('masterData.levelLow', 'Baixo')}</option>
                      <option value="MEDIUM">{t('masterData.levelMedium', 'Médio')}</option>
                      <option value="HIGH">{t('masterData.levelHigh', 'Alto')}</option>
                      <option value="CRITICAL">{t('masterData.levelCritical', 'Crítico')}</option>
                    </select>
                  </Field>
                  <Field label={t('masterData.imageUrl', 'URL da Imagem')}>
                    <input className={inputCls} value={lookupForm.image_url} onChange={e => setLookupForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
                  </Field>
                </div>
              )}

              {editItem && (
                <Field label={t('masterData.status', 'Estado')}>
                  <StatusToggle value={lookupForm.is_active} onChange={v => setLookupForm(p => ({ ...p, is_active: v }))} />
                </Field>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-5 border-t border-gray-200 dark:border-gray-800 mt-2">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              {t('common.cancel', 'Cancelar')}
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#EC0000] hover:bg-[#CC0000] text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-red-200 dark:shadow-none">
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

      {/* Team Detail Panel */}
      {selectedTeam && (
        <TeamDetailPanel
          team={selectedTeam}
          isAdmin={isAdmin}
          availableUsers={availableUsers}
          products={products}
          orgNodes={orgNodes}
          onClose={() => setSelectedTeam(null)}
          onEdit={() => { openEdit(selectedTeam); setSelectedTeam(null); }}
          onDelete={() => { openDelete(selectedTeam); setSelectedTeam(null); }}
          onAddMember={async () => {}}
          onRemoveMember={async () => {}}
          onLinkService={async () => {}}
          onUnlinkService={async () => {}}
          onLoadUsers={() => {}}
        />
      )}
    </div>
  );
}

/* ── Team Detail Panel ──────────────────────────────────────────────── */
function TeamDetailPanel({ team, isAdmin, orgNodes, onClose, onEdit, onDelete }: {
  team: Team;
  isAdmin: boolean;
  availableUsers: any[];
  products: any[];
  orgNodes: OrgNode[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddMember: (uid: number) => Promise<void>;
  onRemoveMember: (mid: number) => Promise<void>;
  onLinkService: (pid: number) => Promise<void>;
  onUnlinkService: (sid: number) => Promise<void>;
  onLoadUsers: () => void;
}) {
  const { t } = useTranslation();
  const chief = team.manager_name || team.manager?.full_name;
  const sector = team.node_id ? orgNodes.find(n => n.id === team.node_id) : null;
  const members = team.team_members || [];
  const services = team.services || [];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#EC0000] to-[#CC0000] flex-shrink-0 rounded-t-2xl" />

        {/* ── Team Header ─────────────────────────────────── */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EC0000] to-[#CC0000] flex items-center justify-center shadow-lg shadow-[#EC0000]/20 flex-shrink-0">
                <span className="text-2xl font-bold text-white">{team.name[0].toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <h2 className="font-headline text-xl font-bold text-gray-900 dark:text-white leading-tight truncate">
                  {team.name}
                </h2>
                {team.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{team.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                    <Users className="w-3 h-3" />
                    {members.length} {t('masterData.members', 'membros')}
                  </span>
                  {services.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                      <Package className="w-3 h-3" />
                      {services.length} {t('masterData.services', 'serviços')}
                    </span>
                  )}
                  {sector && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800/30">
                      <Building className="w-3 h-3" />
                      {sector.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">

          {/* Section label */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {t('masterData.teamStructure', 'Estrutura da Equipa')}
          </p>

          {/* Chief — prominent node at top of structure */}
          <div className="flex flex-col items-center gap-0">
            <div className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-700/30">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md flex-shrink-0">
                {chief
                  ? <span className="text-base font-bold text-white">{chief[0].toUpperCase()}</span>
                  : <Crown className="w-5 h-5 text-white" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {t('masterData.teamChief', 'Chefe de Equipa')}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {chief ?? <span className="text-gray-400 dark:text-gray-500 font-normal text-sm italic">{t('masterData.noChief', 'Sem chefe atribuído')}</span>}
                </p>
              </div>
            </div>

            {/* Connector */}
            {members.length > 0 && (
              <div className="w-px h-4 bg-amber-300 dark:bg-amber-600/40" />
            )}
          </div>

          {/* Members */}
          {members.length > 0 && (
            <div className="border-l-2 border-amber-200 dark:border-amber-700/30 ml-6 pl-4 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {t('masterData.teamMembers', 'Membros')}
                </p>
                <span className="text-[10px] font-bold text-[#EC0000] bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                  {members.length}
                </span>
              </div>
              {members.map(m => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#EC0000] flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-white">{m.full_name[0].toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.full_name}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{m.email}</p>
                  </div>
                  {m.role && !['STUDENT', 'TRAINEE'].includes(m.role) && (() => {
                    const roleLabel: Record<string, string> = {
                      ADMIN: t('roles.admin', 'Admin'),
                      MANAGER: t('roles.manager', 'Gestor'),
                      TRAINER: t('roles.trainer', 'Formador'),
                      DIRECTOR: t('roles.director', 'Diretor'),
                    };
                    return (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded flex-shrink-0">
                        {roleLabel[m.role] || m.role}
                      </span>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}

          {/* Services */}
          {services.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {t('masterData.linkedServices', 'Serviços Associados')}
                </p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                  {services.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {services.map(s => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30"
                  >
                    <Package className="w-3 h-3" />{s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Empty state when no chief, no members, no services */}
          {!chief && members.length === 0 && services.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('masterData.teamEmpty', 'Equipa sem membros ou serviços')}</p>
              {isAdmin && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('masterData.teamEditHint', 'Clique em Editar para configurar a equipa')}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Footer Actions ──────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex gap-3">
          {isAdmin && (
            <button
              onClick={onDelete}
              className="p-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.close', 'Fechar')}
          </button>
          {isAdmin && (
            <button
              onClick={onEdit}
              className="flex-1 py-2.5 rounded-xl bg-[#EC0000] hover:bg-[#CC0000] text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Pencil className="w-4 h-4" /> {t('masterData.edit', 'Editar')}
            </button>
          )}
        </div>
      </div>
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
