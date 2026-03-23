import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, Plus, Globe, CheckCircle2, XCircle, X, Pencil, Trash2,
  AlertTriangle, Search, ChevronLeft, ChevronRight,
} from 'lucide-react';
import api from '../../lib/axios';

interface Bank {
  id: number;
  code: string;
  name: string;
  country: string;
  is_active: boolean;
  created_at: string;
}

const PAGE_SIZE = 15;

const COUNTRY_MAP: Record<string, { flag: string; label: string }> = {
  PT: { flag: '🇵🇹', label: 'Portugal' },
  ES: { flag: '🇪🇸', label: 'Espanha' },
  DE: { flag: '🇩🇪', label: 'Alemanha' },
  BR: { flag: '🇧🇷', label: 'Brasil' },
  UK: { flag: '🇬🇧', label: 'Reino Unido' },
};

const countryFlag = (c: string) => COUNTRY_MAP[c]?.flag ?? '🌍';
const countryLabel = (c: string) => COUNTRY_MAP[c]?.label ?? c;

/* ── Modal shell ─────────────────────────────────────────────────────────── */
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-headline font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ── Pagination ──────────────────────────────────────────────────────────── */
function Pagination({
  page, total, pageSize, onChange,
}: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
      <span className="text-xs text-gray-400 dark:text-gray-500">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 1)
          .reduce<(number | '...')[]>((acc, p, i, arr) => {
            if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={`e-${i}`} className="px-1 text-xs text-gray-400">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p as number)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  p === page
                    ? 'bg-[#EC0000] text-white'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {p}
              </button>
            )
          )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function BanksPage() {
  const { t } = useTranslation();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [deletingBank, setDeletingBank] = useState<Bank | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', country: 'PT', is_active: true });

  useEffect(() => { fetchBanks(); }, []);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const r = await api.get('/api/admin/banks');
      setBanks(r.data);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingBank(null);
    setFormData({ name: '', country: 'PT', is_active: true });
    setShowModal(true);
  };

  const openEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({ name: bank.name, country: bank.country, is_active: bank.is_active });
    setShowModal(true);
  };

  const openDelete = (bank: Bank) => {
    setDeletingBank(bank);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingBank) {
        await api.put(`/api/admin/banks/${editingBank.id}`, formData);
      } else {
        await api.post('/api/admin/banks', formData);
      }
      setShowModal(false);
      fetchBanks();
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingBank) return;
    try {
      await api.delete(`/api/admin/banks/${deletingBank.id}`);
      setShowDeleteModal(false);
      setDeletingBank(null);
      fetchBanks();
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail || 'Erro ao excluir banco');
    }
  };

  /* Derived */
  const filtered = banks.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase()) ||
    b.country.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeBanks = banks.filter(b => b.is_active).length;
  const countries = new Set(banks.map(b => b.country)).size;

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1 text-[#EC0000]">
          {t('masterData.portalTitle', 'Master Data')}
        </p>
        <h1 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">
          {t('admin.banks', 'Bancos')}
        </h1>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Building2, label: t('admin.totalBanks', 'Total'), value: banks.length, box: 'bg-blue-50 dark:bg-blue-900/20', ico: 'text-blue-600 dark:text-blue-400' },
          { icon: CheckCircle2, label: t('admin.activeBanks', 'Activos'), value: activeBanks, box: 'bg-emerald-50 dark:bg-emerald-900/20', ico: 'text-emerald-600 dark:text-emerald-400' },
          { icon: Globe, label: t('admin.countries', 'Países'), value: countries, box: 'bg-purple-50 dark:bg-purple-900/20', ico: 'text-purple-600 dark:text-purple-400' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${kpi.box}`}>
              <kpi.icon className={`w-5 h-5 ${kpi.ico}`} />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3 rounded-xl border px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#EC0000]/30 transition-shadow">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('admin.searchBanks', 'Pesquisar bancos…')}
            className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t('admin.newBank', 'Novo Banco')}
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50 text-gray-500">
                <th className="px-5 py-3 text-left font-semibold">{t('admin.bankCode', 'Código')}</th>
                <th className="px-5 py-3 text-left font-semibold">{t('admin.bankName', 'Nome')}</th>
                <th className="px-5 py-3 text-left font-semibold">{t('admin.country', 'País')}</th>
                <th className="px-5 py-3 text-left font-semibold">{t('admin.status', 'Estado')}</th>
                <th className="px-5 py-3 text-left font-semibold">{t('courses.createdAt', 'Criado em')}</th>
                <th className="px-5 py-3 text-center font-semibold">{t('common.actions', 'Ações')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="w-8 h-8 border-2 border-[#EC0000] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400 dark:text-gray-600">
                    {search ? t('admin.noBanksFound', 'Sem resultados') : t('admin.noBanksRegistered', 'Sem bancos registados')}
                  </td>
                </tr>
              ) : (
                paginated.map(bank => (
                  <tr key={bank.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">{bank.code}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">{bank.name}</td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <span className="text-base">{countryFlag(bank.country)}</span>
                        {countryLabel(bank.country)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        bank.is_active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-[#EC0000]'
                      }`}>
                        {bank.is_active
                          ? <><CheckCircle2 className="w-3 h-3" />{t('common.active', 'Activo')}</>
                          : <><XCircle className="w-3 h-3" />{t('common.inactive', 'Inactivo')}</>
                        }
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                      {new Date(bank.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(bank)}
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
                          title={t('common.edit', 'Editar')}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDelete(bank)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-[#EC0000] hover:bg-red-500/20 transition-colors"
                          title={t('common.delete', 'Eliminar')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingBank ? t('admin.editBank', 'Editar Banco') : t('admin.createNewBank', 'Novo Banco')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {editingBank && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                {t('admin.bankCode', 'Código')}
              </label>
              <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 font-mono text-sm">
                {editingBank.code}
                <span className="text-xs ml-2 text-gray-400">(não editável)</span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              {t('admin.bankName', 'Nome')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#EC0000]/30 transition"
              placeholder={t('admin.bankNamePlaceholder', 'Nome do banco…')}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              {t('admin.country', 'País')} *
            </label>
            <select
              value={formData.country}
              onChange={e => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#EC0000]/30 transition"
              required
            >
              {Object.entries(COUNTRY_MAP).map(([code, { flag, label }]) => (
                <option key={code} value={code}>{flag} {label}</option>
              ))}
            </select>
          </div>
          {editingBank && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('admin.status', 'Estado')}
              </label>
              <div className="flex gap-3">
                {[
                  { val: true, label: t('common.active', 'Activo'), cls: formData.is_active ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-gray-200 dark:border-gray-700 text-gray-500' },
                  { val: false, label: t('common.inactive', 'Inactivo'), cls: !formData.is_active ? 'border-[#EC0000] bg-red-50 dark:bg-red-500/10 text-[#EC0000]' : 'border-gray-200 dark:border-gray-700 text-gray-500' },
                ].map(opt => (
                  <label key={String(opt.val)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-all ${opt.cls}`}>
                    <input
                      type="radio"
                      className="sr-only"
                      checked={formData.is_active === opt.val}
                      onChange={() => setFormData({ ...formData, is_active: opt.val })}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
            >
              {t('common.cancel', 'Cancelar')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? '…' : editingBank ? t('common.save', 'Guardar') : t('admin.createBank', 'Criar Banco')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('common.confirmDelete', 'Confirmar Eliminação')}
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-[#EC0000]" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t('admin.deleteConfirmText', 'Tem certeza que deseja excluir o banco')}:
              </p>
              <p className="text-gray-900 dark:text-white font-semibold mt-1">
                {deletingBank?.code} — {deletingBank?.name}
              </p>
            </div>
          </div>
          {deleteError && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-[#EC0000] text-sm">
              {deleteError}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
            >
              {t('common.cancel', 'Cancelar')}
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('common.delete', 'Eliminar')}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
