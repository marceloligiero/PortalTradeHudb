import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';

interface PendingTrainer {
  id: number;
  email: string;
  full_name: string;
  is_pending: boolean;
}

const TrainerValidation = () => {
  const { t } = useTranslation();
  const [pendingTrainers, setPendingTrainers] = useState<PendingTrainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPendingTrainers();
  }, []);

  const fetchPendingTrainers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/pending-trainers');
      setPendingTrainers(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('messages.error'));
      setPendingTrainers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (trainerId: number, trainerName: string) => {
    if (!window.confirm(`${t('admin.confirmApproveTrainer')} ${trainerName}?`)) {
      return;
    }

    try {
      await api.post(`/api/admin/validate-trainer/${trainerId}`);
      setSuccessMessage(`${trainerName} ${t('admin.approvedTrainer')}`);
      
      // Remove trainer from list
      setPendingTrainers(prev => prev.filter(t => t.id !== trainerId));
      
      // Clear message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('messages.error'));
    }
  };

  const handleReject = async (trainerId: number, trainerName: string) => {
    if (!window.confirm(`${t('admin.confirmRejectTrainer')} ${trainerName}?`)) {
      return;
    }

    try {
      await api.post(`/api/admin/reject-trainer/${trainerId}`);
      setSuccessMessage(`${trainerName} ${t('admin.rejectedTrainer')}`);
      
      // Remove trainer from list
      setPendingTrainers(prev => prev.filter(t => t.id !== trainerId));
      
      // Clear message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('messages.error'));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">{t('messages.loading')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          {t('admin.pendingTrainerValidations')}
        </h2>
        <p className="text-gray-600 mt-1">
          {pendingTrainers.length} {t('admin.trainersPendingValidation')}
        </p>
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="m-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="p-6">
        {pendingTrainers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {t('admin.noTrainersPending')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTrainers.map((trainer) => (
              <div
                key={trainer.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {trainer.full_name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {trainer.email}
                    </p>
                    <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                      {t('admin.awaitingValidation')}
                    </span>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(trainer.id, trainer.full_name)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      {t('admin.approve')}
                    </button>
                    <button
                      onClick={() => handleReject(trainer.id, trainer.full_name)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      {t('admin.reject')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerValidation;
