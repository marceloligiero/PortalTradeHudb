import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Loader2, User, Calendar, Check, Search,
  CheckCircle, XCircle, Clock, Plus, X,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useTheme } from '../../contexts/ThemeContext';

interface Sheet {
  id: number;
  error_id: number;
  user_id: number;
  user_name?: string;
  title?: string;
  error_summary?: string;
  root_cause?: string;
  correct_procedure?: string;
  key_learnings?: string;
  reference_material?: string;
  acknowledgment_note?: string;
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

const STATUS_COLORS: Record<string, { dark: string; light: string; icon: any }> = {
  PENDING:   { dark: 'bg-yellow-500/15 text-yellow-400', light: 'bg-yellow-50 text-yellow-600', icon: Clock },
  PENDENTE:  { dark: 'bg-yellow-500/15 text-yellow-400', light: 'bg-yellow-50 text-yellow-600', icon: Clock },
  SUBMITTED: { dark: 'bg-blue-500/15 text-blue-400', light: 'bg-blue-50 text-blue-600', icon: FileText },
  REVIEWED:  { dark: 'bg-green-500/15 text-green-400', light: 'bg-green-50 text-green-600', icon: CheckCircle },
};

export default function LearningSheets() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Sheet | null>(null);
  const [reviewOutcome, setReviewOutcome] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ error_id: '', tutorado_id: '', title: '', error_summary: '', root_cause: '', correct_procedure: '', key_learnings: '', reference_material: '', is_mandatory: false });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/tutoria/learning-sheets');
      setSheets(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!createForm.title.trim() || !createForm.error_summary.trim()) return;
    setCreating(true);
    try {
      await axios.post('/tutoria/learning-sheets', {
        error_id: Number(createForm.error_id),
        tutorado_id: createForm.tutorado_id ? Number(createForm.tutorado_id) : undefined,
        title: createForm.title,
        error_summary: createForm.error_summary,
        root_cause: createForm.root_cause || undefined,
        correct_procedure: createForm.correct_procedure || undefined,
        key_learnings: createForm.key_learnings || undefined,
        reference_material: createForm.reference_material || undefined,
        is_mandatory: createForm.is_mandatory,
      });
      setShowCreate(false);
      setCreateForm({ error_id: '', tutorado_id: '', title: '', error_summary: '', root_cause: '', correct_procedure: '', key_learnings: '', reference_material: '', is_mandatory: false });
      await load();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleReview = async () => {
    if (!selected || !reviewOutcome) return;
    setSaving(true);
    try {
      await axios.patch(`/tutoria/learning-sheets/${selected.id}/review`, {
        tutor_outcome: reviewOutcome,
        tutor_notes: reviewNotes,
      });
      setSelected(null);
      setReviewOutcome('');
      setReviewNotes('');
      await load();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const filtered = sheets.filter(s => {
    if (filter === 'PENDENTE' && !isPending(s)) return false;
    else if (filter !== 'all' && filter !== 'PENDENTE' && s.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.user_name?.toLowerCase().includes(q) || String(s.error_id).includes(q);
  });

  const isPending = (s: Sheet) => s.status === 'PENDING' || s.status === 'PENDENTE';
  const counts = { total: sheets.length, pending: sheets.filter(isPending).length, submitted: sheets.filter(s => s.status === 'SUBMITTED').length, reviewed: sheets.filter(s => s.status === 'REVIEWED').length };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <FileText className="w-7 h-7 inline mr-2 text-cyan-500" />
              {t('learningSheets.title')}
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('learningSheets.subtitle')}
            </p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-bold transition-colors">
            <Plus className="w-4 h-4" /> {t('learningSheets.create', 'Criar Ficha')}
          </button>
        </div>
      </div>

      <div className={`flex flex-wrap gap-3 p-4 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200'}`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('learningSheets.searchPlaceholder')}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className={`px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
          <option value="all">{t('learningSheets.allSheets', 'Todas')}</option>
          <option value="PENDENTE">{t('learningSheets.pending', 'Pendentes')}</option>
          <option value="SUBMITTED">{t('learningSheets.submitted', 'Submetidas')}</option>
          <option value="REVIEWED">{t('learningSheets.reviewed', 'Revistas')}</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t('learningSheets.totalSheets', 'Total'), value: counts.total, color: 'text-white' },
          { label: t('learningSheets.pendingLabel', 'Pendentes'), value: counts.pending, color: 'text-yellow-400' },
          { label: t('learningSheets.submittedLabel', 'Submetidas'), value: counts.submitted, color: 'text-blue-400' },
          { label: t('learningSheets.reviewedLabel', 'Revistas'), value: counts.reviewed, color: 'text-green-400' },
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
          {filtered.map((sheet, idx) => {
            const scfg = STATUS_COLORS[sheet.status] || STATUS_COLORS.PENDING;
            const Icon = scfg.icon;
            return (
              <motion.div key={sheet.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                onClick={() => { setSelected(sheet); setReviewOutcome(sheet.tutor_outcome || ''); setReviewNotes(sheet.tutor_notes || ''); }}
                className={`group p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-lg ${isDark ? 'bg-white/[0.02] border-white/5 hover:border-white/10' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>#{sheet.id}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${isDark ? scfg.dark : scfg.light}`}>
                        <Icon className="w-3 h-3" /> {sheet.status}
                      </span>
                      {sheet.is_mandatory && (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'}`}>
                          {t('learningSheets.mandatory', 'Obrigatória')}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {t('learningSheets.sheetFor', 'Ficha para')} {sheet.user_name || `User #${sheet.user_id}`}
                    </p>
                    <div className={`flex items-center gap-3 mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{t('learningSheets.error', 'Incidência')} #{sheet.error_id}</span>
                      <span><Calendar className="w-3 h-3 inline mr-1" />{new Date(sheet.created_at).toLocaleDateString('pt-PT')}</span>
                      {sheet.submitted_at && <span className="text-blue-400"><Check className="w-3 h-3 inline mr-1" />{t('learningSheets.submittedAt', 'Submetida')} {new Date(sheet.submitted_at).toLocaleDateString('pt-PT')}</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-lg max-h-[80vh] overflow-auto rounded-2xl border p-6 space-y-4 ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-gray-200'}`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <FileText className="w-5 h-5 inline mr-2 text-cyan-500" /> {t('learningSheets.reviewTitle', 'Revisão da Ficha')}
              </h2>

              <div className="space-y-3">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.participant', 'Participante')}</p>
                  <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selected.user_name || `User #${selected.user_id}`}</p>
                </div>
                {selected.title && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.sheetTitleLabel', 'Título')}</p>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selected.title}</p>
                  </div>
                )}
                {selected.error_summary && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.errorSummary', 'Resumo do Erro')}</p>
                    <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selected.error_summary}</p>
                  </div>
                )}
                {selected.root_cause && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.rootCause', 'Causa Raiz')}</p>
                    <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selected.root_cause}</p>
                  </div>
                )}
                {selected.correct_procedure && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.correctProcedure', 'Procedimento Correto')}</p>
                    <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selected.correct_procedure}</p>
                  </div>
                )}
                {selected.key_learnings && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.keyLearnings', 'Aprendizagens Chave')}</p>
                    <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selected.key_learnings}</p>
                  </div>
                )}
                {selected.reflection && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.reflection', 'Reflexão do Participante')}</p>
                    <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selected.reflection}</p>
                  </div>
                )}
              </div>

              {selected.status === 'SUBMITTED' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.outcome', 'Resultado')}</label>
                    <select value={reviewOutcome} onChange={e => setReviewOutcome(e.target.value)}
                      className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                      <option value="">{t('learningSheets.selectOutcome', '— Selecionar —')}</option>
                      <option value="APROVADO">{t('learningSheets.approved', 'Aprovado')}</option>
                      <option value="NECESSITA_MELHORIA">{t('learningSheets.needsImprovement', 'Necessita Melhoria')}</option>
                      <option value="REPROVADO">{t('learningSheets.rejected', 'Reprovado')}</option>
                    </select>
                  </div>
                  <div>
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.tutorNotes', 'Notas do Tutor')}</label>
                    <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={3}
                      className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm resize-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                      placeholder={t('learningSheets.notesPlaceholder', 'Observações...')} />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setSelected(null)} className={`px-4 py-2 rounded-xl text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('common.cancel', 'Cancelar')}
                    </button>
                    <button onClick={handleReview} disabled={!reviewOutcome || saving}
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-sm font-bold disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('learningSheets.submitReview', 'Submeter Revisão')}
                    </button>
                  </div>
                </div>
              )}

              {selected.status === 'REVIEWED' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.outcome', 'Resultado')}</p>
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selected.tutor_outcome}</p>
                  </div>
                  {selected.tutor_notes && (
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.tutorNotes', 'Notas do Tutor')}</p>
                      <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selected.tutor_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {(selected.status === 'PENDING' || selected.status === 'PENDENTE') && (
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {t('learningSheets.awaitingReflection', 'Aguardando reflexão do participante.')}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <button onClick={() => setSelected(null)} className={`px-4 py-2 rounded-xl text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('common.close', 'Fechar')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Sheet Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-lg max-h-[80vh] overflow-auto rounded-2xl border p-6 space-y-4 ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Plus className="w-5 h-5 inline mr-2 text-cyan-500" /> {t('learningSheets.createTitle', 'Criar Ficha de Aprendizagem')}
                </h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.errorId', 'ID Incidência')} *</label>
                    <input type="number" value={createForm.error_id} onChange={e => setCreateForm({...createForm, error_id: e.target.value})}
                      className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                      placeholder="Ex: 1" />
                  </div>
                  <div>
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.tutoradoId', 'ID Tutorado')}</label>
                    <input type="number" value={createForm.tutorado_id} onChange={e => setCreateForm({...createForm, tutorado_id: e.target.value})}
                      className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                      placeholder="Ex: 5" />
                  </div>
                </div>

                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.sheetTitleLabel', 'Título')} *</label>
                  <input value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})}
                    className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                    placeholder={t('learningSheets.titlePlaceholder', 'Ex: Erro de cotação no produto X')} />
                </div>

                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.errorSummary', 'Resumo do Erro')} *</label>
                  <textarea value={createForm.error_summary} onChange={e => setCreateForm({...createForm, error_summary: e.target.value})} rows={2}
                    className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm resize-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                    placeholder={t('learningSheets.errorSummaryPlaceholder', 'Descreva o erro que ocorreu...')} />
                </div>

                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.rootCause', 'Causa Raiz')}</label>
                  <textarea value={createForm.root_cause} onChange={e => setCreateForm({...createForm, root_cause: e.target.value})} rows={2}
                    className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm resize-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                    placeholder={t('learningSheets.rootCausePlaceholder', 'Qual foi a causa raiz do erro?')} />
                </div>

                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.correctProcedure', 'Procedimento Correto')}</label>
                  <textarea value={createForm.correct_procedure} onChange={e => setCreateForm({...createForm, correct_procedure: e.target.value})} rows={2}
                    className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm resize-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                    placeholder={t('learningSheets.correctProcedurePlaceholder', 'Qual é o procedimento correto?')} />
                </div>

                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.keyLearnings', 'Aprendizagens Chave')}</label>
                  <textarea value={createForm.key_learnings} onChange={e => setCreateForm({...createForm, key_learnings: e.target.value})} rows={2}
                    className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm resize-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                    placeholder={t('learningSheets.keyLearningsPlaceholder', 'O que deve ser aprendido?')} />
                </div>

                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('learningSheets.referenceMaterial', 'Material de Referência')}</label>
                  <input value={createForm.reference_material} onChange={e => setCreateForm({...createForm, reference_material: e.target.value})}
                    className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                    placeholder={t('learningSheets.referencePlaceholder', 'Link ou descrição do material')} />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={createForm.is_mandatory} onChange={e => setCreateForm({...createForm, is_mandatory: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('learningSheets.mandatoryCheck', 'Ficha obrigatória')}</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className={`px-4 py-2 rounded-xl text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('common.cancel', 'Cancelar')}
                </button>
                <button onClick={handleCreate} disabled={!createForm.error_id || !createForm.title.trim() || !createForm.error_summary.trim() || creating}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-sm font-bold disabled:opacity-50">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : t('learningSheets.createBtn', 'Criar Ficha')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
