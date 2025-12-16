import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../lib/axios';

interface Bank {
  id: number;
  code: string;
  name: string;
  country: string;
  is_active: boolean;
  created_at: string;
}

export default function BanksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    country: 'PT'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/banks', formData);
      setShowModal(false);
      setFormData({ code: '', name: '', country: 'PT' });
      fetchBanks();
    } catch (error) {
      console.error('Error creating bank:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                {t('admin.banks')}
              </h1>
              <p className="text-gray-400">{t('admin.manageBanks')}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-900/50"
          >
            <Plus className="w-5 h-5" />
            {t('admin.newBank')}
          </button>
        </div>

        {/* Banks Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            {t('messages.loading')}
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Código</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">País</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Data de Criação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {banks.map((bank) => (
                  <tr key={bank.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{bank.code}</td>
                    <td className="px-6 py-4 text-white">{bank.name}</td>
                    <td className="px-6 py-4 text-gray-400">{bank.country}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        bank.is_active 
                          ? 'bg-green-500/10 text-green-400' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {bank.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(bank.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
            <div className="text-2xl font-bold text-white">{banks.length}</div>
            <div className="text-sm text-gray-400">Total de Bancos</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
            <div className="text-2xl font-bold text-green-400">
              {banks.filter(b => b.is_active).length}
            </div>
            <div className="text-sm text-gray-400">Bancos Ativos</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
            <div className="text-2xl font-bold text-blue-400">
              {new Set(banks.map(b => b.country)).size}
            </div>
            <div className="text-sm text-gray-400">Países</div>
          </div>
        </div>
      </div>

      {/* Create Bank Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl border border-white/10 p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-6">Criar Novo Banco</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Código do Banco *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: PT001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Banco *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Santander Portugal"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  País *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="PT">Portugal</option>
                  <option value="ES">Espanha</option>
                  <option value="BR">Brasil</option>
                  <option value="MX">México</option>
                  <option value="AR">Argentina</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Criar Banco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
