import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShieldAlert, Scale, User, Calendar, Building2,
  FileText, ClipboardList, HelpCircle, Save, Plus, Check,
  Loader2, ChevronDown, ChevronUp, AlertTriangle, BookOpen,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

interface ErrorDetail {
  id: number;
  senso_id: number;
  gravador_id: number;
  gravador_name?: string;
  liberador_id: number;
  liberador_name?: string;
  creator_name?: string;
  impact_id?: number;
  impact_name?: string;
  impact_level?: string;
  category_name?: string;
  error_type_name?: string;
  department_name?: string;
  activity_name?: string;
  bank_name?: string;
  classifications?: { id: number; classification: string; description?: string }[];
  description: string;
  reference_code?: string;
  date_occurrence?: string;
  peso_liberador?: number;
  peso_gravador?: number;
  peso_tutor?: number;
  why_1?: string;
  why_2?: string;
  why_3?: string;
  why_4?: string;
  why_5?: string;
  tutor_evaluation?: string;
  status: string;
  created_at: string;
  action_plan?: {
    id: number;
    description?: string;
    status: string;
    items: { id: number; description: string; type: string; responsible_name?: string; due_date?: string; status: string; }[];
  };
  learning_sheet?: {
    id: number;
    error_summary: string;
    impact_description?: string;
    actions_taken?: string;
    error_weight?: number;
    tutor_evaluation?: string;
    lessons_learned?: string;
    recommendations?: string;
    is_read: boolean;
    created_at: string;
  };
}

