import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Save, X, Bot, ChevronRight, ChevronLeft,
  Search, ToggleLeft, ToggleRight, ExternalLink, Smile, Hash,
  MessageSquare, Link, Settings, CheckCircle2, Loader2,
  Sparkles, GripVertical,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FAQ {
  id: number;
  keywords_pt: string;
  keywords_es: string | null;
  keywords_en: string | null;
  answer_pt: string;
  answer_es: string | null;
  answer_en: string | null;
  support_url: string | null;
  support_label: string | null;
  role_filter: string | null;
  priority: number;
  is_active: boolean;
}

type FormData = Omit<FAQ, 'id' | 'is_active'>;

const EMPTY: FormData = {
  keywords_pt: '', keywords_es: '', keywords_en: '',
  answer_pt: '', answer_es: '', answer_en: '',
  support_url: '', support_label: '', role_filter: '', priority: 0,
};

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: 'chatFAQ.emojiFrequent', emojis: ['👋','✅','❌','⚠️','📌','🔑','💡','📊','🎯','🔗','📝','📚','🚀','💬','👍','👎','❓','❗','🔒','🔓'] },
  { label: 'chatFAQ.emojiFaces', emojis: ['😀','😃','😄','😁','😅','🤔','😊','🙂','😉','😎','🤩','😍','🥳','😏','😶','😬','😮','😯','😲','🤯'] },
  { label: 'chatFAQ.emojiHands', emojis: ['👋','👍','👎','👏','🤝','🙏','✋','🤚','🖐️','✌️','🤞','🫶','💪','☝️','👆','👇','👈','👉','🫵','✍️'] },
  { label: 'chatFAQ.emojiObjects', emojis: ['📄','📋','📊','📈','📉','🗂️','📁','📎','🔍','🔎','💻','🖥️','📱','⌨️','🖨️','📞','📧','🏷️','📌','📍'] },
  { label: 'chatFAQ.emojiSymbols', emojis: ['✅','❌','⚠️','❓','❗','💯','🔴','🟢','🟡','🔵','⭐','💎','🏆','🎖️','🔔','🔕','♻️','⚡','🔥','💥'] },
];

