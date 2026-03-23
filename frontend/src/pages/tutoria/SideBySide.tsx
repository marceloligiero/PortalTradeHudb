import { useState, useEffect } from 'react';
import { Users, Calendar, Plus, Loader2 } from 'lucide-react';
import axios from '../../lib/axios';
import { useTheme } from '../../contexts/ThemeContext';

interface SideBySidePlan {
  id: number;
  tutorado_name?: string;
  observation_date?: string;
  observation_notes?: string;
  expected_result?: string;
  responsible_name?: string;
  deadline?: string;
  status: string;
  created_at: string;
}

interface UserItem {
  id: number;
  full_name: string;
  is_tutor?: boolean;
  is_team_lead?: boolean;
  is_referente?: boolean;
  role?: string;
}

export default function SideBySide() {
  const { isDark } = useTheme();
  const [plans, setPlans] = useState<SideBySidePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [team, setTeam] = useState<UserItem[]>([]);
  const [form, setForm] = useState({
    tutorado_id: '',
    observation_date: '',
    observation_notes: '',
    expected_result: '',
    responsible_id: '',
    deadline: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [plansRes, teamRes] = await Promise.all([
        axios.get('/api/tutoria/plans'),
        axios.get('/api/tutoria/team'),
      ]);
      const allPlans = Array.isArray(plansRes.data) ? plansRes.data : [];
      setPlans(allPlans.filter((p: any) => p.side_by_side));
      setTeam(Array.isArray(teamRes.data) ? teamRes.data : []);
    } catch {
      setError('Erro ao carregar planos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const responsibleOptions = team.filter(
    u => u.is_tutor || u.is_team_lead || u.is_referente || ['ADMIN', 'MANAGER'].includes(u.role || '')
  );
  const collaboratorOptions = team.filter(u => !['ADMIN'].includes(u.role || ''));

  const handleCreate = async () => {
    if (!form.tutorado_id || !form.observation_date) {
      setError('Colaborador e Data de Observação são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await axios.post('/api/tutoria/plans/side-by-side', {
        tutorado_id: Number(form.tutorado_id),
        observation_date: form.observation_date,
        observation_notes: form.observation_notes || null,
        expected_result: form.expected_result || null,
        responsible_id: form.responsible_id ? Number(form.responsible_id) : null,
        deadline: form.deadline || null,
        plan_type: 'SEGUIMENTO',
        side_by_side: true,
      });
      setShowCreate(false);
      setForm({ tutorado_id: '', observation_date: '', observation_notes: '', expected_result: '', responsible_id: '', deadline: '' });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Erro ao criar plano.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-[#EC0000] focus:ring-1 focus:ring-[#EC0000]/20 ${
    isDark
      ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-500'
      : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  const labelCls = `block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
    isDark ? 'text-gray-400' : 'text-gray-500'
  }`;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-headline font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Planos Side by Side
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Seguimento presencial dos colaboradores
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#EC0000] text-white rounded-xl text-sm font-semibold hover:bg-[#CC0000] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Plano
        </button>
      </div>

      {/* Global error */}
      {error && !showCreate && (
        <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-xl text-sm">{error}</div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#EC0000]" />
        </div>
      ) : plans.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border border-dashed ${isDark ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum plano Side by Side registado.</p>
          <p className="text-xs mt-1 opacity-70">Clique em "Novo Plano" para criar o primeiro.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`p-4 rounded-2xl border ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {plan.tutorado_name || '—'}
                  </div>
                  {plan.observation_date && (
                    <div className={`flex items-center gap-1 text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      {new Date(plan.observation_date).toLocaleDateString('pt-PT')}
                    </div>
                  )}
                  {plan.responsible_name && (
                    <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Responsável: {plan.responsible_name}
                    </div>
                  )}
                  {plan.observation_notes && (
                    <p className={`text-sm mt-2 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {plan.observation_notes}
                    </p>
                  )}
                </div>
                <span
                  className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-bold ${
                    plan.status === 'DONE' || plan.status === 'CONCLUIDO'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-blue-500/10 text-blue-500'
                  }`}
                >
                  {plan.status}
                </span>
              </div>
              {plan.deadline && (
                <div className={`mt-3 pt-3 border-t text-xs ${isDark ? 'border-white/5 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                  Prazo: {new Date(plan.deadline).toLocaleDateString('pt-PT')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl p-6 ${
              isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'
            }`}
          >
            <h2 className={`text-lg font-headline font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Novo Plano Side by Side
            </h2>

            {error && (
              <div className="mb-3 p-3 bg-red-500/10 text-red-400 rounded-xl text-sm">{error}</div>
            )}

            <div className="space-y-3">
              {/* Colaborador */}
              <div>
                <label className={labelCls}>Colaborador *</label>
                <select
                  value={form.tutorado_id}
                  onChange={e => setForm(f => ({ ...f, tutorado_id: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">— Selecionar —</option>
                  {collaboratorOptions.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Data de Observação */}
              <div>
                <label className={labelCls}>Data de Observação *</label>
                <input
                  type="date"
                  value={form.observation_date}
                  onChange={e => setForm(f => ({ ...f, observation_date: e.target.value }))}
                  className={inputCls}
                />
              </div>

              {/* Notas */}
              <div>
                <label className={labelCls}>Notas da Observação</label>
                <textarea
                  value={form.observation_notes}
                  onChange={e => setForm(f => ({ ...f, observation_notes: e.target.value }))}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Resultado Esperado */}
              <div>
                <label className={labelCls}>Resultado Esperado</label>
                <textarea
                  value={form.expected_result}
                  onChange={e => setForm(f => ({ ...f, expected_result: e.target.value }))}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Responsável + Prazo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Responsável</label>
                  <select
                    value={form.responsible_id}
                    onChange={e => setForm(f => ({ ...f, responsible_id: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">— Selecionar —</option>
                    {responsibleOptions.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Prazo</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowCreate(false); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  isDark ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#EC0000] text-white hover:bg-[#CC0000] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Criar Plano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
