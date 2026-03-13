import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { Bell, CheckCheck, ExternalLink, AlertTriangle, ClipboardList, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../lib/axios';

interface Notification {
  id: number;
  type: string;
  message: string;
  error_id: number | null;
  plan_id: number | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, typeof AlertTriangle> = {
  NEW_ERROR: AlertTriangle,
  PENDING_REVIEW: ClipboardList,
  STATUS_CHANGE: Info,
  PLAN_CREATED: ClipboardList,
};

export default function TutoriaNotifications() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/tutoria/notifications');
      setNotifications(res.data);
    } catch {
      // silently fail - empty notifications
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id: number) => {
    await api.patch(`/tutoria/notifications/${id}/read`);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllRead = async () => {
    await api.patch('/tutoria/notifications/read-all');
    setNotifications([]);
  };

  const handleClick = (n: Notification) => {
    markRead(n.id);
    if (n.error_id) navigate(`/tutoria/errors/${n.error_id}`);
    else if (n.plan_id) navigate(`/tutoria/plans/${n.plan_id}`);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-indigo-500" />
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('tutoriaNotifications.title', 'Notificações')}
          </h1>
          {notifications.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>
          )}
        </div>
        {notifications.length > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition">
            <CheckCheck className="w-4 h-4" />
            {t('tutoriaNotifications.markAllRead', 'Marcar todas como lidas')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className={`text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">{t('tutoriaNotifications.empty', 'Sem notificações pendentes')}</p>
          <p className="text-sm mt-1">{t('tutoriaNotifications.emptyDesc', 'Todas as notificações foram lidas.')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const Icon = TYPE_ICONS[n.type] || Info;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border ${
                  isDark
                    ? 'bg-gray-800/60 border-gray-700 hover:bg-gray-700/80'
                    : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'
                }`}
              >
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  n.type === 'NEW_ERROR' ? 'bg-red-500/10 text-red-500' :
                  n.type === 'PENDING_REVIEW' ? 'bg-yellow-500/10 text-yellow-500' :
                  'bg-indigo-500/10 text-indigo-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {n.message}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatDate(n.created_at)}
                  </p>
                </div>
                <ExternalLink className={`w-4 h-4 flex-shrink-0 mt-1 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
