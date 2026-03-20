import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import axios from '../../lib/axios';
import { useTheme } from '../../contexts/ThemeContext';

interface Response {
  id: number;
  liberador_id: number;
  liberador_name: string;
  grabador_id: number;
  grabador_name: string;
  opinion: string | null;
  sentiment: string | null;
  concrete_situations: string | null;
  needs_tutor_intervention: boolean;
  submitted_at: string;
  actions: { id: number; action_type: string; description: string; created_at: string }[];
}

interface Survey {
  id: number;
  title: string;
  week_start: string;
  week_end: string;
  status: string;
  response_count: number;
  responses?: Response[];
}

const SENTIMENT_COLORS: Record<string, string> = {
  POSITIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  NEUTRAL: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  NEGATIVE: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

export default function FeedbackSurveyDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionForms, setActionForms] = useState<Record<number, { type: string; desc: string }>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/feedback/surveys/${id}`)
      .then(r => setSurvey(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddAction = async (responseId: number) => {
    const f = actionForms[responseId];
    if (!f?.type || !f?.desc) return;
    setSaving(prev => ({ ...prev, [responseId]: true }));
    try {
      const res = await axios.post('/api/feedback/actions', {
        response_id: responseId,
        action_type: f.type,
        description: f.desc,
      });
      setSurvey(prev => {
        if (!prev?.responses) return prev;
        return {
          ...prev,
          responses: prev.responses.map(r =>
            r.id === responseId ? { ...r, actions: [...r.actions, res.data] } : r
          ),
        };
      });
      setActionForms(prev => ({ ...prev, [responseId]: { type: '', desc: '' } }));
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro');
    } finally {
      setSaving(prev => ({ ...prev, [responseId]: false }));
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#EC0000]" /></div>
  );

  if (!survey) return (
    <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Survey não encontrada</div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/tutoria/feedback')}
          className={`p-2 rounded-xl ${isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-100'}`}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{survey.title}</h1>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {survey.week_start} → {survey.week_end} ·{' '}
            <span className={`font-semibold ${survey.status === 'OPEN' ? 'text-emerald-500' : 'text-gray-400'}`}>
              {survey.status}
            </span>
          </p>
        </div>
      </div>

      {(!survey.responses || survey.responses.length === 0) ? (
        <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {t('feedback.noResponses', 'Ainda sem respostas.')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {survey.responses.map(r => (
            <div key={r.id}
              className={`rounded-2xl border p-5 space-y-3 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}>
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {r.liberador_name} → {r.grabador_name}
                </p>
                <div className="flex items-center gap-2">
                  {r.sentiment && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SENTIMENT_COLORS[r.sentiment] || ''}`}>
                      {r.sentiment}
                    </span>
                  )}
                  {r.needs_tutor_intervention && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {t('feedback.needsIntervention', 'Intervenção')}
                    </span>
                  )}
                </div>
              </div>

              {/* Fields */}
              {r.opinion && (
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('feedback.opinion', 'Opinião')}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{r.opinion}</p>
                </div>
              )}
              {r.concrete_situations && (
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('feedback.concreteSituations', 'Situações Concretas')}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{r.concrete_situations}</p>
                </div>
              )}

              {/* Actions */}
              {r.actions.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('feedback.actions', 'Acções')}
                  </p>
                  <div className="space-y-1.5">
                    {r.actions.map(a => (
                      <div key={a.id} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${isDark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                        <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span><strong>{a.action_type}</strong>: {a.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add action */}
              <div className="flex gap-2 pt-1">
                <select
                  value={actionForms[r.id]?.type || ''}
                  onChange={e => setActionForms(prev => ({ ...prev, [r.id]: { ...prev[r.id], type: e.target.value, desc: prev[r.id]?.desc || '' } }))}
                  className={`text-xs px-2 py-1.5 rounded-lg border ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                >
                  <option value="">Tipo de acção...</option>
                  <option value="FEEDBACK_DIRETO">Feedback Direto</option>
                  <option value="TUTORIA">Tutoria</option>
                  <option value="SEGUIMENTO">Seguimento</option>
                  <option value="OUTRO">Outro</option>
                </select>
                <input
                  type="text"
                  placeholder={t('feedback.describeAction', 'Descrição da acção...')}
                  value={actionForms[r.id]?.desc || ''}
                  onChange={e => setActionForms(prev => ({ ...prev, [r.id]: { ...prev[r.id], desc: e.target.value, type: prev[r.id]?.type || '' } }))}
                  className={`flex-1 text-xs px-2 py-1.5 rounded-lg border ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
                <button
                  onClick={() => handleAddAction(r.id)}
                  disabled={saving[r.id]}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold disabled:opacity-50">
                  {saving[r.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
