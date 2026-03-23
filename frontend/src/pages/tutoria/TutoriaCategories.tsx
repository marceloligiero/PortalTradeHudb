import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, Tag, Plus, Pencil, ToggleLeft, ToggleRight,
  ChevronRight, AlertTriangle, Check, X, FolderOpen,
  Eye, EyeOff, RefreshCw,
} from 'lucide-react';
import TutoriaPage from './TutoriaPage';
import { useTranslation } from 'react-i18next';

interface Origin {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
  origin_id: number | null;
  is_active: boolean;
  created_at: string;
}

interface FormState {
  name: string;
  description: string;
  parent_id: string;
  origin_id: string;
}

const EMPTY_FORM: FormState = { name: '', description: '', parent_id: '', origin_id: '' };

export default function TutoriaCategories() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/tutoria');
    }
  }, [user, navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tutoria/categories');
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError(t('tutoriaCategories.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flashSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description ?? '',
      parent_id: cat.parent_id ? String(cat.parent_id) : '',
    });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError(t('tutoriaCategories.nameRequired')); return; }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
      };
      if (editingId) {
        await axios.patch(`/api/tutoria/categories/${editingId}`, payload);
        flashSuccess(t('tutoriaCategories.categoryUpdated'));
      } else {
        await axios.post('/api/tutoria/categories', payload);
        flashSuccess(t('tutoriaCategories.categoryCreated'));
      }
      closeForm();
      await load();
    } catch (e: any) {
      setFormError(e?.response?.data?.detail ?? t('tutoriaCategories.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await axios.patch(`/api/tutoria/categories/${cat.id}`, { is_active: !cat.is_active });
      flashSuccess(cat.is_active ? t('tutoriaCategories.categoryDeactivated') : t('tutoriaCategories.categoryActivated'));
      await load();
    } catch {
      setError(t('tutoriaCategories.toggleError'));
    }
  };

  const topLevel = categories.filter(c => !c.parent_id);
  const children = (parentId: number) => categories.filter(c => c.parent_id === parentId);
  const parentOptions = categories.filter(c => !c.parent_id && (!editingId || c.id !== editingId));

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-[#EC0000]" />
    </div>
  );

  return (
    <TutoriaPage className="space-y-8">

      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between flex-wrap gap-4 border-b pb-6 border-neutral-200 dark:border-neutral-700"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-14 h-14 bg-[#EC0000]/10 rounded-2xl flex items-center justify-center"
          >
            <Tag className="w-7 h-7 text-[#EC0000]" />
          </motion.div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1 text-[#EC0000]">
              {t('tutoriaCategories.headerSubtitle')}
            </p>
            <h1 className="font-headline text-xl font-bold text-neutral-900 dark:text-white">
              {t('tutoriaCategories.title')}
            </h1>
            <p className="text-sm mt-0.5 text-neutral-500 dark:text-neutral-400">
              {t('tutoriaCategories.activeCount', { active: categories.filter(c => c.is_active).length, inactive: categories.filter(c => !c.is_active).length })}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white font-semibold text-sm rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('tutoriaCategories.newCategory')}
        </motion.button>
      </motion.div>

      {/* ── Feedback banners ────────────────────────────────── */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400"
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create / Edit form (inline panel) ──────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold text-neutral-900 dark:text-white">
                {editingId ? t('tutoriaCategories.editCategory') : t('tutoriaCategories.newCategory')}
              </h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <p className="text-sm px-3 py-2 rounded-lg border bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400">
                {formError}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-1.5">
                  {t('tutoriaCategories.nameLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t('tutoriaCategories.namePlaceholder')}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#EC0000] focus:ring-2 focus:ring-[#EC0000]/20 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-1.5">
                  {t('tutoriaCategories.parentLabel')}
                </label>
                <select
                  value={form.parent_id}
                  onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#EC0000] focus:ring-2 focus:ring-[#EC0000]/20 transition-colors"
                >
                  <option value="">{t('tutoriaCategories.noParent')}</option>
                  {parentOptions.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-1.5">
                {t('tutoriaCategories.descriptionLabel')}
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder={t('tutoriaCategories.descriptionPlaceholder')}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 resize-none focus:outline-none focus:border-[#EC0000] focus:ring-2 focus:ring-[#EC0000]/20 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={closeForm}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-semibold text-sm rounded-xl transition-colors"
              >
                {t('tutoriaCategories.cancel')}
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? t('tutoriaCategories.saving') : t('tutoriaCategories.save')}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Category tree ───────────────────────────────────── */}
      {categories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl border p-16 text-center bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
        >
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-700" />
          <p className="text-sm text-neutral-400 dark:text-neutral-500">{t('tutoriaCategories.emptyState')}</p>
          <button
            onClick={openCreate}
            className="mt-4 text-sm font-semibold underline text-[#EC0000] hover:text-[#CC0000]"
          >
            {t('tutoriaCategories.createFirst')}
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {topLevel.map((cat, idx) => {
            const subs = children(cat.id);
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className={`rounded-2xl border overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm ${!cat.is_active ? 'opacity-60' : ''}`}
              >
                {/* Parent category row */}
                <div className={`flex items-center gap-4 px-5 py-4 ${subs.length ? 'border-b border-neutral-100 dark:border-neutral-800' : ''}`}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#EC0000]/10">
                    <Tag className="w-4 h-4 text-[#EC0000]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">{cat.name}</span>
                      {!cat.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400">{t('tutoriaCategories.inactive')}</span>
                      )}
                      {subs.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-[#EC0000]/5 dark:bg-[#EC0000]/10 border-[#EC0000]/20 text-[#EC0000]">{t('tutoriaCategories.subCount', { count: subs.length })}</span>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs mt-0.5 truncate text-neutral-400 dark:text-neutral-500">{cat.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => openEdit(cat)}
                      title={t('tutoriaCategories.editTooltip')}
                      className="p-2 rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                    >
                      <Pencil className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggleActive(cat)}
                      title={cat.is_active ? t('tutoriaCategories.deactivateTooltip') : t('tutoriaCategories.activateTooltip')}
                      className={`p-2 rounded-lg transition-colors ${
                        cat.is_active
                          ? 'hover:bg-red-50 dark:hover:bg-red-500/10 text-green-600 dark:text-green-400 hover:text-red-500 dark:hover:text-red-400'
                          : 'hover:bg-green-50 dark:hover:bg-green-500/10 text-neutral-400 dark:text-neutral-500 hover:text-green-600 dark:hover:text-green-400'
                      }`}
                    >
                      {cat.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </motion.button>
                  </div>
                </div>

                {/* Sub-categories */}
                {subs.map(sub => (
                  <div
                    key={sub.id}
                    className={`flex items-center gap-4 px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${!sub.is_active ? 'opacity-60' : ''}`}
                  >
                    <div className="w-9 flex-shrink-0 flex justify-center">
                      <ChevronRight className="w-3 h-3 text-neutral-300 dark:text-neutral-600" />
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#EC0000]/10">
                      <Tag className="w-3.5 h-3.5 text-[#EC0000]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{sub.name}</span>
                        {!sub.is_active && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full border bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500">{t('tutoriaCategories.inactive')}</span>
                        )}
                      </div>
                      {sub.description && (
                        <p className="text-xs mt-0.5 truncate text-neutral-400 dark:text-neutral-500">{sub.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => openEdit(sub)}
                        title={t('tutoriaCategories.editTooltip')}
                        className="p-1.5 rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-white"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleActive(sub)}
                        title={sub.is_active ? t('tutoriaCategories.deactivateTooltip') : t('tutoriaCategories.activateTooltip')}
                        className={`p-1.5 rounded-lg transition-colors ${
                          sub.is_active
                            ? 'hover:bg-red-50 dark:hover:bg-red-500/10 text-green-600 dark:text-green-400 hover:text-red-500 dark:hover:text-red-400'
                            : 'hover:bg-green-50 dark:hover:bg-green-500/10 text-neutral-400 dark:text-neutral-500 hover:text-green-600 dark:hover:text-green-400'
                        }`}
                      >
                        {sub.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </motion.button>
                    </div>
                  </div>
                ))}
              </motion.div>
            );
          })}
        </div>
      )}
    </TutoriaPage>
  );
}