function EmojiPicker({ onSelect, isDark }: { onSelect: (e: string) => void; isDark: boolean }) {
  const [tab, setTab] = useState(0);
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className={`absolute bottom-full mb-2 left-0 w-[320px] rounded-2xl border shadow-2xl overflow-hidden z-50 ${isDark ? 'bg-[#1a1a1f] border-white/10' : 'bg-white border-gray-200'}`}
    >
      <div className={`flex gap-1 px-3 py-2 border-b overflow-x-auto ${isDark ? 'border-white/8' : 'border-gray-100'}`}>
        {EMOJI_GROUPS.map((g, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
              i === tab
                ? 'bg-[#EC0000] text-white'
                : isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-50'
            }`}>{t(g.label)}</button>
        ))}
      </div>
      <div className="grid grid-cols-10 gap-0.5 p-3 max-h-[180px] overflow-y-auto">
        {EMOJI_GROUPS[tab].emojis.map((e, i) => (
          <button key={i} onClick={() => onSelect(e)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-base hover:scale-125 transition-transform ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
          >{e}</button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Wizard Steps ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'chatFAQ.stepKeywords', icon: Hash },
  { label: 'chatFAQ.stepAnswers', icon: MessageSquare },
  { label: 'chatFAQ.stepSettings', icon: Settings },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ChatFAQAdmin() {
  const { token } = useAuthStore();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Emoji picker
  const [emojiField, setEmojiField] = useState<string | null>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // ── Data ────────────────────────────────────────────────────────────────

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat/faqs', { headers });
      if (!res.ok) throw new Error();
      setFaqs(await res.json());
    } catch { setError(t('chatFAQ.loadError')); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFaqs(); }, []);

  // Close emoji picker on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiField(null);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ── Wizard helpers ──────────────────────────────────────────────────────

  const openNew = () => {
    setForm(EMPTY); setEditingId(null); setStep(0); setError(''); setSaved(false); setWizardOpen(true);
  };
  const openEdit = (faq: FAQ) => {
    setForm({
      keywords_pt: faq.keywords_pt, keywords_es: faq.keywords_es || '', keywords_en: faq.keywords_en || '',
      answer_pt: faq.answer_pt, answer_es: faq.answer_es || '', answer_en: faq.answer_en || '',
      support_url: faq.support_url || '', support_label: faq.support_label || '',
      role_filter: faq.role_filter || '', priority: faq.priority,
    });
    setEditingId(faq.id); setStep(0); setError(''); setSaved(false); setWizardOpen(true);
  };
  const closeWizard = () => { setWizardOpen(false); setEmojiField(null); };

  const insertEmoji = (emoji: string) => {
    if (!emojiField) return;
    setForm(prev => ({ ...prev, [emojiField]: (prev as any)[emojiField] + emoji }));
  };

  const validateStep = (): boolean => {
    if (step === 0 && !form.keywords_pt.trim()) { setError(t('chatFAQ.keywordsRequired')); return false; }
    if (step === 1 && !form.answer_pt.trim()) { setError(t('chatFAQ.answerRequired')); return false; }
    setError(''); return true;
  };

  const nextStep = () => { if (validateStep()) setStep(s => Math.min(s + 1, STEPS.length - 1)); };
  const prevStep = () => { setError(''); setStep(s => Math.max(s - 1, 0)); };

  const saveFaq = async () => {
    if (!validateStep()) return;
    setSaving(true); setError('');
    try {
      const payload = {
        keywords_pt: form.keywords_pt, keywords_es: form.keywords_es || null,
        keywords_en: form.keywords_en || null, answer_pt: form.answer_pt,
        answer_es: form.answer_es || null, answer_en: form.answer_en || null,
        support_url: form.support_url || null, support_label: form.support_label || null,
        role_filter: form.role_filter || null, priority: Number(form.priority),
      };
      const url = editingId ? `/api/chat/faqs/${editingId}` : '/api/chat/faqs';
      const res = await fetch(url, { method: editingId ? 'PATCH' : 'POST', headers, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => { closeWizard(); fetchFaqs(); }, 1000);
    } catch { setError(t('chatFAQ.saveError')); }
    finally { setSaving(false); }
  };

  const toggleActive = async (faq: FAQ) => {
    await fetch(`/api/chat/faqs/${faq.id}`, { method: 'PATCH', headers, body: JSON.stringify({ is_active: !faq.is_active }) });
    fetchFaqs();
  };

  const deleteFaq = async (id: number) => {
    if (!confirm(t('chatFAQ.deleteConfirm'))) return;
    await fetch(`/api/chat/faqs/${id}`, { method: 'DELETE', headers });
    fetchFaqs();
  };

  // ── Filtered list ───────────────────────────────────────────────────────

  const filtered = faqs.filter(f =>
    !search.trim() ||
    f.keywords_pt.toLowerCase().includes(search.toLowerCase()) ||
    f.answer_pt.toLowerCase().includes(search.toLowerCase())
  );

  // ── Styles ──────────────────────────────────────────────────────────────

  const inputCls = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all resize-none ${
    isDark
      ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus:border-[#EC0000] focus:ring-2 focus:ring-[#EC0000]/15'
      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#EC0000] focus:ring-2 focus:ring-[#EC0000]/10'
  }`;

  const labelCls = `block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className={`border-b pb-8 ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5">
            <motion.div whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-16 h-16 bg-gradient-to-br from-[#EC0000] to-[#CC0000] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#EC0000]/30"
            >
              <Bot className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-[#EC0000]">{t('chatFAQ.headerSubtitle')}</span>
              <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('chatFAQ.title')}
              </h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                {t('chatFAQ.description')}
              </p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={openNew}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#EC0000] to-[#CC0000] hover:from-[#D60000] hover:to-[#B80000] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#EC0000]/25 transition-all"
          >
            <Plus className="w-4 h-4" /> {t('chatFAQ.newFaq')}
          </motion.button>
        </div>
      </motion.div>

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <Search className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('chatFAQ.searchPlaceholder')}
          className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder:text-gray-600' : 'text-gray-900 placeholder:text-gray-400'}`}
        />
        {search && (
          <button onClick={() => setSearch('')} className={`p-1 rounded-lg ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <span className={`text-xs font-semibold ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('chatFAQ.resultsCount', { count: filtered.length })}</span>
      </motion.div>

      {/* ── FAQ list ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#EC0000]" /></div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-16 text-center ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-white border-gray-200'}`}
        >
          <Bot className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
          <p className={`font-bold text-lg ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {search ? t('chatFAQ.emptySearch') : t('chatFAQ.emptyNoFaqs')}
          </p>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            {search ? t('chatFAQ.emptySearchHint') : t('chatFAQ.emptyHint')}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((faq, i) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`group rounded-2xl border overflow-hidden transition-all ${
                !faq.is_active ? 'opacity-50' : ''
              } ${isDark ? 'bg-white/[0.03] border-white/8 hover:border-white/15' : 'bg-white border-gray-200 hover:border-[#EC0000]/20 shadow-sm hover:shadow-md'}`}
            >
              <div className="flex items-start gap-4 p-5">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                  faq.is_active
                    ? 'bg-gradient-to-br from-[#EC0000] to-[#CC0000] text-white'
                    : isDark ? 'bg-white/5 text-gray-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {faq.priority || faq.id}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {faq.role_filter && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        {faq.role_filter}
                      </span>
                    )}
                    {!faq.is_active && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20">{t('chatFAQ.inactive')}</span>
                    )}
                    {faq.support_url && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                        <ExternalLink className="w-2.5 h-2.5 inline mr-0.5 -mt-px" /> Link
                      </span>
                    )}
                  </div>

                  <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-[#EC0000]/80' : 'text-[#EC0000]'}`}>
                    🔑 {faq.keywords_pt.split(/[\n,]/).slice(0, 5).join(' · ')}{faq.keywords_pt.split(/[\n,]/).length > 5 ? ' …' : ''}
                  </p>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {faq.answer_pt.slice(0, 150)}{faq.answer_pt.length > 150 ? '…' : ''}
                  </p>

                  {(faq.keywords_es || faq.keywords_en) && (
                    <div className="flex gap-2 mt-2">
                      {faq.keywords_es && <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>🇪🇸 ES</span>}
                      {faq.keywords_en && <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>🇺🇸 EN</span>}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleActive(faq)} title={faq.is_active ? t('chatFAQ.deactivateTooltip') : t('chatFAQ.activateTooltip')}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    {faq.is_active
                      ? <ToggleRight className="w-5 h-5 text-green-500" />
                      : <ToggleLeft className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    }
                  </button>
                  <button onClick={() => openEdit(faq)} title={t('chatFAQ.editTooltip')}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteFaq(faq.id)} title={t('chatFAQ.deleteTooltip')}
                    className="p-2 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Wizard Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {wizardOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeWizard}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
                isDark ? 'bg-[#141418] border-white/10' : 'bg-white border-gray-200'
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#EC0000] to-[#CC0000]">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-white/80" />
                  <div>
                    <h2 className="text-white font-bold text-sm">{editingId ? t('chatFAQ.editFaq') : t('chatFAQ.newFaq')}</h2>
                    <p className="text-white/60 text-xs">{t('chatFAQ.wizardStep', { step: step + 1, total: STEPS.length, label: t(STEPS[step].label) })}</p>
                  </div>
                </div>
                <button onClick={closeWizard} className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step indicators */}
              <div className="px-6 py-3 flex items-center gap-2">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className="flex items-center gap-2 flex-1">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border flex-1 transition-all ${
                        i === step
                          ? 'bg-[#EC0000]/10 border-[#EC0000]/25 text-[#EC0000]'
                          : i < step
                            ? isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : isDark ? 'bg-white/[0.02] border-white/5 text-gray-700' : 'bg-gray-50 border-gray-200 text-gray-300'
                      }`}>
                        {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{t(s.label)}</span>
                      </div>
                      {i < STEPS.length - 1 && <div className={`w-6 h-px flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />}
                    </div>
                  );
                })}
              </div>

              {/* Saved success screen */}
              {saved ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#EC0000] to-[#CC0000] rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-[#EC0000]/30">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('chatFAQ.faqSaved')}</h3>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('chatFAQ.closing')}</p>
                  </motion.div>
                </div>
              ) : (
                <>
                  {/* Step content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <AnimatePresence mode="wait">

                      {/* ── Step 0: Keywords ── */}
                      {step === 0 && (
                        <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                          <div className={`rounded-xl border p-4 ${isDark ? 'bg-[#EC0000]/5 border-[#EC0000]/15' : 'bg-red-50 border-red-100'}`}>
                            <p className={`text-xs font-semibold ${isDark ? 'text-[#EC0000]/80' : 'text-[#EC0000]'}`}>
                              {t('chatFAQ.keywordsTip')}
                            </p>
                          </div>

                          {[
                            { key: 'keywords_pt', label: t('chatFAQ.keywordsPt'), flag: '🇵🇹', required: true, placeholder: 'erros criticos\ncritico\ngrave' },
                            { key: 'keywords_es', label: t('chatFAQ.keywordsEs'), flag: '🇪🇸', placeholder: 'errores criticos\ncritico' },
                            { key: 'keywords_en', label: t('chatFAQ.keywordsEn'), flag: '🇺🇸', placeholder: 'critical errors\ncritical' },
                          ].map(f => (
                            <div key={f.key}>
                              <label className={labelCls}>{f.flag} {f.label} {f.required && <span className="text-[#EC0000]">*</span>}</label>
                              <div className="relative" ref={emojiField === f.key ? emojiRef : undefined}>
                                <textarea
                                  rows={3} value={(form as any)[f.key] || ''}
                                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                  placeholder={f.placeholder} className={inputCls}
                                />
                                <button
                                  onClick={() => setEmojiField(emojiField === f.key ? null : f.key)}
                                  className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
                                >
                                  <Smile className="w-4 h-4" />
                                </button>
                                <AnimatePresence>{emojiField === f.key && <EmojiPicker isDark={isDark} onSelect={insertEmoji} />}</AnimatePresence>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {/* ── Step 1: Answers ── */}
                      {step === 1 && (
                        <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                          <div className={`rounded-xl border p-4 ${isDark ? 'bg-[#EC0000]/5 border-[#EC0000]/15' : 'bg-red-50 border-red-100'}`}>
                            <p className={`text-xs font-semibold ${isDark ? 'text-[#EC0000]/80' : 'text-[#EC0000]'}`}>
                              {t('chatFAQ.answersTip')}
                            </p>
                          </div>

                          {[
                            { key: 'answer_pt', label: t('chatFAQ.answerPt'), flag: '🇵🇹', required: true, placeholder: 'Resposta em português…\n\nPode usar:\n• **negrito** para destaque\n• Listas com •' },
                            { key: 'answer_es', label: t('chatFAQ.answerEs'), flag: '🇪🇸', placeholder: 'Respuesta en español…' },
                            { key: 'answer_en', label: t('chatFAQ.answerEn'), flag: '🇺🇸', placeholder: 'Answer in English…' },
                          ].map(f => (
                            <div key={f.key}>
                              <label className={labelCls}>{f.flag} {f.label} {f.required && <span className="text-[#EC0000]">*</span>}</label>
                              <div className="relative" ref={emojiField === f.key ? emojiRef : undefined}>
                                <textarea
                                  rows={5} value={(form as any)[f.key] || ''}
                                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                  placeholder={f.placeholder} className={inputCls}
                                />
                                <button
                                  onClick={() => setEmojiField(emojiField === f.key ? null : f.key)}
                                  className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
                                >
                                  <Smile className="w-4 h-4" />
                                </button>
                                <AnimatePresence>{emojiField === f.key && <EmojiPicker isDark={isDark} onSelect={insertEmoji} />}</AnimatePresence>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {/* ── Step 2: Settings ── */}
                      {step === 2 && (
                        <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                              <label className={labelCls}><Link className="w-3 h-3 inline mr-1 -mt-px" />{t('chatFAQ.supportUrl')}</label>
                              <input type="url" value={form.support_url || ''} onChange={e => setForm({ ...form, support_url: e.target.value })}
                                placeholder={t('chatFAQ.supportUrlPlaceholder')} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>{t('chatFAQ.supportLabel')}</label>
                              <input type="text" value={form.support_label || ''} onChange={e => setForm({ ...form, support_label: e.target.value })}
                                placeholder={t('chatFAQ.supportLabelPlaceholder')} className={inputCls} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                              <label className={labelCls}>{t('chatFAQ.roleFilter')}</label>
                              <input type="text" value={form.role_filter || ''} onChange={e => setForm({ ...form, role_filter: e.target.value })}
                                placeholder={t('chatFAQ.roleFilterPlaceholder')} className={inputCls} />
                              <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('chatFAQ.roleFilterHint')}</p>
                            </div>
                            <div>
                              <label className={labelCls}><GripVertical className="w-3 h-3 inline mr-1 -mt-px" />{t('chatFAQ.priority')}</label>
                              <input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })}
                                className={inputCls} />
                              <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('chatFAQ.priorityHint')}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className={`mx-6 mb-3 flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${isDark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                      ⚠️ {error}
                    </div>
                  )}

                  {/* Footer */}
                  <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
                    <button onClick={step === 0 ? closeWizard : prevStep}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {step === 0 ? <><X className="w-4 h-4" /> {t('chatFAQ.cancel')}</> : <><ChevronLeft className="w-4 h-4" /> {t('chatFAQ.previous')}</>}
                    </button>

                    {step < STEPS.length - 1 ? (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={nextStep}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#EC0000] to-[#CC0000] text-white text-sm font-bold shadow-lg shadow-[#EC0000]/25"
                      >
                        {t('chatFAQ.next')} <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={saveFaq} disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#EC0000] to-[#CC0000] text-white text-sm font-bold shadow-lg shadow-[#EC0000]/25 disabled:opacity-50"
                      >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('chatFAQ.saving')}</> : <><Save className="w-4 h-4" /> {t('chatFAQ.saveFaq')}</>}
                      </motion.button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
