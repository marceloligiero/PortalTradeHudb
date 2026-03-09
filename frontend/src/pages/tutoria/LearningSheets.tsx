import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FileText, Loader2, User, Calendar, Check, Search,
  ArrowRight,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useTheme } from '../../contexts/ThemeContext';

interface InternalError {
  id: number;
  gravador_name?: string;
  description: string;
  date_occurrence?: string;
  peso_tutor?: number;
  has_learning_sheet: boolean;
  has_action_plan: boolean;
  status: string;
}

export default function LearningSheets() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<InternalError[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'with' | 'without'>('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.get('/internal-errors/errors');
        setErrors(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const filtered = errors.filter(e => {
    if (filter === 'with' && !e.has_learning_sheet) return false;
    if (filter === 'without' && e.has_learning_sheet) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return e.description.toLowerCase().includes(s) || e.gravador_name?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FileText className="w-7 h-7 inline mr-2 text-cyan-500" />
          {t('learningSheets.title')}
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('learningSheets.subtitle')}
        </p>
      </div>

      <div className={`flex flex-wrap gap-3 p-4 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200'}`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('learningSheets.searchPlaceholder')}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value as any)}
          className={`px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
          <option value="all">{t('learningSheets.allErrors')}</option>
          <option value="with">{t('learningSheets.withSheet')}</option>
          <option value="without">{t('learningSheets.withoutSheet')}</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('learningSheets.totalErrors'), value: errors.length, color: 'text-white' },
          { label: t('learningSheets.withSheetLabel'), value: errors.filter(e => e.has_learning_sheet).length, color: 'text-cyan-400' },
          { label: t('learningSheets.withoutSheetLabel'), value: errors.filter(e => !e.has_learning_sheet).length, color: 'text-yellow-400' },
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
          <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('learningSheets.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((err, idx) => (
            <motion.div key={err.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
              onClick={() => navigate(`/tutoria/internal-errors/${err.id}`)}
              className={`group p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-lg ${isDark ? 'bg-white/[0.02] border-white/5 hover:border-white/10' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>#{err.id}</span>
                    {err.has_learning_sheet ? (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                        <Check className="w-3 h-3 inline mr-1" />{t('learningSheets.sheetCreated')}
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${isDark ? 'bg-yellow-500/15 text-yellow-400' : 'bg-yellow-50 text-yellow-600'}`}>
                        {t('learningSheets.noSheet')}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-medium line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{err.description}</p>
                  <div className={`flex items-center gap-3 mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{err.gravador_name || 'N/A'}</span>
                    {err.date_occurrence && <span><Calendar className="w-3 h-3 inline mr-1" />{new Date(err.date_occurrence).toLocaleDateString('pt-PT')}</span>}
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
