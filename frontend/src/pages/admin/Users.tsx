import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users as UsersIcon, UserCheck, UserX, Clock } from 'lucide-react';
import api from '../../lib/axios';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'STUDENT' | 'TRAINER' | 'ADMIN';
  is_active: boolean;
  is_pending: boolean;
  created_at: string;
}

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/users');
      setUsers(response.data?.items ?? response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTrainer = async (userId: number) => {
    try {
      await api.post(`/api/admin/validate-trainer/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error('Error approving trainer:', error);
    }
  };

  const handleRejectTrainer = async (userId: number) => {
    try {
      await api.delete(`/api/admin/reject-trainer/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting trainer:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'pending') return user.is_pending;
    if (filter === 'active') return user.is_active && !user.is_pending;
    if (filter === 'inactive') return !user.is_active;
    return true;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'TRAINER': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'STUDENT': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/50">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                {t('navigation.users')}
              </h1>
              <p className="text-gray-400">{t('admin.manageUsers')}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {['all', 'pending', 'active', 'inactive'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === f
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {t(`admin.filter.${f}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {t('admin.name')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {t('admin.email')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {t('admin.role')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {t('admin.status')}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                    {t('admin.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      {t('messages.loading')}
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      {t('admin.noUsers')}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">
                        {user.full_name}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                          {t(`roles.${user.role.toLowerCase()}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_pending ? (
                          <span className="flex items-center gap-2 text-yellow-400">
                            <Clock className="w-4 h-4" />
                            {t('admin.pending')}
                          </span>
                        ) : user.is_active ? (
                          <span className="flex items-center gap-2 text-green-400">
                            <UserCheck className="w-4 h-4" />
                            {t('admin.active')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-red-400">
                            <UserX className="w-4 h-4" />
                            {t('admin.inactive')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.is_pending && user.role === 'TRAINER' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApproveTrainer(user.id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              {t('admin.approve')}
                            </button>
                            <button
                              onClick={() => handleRejectTrainer(user.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              {t('admin.reject')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <div className="text-sm text-gray-400">{t('admin.totalUsers')}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {users.filter(u => u.is_pending).length}
            </div>
            <div className="text-sm text-gray-400">{t('admin.pendingApproval')}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
            <div className="text-2xl font-bold text-green-400">
              {users.filter(u => u.is_active && !u.is_pending).length}
            </div>
            <div className="text-sm text-gray-400">{t('admin.activeUsers')}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
            <div className="text-2xl font-bold text-blue-400">
              {users.filter(u => u.role === 'TRAINER').length}
            </div>
            <div className="text-sm text-gray-400">{t('admin.totalTrainers')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
