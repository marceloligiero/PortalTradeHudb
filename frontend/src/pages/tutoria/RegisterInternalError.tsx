import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldAlert, Save, ArrowLeft, Calendar, User,
  Building2, FolderOpen, AlertTriangle, Hash, FileText, Loader2, Plus, X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from '../../lib/axios';
import { useTheme } from '../../contexts/ThemeContext';

interface LookupItem { id: number; name: string; }
interface UserItem { id: number; full_name: string; email: string; }
interface Senso { id: number; name: string; status: string; }

export default function RegisterInternalError() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [sensos, setSensos] = useState<Senso[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [impacts, setImpacts] = useState<LookupItem[]>([]);
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [errorTypes, setErrorTypes] = useState<LookupItem[]>([]);
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [activities, setActivities] = useState<LookupItem[]>([]);
  const [banks, setBanks] = useState<LookupItem[]>([]);

  const [sensoId, setSensoId] = useState('');
  const [gravadorId, setGravadorId] = useState('');
  const [description, setDescription] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [dateOccurrence, setDateOccurrence] = useState(new Date().toISOString().split('T')[0]);
  const [impactId, setImpactId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [errorTypeId, setErrorTypeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [activityId, setActivityId] = useState('');
  const [bankId, setBankId] = useState('');
  const [classifications, setClassifications] = useState<{type: string; description: string}[]>([]);
  // pesoLiberador — oculto, enviado como 0 automaticamente

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get('/internal-errors/sensos'),
      axios.get('/admin/users', { params: { page_size: 100 } }),
      axios.get('/internal-errors/lookups/impacts').catch(() => ({ data: [] })),
      axios.get('/internal-errors/lookups/categories').catch(() => ({ data: [] })),
      axios.get('/internal-errors/lookups/error-types').catch(() => ({ data: [] })),
      axios.get('/internal-errors/lookups/departments').catch(() => ({ data: [] })),
      axios.get('/internal-errors/lookups/activities').catch(() => ({ data: [] })),
      axios.get('/internal-errors/lookups/banks').catch(() => ({ data: [] })),
    ]).then(([sensoRes, usersRes, impRes, catRes, etRes, depRes, actRes, bankRes]) => {
      const sensoData = Array.isArray(sensoRes.data) ? sensoRes.data : [];
      setSensos(sensoData.filter((s: Senso) => s.status === 'ATIVO'));
      const usersData = usersRes.data?.items ?? (Array.isArray(usersRes.data) ? usersRes.data : []);
      setUsers(usersData);
      setImpacts(Array.isArray(impRes.data) ? impRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setErrorTypes(Array.isArray(etRes.data) ? etRes.data : []);
      setDepartments(Array.isArray(depRes.data) ? depRes.data : []);
      setActivities(Array.isArray(actRes.data) ? actRes.data : []);
      setBanks(Array.isArray(bankRes.data) ? bankRes.data : []);
    });
  }, []);

  const handleSave = async () => {
    if (!gravadorId || !description.trim()) {
      setError(t('registerInternalError.fillRequired'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await axios.post('/internal-errors/errors', {
        senso_id: sensoId ? Number(sensoId) : undefined,
        gravador_id: Number(gravadorId),
        description,
        reference_code: referenceCode || undefined,
        date_occurrence: dateOccurrence,
        impact_id: impactId ? Number(impactId) : undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        error_type_id: errorTypeId ? Number(errorTypeId) : undefined,
        department_id: departmentId ? Number(departmentId) : undefined,
        activity_id: activityId ? Number(activityId) : undefined,
        bank_id: bankId ? Number(bankId) : undefined,
        classifications: classifications.length > 0
          ? classifications.map(c => ({ classification: c.type, description: c.description || undefined }))
          : undefined,
        peso_liberador: 0,
      });
      navigate('/tutoria/internal-errors');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('registerInternalError.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-red-500'}`;
  const selectCls = `w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${isDark ? 'bg-[#1a1a2e] border-white/10 text-white focus:border-red-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-red-500'}`;
  const labelCls = `block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/tutoria/internal-errors')}
          className={`p-2 rounded-xl border transition-all ${isDark ? 'border-white/10 hover:bg-white/5 text-gray-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <ShieldAlert className="w-6 h-6 inline mr-2 text-red-500" />
            {t('registerInternalError.title')}
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('registerInternalError.subtitle')}</p>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </motion.div>
      )}

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl border space-y-6 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200'}`}>

        {/* Gravador */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Censo — oculto por enquanto, descomentar quando necessário */}
          {/* <div>
            <label className={labelCls}><Calendar className="w-3 h-3 inline mr-1" />{t('registerInternalError.senso')}</label>
            <select value={sensoId} onChange={e => setSensoId(e.target.value)} className={selectCls}>
              <option value="">{t('registerInternalError.selectSenso')}</option>
              {sensos.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div> */}
          <div>
            <label className={labelCls}><User className="w-3 h-3 inline mr-1" />{t('registerInternalError.gravador')}</label>
            <select value={gravadorId} onChange={e => setGravadorId(e.target.value)} className={selectCls}>
              <option value="">{t('registerInternalError.selectGravador')}</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
        </div>

        {/* Data + Referência */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}><Calendar className="w-3 h-3 inline mr-1" />{t('registerInternalError.dateOccurrence')}</label>
            <input type="date" value={dateOccurrence} onChange={e => setDateOccurrence(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}><Hash className="w-3 h-3 inline mr-1" />{t('registerInternalError.referenceCode')}</label>
            <input value={referenceCode} onChange={e => setReferenceCode(e.target.value)} placeholder={t('registerInternalError.referencePlaceholder')} className={inputCls} />
          </div>
        </div>

        {/* Classification */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}><AlertTriangle className="w-3 h-3 inline mr-1" />{t('registerInternalError.impact')}</label>
            <select value={impactId} onChange={e => setImpactId(e.target.value)} className={selectCls}>
              <option value="">{t('registerInternalError.select')}</option>
              {impacts.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}><FolderOpen className="w-3 h-3 inline mr-1" />{t('registerInternalError.category')}</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={selectCls}>
              <option value="">{t('registerInternalError.select')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t('registerInternalError.errorType')}</label>
            <select value={errorTypeId} onChange={e => setErrorTypeId(e.target.value)} className={selectCls}>
              <option value="">{t('registerInternalError.select')}</option>
              {errorTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}><Building2 className="w-3 h-3 inline mr-1" />{t('registerInternalError.department')}</label>
            <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className={selectCls}>
              <option value="">{t('registerInternalError.select')}</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t('registerInternalError.activity')}</label>
            <select value={activityId} onChange={e => setActivityId(e.target.value)} className={selectCls}>
              <option value="">{t('registerInternalError.select')}</option>
              {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}><Building2 className="w-3 h-3 inline mr-1" />{t('registerInternalError.bank')}</label>
            <select value={bankId} onChange={e => setBankId(e.target.value)} className={selectCls}>
              <option value="">{t('registerInternalError.select')}</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        {/* Peso Liberador — oculto, preenchido automaticamente como 0 */}
        {/* <div className="max-w-xs">
          <label className={labelCls}><Scale className="w-3 h-3 inline mr-1" />{t('registerInternalError.weightLiberador')}</label>
          <input type="number" min="1" max="10" value={pesoLiberador} onChange={e => setPesoLiberador(e.target.value)} placeholder="1-10" className={inputCls} />
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('registerInternalError.weightHint')}</p>
        </div> */}

        {/* Classificação do Erro (múltiplas) */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <AlertTriangle className="w-4 h-4 inline mr-1.5 text-amber-500" />
            {t('registerInternalError.classificationsTitle')}
          </h3>
          <p className={`text-xs mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('registerInternalError.classificationsHint')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { value: 'METHODOLOGY', label: t('registerInternalError.methodology'), active: 'border-blue-500 bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30', activeLight: 'border-blue-500 bg-blue-50 text-blue-600 ring-1 ring-blue-500/30' },
              { value: 'KNOWLEDGE', label: t('registerInternalError.knowledge'), active: 'border-purple-500 bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30', activeLight: 'border-purple-500 bg-purple-50 text-purple-600 ring-1 ring-purple-500/30' },
              { value: 'DETAIL', label: t('registerInternalError.detail'), active: 'border-amber-500 bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30', activeLight: 'border-amber-500 bg-amber-50 text-amber-600 ring-1 ring-amber-500/30' },
              { value: 'PROCEDURE', label: t('registerInternalError.procedure'), active: 'border-emerald-500 bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30', activeLight: 'border-emerald-500 bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/30' },
            ].map(opt => {
              const isSelected = classifications.some(c => c.type === opt.value);
              return (
                <button key={opt.value} type="button"
                  onClick={() => {
                    if (isSelected) {
                      setClassifications(prev => prev.filter(c => c.type !== opt.value));
                    } else {
                      setClassifications(prev => [...prev, { type: opt.value, description: '' }]);
                    }
                  }}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    isSelected
                      ? (isDark ? opt.active : opt.activeLight)
                      : isDark ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}>
                  {isSelected && <Plus className="w-3 h-3 inline mr-1 rotate-45" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
          {classifications.length > 0 && (
            <div className="space-y-3">
              {classifications.map((c, idx) => {
                const labelMap: Record<string,string> = { METHODOLOGY: t('registerInternalError.methodology'), KNOWLEDGE: t('registerInternalError.knowledge'), DETAIL: t('registerInternalError.detail'), PROCEDURE: t('registerInternalError.procedure') };
                return (
                  <div key={c.type} className={`p-3 rounded-lg border ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{labelMap[c.type] || c.type}</span>
                      <button type="button" onClick={() => setClassifications(prev => prev.filter(x => x.type !== c.type))}
                        className={`p-1 rounded-lg ${isDark ? 'text-gray-500 hover:text-red-400 hover:bg-white/5' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea value={c.description}
                      onChange={e => setClassifications(prev => prev.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
                      rows={2} placeholder={t('registerInternalError.classDescPlaceholder')}
                      className={`${inputCls} resize-none`} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}><FileText className="w-3 h-3 inline mr-1" />{t('registerInternalError.errorDescLabel')}</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder={t('registerInternalError.errorDescPlaceholder')}
            className={`${inputCls} resize-none`} />
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button onClick={() => navigate('/tutoria/internal-errors')}
          className={`px-6 py-2.5 rounded-xl border text-sm font-medium transition-all ${isDark ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
          {t('registerInternalError.cancel')}
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm hover:shadow-lg hover:shadow-red-600/20 transition-all disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('registerInternalError.submit')}
        </button>
      </div>
    </div>
  );
}