export default function InternalErrorDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { isDark } = useTheme();

  const STATUS_LABELS: Record<string, string> = {
    PENDENTE: t('internalErrorDetail.statusPendente'), AVALIADO: t('internalErrorDetail.statusAvaliado'), PLANO_CRIADO: t('internalErrorDetail.statusPlanoCriado'), CONCLUIDO: t('internalErrorDetail.statusConcluido'),
  };
  const navigate = useNavigate();

  const [error, setError] = useState<ErrorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // 5 Whys state
  const [whys, setWhys] = useState({ why_1: '', why_2: '', why_3: '', why_4: '', why_5: '' });
  const [pesoGravador, setPesoGravador] = useState('');
  const [savingWhys, setSavingWhys] = useState(false);
  const [showWhys, setShowWhys] = useState(true);

  // Tutor evaluation
  const [tutorEval, setTutorEval] = useState('');
  const [pesoTutor, setPesoTutor] = useState('');
  const [savingTutor, setSavingTutor] = useState(false);

  // Action plan
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planDesc, setPlanDesc] = useState('');
  const [planItems, setPlanItems] = useState<{ description: string; type: string }[]>([]);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemType, setNewItemType] = useState('CORRETIVA');
  const [savingPlan, setSavingPlan] = useState(false);

  // Learning sheet
  const [showSheetForm, setShowSheetForm] = useState(false);
  const [sheetData, setSheetData] = useState({
    error_summary: '', impact_description: '', actions_taken: '',
    error_weight: '', tutor_evaluation: '', lessons_learned: '', recommendations: '',
  });
  const [savingSheet, setSavingSheet] = useState(false);

  const isTutorOrAdmin = user?.role === 'ADMIN' || user?.is_tutor;
  const isGravador = user?.id === error?.gravador_id;

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/internal-errors/errors/${id}`);
      setError(data);
      setWhys({
        why_1: data.why_1 || '', why_2: data.why_2 || '', why_3: data.why_3 || '',
        why_4: data.why_4 || '', why_5: data.why_5 || '',
      });
      setPesoGravador(data.peso_gravador?.toString() || '');
      setTutorEval(data.tutor_evaluation || '');
      setPesoTutor(data.peso_tutor?.toString() || '');
    } catch { navigate('/tutoria/internal-errors'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const saveWhys = async () => {
    setSavingWhys(true);
    try {
      await axios.patch(`/internal-errors/errors/${id}`, {
        ...whys,
        peso_gravador: pesoGravador ? Number(pesoGravador) : undefined,
      });
      await load();
    } catch { /* ignore */ }
    setSavingWhys(false);
  };

  const saveTutorEvaluation = async () => {
    setSavingTutor(true);
    try {
      await axios.patch(`/internal-errors/errors/${id}`, {
        tutor_evaluation: tutorEval,
        peso_tutor: pesoTutor ? Number(pesoTutor) : undefined,
        status: 'AVALIADO',
      });
      await load();
    } catch { /* ignore */ }
    setSavingTutor(false);
  };

  const addPlanItem = () => {
    if (!newItemDesc.trim()) return;
    setPlanItems([...planItems, { description: newItemDesc, type: newItemType }]);
    setNewItemDesc('');
    setNewItemType('CORRETIVA');
  };

  const saveActionPlan = async () => {
    setSavingPlan(true);
    try {
      await axios.post(`/internal-errors/errors/${id}/action-plan`, {
        description: planDesc,
        items: planItems,
      });
      setShowPlanForm(false);
      await load();
    } catch { /* ignore */ }
    setSavingPlan(false);
  };

  const saveLearningSheet = async () => {
    setSavingSheet(true);
    try {
      await axios.post(`/internal-errors/errors/${id}/learning-sheet`, {
        ...sheetData,
        error_weight: sheetData.error_weight ? Number(sheetData.error_weight) : undefined,
      });
      setShowSheetForm(false);
      await load();
    } catch { /* ignore */ }
    setSavingSheet(false);
  };

  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-red-500'}`;
  const labelCls = `block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;
  const sectionCls = `p-6 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200'}`;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;
  if (!error) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/tutoria/internal-errors')}
          className={`p-2 rounded-xl border transition-all ${isDark ? 'border-white/10 hover:bg-white/5 text-gray-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <ShieldAlert className="w-6 h-6 inline mr-2 text-red-500" />
            {t('internalErrorDetail.title', { id: error.id })}
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {STATUS_LABELS[error.status] || error.status}
          </p>
        </div>
      </div>

      {/* Error Info */}
      <div className={sectionCls}>
        <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('internalErrorDetail.errorInfo')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <InfoItem isDark={isDark} icon={<User className="w-4 h-4" />} label={t('internalErrorDetail.gravador')} value={error.gravador_name} />
          <InfoItem isDark={isDark} icon={<User className="w-4 h-4" />} label={t('internalErrorDetail.liberador')} value={error.liberador_name} />
          <InfoItem isDark={isDark} icon={<Calendar className="w-4 h-4" />} label={t('internalErrorDetail.date')} value={error.date_occurrence ? new Date(error.date_occurrence).toLocaleDateString('pt-PT') : '-'} />
          {error.bank_name && <InfoItem isDark={isDark} icon={<Building2 className="w-4 h-4" />} label={t('internalErrorDetail.bank')} value={error.bank_name} />}
          {error.category_name && <InfoItem isDark={isDark} label={t('internalErrorDetail.category')} value={error.category_name} />}
          {error.error_type_name && <InfoItem isDark={isDark} label={t('internalErrorDetail.errorType')} value={error.error_type_name} />}
          {error.department_name && <InfoItem isDark={isDark} label={t('internalErrorDetail.department')} value={error.department_name} />}
          {error.activity_name && <InfoItem isDark={isDark} label={t('internalErrorDetail.activity')} value={error.activity_name} />}
          {error.impact_name && <InfoItem isDark={isDark} icon={<AlertTriangle className="w-4 h-4" />} label={t('internalErrorDetail.impact')} value={`${error.impact_name} (${error.impact_level || ''})`} />}
          {error.reference_code && <InfoItem isDark={isDark} label={t('internalErrorDetail.reference')} value={error.reference_code} />}
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{error.description}</p>
        </div>

        {/* Classificações */}
        {error.classifications && error.classifications.length > 0 && (
          <div className="mt-4">
            <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <AlertTriangle className="w-4 h-4 inline mr-1.5 text-amber-500" />{t('internalErrorDetail.classifications')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {error.classifications.map(c => {
                const labelMap: Record<string,string> = { METHODOLOGY: t('internalErrorDetail.methodology'), KNOWLEDGE: t('internalErrorDetail.knowledge'), DETAIL: t('internalErrorDetail.detail'), PROCEDURE: t('internalErrorDetail.procedure') };
                const colorMap: Record<string,string> = {
                  METHODOLOGY: isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-200',
                  KNOWLEDGE: isDark ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-600 border-purple-200',
                  DETAIL: isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-200',
                  PROCEDURE: isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
                };
                return (
                  <div key={c.id} className={`px-3 py-2 rounded-lg border text-sm ${colorMap[c.classification] || (isDark ? 'bg-white/5 text-gray-300 border-white/10' : 'bg-gray-50 text-gray-700 border-gray-200')}`}>
                    <span className="font-semibold">{labelMap[c.classification] || c.classification}</span>
                    {c.description && <p className="text-xs mt-1 opacity-80">{c.description}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weights comparison */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <WeightCard isDark={isDark} label={t('internalErrorDetail.weightLiberador')} value={error.peso_liberador} color="text-blue-400" />
          <WeightCard isDark={isDark} label={t('internalErrorDetail.weightGravador')} value={error.peso_gravador} color="text-orange-400" />
          <WeightCard isDark={isDark} label={t('internalErrorDetail.weightTutor')} value={error.peso_tutor} color="text-emerald-400" />
        </div>
      </div>

      {/* 5 Whys Section */}
      <div className={sectionCls}>
        <button onClick={() => setShowWhys(!showWhys)} className="flex items-center justify-between w-full">
          <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <HelpCircle className="w-5 h-5 text-yellow-500" /> {t('internalErrorDetail.fiveWhys')}
          </h2>
          {showWhys ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        <AnimatePresence>
          {showWhys && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="pt-4 space-y-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n}>
                    <label className={labelCls}>{t('internalErrorDetail.whyN', { n })}</label>
                    <textarea
                      value={whys[`why_${n}` as keyof typeof whys]}
                      onChange={e => setWhys({ ...whys, [`why_${n}`]: e.target.value })}
                      rows={2}
                      disabled={!isGravador && !isTutorOrAdmin}
                      placeholder={t('internalErrorDetail.whyPlaceholder', { n })}
                      className={`${inputCls} resize-none disabled:opacity-50`}
                    />
                  </div>
                ))}
                {isGravador && (
                  <div className="max-w-xs">
                    <label className={labelCls}><Scale className="w-3 h-3 inline mr-1" />{t('internalErrorDetail.myWeightGravador')}</label>
                    <input type="number" min="1" max="10" value={pesoGravador} onChange={e => setPesoGravador(e.target.value)}
                      placeholder="1-10" className={inputCls} />
                  </div>
                )}
                {(isGravador || isTutorOrAdmin) && (
                  <div className="flex justify-end">
                    <button onClick={saveWhys} disabled={savingWhys}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-yellow-600 text-white text-sm font-semibold hover:bg-yellow-700 transition-all disabled:opacity-50">
                      {savingWhys ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {t('internalErrorDetail.saveFiveWhys')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tutor Evaluation */}
      {isTutorOrAdmin && (
        <div className={sectionCls}>
          <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <BookOpen className="w-5 h-5 text-emerald-500" /> {t('internalErrorDetail.tutorEvaluation')}
          </h2>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>{t('internalErrorDetail.evaluation')}</label>
              <textarea value={tutorEval} onChange={e => setTutorEval(e.target.value)} rows={3}
                placeholder={t('internalErrorDetail.evalPlaceholder')} className={`${inputCls} resize-none`} />
            </div>
            <div className="max-w-xs">
              <label className={labelCls}><Scale className="w-3 h-3 inline mr-1" />{t('internalErrorDetail.weightTutorLabel')}</label>
              <input type="number" min="1" max="10" value={pesoTutor} onChange={e => setPesoTutor(e.target.value)}
                placeholder="1-10" className={inputCls} />
            </div>
            <div className="flex justify-end">
              <button onClick={saveTutorEvaluation} disabled={savingTutor}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50">
                {savingTutor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t('internalErrorDetail.saveEvaluation')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Plan */}
      <div className={sectionCls}>
        <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <ClipboardList className="w-5 h-5 text-purple-500" /> {t('internalErrorDetail.actionPlan')}
        </h2>
        {error.action_plan ? (
          <div className="space-y-3">
            {error.action_plan.description && (
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{error.action_plan.description}</p>
            )}
            <div className="space-y-2">
              {error.action_plan.items.map(item => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className={`w-2 h-2 rounded-full ${item.status === 'CONCLUIDO' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.description}</p>
                    <div className={`flex gap-3 text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      <span className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>{item.type}</span>
                      {item.responsible_name && <span>{item.responsible_name}</span>}
                      {item.due_date && <span>{new Date(item.due_date).toLocaleDateString('pt-PT')}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isTutorOrAdmin ? (
          !showPlanForm ? (
            <button onClick={() => setShowPlanForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-all">
              <Plus className="w-4 h-4" /> {t('internalErrorDetail.createActionPlan')}
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>{t('internalErrorDetail.planDescription')}</label>
                <textarea value={planDesc} onChange={e => setPlanDesc(e.target.value)} rows={2}
                  placeholder={t('internalErrorDetail.planDescPlaceholder')} className={`${inputCls} resize-none`} />
              </div>
              {/* Items */}
              {planItems.length > 0 && (
                <div className="space-y-2">
                  {planItems.map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <Check className="w-4 h-4 text-purple-400" />
                      <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.description}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>{item.type}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder={t('internalErrorDetail.actionDescPlaceholder')}
                  className={`flex-1 ${inputCls}`} />
                <select value={newItemType} onChange={e => setNewItemType(e.target.value)} className={`w-36 ${inputCls}`}>
                  <option value="CORRETIVA">{t('internalErrorDetail.corrective')}</option>
                  <option value="PREVENTIVA">{t('internalErrorDetail.preventive')}</option>
                </select>
                <button onClick={addPlanItem} className="px-3 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowPlanForm(false)}
                  className={`px-5 py-2 rounded-xl border text-sm ${isDark ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
                  {t('internalErrorDetail.cancel')}
                </button>
                <button onClick={saveActionPlan} disabled={savingPlan || planItems.length === 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
                  {savingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t('internalErrorDetail.savePlan')}
                </button>
              </div>
            </div>
          )
        ) : (
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('internalErrorDetail.noPlan')}</p>
        )}
      </div>

      {/* Learning Sheet */}
      <div className={sectionCls}>
        <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FileText className="w-5 h-5 text-cyan-500" /> {t('internalErrorDetail.learningSheet')}
        </h2>
        {error.learning_sheet ? (
          <div className="space-y-3">
            <InfoRow isDark={isDark} label={t('internalErrorDetail.errorSummary')} value={error.learning_sheet.error_summary} />
            {error.learning_sheet.impact_description && <InfoRow isDark={isDark} label={t('internalErrorDetail.impact')} value={error.learning_sheet.impact_description} />}
            {error.learning_sheet.actions_taken && <InfoRow isDark={isDark} label={t('internalErrorDetail.actionsTaken')} value={error.learning_sheet.actions_taken} />}
            {error.learning_sheet.error_weight && <InfoRow isDark={isDark} label={t('internalErrorDetail.errorWeight')} value={String(error.learning_sheet.error_weight)} />}
            {error.learning_sheet.tutor_evaluation && <InfoRow isDark={isDark} label={t('internalErrorDetail.tutorEvaluation')} value={error.learning_sheet.tutor_evaluation} />}
            {error.learning_sheet.lessons_learned && <InfoRow isDark={isDark} label={t('internalErrorDetail.lessonsLearned')} value={error.learning_sheet.lessons_learned} />}
            {error.learning_sheet.recommendations && <InfoRow isDark={isDark} label={t('internalErrorDetail.recommendations')} value={error.learning_sheet.recommendations} />}
            <div className={`flex items-center gap-2 text-xs ${error.learning_sheet.is_read ? 'text-green-400' : 'text-yellow-400'}`}>
              <Check className="w-3 h-3" /> {error.learning_sheet.is_read ? t('internalErrorDetail.readByTutorado') : t('internalErrorDetail.notReadYet')}
            </div>
          </div>
        ) : isTutorOrAdmin ? (
          !showSheetForm ? (
            <button onClick={() => {
              setSheetData({
                error_summary: error.description,
                impact_description: error.impact_name || '',
                actions_taken: '',
                error_weight: error.peso_tutor?.toString() || error.peso_liberador?.toString() || '',
                tutor_evaluation: tutorEval || error.tutor_evaluation || '',
                lessons_learned: '',
                recommendations: '',
              });
              setShowSheetForm(true);
            }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 transition-all">
              <Plus className="w-4 h-4" /> {t('internalErrorDetail.createSheet')}
            </button>
          ) : (
            <div className="space-y-4">
              {(['error_summary', 'impact_description', 'actions_taken', 'tutor_evaluation', 'lessons_learned', 'recommendations'] as const).map(field => (
                <div key={field}>
                  <label className={labelCls}>{({
                    error_summary: t('internalErrorDetail.errorSummary'), impact_description: t('internalErrorDetail.impactDesc'),
                    actions_taken: t('internalErrorDetail.actionsTaken'), tutor_evaluation: t('internalErrorDetail.tutorEvaluation'),
                    lessons_learned: t('internalErrorDetail.lessonsLearned'), recommendations: t('internalErrorDetail.recommendations'),
                  })[field]}</label>
                  <textarea value={sheetData[field]} onChange={e => setSheetData({ ...sheetData, [field]: e.target.value })}
                    rows={2} className={`${inputCls} resize-none`} />
                </div>
              ))}
              <div className="max-w-xs">
                <label className={labelCls}><Scale className="w-3 h-3 inline mr-1" />{t('internalErrorDetail.errorWeight')}</label>
                <input type="number" min="1" max="10" value={sheetData.error_weight}
                  onChange={e => setSheetData({ ...sheetData, error_weight: e.target.value })}
                  placeholder="1-10" className={inputCls} />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowSheetForm(false)}
                  className={`px-5 py-2 rounded-xl border text-sm ${isDark ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
                  {t('internalErrorDetail.cancel')}
                </button>
                <button onClick={saveLearningSheet} disabled={savingSheet || !sheetData.error_summary.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50">
                  {savingSheet ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t('internalErrorDetail.createSheetBtn')}
                </button>
              </div>
            </div>
          )
        ) : (
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('internalErrorDetail.noSheet')}</p>
        )}
      </div>
    </div>
  );
}

function InfoItem({ isDark, icon, label, value }: { isDark: boolean; icon?: React.ReactNode; label: string; value?: string }) {
  return (
    <div>
      <p className={`text-xs font-medium flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {icon} {label}
      </p>
      <p className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value || '-'}</p>
    </div>
  );
}

function WeightCard({ isDark, label, value, color }: { isDark: boolean; label: string; value?: number; color: string }) {
  return (
    <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
      <Scale className={`w-5 h-5 mx-auto mb-1 ${color}`} />
      <p className={`text-2xl font-bold ${color}`}>{value ?? '-'}</p>
      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
    </div>
  );
}

function InfoRow({ isDark, label, value }: { isDark: boolean; label: string; value: string }) {
  return (
    <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{value}</p>
    </div>
  );
}
