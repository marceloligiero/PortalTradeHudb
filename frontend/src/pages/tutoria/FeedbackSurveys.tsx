import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Star, ChevronRight, Loader2, CheckCircle, Clock } from 'lucide-react';
import axios from '../../lib/axios';
import { useTheme } from '../../contexts/ThemeContext';

interface Survey {
  id: number;
  title: string;
  week_start: string;
  week_end: string;
  status: string;
  created_by_name: string;
  response_count: number;
  created_at: string;
}

export default function FeedbackSurveys() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', week_start: '', week_end: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    axios.get('/api/feedback/surveys')
      .then(r => setSurveys(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.week_start || !form.week_end) return;
    setCreating(true);
    try {
      const res = await axios.post('/api/feedback/surveys', form);
      setSurveys(prev => [res.data, ...prev]);
      setForm({ title: '', week_start: '', week_end: '' });
      setShowCreate(false);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao criar survey');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = async (id: number) => {
    try {
      const res = await axios.post(`/api/feedback/surveys/${id}/close`);
      setSurveys(prev => prev.map(s => s.id === id ? res.data : s));
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao fechar survey');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('feedback.surveysTitle', 'Feedback dos Liberadores')}
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('feedback.surveysSubtitle', 'Questionários semanais de avaliação')}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EC0000] text-white text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          {t('feedback.createSurvey', 'Nova Survey')}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className={`rounded-2xl border p-5 space-y-4 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('feedback.createSurveyTitle', 'Criar Nova Survey')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <input
                type="text"
                placeholder={t('feedback.surveyTitleLabel', 'Título da survey...')}
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className={`w-full px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-[#EC0000]/30`}
              />
            </div>
            <div>
              <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('feedback.weekStart', 'Início da semana')}
              </label>
              <input type="date" value={form.week_start}
                onChange={e => setForm(p => ({ ...p, week_start: e.target.value }))}
                className={`w-full px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}
              />
            </div>
            <div>
              <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('feedback.weekEnd', 'Fim da semana')}
              </label>
              <input type="date" value={form.week_end}
                onChange={e => setForm(p => ({ ...p, week_end: e.target.value }))}
                className={`w-full px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}
              />
            </div>
            <div className="flex items-end">
              <button onClick={handleCreate} disabled={creating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#EC0000] text-white text-xs font-bold disabled:opacity-50">
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {t('common.create', 'Criar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Survey list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#EC0000]" />
        </div>
      ) : surveys.length === 0 ? (
        <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-white border-gray-200'}`}>
          <Star className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {t('feedback.noSurveys', 'Nenhuma survey criada')}
          </p>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
            {surveys.map(s => (
              <div key={s.id}
                className={`px-5 py-4 flex items-center gap-4 ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'} transition-colors`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.status === 'OPEN' ? 'bg-emerald-500/15' : 'bg-gray-500/15'}`}>
                  {s.status === 'OPEN' ? <Clock className="w-4 h-4 text-emerald-500" /> : <CheckCircle className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/tutoria/feedback/${s.id}`)}>
                  <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.title}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {s.week_start} → {s.week_end} · {s.response_count} {t('feedback.responses', 'respostas')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.status === 'OPEN' && (
                    <button onClick={() => handleClose(s.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {t('feedback.close', 'Fechar')}
                    </button>
                  )}
                  <ChevronRight className={`w-4 h-4 cursor-pointer ${isDark ? 'text-gray-600' : 'text-gray-300'}`}
                    onClick={() => navigate(`/tutoria/feedback/${s.id}`)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
