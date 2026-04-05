import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, Save, Trash2, Edit3, Loader2, X,
  ShieldAlert, ChevronRight, User, Scale, FileText,
  AlertTriangle,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

interface Senso {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: string;
  creator_name?: string;
  error_count: number;
  created_at: string;
}

interface SensoError {
  id: number;
  gravador_name?: string;
  liberador_name?: string;
  description: string;
  reference_code?: string;
  date_occurrence?: string;
  impact_name?: string;
  category_name?: string;
  error_type_name?: string;
  bank_name?: string;
  status: string;
  peso_liberador?: number;
  peso_gravador?: number;
  peso_tutor?: number;
  has_learning_sheet: boolean;
  has_action_plan: boolean;
  classifications?: { id: number; classification: string; description?: string }[];
}

const STATUS_CLS: Record<string, Record<string, string>> = {
  dark: { ATIVO: 'bg-green-500/15 text-green-400 border-green-500/20', FECHADO: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
  light: { ATIVO: 'bg-green-50 text-green-700 border-green-200', FECHADO: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export default function SensoManagement() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [sensos, setSensos] = useState<Senso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Senso | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sensoErrors, setSensoErrors] = useState<SensoError[]>([]);
  const [loadingErrors, setLoadingErrors] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isTutorOrAdmin = user?.role === 'ADMIN' || user?.is_tutor;

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/internal-errors/sensos');
      setSensos(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setShowForm(true);
  };

  const openEdit = (s: Senso) => {
    setEditing(s);
    setName(s.name);
    setDescription(s.description || '');
    setStartDate(s.start_date);
    setEndDate(s.end_date);
    setShowForm(true);
  };

  const save = async () => {
    if (!name.trim() || !startDate || !endDate) return;
    setSaving(true);
    try {
      if (editing) {
        await axios.patch(`/internal-errors/sensos/${editing.id}`, { name, description, start_date: startDate, end_date: endDate });
      } else {
        await axios.post('/internal-errors/sensos', { name, description, start_date: startDate, end_date: endDate });
      }
      setShowForm(false);
      await load();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const toggleStatus = async (s: Senso) => {
    try {
      await axios.patch(`/internal-errors/sensos/${s.id}`, { status: s.status === 'ATIVO' ? 'FECHADO' : 'ATIVO' });
      await load();
    } catch { /* ignore */ }
  };

  const remove = async (s: Senso) => {
    if (!confirm(t('sensoManagement.deleteConfirm'))) return;
    try {
      await axios.delete(`/internal-errors/sensos/${s.id}`);
      if (expandedId === s.id) setExpandedId(null);
      await load();
    } catch { /* ignore */ }
  };

  const toggleExpand = async (s: Senso) => {
    if (expandedId === s.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(s.id);
    setLoadingErrors(true);
    try {
      const { data } = await axios.get('/internal-errors/errors', { params: { senso_id: s.id } });
      setSensoErrors(Array.isArray(data) ? data : []);
    } catch { setSensoErrors([]); }
    setLoadingErrors(false);
  };

  const errStatusCls = (st: string) => {
    const dark: Record<string, string> = { PENDENTE: 'bg-yellow-500/15 text-yellow-400', AVALIADO: 'bg-blue-500/15 text-blue-400', PLANO_CRIADO: 'bg-purple-500/15 text-purple-400', CONCLUIDO: 'bg-green-500/15 text-green-400' };
    const light: Record<string, string> = { PENDENTE: 'bg-yellow-50 text-yellow-700', AVALIADO: 'bg-blue-50 text-blue-700', PLANO_CRIADO: 'bg-purple-50 text-purple-700', CONCLUIDO: 'bg-green-50 text-green-700' };
    return (isDark ? dark : light)[st] || (isDark ? 'bg-gray-500/15 text-gray-400' : 'bg-gray-100 text-gray-600');
  };
  const errStatusLabel: Record<string, string> = { PENDENTE: t('sensoManagement.statusPendente'), AVALIADO: t('sensoManagement.statusAvaliado'), PLANO_CRIADO: t('sensoManagement.statusPlanoCriado'), CONCLUIDO: t('sensoManagement.statusConcluido') };

  const classLabelMap: Record<string, string> = { METHODOLOGY: t('sensoManagement.methodology'), KNOWLEDGE: t('sensoManagement.knowledge'), DETAIL: t('sensoManagement.detail'), PROCEDURE: t('sensoManagement.procedure') };
  const classColorMap = (cls: string) => {
    const map: Record<string, string> = {
      METHODOLOGY: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600',
      KNOWLEDGE: isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600',
      DETAIL: isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600',
      PROCEDURE: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
    };
    return map[cls] || (isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600');
  };

  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-red-500'}`;
  const labelCls = `block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Calendar className="w-7 h-7 inline mr-2 text-red-500" />
            {t('sensoManagement.title')}
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('sensoManagement.subtitle')}
          </p>
        </div>
        {isTutorOrAdmin && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm hover:shadow-lg hover:shadow-red-600/20 transition-all">
            <Plus className="w-4 h-4" /> {t('sensoManagement.newSenso')}
          </button>
        )}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{editing ? t('sensoManagement.editSenso') : t('sensoManagement.newSenso')}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>{t('sensoManagement.name')}</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Censo Janeiro 2025" className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>{t('sensoManagement.description')}</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder={t('sensoManagement.descPlaceholder')} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>{t('sensoManagement.startDate')}</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('sensoManagement.endDate')}</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)}
                className={`px-5 py-2 rounded-xl border text-sm ${isDark ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
                {t('sensoManagement.cancel')}
              </button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t('sensoManagement.save')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
      ) : sensos.length === 0 ? (
        <div className={`text-center py-20 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200'}`}>
          <Calendar className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('sensoManagement.noSensos')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sensos.map((s, idx) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
              className={`rounded-2xl border transition-all ${isDark ? 'bg-white/[0.02] border-white/5 hover:border-white/10' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
              <div className="p-5 cursor-pointer" onClick={() => toggleExpand(s)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <ChevronRight className={`w-4 h-4 transition-transform ${expandedId === s.id ? 'rotate-90' : ''} ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${(isDark ? STATUS_CLS.dark : STATUS_CLS.light)[s.status] || ''}`}>
                        {s.status}
                      </span>
                    </div>
                    {s.description && <p className={`text-sm mb-2 ml-7 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.description}</p>}
                    <div className={`flex flex-wrap items-center gap-4 text-xs ml-7 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(s.start_date).toLocaleDateString('pt-PT')} — {new Date(s.end_date).toLocaleDateString('pt-PT')}
                      </span>
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> {s.error_count} {t('sensoManagement.errorsCount', { count: s.error_count })}
                      </span>
                      {s.creator_name && <span>{t('sensoManagement.createdBy')} {s.creator_name}</span>}
                    </div>
                  </div>
                  {isTutorOrAdmin && (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleStatus(s)} title={s.status === 'ATIVO' ? t('sensoManagement.close') : t('sensoManagement.reopen')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${s.status === 'ATIVO' ? (isDark ? 'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100') : (isDark ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25' : 'bg-green-50 text-green-700 hover:bg-green-100')}`}>
                        {s.status === 'ATIVO' ? t('sensoManagement.close') : t('sensoManagement.reopen')}
                      </button>
                      <button onClick={() => openEdit(s)}
                        className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(s)}
                        className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded detail + errors */}
              <AnimatePresence>
                {expandedId === s.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className={`mx-5 mb-5 p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                      {/* Censo details */}
                      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div>
                          <span className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('sensoManagement.period')}</span>
                          {new Date(s.start_date).toLocaleDateString('pt-PT')} — {new Date(s.end_date).toLocaleDateString('pt-PT')}
                        </div>
                        <div>
                          <span className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('sensoManagement.state')}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${(isDark ? STATUS_CLS.dark : STATUS_CLS.light)[s.status] || ''}`}>{s.status}</span>
                        </div>
                        <div>
                          <span className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('sensoManagement.registeredErrors')}</span>
                          {s.error_count}
                        </div>
                        <div>
                          <span className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('sensoManagement.createdBy')}</span>
                          {s.creator_name || '—'}
                        </div>
                      </div>
                      {s.description && (
                        <div className={`mb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <span className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('sensoManagement.description')}</span>
                          {s.description}
                        </div>
                      )}

                      {/* Errors list */}
                      <div>
                        <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <ShieldAlert className="w-4 h-4 text-red-500" /> {t('sensoManagement.errorsOfSenso')}
                        </h4>
                        {loadingErrors ? (
                          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>
                        ) : sensoErrors.length === 0 ? (
                          <p className={`text-sm text-center py-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('sensoManagement.noErrorsInSenso')}</p>
                        ) : (
                          <div className="space-y-2">
                            {sensoErrors.map(err => (
                              <div key={err.id}
                                onClick={() => navigate(`/tutoria/internal-errors/${err.id}`)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${isDark ? 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${errStatusCls(err.status)}`}>
                                        {errStatusLabel[err.status] || err.status}
                                      </span>
                                      {err.reference_code && (
                                        <span className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>#{err.reference_code}</span>
                                      )}
                                      {err.classifications && err.classifications.map(c => (
                                        <span key={c.id} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${classColorMap(c.classification)}`}>
                                          {classLabelMap[c.classification] || c.classification}
                                        </span>
                                      ))}
                                    </div>
                                    <p className={`text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{err.description}</p>
                                    <div className={`flex flex-wrap items-center gap-3 mt-1.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                      {err.gravador_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{err.gravador_name}</span>}
                                      {err.date_occurrence && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(err.date_occurrence).toLocaleDateString('pt-PT')}</span>}
                                      {err.impact_name && <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{err.impact_name}</span>}
                                      {err.bank_name && <span>{err.bank_name}</span>}
                                      {err.has_action_plan && <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-purple-400" />{t('sensoManagement.plan')}</span>}
                                      {err.has_learning_sheet && <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-blue-400" />{t('sensoManagement.sheet')}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    {(err.peso_liberador || err.peso_gravador || err.peso_tutor) && (
                                      <div className="flex items-center gap-1">
                                        <Scale className={`w-3 h-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                        <span className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                          {[err.peso_liberador, err.peso_gravador, err.peso_tutor].filter(Boolean).join('/')}
                                        </span>
                                      </div>
                                    )}
                                    <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
