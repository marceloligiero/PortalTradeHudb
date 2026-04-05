import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Briefcase, Package, UsersRound,
  Star, User, ChevronDown, ChevronRight,
  ExternalLink, Info, Pencil, Check, X,
  Loader2, AlertTriangle,
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

// ── Types ────────────────────────────────────────────────────────────────────

interface Person {
  id: number;
  full_name: string;
  email?: string | null;
  role?: string | null;
}

interface VTeam {
  id: number;
  name: string;
  chief: Person | null;
  members: Person[];
  members_count: number;
}

interface VSector {
  id: number;
  name: string;
  teams: VTeam[];
}

interface VDepartment {
  id: number;
  name: string;
  managers: Person[];
  sectors: VSector[];
  direct_teams: VTeam[];
}

interface VHierarchy {
  organization: string;
  director: Person | null;
  manager: Person | null;
  departments: VDepartment[];
  unlinked_teams: VTeam[];
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function OrgHierarchy() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.is_admin || user?.is_diretor;

  const [data, setData] = useState<VHierarchy | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set());
  const [expandedSectors, setExpandedSectors] = useState<Set<number>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());

  // Staff editing state
  const [allUsers, setAllUsers] = useState<Person[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [editingRole, setEditingRole] = useState<'director' | 'manager' | null>(null);
  const [pickedUserId, setPickedUserId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/api/org/visual-hierarchy')
      .then(r => {
        setData(r.data);
        const depts = new Set<number>(r.data.departments.map((d: VDepartment) => d.id));
        setExpandedDepts(depts);
        const sectors = new Set<number>();
        r.data.departments.forEach((d: VDepartment) =>
          d.sectors.forEach((s: VSector) => sectors.add(s.id))
        );
        setExpandedSectors(sectors);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  const loadUsers = () => {
    setUsersLoading(true);
    setUsersError('');
    api.get('/api/org/available-users')
      .then(r => setAllUsers(r.data))
      .catch(() => setUsersError(t('orgChart.usersLoadError', 'Erro ao carregar utilizadores. Tente novamente.')))
      .finally(() => setUsersLoading(false));
  };

  useEffect(() => {
    load();
    if (isAdmin) loadUsers();
  }, []);

  const toggle = (set: Set<number>, setFn: (v: Set<number>) => void, id: number) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setFn(next);
  };

  const openEdit = (role: 'director' | 'manager') => {
    const current = role === 'director' ? data?.director : data?.manager;
    setPickedUserId(current?.id ?? null);
    setEditingRole(role);
    setSaveError('');
    // Reload users if they failed to load before
    if (allUsers.length === 0 && !usersLoading) loadUsers();
  };

  const saveStaff = async () => {
    if (!editingRole || !pickedUserId) return;
    setSaving(true);
    setSaveError('');
    try {
      await api.put('/api/org/staff', {
        director_id: editingRole === 'director' ? pickedUserId : undefined,
        manager_id:  editingRole === 'manager'  ? pickedUserId : undefined,
      });
      setEditingRole(null);
      load();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || t('orgChart.saveError', 'Erro ao guardar. Tente novamente.');
      setSaveError(msg);
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-14 bg-gray-200 dark:bg-gray-800 rounded-xl"
              style={{ marginLeft: `${Math.min(i * 20, 80)}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <p className="font-body text-gray-500">{t('orgChart.noData')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">
            {t('orgChart.section')}
          </p>
          <h1 className="font-headline text-3xl font-bold text-gray-900 dark:text-white">
            {t('orgChart.title')}
          </h1>
          <p className="font-body text-gray-500 dark:text-gray-400 mt-1">
            {t('orgChart.subtitle')}
          </p>
        </div>

        {/* Notice */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <p className="font-body text-sm text-blue-700 dark:text-blue-300 flex-1">
            {t('orgChart.readonlyNotice')}
          </p>
          <button
            onClick={() => navigate('/master-data/teams')}
            className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-body font-bold cursor-pointer shrink-0"
          >
            {t('orgChart.goToMasterData')}
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Leadership Assignment (admin only) ──────────────── */}
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            {t('orgChart.leadershipSection')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Diretora */}
            <LeaderCard
              role="director"
              label={t('orgChart.director')}
              badge={t('orgChart.levelDirector')}
              person={data.director}
              icon={<Crown className="w-5 h-5 text-[#EC0000]" />}
              iconBg="bg-red-50 dark:bg-red-900/20"
              badgeColor="text-[#EC0000] bg-red-50 dark:bg-red-900/20"
              borderColor="border-[#EC0000]"
              isAdmin={isAdmin}
              editing={editingRole === 'director'}
              pickedUserId={pickedUserId}
              allUsers={allUsers}
              usersLoading={usersLoading}
              usersError={usersError}
              saving={saving}
              saveError={editingRole === 'director' ? saveError : ''}
              onEdit={() => openEdit('director')}
              onCancel={() => { setEditingRole(null); setSaveError(''); }}
              onSave={saveStaff}
              onPick={id => setPickedUserId(id || null)}
              onRetryUsers={loadUsers}
            />

            {/* Gerente */}
            <LeaderCard
              role="manager"
              label={t('orgChart.manager')}
              badge={t('orgChart.levelManager')}
              person={data.manager}
              icon={<Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              iconBg="bg-blue-50 dark:bg-blue-500/10"
              badgeColor="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
              borderColor="border-blue-400 dark:border-blue-500"
              isAdmin={isAdmin}
              editing={editingRole === 'manager'}
              pickedUserId={pickedUserId}
              allUsers={allUsers}
              usersLoading={usersLoading}
              usersError={usersError}
              saving={saving}
              saveError={editingRole === 'manager' ? saveError : ''}
              onEdit={() => openEdit('manager')}
              onCancel={() => { setEditingRole(null); setSaveError(''); }}
              onSave={saveStaff}
              onPick={id => setPickedUserId(id || null)}
              onRetryUsers={loadUsers}
            />

          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {[
            { dot: 'bg-[#EC0000]', label: t('orgChart.levelDirector') },
            { dot: 'bg-blue-500', label: t('orgChart.levelManager') },
            { dot: 'bg-purple-500', label: t('orgChart.levelProduct') },
            { dot: 'bg-emerald-500', label: t('orgChart.levelTeam') },
            { dot: 'bg-gray-400 dark:bg-gray-600', label: t('orgChart.levelMembers') },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${l.dot}`} />
              <span className="font-body text-xs text-gray-500 dark:text-gray-400">{l.label}</span>
            </div>
          ))}
        </div>

        {/* ── Org Chart Tree ─────────────────────────────────────── */}
        <div className="space-y-1">

          {/* L1 — Diretora */}
          <div className="rounded-2xl border-2 border-[#EC0000] bg-white dark:bg-gray-900 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-[#EC0000]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[10px] font-bold uppercase tracking-widest text-[#EC0000]">
                  {data.organization}
                </p>
                <p className="font-headline text-lg font-bold text-gray-900 dark:text-white">
                  {data.director ? data.director.full_name : t('orgChart.noDirectorAssigned')}
                </p>
                {data.director?.email && (
                  <p className="font-body text-xs text-gray-400">{data.director.email}</p>
                )}
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 font-body text-xs font-bold text-[#EC0000] shrink-0">
                {t('orgChart.director')}
              </span>
            </div>
          </div>

          {/* L2 — Gerente (nível fixo — sempre visível) */}
          <div className="ml-6">
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 ml-3" />
            <div className="rounded-xl border-2 border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-900 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  {data.manager ? (
                    <>
                      <p className="font-headline text-base font-bold text-gray-900 dark:text-white">
                        {data.manager.full_name}
                      </p>
                      {data.manager.email && (
                        <p className="font-body text-xs text-gray-400">{data.manager.email}</p>
                      )}
                    </>
                  ) : (
                    <p className="font-headline text-base font-normal text-gray-400 dark:text-gray-500 italic">
                      {t('orgChart.noManagerAssigned', 'Nenhum gestor designado')}
                    </p>
                  )}
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 font-body text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                  {t('orgChart.manager')}
                </span>
              </div>
            </div>
          </div>

          {/* L3 — Departamentos (agrupadores, sem hierarquia de pessoa) */}
          {data.departments.map((dept) => (
            <div key={dept.id} className="ml-12">
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 ml-3" />

              <button
                className="w-full rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/5 px-4 py-3 text-left cursor-pointer"
                onClick={() => toggle(expandedDepts, setExpandedDepts, dept.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-headline text-sm font-bold text-gray-900 dark:text-white">{dept.name}</p>
                    <p className="font-body text-xs text-gray-400 dark:text-gray-500">
                      {dept.sectors.length} {t('orgChart.sectors')}
                    </p>
                  </div>
                  {expandedDepts.has(dept.id)
                    ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  }
                </div>
              </button>

              {/* L4 — Setores */}
              {expandedDepts.has(dept.id) && (
                <div className="ml-6">
                  {dept.sectors.map((sector) => (
                    <div key={sector.id}>
                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 ml-3" />

                      <button
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-left cursor-pointer"
                        onClick={() => toggle(expandedSectors, setExpandedSectors, sector.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                            <Briefcase className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-headline text-sm font-bold text-gray-900 dark:text-white">{sector.name}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-body text-xs text-gray-400">
                              {sector.teams.length} {t('orgChart.teamsCount')}
                            </span>
                            {expandedSectors.has(sector.id)
                              ? <ChevronDown className="w-4 h-4 text-gray-400" />
                              : <ChevronRight className="w-4 h-4 text-gray-400" />
                            }
                          </div>
                        </div>
                      </button>

                      {/* L5 — Equipas */}
                      {expandedSectors.has(sector.id) && (
                        <div className="ml-6">
                          {sector.teams.length === 0 && (
                            <p className="font-body text-xs text-gray-400 italic mt-2 ml-3">{t('orgChart.noTeams')}</p>
                          )}
                          {sector.teams.map((team) => (
                            <div key={team.id}>
                              <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 ml-3" />
                              <TeamCard
                                team={team}
                                expanded={expandedTeams.has(team.id)}
                                onToggle={() => toggle(expandedTeams, setExpandedTeams, team.id)}
                                t={t}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {dept.direct_teams.map((team) => (
                    <div key={team.id}>
                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 ml-3" />
                      <TeamCard
                        team={team}
                        expanded={expandedTeams.has(team.id)}
                        onToggle={() => toggle(expandedTeams, setExpandedTeams, team.id)}
                        t={t}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Equipas sem setor */}
          {data.unlinked_teams.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
              <p className="font-body text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                {t('orgChart.unlinkedTeams')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.unlinked_teams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    expanded={expandedTeams.has(team.id)}
                    onToggle={() => toggle(expandedTeams, setExpandedTeams, team.id)}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── LeaderCard ────────────────────────────────────────────────────────────────

interface LeaderCardProps {
  role: 'director' | 'manager';
  label: string;
  badge: string;
  person: Person | null;
  icon: React.ReactNode;
  iconBg: string;
  badgeColor: string;
  borderColor: string;
  isAdmin: boolean;
  editing: boolean;
  pickedUserId: number | null;
  allUsers: Person[];
  usersLoading: boolean;
  usersError: string;
  saving: boolean;
  saveError: string;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onPick: (id: number) => void;
  onRetryUsers: () => void;
}

function LeaderCard({
  label, badge, person, icon, iconBg, badgeColor, borderColor,
  isAdmin, editing, pickedUserId, allUsers, usersLoading, usersError,
  saving, saveError,
  onEdit, onCancel, onSave, onPick, onRetryUsers,
}: LeaderCardProps) {
  const { t } = useTranslation();
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border-2 ${borderColor} p-5`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`px-2 py-0.5 rounded-lg font-body text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
              {badge}
            </span>
            {isAdmin && !editing && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1 text-xs font-body text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors"
              >
                <Pencil className="w-3 h-3" />
                {t('orgChart.change')}
              </button>
            )}
          </div>

          {!editing ? (
            <p className="font-headline text-base font-bold text-gray-900 dark:text-white">
              {person ? person.full_name : (
                <span className="text-gray-400 dark:text-gray-500 font-normal text-sm italic">
                  {t('orgChart.noneAssigned')}
                </span>
              )}
            </p>
          ) : (
            <div className="space-y-2 mt-1">
              {usersLoading ? (
                <div className="flex items-center gap-2 py-2 text-xs font-body text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t('orgChart.loadingUsers', 'A carregar utilizadores...')}
                </div>
              ) : usersError ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-body text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {usersError}
                  </p>
                  <button
                    onClick={onRetryUsers}
                    className="text-xs font-body font-bold text-blue-500 hover:text-blue-600 cursor-pointer"
                  >
                    {t('orgChart.retryLoad', 'Tentar novamente')}
                  </button>
                </div>
              ) : (
                <select
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-body text-sm px-3 py-2 cursor-pointer focus:border-[#EC0000]/40 focus:ring-2 focus:ring-[#EC0000]/10 outline-none transition-all"
                  value={pickedUserId ?? ''}
                  onChange={e => onPick(Number(e.target.value))}
                >
                  <option value="">{t('orgChart.selectUser')}</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              )}

              {/* Save error */}
              {saveError && (
                <p className="text-xs font-body text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {saveError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={onSave}
                  disabled={saving || !pickedUserId || usersLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-body text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {t('orgChart.save')}
                </button>
                <button
                  onClick={onCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-body text-xs font-bold cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  {t('orgChart.cancel')}
                </button>
              </div>
            </div>
          )}

          {person?.email && !editing && (
            <p className="font-body text-xs text-gray-400 mt-0.5">{person.email}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TeamCard ──────────────────────────────────────────────────────────────────

function TeamCard({
  team, expanded, onToggle, t,
}: {
  team: VTeam;
  expanded: boolean;
  onToggle: () => void;
  t: (k: string) => string;
}) {
  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-white dark:bg-gray-900 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
        onClick={onToggle}
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
          <UsersRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-headline text-sm font-bold text-gray-900 dark:text-white truncate">{team.name}</p>
          {team.chief && (
            <p className="font-body text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Star className="w-3 h-3" />
              {team.chief.full_name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-body text-xs text-gray-400">
            {team.members_count} {t('orgChart.members')}
          </span>
          {expanded
            ? <ChevronDown className="w-4 h-4 text-gray-400" />
            : <ChevronRight className="w-4 h-4 text-gray-400" />
          }
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 space-y-3">
          {team.chief && (
            <div>
              <p className="font-body text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
                {t('orgChart.teamChief')}
              </p>
              <MemberPill person={team.chief} isChief />
            </div>
          )}
          {team.members.length > 0 && (
            <div>
              <p className="font-body text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                {t('orgChart.teamMembers')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {team.members.map(m => <MemberPill key={m.id} person={m} />)}
              </div>
            </div>
          )}
          {!team.chief && team.members.length === 0 && (
            <p className="font-body text-xs text-gray-400 italic">{t('orgChart.noMembers')}</p>
          )}
        </div>
      )}
    </div>
  );
}

function MemberPill({ person, isChief }: { person: Person; isChief?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-body ${
      isChief
        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    }`}>
      {isChief ? <Star className="w-3 h-3" /> : <User className="w-3 h-3" />}
      {person.full_name}
    </div>
  );
}
