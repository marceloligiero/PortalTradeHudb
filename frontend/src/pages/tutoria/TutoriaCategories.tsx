import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, Tag, Plus, Pencil, ToggleLeft, ToggleRight,
  ChevronRight, AlertTriangle, Check, X, FolderOpen,
} from 'lucide-react';
import TutoriaPage from './TutoriaPage';
import { useTranslation } from 'react-i18next';

interface Category {
  id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
  is_active: boolean;
  created_at: string;
}

interface FormState {
  name: string;
  description: string;
  parent_id: string;
}

const EMPTY_FORM: FormState = { name: '', description: '', parent_id: '' };

export default function TutoriaCategories() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
    </div>
  );

  return (
    <TutoriaPage className="space-y-8">

      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`flex items-center justify-between flex-wrap gap-4 border-b pb-6 ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/30"
          >
            <Tag className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-violet-400' : 'text-violet-500'}`}>
              {t('tutoriaCategories.headerSubtitle')}
            </p>
            <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('tutoriaCategories.title')}
            </h1>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              {t('tutoriaCategories.activeCount', { active: categories.filter(c => c.is_active).length, inactive: categories.filter(c => !c.is_active).length })}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/25 transition-all"
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
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
              isDark ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-200 text-green-700'
            }`}
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
              isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
            }`}
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
            className={`rounded-2xl border p-6 space-y-5 ${
              isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-gray-200 shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingId ? t('tutoriaCategories.editCategory') : t('tutoriaCategories.newCategory')}
              </h2>
              <button onClick={closeForm} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <p className={`text-sm px-3 py-2 rounded-lg border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                {formError}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                  {t('tutoriaCategories.nameLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t('tutoriaCategories.namePlaceholder')}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-violet-500/50'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-300 focus:bg-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                  {t('tutoriaCategories.parentLabel')}
                </label>
                <select
                  value={form.parent_id}
                  onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                  style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white focus:border-violet-500/50'
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-300 focus:bg-white'
                  }`}
                >
                  <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{t('tutoriaCategories.noParent')}</option>
                  {parentOptions.map(p => (
                    <option key={p.id} value={p.id} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                {t('tutoriaCategories.descriptionLabel')}
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder={t('tutoriaCategories.descriptionPlaceholder')}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-violet-500/50'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-300 focus:bg-white'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={closeForm}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  isDark ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('tutoriaCategories.cancel')}
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-600/20"
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
          className={`rounded-2xl border p-16 text-center ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-gray-50 border-gray-200'}`}
        >
          <FolderOpen className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('tutoriaCategories.emptyState')}</p>
          <button
            onClick={openCreate}
            className={`mt-4 text-sm font-semibold underline ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}
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
                className={`rounded-2xl border overflow-hidden ${
                  isDark ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200 shadow-sm'
                } ${!cat.is_active ? 'opacity-60' : ''}`}
              >
                {/* Parent category row */}
                <div className={`flex items-center gap-4 px-5 py-4 ${isDark ? 'border-b border-white/5' : subs.length ? 'border-b border-gray-100' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20`}>
                    <Tag className="w-4 h-4 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{cat.name}</span>
                      {!cat.is_active && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                          isDark ? 'bg-gray-500/10 border-gray-500/20 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'
                        }`}>{t('tutoriaCategories.inactive')}</span>
                      )}
                      {subs.length > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                          isDark ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-violet-50 border-violet-200 text-violet-600'
                        }`}>{t('tutoriaCategories.subCount', { count: subs.length })}</span>
                      )}
                    </div>
                    {cat.description && (
                      <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{cat.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => openEdit(cat)}
                      title={t('tutoriaCategories.editTooltip')}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggleActive(cat)}
                      title={cat.is_active ? t('tutoriaCategories.deactivateTooltip') : t('tutoriaCategories.activateTooltip')}
                      className={`p-2 rounded-lg transition-colors ${
                        cat.is_active
                          ? isDark ? 'hover:bg-red-500/10 text-green-400 hover:text-red-400' : 'hover:bg-red-50 text-green-600 hover:text-red-500'
                          : isDark ? 'hover:bg-green-500/10 text-gray-500 hover:text-green-400' : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
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
                    className={`flex items-center gap-4 px-5 py-3 border-t ${
                      isDark ? 'border-white/5 hover:bg-white/[0.02]' : 'border-gray-50 hover:bg-gray-50'
                    } ${!sub.is_active ? 'opacity-60' : ''}`}
                  >
                    <div className="w-9 flex-shrink-0 flex justify-center">
                      <ChevronRight className={`w-3 h-3 ${isDark ? 'text-white/20' : 'text-gray-300'}`} />
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/5' : 'bg-violet-50'}`}>
                      <Tag className={`w-3.5 h-3.5 ${isDark ? 'text-violet-400' : 'text-violet-500'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isDark ? 'text-white/80' : 'text-gray-800'}`}>{sub.name}</span>
                        {!sub.is_active && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
                            isDark ? 'bg-gray-500/10 border-gray-500/20 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-400'
                          }`}>{t('tutoriaCategories.inactive')}</span>
                        )}
                      </div>
                      {sub.description && (
                        <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{sub.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => openEdit(sub)}
                        title={t('tutoriaCategories.editTooltip')}
                        className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleActive(sub)}
                        title={sub.is_active ? t('tutoriaCategories.deactivateTooltip') : t('tutoriaCategories.activateTooltip')}
                        className={`p-1.5 rounded-lg transition-colors ${
                          sub.is_active
                            ? isDark ? 'hover:bg-red-500/10 text-green-400 hover:text-red-400' : 'hover:bg-red-50 text-green-600 hover:text-red-500'
                            : isDark ? 'hover:bg-green-500/10 text-gray-500 hover:text-green-400' : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
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
