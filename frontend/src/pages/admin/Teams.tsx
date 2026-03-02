import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Pencil, X, Save, Loader2, Search,
  UserPlus, UserMinus, Shield, ChevronRight, Building2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

interface Team {
  id: number;
  name: string;
  description: string | null;
  product_id: number | null;
  product_name: string | null;
  manager_id: number | null;
  manager_name: string | null;
  members_count: number;
  is_active: boolean;
}

interface Member {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  team_id: number | null;
  team_name: string | null;
}

interface Product { id: number; name: string; code: string; }
interface Manager { id: number; full_name: string; email: string; }

const EMPTY_FORM = { name: '', description: '', product_id: '', manager_id: '' };

export default function AdminTeams() {
  const { token } = useAuthStore();
  const { isDark } = useTheme();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [unassigned, setUnassigned] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [addSearch, setAddSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [error, setError] = useState('');

  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tr, pr, ur] = await Promise.all([
        fetch('/api/teams', { headers: h }),
        fetch('/api/products', { headers: h }),
        fetch('/api/users?role=MANAGER', { headers: h }),
      ]);
      if (tr.ok) setTeams(await tr.json());
      if (pr.ok) setProducts(await pr.json());
      if (ur.ok) {
        const all = await ur.json();
        setManagers(Array.isArray(all) ? all.filter((u: any) => u.role === 'MANAGER') : []);
      }
    } finally { setLoading(false); }
  };

  const fetchMembers = async (teamId: number) => {
    const [mr, ur] = await Promise.all([
      fetch(`/api/teams/${teamId}/members`, { headers: h }),
      fetch('/api/users/unassigned', { headers: h }),
    ]);
    if (mr.ok) setMembers(await mr.json());
    if (ur.ok) setUnassigned(await ur.json());
  };

  useEffect(() => { fetchAll(); }, []);

  const selectTeam = (team: Team) => {
    setSelectedTeam(team);
    setAddSearch('');
    fetchMembers(team.id);
  };

  const openNew = () => {
    setForm(EMPTY_FORM); setEditingId(null); setError(''); setWizardOpen(true);
  };

  const openEdit = (team: Team) => {
    setForm({
      name: team.name,
      description: team.description || '',
      product_id: team.product_id?.toString() || '',
      manager_id: team.manager_id?.toString() || '',
    });
    setEditingId(team.id); setError(''); setWizardOpen(true);
  };

  const saveTeam = async () => {
    if (!form.name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        product_id: form.product_id ? Number(form.product_id) : null,
        manager_id: form.manager_id ? Number(form.manager_id) : null,
      };
      const url = editingId ? `/api/teams/${editingId}` : '/api/teams';
      const res = await fetch(url, { method: editingId ? 'PATCH' : 'POST', headers: h, body: JSON.stringify(payload) });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Erro ao guardar');
      }
      setWizardOpen(false);
      fetchAll();
      if (selectedTeam?.id === editingId) {
        const updated = await fetch(`/api/teams/${editingId}`, { headers: h });
        if (updated.ok) setSelectedTeam(await updated.json());
      }
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const addMember = async (userId: number) => {
    await fetch(`/api/teams/${selectedTeam!.id}/members`, {
      method: 'POST', headers: h, body: JSON.stringify({ user_id: userId }),
    });
    fetchMembers(selectedTeam!.id);
    fetchAll();
  };

  const removeMember = async (userId: number) => {
    if (!confirm('Remover este membro da equipa?')) return;
    await fetch(`/api/teams/${selectedTeam!.id}/members/${userId}`, { method: 'DELETE', headers: h });
    fetchMembers(selectedTeam!.id);
    fetchAll();
  };

  const roleColor = (role: string) => {
    const m: Record<string, string> = {
      ADMIN: 'bg-red-500/10 text-red-400', MANAGER: 'bg-purple-500/10 text-purple-400',
      TRAINER: 'bg-blue-500/10 text-blue-400', STUDENT: 'bg-emerald-500/10 text-emerald-400',
      TRAINEE: 'bg-yellow-500/10 text-yellow-400',
    };
    return m[role] || 'bg-gray-500/10 text-gray-400';
  };

  const inputCls = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
    isDark
      ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus:border-red-500/40 focus:ring-2 focus:ring-red-500/10'
      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-100'
  }`;

  const filteredTeams = teams.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));
  const filteredUnassigned = unassigned.filter(u => !addSearch || u.full_name.toLowerCase().includes(addSearch.toLowerCase()) || u.email.toLowerCase().includes(addSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Users className="w-7 h-7 text-red-500" /> Gestão de Equipas
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Cria equipas, associa um produto/serviço e atribui membros
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/25"
        >
          <Plus className="w-4 h-4" /> Nova Equipa
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Team list ────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Search */}
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}>
            <Search className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar equipas…"
              className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder:text-gray-600' : 'text-gray-900 placeholder:text-gray-400'}`}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>
          ) : filteredTeams.length === 0 ? (
            <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-white border-gray-200'}`}>
              <Users className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {search ? 'Nenhuma equipa encontrada' : 'Cria a primeira equipa'}
              </p>
            </div>
          ) : (
            filteredTeams.map(team => (
              <motion.div key={team.id} whileHover={{ x: 2 }}
                onClick={() => selectTeam(team)}
                className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                  selectedTeam?.id === team.id
                    ? isDark ? 'border-red-500/40 bg-red-500/5' : 'border-red-400/40 bg-red-50'
                    : isDark ? 'border-white/8 bg-white/[0.02] hover:border-white/15' : 'border-gray-200 bg-white hover:border-red-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      selectedTeam?.id === team.id ? 'bg-red-600 text-white' : isDark ? 'bg-white/8 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{team.name}</p>
                      <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {team.product_name || '—'} · {team.manager_name || 'sem manager'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-500'}`}>
                          {team.members_count} membros
                        </span>
                        {!team.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">Inativa</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); openEdit(team); }}
                      className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className={`w-4 h-4 ${selectedTeam?.id === team.id ? 'text-red-500' : isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* ── Members panel ────────────────────────────────────────────────── */}
        <div>
          {!selectedTeam ? (
            <div className={`rounded-2xl border p-12 text-center h-full flex flex-col items-center justify-center ${isDark ? 'bg-white/[0.02] border-white/8 border-dashed' : 'bg-gray-50 border-gray-200 border-dashed'}`}>
              <Shield className={`w-10 h-10 mb-2 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
              <p className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Seleciona uma equipa para ver os membros</p>
            </div>
          ) : (
            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}>
              {/* Panel header */}
              <div className={`px-5 py-4 border-b ${isDark ? 'border-white/8' : 'border-gray-100'}`}>
                <h2 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedTeam.name} · <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{members.length} membros</span>
                </h2>
              </div>

              {/* Current members */}
              <div className="p-4 space-y-2 max-h-[220px] overflow-y-auto">
                {members.length === 0 ? (
                  <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Sem membros. Adiciona abaixo.</p>
                ) : members.map(m => (
                  <div key={m.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.full_name}</p>
                      <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{m.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColor(m.role)}`}>{m.role}</span>
                      <button onClick={() => removeMember(m.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add members */}
              <div className={`border-t p-4 space-y-2 ${isDark ? 'border-white/8' : 'border-gray-100'}`}>
                <p className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Adicionar utilizador</p>
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-gray-50 border-gray-200'}`}>
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  <input type="text" value={addSearch} onChange={e => setAddSearch(e.target.value)}
                    placeholder="Pesquisar utilizadores sem equipa…"
                    className={`flex-1 bg-transparent text-xs outline-none ${isDark ? 'text-white placeholder:text-gray-600' : 'text-gray-900 placeholder:text-gray-400'}`}
                  />
                </div>
                <div className="space-y-1 max-h-[180px] overflow-y-auto">
                  {filteredUnassigned.length === 0 ? (
                    <p className={`text-xs text-center py-3 ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
                      {addSearch ? 'Nenhum resultado' : 'Todos os utilizadores já têm equipa'}
                    </p>
                  ) : filteredUnassigned.map(u => (
                    <div key={u.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{u.full_name}</p>
                        <p className={`text-[10px] truncate ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${roleColor(u.role)}`}>{u.role}</span>
                        <button onClick={() => addMember(u.id)}
                          className="p-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-500 transition-colors"
                        >
                          <UserPlus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create/Edit wizard ───────────────────────────────────────────── */}
      <AnimatePresence>
        {wizardOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setWizardOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden ${isDark ? 'bg-[#141418] border-white/10' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 to-red-500">
                <h2 className="text-white font-bold">{editingId ? 'Editar Equipa' : 'Nova Equipa'}</h2>
                <button onClick={() => setWizardOpen(false)} className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Nome *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Equipa Forex" className={inputCls} />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Descrição</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Descrição opcional…" className={inputCls} />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Produto / Serviço</label>
                  <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className={inputCls}>
                    <option value="">— Sem produto —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manager (chefe de equipa)</label>
                  <select value={form.manager_id} onChange={e => setForm({ ...form, manager_id: e.target.value })} className={inputCls}>
                    <option value="">— Sem manager —</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                  {managers.length === 0 && (
                    <p className={`text-xs mt-1 ${isDark ? 'text-yellow-500/70' : 'text-yellow-600'}`}>
                      Nenhum utilizador com role MANAGER encontrado
                    </p>
                  )}
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-2 pt-2">
                  <button onClick={saveTeam} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'A guardar…' : 'Guardar'}
                  </button>
                  <button onClick={() => setWizardOpen(false)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
