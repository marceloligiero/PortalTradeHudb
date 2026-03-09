import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Loader2, Scale, Calendar, Check, Search,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useTheme } from '../../contexts/ThemeContext';

interface LearningSheet {
  id: number;
  internal_error_id: number;
  error_summary: string;
  impact_description?: string;
  actions_taken?: string;
  error_weight?: number;
  tutor_evaluation?: string;
  lessons_learned?: string;
  recommendations?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export default function MyLearningSheets() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [sheets, setSheets] = useState<LearningSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LearningSheet | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/internal-errors/my-learning-sheets');
      setSheets(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (sheet: LearningSheet) => {
    try {
      await axios.post(`/internal-errors/learning-sheets/${sheet.id}/mark-read`);
      await load();
      setSelected({ ...sheet, is_read: true });
    } catch { /* ignore */ }
  };

  const filtered = sheets.filter(s => !search || s.error_summary.toLowerCase().includes(search.toLowerCase()));

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
          { label: t('myLearningSheets.total'), value: sheets.length, color: 'text-cyan-400' },
          { label: t('myLearningSheets.unread'), value: sheets.filter(s => !s.is_read).length, color: 'text-yellow-400' },
          { label: t('myLearningSheets.read'), value: sheets.filter(s => s.is_read).length, color: 'text-green-400' },
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
          {filtered.map((sheet, idx) => (
            <motion.div key={sheet.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
              onClick={() => setSelected(sheet)}
              className={`group p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-lg ${!sheet.is_read ? (isDark ? 'bg-cyan-500/[0.03] border-cyan-500/20 hover:border-cyan-500/30' : 'bg-cyan-50/50 border-cyan-200 hover:border-cyan-300') : (isDark ? 'bg-white/[0.02] border-white/5 hover:border-white/10' : 'bg-white border-gray-200 hover:border-gray-300')}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {!sheet.is_read && <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {new Date(sheet.created_at).toLocaleDateString('pt-PT')}
                    </span>
                    {sheet.error_weight && (
                      <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                        <Scale className="w-3 h-3" /> {t('myLearningSheets.weight')}: {sheet.error_weight}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-medium line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{sheet.error_summary}</p>
                  {sheet.tutor_evaluation && (
                    <p className={`text-xs mt-1 line-clamp-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{sheet.tutor_evaluation}</p>
                  )}
                </div>
                <div className={`flex items-center gap-1 text-xs ${sheet.is_read ? 'text-green-400' : 'text-yellow-400'}`}>
                  {sheet.is_read ? <><Check className="w-3 h-3" /> {t('myLearningSheets.readStatus')}</> : t('myLearningSheets.new')}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-2xl max-h-[80vh] overflow-auto rounded-2xl border p-6 space-y-4 ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <FileText className="w-5 h-5 inline mr-2 text-cyan-500" /> {t('myLearningSheets.sheetTitle')}
                </h2>
                <button onClick={() => setSelected(null)} className={`text-gray-400 hover:text-white`}>✕</button>
              </div>
              {[
                { label: t('myLearningSheets.errorSummary'), value: selected.error_summary },
                { label: t('myLearningSheets.impactLabel'), value: selected.impact_description },
                { label: t('myLearningSheets.actionsTaken'), value: selected.actions_taken },
                { label: t('myLearningSheets.errorWeight'), value: selected.error_weight?.toString() },
                { label: t('myLearningSheets.tutorEvaluation'), value: selected.tutor_evaluation },
                { label: t('myLearningSheets.lessonsLearned'), value: selected.lessons_learned },
                { label: t('myLearningSheets.recommendations'), value: selected.recommendations },
              ].filter(r => r.value).map(r => (
                <div key={r.label} className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{r.label}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{r.value}</p>
                </div>
              ))}
              {!selected.is_read && (
                <div className="flex justify-end">
                  <button onClick={() => markRead(selected)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700">
                    <Check className="w-4 h-4" /> {t('myLearningSheets.markAsRead')}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
