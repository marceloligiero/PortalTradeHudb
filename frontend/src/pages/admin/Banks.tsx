import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Globe, CheckCircle2, XCircle, X, Sparkles, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import api from '../../lib/axios';
import { PremiumHeader, AnimatedStatCard, FloatingOrbs, GridBackground } from '../../components/premium';

interface Bank {
  id: number;
  code: string;
  name: string;
  country: string;
  is_active: boolean;
  created_at: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export default function BanksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [deletingBank, setDeletingBank] = useState<Bank | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    country: 'PT',
    is_active: true
  });

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/banks');
      setBanks(response.data);
    } catch (error) {
      console.error('Error fetching banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingBank(null);
    setFormData({ name: '', country: 'PT', is_active: true });
    setShowModal(true);
  };

  const handleOpenEditModal = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({
      name: bank.name,
      country: bank.country,
      is_active: bank.is_active
    });
    setShowModal(true);
  };

  const handleOpenDeleteModal = (bank: Bank) => {
    setDeletingBank(bank);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBank) {
        // Atualizar banco existente
        await api.put(`/api/admin/banks/${editingBank.id}`, formData);
      } else {
        // Criar novo banco (código será gerado automaticamente)
        await api.post('/api/admin/banks', formData);
      }
      setShowModal(false);
      setFormData({ name: '', country: 'PT', is_active: true });
      setEditingBank(null);
      fetchBanks();
    } catch (error) {
      console.error('Error saving bank:', error);
    }
  };

  const handleDelete = async () => {
    if (!deletingBank) return;
    try {
      await api.delete(`/api/admin/banks/${deletingBank.id}`);
      setShowDeleteModal(false);
      setDeletingBank(null);
      fetchBanks();
    } catch (error: any) {
      console.error('Error deleting bank:', error);
      setDeleteError(error.response?.data?.detail || 'Erro ao excluir banco');
    }
  };

  const activeBanks = banks.filter(b => b.is_active).length;
  const countriesCount = new Set(banks.map(b => b.country)).size;

  const getCountryFlag = (country: string) => {
    switch (country) {
      case 'PT': return '🇵🇹';
      case 'ES': return '🇪🇸';
      case 'DE': return '🇩🇪';
      default: return '🌍';
    }
  };

  const getCountryName = (country: string) => {
    switch (country) {
      case 'PT': return 'Portugal';
      case 'ES': return 'Espanha';
      case 'DE': return 'Alemanha';
      default: return country;
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <PremiumHeader
        icon={Building2}
        title={t('admin.banks')}
        subtitle={t('admin.manageBanks')}
        badge="Gestão de Bancos"
        iconColor="from-blue-500 to-blue-700"
        actions={
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-600/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            {t('admin.newBank')}
          </motion.button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatedStatCard
          icon={Building2}
          label={t('admin.totalBanks')}
          value={banks.length}
          color="from-blue-500 to-blue-700"
          delay={0}
        />
        <AnimatedStatCard
          icon={CheckCircle2}
          label={t('admin.activeBanks')}
          value={activeBanks}
          color="from-green-500 to-emerald-600"
          delay={0.1}
        />
        <AnimatedStatCard
          icon={Globe}
          label={t('admin.countries')}
          value={countriesCount}
          color="from-purple-500 to-purple-700"
          delay={0.2}
        />
      </div>

      {/* Banks Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 rounded-2xl" />
        <FloatingOrbs variant="subtle" />
        
        <div className="relative bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
              />
            </div>
          ) : banks.length === 0 ? (
            <div className="text-center py-20">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <Building2 className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">{t('admin.noBanksRegistered')}</p>
              <p className="text-gray-500 mt-2">{t('admin.createFirstBank')}</p>
            </div>
          ) : (
            <motion.table
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full"
            >
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('admin.bankCode')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('admin.bankName')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('admin.country')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('admin.status')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('courses.createdAt')}</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {banks.map((bank, index) => (
                  <motion.tr
                    key={bank.id}
                    variants={rowVariants}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">{bank.code}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      {bank.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCountryFlag(bank.country)}</span>
                        <span className="text-gray-600 dark:text-gray-400">{getCountryName(bank.country)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          bank.is_active
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {bank.is_active ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {bank.is_active ? t('common.active') : t('common.inactive')}
                      </motion.span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {new Date(bank.created_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenEditModal(bank)}
                          className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
                          title={t('common.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenDeleteModal(bank)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </motion.table>
          )}
        </div>
      </motion.div>

      {/* Create/Edit Bank Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative overflow-hidden">
                <GridBackground opacity={0.2} />
                <div className="relative flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {editingBank ? t('admin.editBank') : t('admin.createNewBank')}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {editingBank ? 'Alterar informações do banco' : 'O código será gerado automaticamente'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {editingBank && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('admin.bankCode')}
                    </label>
                    <div className="w-full px-4 py-3 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400 font-mono">
                      {editingBank.code}
                      <span className="text-xs ml-2 text-gray-400">(não editável)</span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.bankName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Nome completo do banco"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.country')} *
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="PT" className="bg-white dark:bg-gray-800">🇵🇹 Portugal</option>
                    <option value="ES" className="bg-white dark:bg-gray-800">🇪🇸 Espanha</option>
                    <option value="DE" className="bg-white dark:bg-gray-800">🇩🇪 Alemanha</option>
                  </select>
                </div>
                {editingBank && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('admin.status')}
                    </label>
                    <div className="flex gap-4">
                      <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                        formData.is_active 
                          ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400' 
                          : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          checked={formData.is_active}
                          onChange={() => setFormData({ ...formData, is_active: true })}
                          className="sr-only"
                        />
                        <CheckCircle2 className="w-4 h-4" />
                        {t('common.active')}
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                        !formData.is_active 
                          ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400' 
                          : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          checked={!formData.is_active}
                          onChange={() => setFormData({ ...formData, is_active: false })}
                          className="sr-only"
                        />
                        <XCircle className="w-4 h-4" />
                        {t('common.inactive')}
                      </label>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all font-medium"
                  >
                    {t('common.cancel')}
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-600/30 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {editingBank ? t('common.save') : t('admin.createBank')}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && deletingBank && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Confirmar Exclusão
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Tem certeza que deseja excluir o banco:
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {deletingBank.code} - {deletingBank.name}
                </p>
                
                {deleteError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                    {deleteError}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all font-medium"
                  >
                    {t('common.cancel')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDelete}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg hover:shadow-red-600/30 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
