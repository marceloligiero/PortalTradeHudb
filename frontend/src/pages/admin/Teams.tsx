import { useState, useEffect } from 'react';
import {
  Users, Plus, Pencil, X, Save, Loader2, Search,
  UserPlus, UserMinus, Shield, ChevronRight, Building2,
  AlertCircle, Layers,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

interface Team {
  id: number;
  name: string;
  description: string | null;
  product_id: number | null;
  product_name: string | null;
  department_id: number | null;
  department_name: string | null;
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
interface Department { id: number; name: string; is_active: boolean; }

const EMPTY_FORM = {
  name: '',
  description: '',
  product_id: '',
  department_id: '',
  manager_id: '',
};

const roleStyle = (role: string) => {
  const m: Record<string, string> = {
    ADMIN:   'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
    MANAGER: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
    TRAINER: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    TRAINEE: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  };
  return m[role] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
};

export default function AdminTeams() {
  const { t } = useTranslation();
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.role === 'ADMIN';

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [addSearch, setAddSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formError, setFormError] = useState('');
  const [membersLoading, setMembersLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tr, pr, ur, dr] = await Promise.all([
        api.get('/teams'),
        api.get('/products'),
        api.get('/api/admin/users?page_size=100'),
        api.get('/master/departments'),
      ]);
      setTeams(tr.data);
      setProducts(pr.data);
      const allUsers = ur.data?.items || ur.data || [];
      setManagers(Array.isArray(allUsers) ? allUsers.filter((u: any) => u.is_chefe_equipe || u.role === 'MANAGER' || u.role === 'CHEFE_EQUIPE') : []);
      setDepartments(Array.isArray(dr.data) ? dr.data.filter((d: any) => d.is_active !== false) : []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const fetchMembers = async (teamId: number) => {
    setMembersLoading(true);
    try {
      const [mr, ur] = await Promise.all([
        api.get(`/teams/${teamId}/members`),
        api.get('/users/unassigned'),
      ]);
      setMembers(mr.data);
      setAllUsers(ur.data);
    } catch { /* silent */ }
    finally { setMembersLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const selectTeam = (team: Team) => {
    setSelectedTeam(team);
    setAddSearch('');
    fetchMembers(team.id);
  };

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setMembers([]);
    setAllUsers([]);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (e: React.MouseEvent, team: Team) => {
    e.stopPropagation();
    setForm({
      name: team.name,
      description: team.description || '',
      product_id: team.product_id?.toString() || '',
      department_id: team.department_id?.toString() || '',
      manager_id: team.manager_id?.toString() || '',
    });
    setEditingId(team.id);
    setFormError('');
    setAddSearch('');
    setModalOpen(true);
    // Carrega membros para o modal de edição
    fetchMembers(team.id);
  };

  const saveTeam = async () => {
    if (!form.name.trim()) { setFormError(t('adminTeams.nameRequired')); return; }
    setSaving(true); setFormError('');
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        product_id: form.product_id ? Number(form.product_id) : null,
        department_id: form.department_id ? Number(form.department_id) : null,
        manager_id: form.manager_id ? Number(form.manager_id) : null,
      };
      const url = editingId ? `/teams/${editingId}` : '/teams';
      if (editingId) {
        await api.patch(url, payload);
        if (selectedTeam?.id === editingId) {
          const updated = await api.get(`/teams/${editingId}`);
          setSelectedTeam(updated.data);
        }
      } else {
        await api.post(url, payload);
      }
      setModalOpen(false);
      fetchAll();
    } catch (e: any) { setFormError(e.response?.data?.detail || e.message); }
    finally { setSaving(false); }
  };

  const addMember = async (userId: number) => {
    const teamId = editingId || selectedTeam?.id;
    if (!teamId) return;
    await api.post(`/teams/${teamId}/members`, { user_id: userId });
    fetchMembers(teamId);
    fetchAll();
  };

  const removeMember = async (userId: number) => {
    if (!confirm(t('adminTeams.confirmRemoveMember'))) return;
    const teamId = editingId || selectedTeam?.id;
    if (!teamId) return;
    await api.delete(`/teams/${teamId}/members/${userId}`);
    fetchMembers(teamId);
    fetchAll();
  };

  const filteredTeams = teams.filter(tm =>
    !search || tm.name.toLowerCase().includes(search.toLowerCase())
  );

  // Utilizadores disponíveis para adicionar (excluir os que já são membros)
  const memberIds = new Set(members.map(m => m.id));
  const availableUsers = allUsers.filter(u => !memberIds.has(u.id));
  const filteredAvailable = availableUsers.filter(u =>
    !addSearch ||
    u.full_name.toLowerCase().includes(addSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(addSearch.toLowerCase())
  );

  const inputCls = 'w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#EC0000] focus:ring-2 focus:ring-[#EC0000]/20';

  return (
    <div className="space-y-5">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-headline font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#EC0000]" />
            {t('adminTeams.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('adminTeams.subtitle')}</p>
        </div>
        {isAdmin && (
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t('adminTeams.newTeam')}
          </button>
        )}
      </div>

      {/* ── Two-column layout ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left: Team list */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('adminTeams.searchTeams')}
              className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#EC0000]" />
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
              <Users className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {search ? t('adminTeams.noTeamsFound') : t('adminTeams.createFirstTeam')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTeams.map(team => {
                const active = selectedTeam?.id === team.id;
                return (
                  <div
                    key={team.id}
                    onClick={() => selectTeam(team)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      active
                        ? 'border-[#EC0000]/30 bg-[#EC0000]/5 dark:bg-[#EC0000]/10'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#EC0000]/20 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      active ? 'bg-[#EC0000] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{team.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {team.department_name
                          ? <><Layers className="w-3 h-3 inline mr-0.5" />{team.department_name} · </>
                          : null}
                        {team.manager_name || t('adminTeams.noManager')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
                          {team.members_count} {t('adminTeams.members')}
                        </span>
                        {team.product_name && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium truncate max-w-[120px]">
                            {team.product_name}
                          </span>
                        )}
                        {!team.is_active && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                            {t('adminTeams.inactive')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isAdmin && (
                        <button
                          onClick={e => openEdit(e, team)}
                          className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label={t('common.edit')}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronRight className={`w-4 h-4 transition-colors ${active ? 'text-[#EC0000]' : 'text-gray-300 dark:text-gray-600'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Members quick view (when team is selected via click) */}
        <div>
          {!selectedTeam ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center h-full flex flex-col items-center justify-center">
              <Shield className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                {t('adminTeams.selectTeamToViewMembers')}
              </p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                {t('adminTeams.clickEditToManage', 'Clica em ✏ para editar e gerir membros')}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTeam.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selectedTeam.department_name && (
                      <span className="text-xs text-[#EC0000] font-medium flex items-center gap-1">
                        <Layers className="w-3 h-3" />{selectedTeam.department_name}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">{members.length} {t('adminTeams.members')}</span>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={e => openEdit(e, selectedTeam)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#EC0000] hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {t('adminTeams.editMembers', 'Editar / Membros')}
                  </button>
                )}
              </div>

              {/* Current members */}
              <div className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                  {t('adminTeams.currentMembers', 'Membros')}
                </p>
                {membersLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-[#EC0000]" />
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {members.length === 0 ? (
                      <p className="text-sm text-center py-4 text-gray-400 dark:text-gray-500">
                        {t('adminTeams.noMembers')}
                      </p>
                    ) : members.map(m => (
                      <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.full_name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{m.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleStyle(m.role)}`}>
                            {m.role}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => removeMember(m.id)}
                              className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              aria-label={t('adminTeams.removeMember', 'Remover')}
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add members */}
              {isAdmin && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {t('adminTeams.addUser')}
                  </p>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={addSearch}
                      onChange={e => setAddSearch(e.target.value)}
                      placeholder={t('adminTeams.searchUnassignedUsers')}
                      className="flex-1 bg-transparent text-xs outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-1 max-h-44 overflow-y-auto">
                    {filteredAvailable.length === 0 ? (
                      <p className="text-xs text-center py-3 text-gray-400 dark:text-gray-500">
                        {addSearch ? t('adminTeams.noResults') : t('adminTeams.allUsersAssigned')}
                      </p>
                    ) : filteredAvailable.map(u => (
                      <div key={u.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-300 truncate">{u.full_name}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleStyle(u.role)}`}>
                            {u.role}
                          </span>
                          <button
                            onClick={() => addMember(u.id)}
                            className="p-1.5 rounded-lg bg-[#EC0000]/10 hover:bg-[#EC0000]/20 text-[#EC0000] transition-colors"
                            aria-label={t('adminTeams.addUser')}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Modal ──────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          <div className={`relative w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col ${
            editingId ? 'max-w-4xl max-h-[90vh]' : 'max-w-md'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {editingId ? t('adminTeams.editTeam') : t('adminTeams.newTeam')}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className={`overflow-y-auto flex-1 ${editingId ? 'grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700' : ''}`}>

              {/* ── Coluna esquerda: campos do formulário ── */}
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                    {t('adminTeams.nameLabel')} *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder={t('adminTeams.namePlaceholder')}
                    className={inputCls}
                  />
                </div>

                {/* Departamento — novo campo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                    {t('adminTeams.departmentLabel', 'Departamento')}
                  </label>
                  <select
                    value={form.department_id}
                    onChange={e => setForm({ ...form, department_id: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">{t('adminTeams.noDepartment', '— Sem departamento —')}</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {departments.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {t('adminTeams.noDepartmentsFound', 'Nenhum departamento configurado em Dados Mestres')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                    {t('adminTeams.managerLabel')}
                  </label>
                  <select
                    value={form.manager_id}
                    onChange={e => setForm({ ...form, manager_id: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">{t('adminTeams.noManagerOption')}</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                  {managers.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('adminTeams.noManagersFound')}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                    {t('adminTeams.productService')}
                  </label>
                  <select
                    value={form.product_id}
                    onChange={e => setForm({ ...form, product_id: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">{t('adminTeams.noProduct')}</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                    {t('adminTeams.description')}
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder={t('adminTeams.descriptionPlaceholder')}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={saveTeam}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? t('adminTeams.saving') : t('adminTeams.save')}
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('adminTeams.cancel')}
                  </button>
                </div>
              </div>

              {/* ── Coluna direita: membros (só no modo edição) ── */}
              {editingId && (
                <div className="p-5 space-y-4 flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#EC0000]" />
                      {t('adminTeams.membersSection', 'Membros da Equipa')}
                      <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">
                        ({members.length})
                      </span>
                    </h3>
                    {membersLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EC0000]" />}
                  </div>

                  {/* Lista de membros actuais */}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {members.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-1 opacity-30" />
                        <p className="text-xs">{t('adminTeams.noMembers')}</p>
                      </div>
                    ) : members.map(m => (
                      <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.full_name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{m.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleStyle(m.role)}`}>
                            {m.role}
                          </span>
                          <button
                            onClick={() => removeMember(m.id)}
                            className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 hover:text-red-600 transition-colors"
                            aria-label={t('adminTeams.removeMember', 'Remover')}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Adicionar membros */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {t('adminTeams.addUser')}
                    </p>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={addSearch}
                        onChange={e => setAddSearch(e.target.value)}
                        placeholder={t('adminTeams.searchUnassignedUsers')}
                        className="flex-1 bg-transparent text-xs outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {filteredAvailable.length === 0 ? (
                        <p className="text-xs text-center py-3 text-gray-400 dark:text-gray-500">
                          {addSearch ? t('adminTeams.noResults') : t('adminTeams.allUsersAssigned')}
                        </p>
                      ) : filteredAvailable.map(u => (
                        <div key={u.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-300 truncate">{u.full_name}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleStyle(u.role)}`}>
                              {u.role}
                            </span>
                            <button
                              onClick={() => addMember(u.id)}
                              className="p-1.5 rounded-lg bg-[#EC0000]/10 hover:bg-[#EC0000]/20 text-[#EC0000] transition-colors"
                              aria-label={t('adminTeams.addUser')}
                            >
                              <UserPlus className="w-3.5 h-3.5" />
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
        </div>
      )}
    </div>
  );
}
