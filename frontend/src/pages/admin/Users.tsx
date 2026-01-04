import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users as UsersIcon, 
  UserCheck, 
  UserX, 
  Clock, 
  Search, 
  Filter,
  MoreVertical,
  Mail,
  Shield,
  GraduationCap,
  Briefcase,
  ChevronDown,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  Trash2,
  RefreshCw
} from 'lucide-react';
import api from '../../lib/axios';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'TRAINEE' | 'TRAINER' | 'ADMIN';
  is_active: boolean;
  is_pending: boolean;
  created_at: string;
}

// Animated Counter Component
const AnimatedCounter = ({ value, className = '' }: { value: number; className?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span className={className}>{displayValue}</span>;
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="relative group"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
    <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center"
        >
          <Sparkles className="w-4 h-4 text-white/30" />
        </motion.div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">
        <AnimatedCounter value={value} />
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  </motion.div>
);

// User Row Component with animations
const UserRow = ({ user, index, onApprove, onReject, t }: any) => {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return Shield;
      case 'TRAINER': return Briefcase;
      default: return GraduationCap;
    }
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'ADMIN': return { 
        bg: 'from-purple-500/20 to-purple-600/20', 
        border: 'border-purple-500/30',
        text: 'text-purple-300',
        glow: 'shadow-purple-500/20'
      };
      case 'TRAINER': return { 
        bg: 'from-blue-500/20 to-blue-600/20', 
        border: 'border-blue-500/30',
        text: 'text-blue-300',
        glow: 'shadow-blue-500/20'
      };
      default: return { 
        bg: 'from-green-500/20 to-green-600/20', 
        border: 'border-green-500/30',
        text: 'text-green-300',
        glow: 'shadow-green-500/20'
      };
    }
  };

  const RoleIcon = getRoleIcon(user.role);
  const roleConfig = getRoleConfig(user.role);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      className="group relative"
    >
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/5 to-red-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative grid grid-cols-12 gap-4 items-center px-6 py-5 border-b border-white/5">
        {/* Avatar & Name */}
        <div className="col-span-4 flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="relative"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roleConfig.bg} ${roleConfig.border} border flex items-center justify-center shadow-lg ${roleConfig.glow}`}>
              <span className={`text-lg font-bold ${roleConfig.text}`}>
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            {user.is_pending && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-gray-900"
              />
            )}
          </motion.div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-red-300 transition-colors">
              {user.full_name}
            </h3>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Mail className="w-3 h-3" />
              {user.email}
            </div>
          </div>
        </div>

        {/* Role Badge */}
        <div className="col-span-2">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${roleConfig.bg} ${roleConfig.border} border`}
          >
            <RoleIcon className={`w-4 h-4 ${roleConfig.text}`} />
            <span className={`text-sm font-medium ${roleConfig.text}`}>
              {t(`roles.${user.role.toLowerCase()}`)}
            </span>
          </motion.div>
        </div>

        {/* Status */}
        <div className="col-span-3">
          {user.is_pending ? (
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2 text-yellow-400"
            >
              <div className="relative">
                <Clock className="w-5 h-5" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <div className="w-1 h-1 bg-yellow-400 rounded-full absolute top-0 left-1/2 -translate-x-1/2" />
                </motion.div>
              </div>
              <span className="font-medium">{t('admin.pending')}</span>
              <span className="text-xs text-yellow-500/60 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                Aguardando
              </span>
            </motion.div>
          ) : user.is_active ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">{t('admin.active')}</span>
              <span className="text-xs text-green-500/60 bg-green-500/10 px-2 py-0.5 rounded-full">
                Online
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">{t('admin.inactive')}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="col-span-3 flex items-center justify-end gap-2">
          {user.is_pending && user.role === 'TRAINER' ? (
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onApprove(user.id)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-green-900/30 transition-all"
              >
                <UserCheck className="w-4 h-4" />
                {t('admin.approve')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onReject(user.id)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-red-900/30 transition-all"
              >
                <UserX className="w-4 h-4" />
                {t('admin.reject')}
              </motion.button>
            </div>
          ) : (
            <div className="relative" ref={actionsRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowActions(!showActions)}
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </motion.button>
              
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
                  >
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all">
                      <Eye className="w-4 h-4" />
                      Ver Detalhes
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all">
                      <Edit3 className="w-4 h-4" />
                      Editar
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all">
                      <Trash2 className="w-4 h-4" />
                      Remover
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'pending' ? user.is_pending :
      filter === 'active' ? user.is_active && !user.is_pending :
      !user.is_active;
    
    const matchesSearch = searchQuery === '' || 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const filterOptions = [
    { key: 'all', icon: UsersIcon, label: t('admin.filter.all'), count: users.length },
    { key: 'pending', icon: Clock, label: t('admin.filter.pending'), count: users.filter(u => u.is_pending).length },
    { key: 'active', icon: UserCheck, label: t('admin.filter.active'), count: users.filter(u => u.is_active && !u.is_pending).length },
    { key: 'inactive', icon: UserX, label: t('admin.filter.inactive'), count: users.filter(u => !u.is_active).length },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(220, 38, 38, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(220, 38, 38, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] bg-red-600/10"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] bg-blue-600/10"
        />
      </div>

      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-2xl shadow-red-900/50"
                >
                  <UsersIcon className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
                    {t('navigation.users')}
                  </h1>
                  <p className="text-gray-400 mt-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-red-500" />
                    {t('admin.manageUsers')}
                  </p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchUsers}
                disabled={loading}
                className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
              >
                <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard 
                icon={UsersIcon} 
                label={t('admin.totalUsers')} 
                value={users.length} 
                color="from-red-600 to-red-700"
                delay={0}
              />
              <StatCard 
                icon={Clock} 
                label={t('admin.pendingApproval')} 
                value={users.filter(u => u.is_pending).length} 
                color="from-yellow-500 to-orange-500"
                delay={0.1}
              />
              <StatCard 
                icon={UserCheck} 
                label={t('admin.activeUsers')} 
                value={users.filter(u => u.is_active && !u.is_pending).length} 
                color="from-green-500 to-emerald-600"
                delay={0.2}
              />
              <StatCard 
                icon={Briefcase} 
                label={t('admin.totalTrainers')} 
                value={users.filter(u => u.role === 'TRAINER').length} 
                color="from-blue-500 to-indigo-600"
                delay={0.3}
              />
            </div>

            {/* Search & Filters Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between"
            >
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Pesquisar utilizadores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFilter(option.key as any)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                        filter === option.key
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/40'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{option.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        filter === option.key 
                          ? 'bg-white/20' 
                          : 'bg-white/5'
                      }`}>
                        {option.count}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>

          {/* Users List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative"
          >
            {/* Glass Card Container */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 rounded-3xl blur-xl" />
            <div className="relative bg-white/[0.02] backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10">
                <div className="col-span-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Utilizador
                </div>
                <div className="col-span-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Função
                </div>
                <div className="col-span-3 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Estado
                </div>
                <div className="col-span-3 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">
                  Ações
                </div>
              </div>

              {/* Users List */}
              <div className="divide-y divide-white/5">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-2 border-red-500/30 border-t-red-500 rounded-full mb-4"
                    />
                    <p className="text-gray-400">{t('messages.loading')}</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <AlertCircle className="w-10 h-10 text-gray-500" />
                    </div>
                    <p className="text-gray-400 text-lg">{t('admin.noUsers')}</p>
                    <p className="text-gray-500 text-sm mt-1">Tente ajustar os filtros de pesquisa</p>
                  </div>
                ) : (
                  filteredUsers.map((user, index) => (
                    <UserRow 
                      key={user.id} 
                      user={user} 
                      index={index}
                      onApprove={handleApproveTrainer}
                      onReject={handleRejectTrainer}
                      t={t}
                    />
                  ))
                )}
              </div>

              {/* Footer */}
              {!loading && filteredUsers.length > 0 && (
                <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    A mostrar <span className="text-white font-medium">{filteredUsers.length}</span> de <span className="text-white font-medium">{users.length}</span> utilizadores
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Powered by</span>
                    <span className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">TradeHub</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
