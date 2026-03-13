import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Loader2, Calendar, Check, Search, Clock, CheckCircle, Send,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useTheme } from '../../contexts/ThemeContext';

interface Sheet {
  id: number;
  error_id: number;
  user_id: number;
  user_name?: string;
  status: string;
  is_mandatory: boolean;
  reflection?: string;
  submitted_at?: string;
  tutor_id?: number;
  tutor_name?: string;
  tutor_outcome?: string;
  tutor_notes?: string;
  reviewed_at?: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, { dark: string; light: string }> = {
  PENDING:   { dark: 'bg-yellow-500/15 text-yellow-400', light: 'bg-yellow-50 text-yellow-600' },
  SUBMITTED: { dark: 'bg-blue-500/15 text-blue-400', light: 'bg-blue-50 text-blue-600' },
  REVIEWED:  { dark: 'bg-green-500/15 text-green-400', light: 'bg-green-50 text-green-600' },
};

export default function MyLearningSheets() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Sheet | null>(null);
  const [reflection, setReflection] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/tutoria/learning-sheets/mine');
      setSheets(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmitReflection = async () => {
    if (!selected || !reflection.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`/tutoria/learning-sheets/${selected.id}/submit`, { reflection });
      setSelected(null);
      setReflection('');
      await load();
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const filtered = sheets.filter(s => !search || String(s.error_id).includes(search) || s.tutor_name?.toLowerCase().includes(search.toLowerCase()));

  const counts = { total: sheets.length, pending: sheets.filter(s => s.status === 'PENDING').length, submitted: sheets.filter(s => s.status === 'SUBMITTED').length, reviewed: sheets.filter(s => s.status === 'REVIEWED').length };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FileText className="w-7 h-7 inline mr-2 text-cyan-500" />
          {t('myLearningSheets.title')}
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('myLearningSheets.subtitle')}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('myLearningSheets.searchPlaceholder')}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('myLearningSheets.total'), value: counts.total, color: 'text-cyan-400' },
          { label: t('myLearningSheets.pending', 'Pendentes'), value: counts.pending, color: 'text-yellow-400' },
          { label: t('myLearningSheets.reviewed', 'Revistas'), value: counts.reviewed, color: 'text-green-400' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200'}`}>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-20 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200'}`}>
          <FileText className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('myLearningSheets.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sheet, idx) => {
            const scfg = STATUS_COLORS[sheet.status] || STATUS_COLORS.PENDING;
            return (
              <motion.div key={sheet.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                onClick={() => { setSelected(sheet); setReflection(sheet.reflection || ''); }}
                className={`group p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-lg ${sheet.status === 'PENDING' ? (isDark ? 'bg-cyan-500/[0.03] border-cyan-500/20 hover:border-cyan-500/30' : 'bg-cyan-50/50 border-cyan-200 hover:border-cyan-300') : (isDark ? 'bg-white/[0.02] border-white/5 hover:border-white/10' : 'bg-white border-gray-200 hover:border-gray-300')}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {sheet.status === 'PENDING' && <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {new Date(sheet.created_at).toLocaleDateString('pt-PT')}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${isDark ? scfg.dark : scfg.light}`}>
                        {sheet.status === 'PENDING' ? <Clock className="w-3 h-3" /> : sheet.status === 'SUBMITTED' ? <Send className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        {sheet.status}
                      </span>
                      {sheet.is_mandatory && (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'}`}>
                          {t('myLearningSheets.mandatory', 'Obrigatória')}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-medium line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {t('myLearningSheets.sheetForError', 'Ficha — Incidência')} #{sheet.error_id}
                    </p>
                    {sheet.tutor_name && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {t('myLearningSheets.tutor', 'Tutor')}: {sheet.tutor_name}
                      </p>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${sheet.status === 'REVIEWED' ? 'text-green-400' : sheet.status === 'SUBMITTED' ? 'text-blue-400' : 'text-yellow-400'}`}>
                    {sheet.status === 'REVIEWED' ? <><Check className="w-3 h-3" /> {t('myLearningSheets.reviewedStatus', 'Revista')}</> : sheet.status === 'SUBMITTED' ? t('myLearningSheets.submittedStatus', 'Enviada') : t('myLearningSheets.pendingStatus', 'Pendente')}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail / Submit modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-lg max-h-[80vh] overflow-auto rounded-2xl border p-6 space-y-4 ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <FileText className="w-5 h-5 inline mr-2 text-cyan-500" /> {t('myLearningSheets.sheetTitle')}
                </h2>
                <button onClick={() => setSelected(null)} className={`text-gray-400 hover:text-white`}>✕</button>
              </div>

              <div className="space-y-3">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('myLearningSheets.errorRef', 'Incidência')}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>#{selected.error_id}</p>
                </div>
              </div>

              {/* Pending — show reflection textarea + submit */}
              {selected.status === 'PENDING' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('myLearningSheets.reflectionLabel', 'A minha reflexão')}</label>
                    <textarea value={reflection} onChange={e => setReflection(e.target.value)} rows={5}
                      className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm resize-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                      placeholder={t('myLearningSheets.reflectionPlaceholder', 'Descreva a sua reflexão sobre o erro e o que aprendeu...')} />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setSelected(null)} className={`px-4 py-2 rounded-xl text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('common.cancel', 'Cancelar')}
                    </button>
                    <button onClick={handleSubmitReflection} disabled={!reflection.trim() || submitting}
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-sm font-bold disabled:opacity-50">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t('myLearningSheets.submitReflection', 'Submeter Reflexão')} <Send className="w-3.5 h-3.5 inline ml-1" /></>}
                    </button>
                  </div>
                </div>
              )}

              {/* Submitted — show reflection (read-only) */}
              {selected.status === 'SUBMITTED' && (
                <div className="space-y-3 pt-2">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('myLearningSheets.reflectionLabel', 'A minha reflexão')}</p>
                    <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selected.reflection}</p>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{t('myLearningSheets.awaitingTutorReview', 'Aguardando revisão do tutor.')}</p>
                </div>
              )}

              {/* Reviewed — show tutor feedback */}
              {selected.status === 'REVIEWED' && (
                <div className="space-y-3 pt-2">
                  {selected.reflection && (
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('myLearningSheets.reflectionLabel', 'A minha reflexão')}</p>
                      <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selected.reflection}</p>
                    </div>
                  )}
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-green-500/[0.05]' : 'bg-green-50'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>{t('myLearningSheets.tutorOutcome', 'Resultado do Tutor')}</p>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selected.tutor_outcome}</p>
                  </div>
                  {selected.tutor_notes && (
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('myLearningSheets.tutorNotes', 'Notas do Tutor')}</p>
                      <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selected.tutor_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
