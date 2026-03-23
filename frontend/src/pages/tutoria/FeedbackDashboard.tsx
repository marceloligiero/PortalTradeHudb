import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, AlertTriangle, Users, ThumbsUp, ThumbsDown, Minus, ArrowLeft, Loader2 } from 'lucide-react';
import axios from '../../lib/axios';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface SentimentCounts {
  POSITIVE: number;
  NEUTRAL: number;
  NEGATIVE: number;
  UNKNOWN: number;
}

interface InterventionAlert {
  response_id: number;
  liberador_id: number;
  liberador_name: string;
  grabador_id: number;
  grabador_name: string;
  survey_id: number;
}

interface GrabadorScore {
  name: string;
  positive: number;
  neutral: number;
  negative: number;
}

interface DashboardData {
  total_responses: number;
  sentiment_counts: SentimentCounts;
  intervention_alerts: InterventionAlert[];
  grabador_scores: GrabadorScore[];
}

export default function FeedbackDashboard() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/feedback/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Suppress unused isDark lint warning — used implicitly via Tailwind dark: classes on document root
  void isDark;

  const cardBase =
    'rounded-xl border p-5 flex flex-col gap-1 ' +
    'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#EC0000]" />
      </div>
    );
  }

  if (!data || data.total_responses === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/tutoria/feedback')}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#EC0000] dark:text-gray-400 dark:hover:text-[#EC0000] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back', 'Voltar')}
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 className="w-14 h-14 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
            {t('feedbackDashboard.noResponses', 'Sem respostas ainda')}
          </p>
        </div>
      </div>
    );
  }

  const { total_responses, sentiment_counts, intervention_alerts, grabador_scores } = data;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tutoria/feedback')}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#EC0000] dark:text-gray-400 dark:hover:text-[#EC0000] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back', 'Voltar')}
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('feedbackDashboard.title', 'Dashboard de Feedback')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('feedbackDashboard.subtitle', 'Resumo de sentimentos e alertas de intervenção')}
          </p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">
            <BarChart3 className="w-4 h-4" />
            {t('feedbackDashboard.totalResponses', 'Total Respostas')}
          </div>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {total_responses}
          </span>
        </div>

        {/* Positive */}
        <div className={cardBase + ' border-l-4 border-l-emerald-500'}>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-1">
            <ThumbsUp className="w-4 h-4" />
            {t('feedbackDashboard.positive', 'Positivo')}
          </div>
          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {sentiment_counts.POSITIVE}
          </span>
        </div>

        {/* Neutral */}
        <div className={cardBase + ' border-l-4 border-l-amber-400'}>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wide mb-1">
            <Minus className="w-4 h-4" />
            {t('feedbackDashboard.neutral', 'Neutro')}
          </div>
          <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {sentiment_counts.NEUTRAL}
          </span>
        </div>

        {/* Negative */}
        <div className={cardBase + ' border-l-4 border-l-[#EC0000]'}>
          <div className="flex items-center gap-2 text-[#EC0000] dark:text-red-400 text-xs font-semibold uppercase tracking-wide mb-1">
            <ThumbsDown className="w-4 h-4" />
            {t('feedbackDashboard.negative', 'Negativo')}
          </div>
          <span className="text-3xl font-bold text-[#EC0000] dark:text-red-400">
            {sentiment_counts.NEGATIVE}
          </span>
        </div>
      </div>

      {/* ── Intervention Alerts ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-[#EC0000]" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('feedbackDashboard.interventionAlerts', 'Alertas de Intervenção')}
          </h2>
          {intervention_alerts.length > 0 && (
            <span className="ml-auto text-xs font-bold bg-[#EC0000] text-white rounded-full px-2 py-0.5">
              {intervention_alerts.length}
            </span>
          )}
        </div>

        {intervention_alerts.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center text-sm text-gray-400 dark:text-gray-500">
            {t('feedbackDashboard.noAlerts', 'Sem alertas de intervenção')}
          </div>
        ) : (
          <ul className="space-y-3">
            {intervention_alerts.map(alert => (
              <li
                key={alert.response_id}
                className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                    <span className="font-semibold">{alert.liberador_name}</span>
                    <span className="text-gray-400 dark:text-gray-500">→</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {t('feedbackDashboard.about', 'sobre')}
                    </span>
                    <span className="font-semibold">{alert.grabador_name}</span>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1 text-xs font-semibold bg-[#EC0000] text-white rounded-full px-2.5 py-0.5">
                    <AlertTriangle className="w-3 h-3" />
                    {t('feedbackDashboard.needsIntervention', 'Necessita Intervenção Tutor')}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/tutoria/feedback/${alert.survey_id}`)}
                  className="shrink-0 text-sm font-semibold text-[#EC0000] hover:text-[#CC0000] dark:text-red-400 dark:hover:text-red-300 border border-[#EC0000] dark:border-red-400 rounded-lg px-4 py-1.5 transition-colors"
                >
                  {t('feedbackDashboard.viewResponse', 'Ver Resposta')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Grabador Scores ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('feedbackDashboard.grabadorScores', 'Scores por Gravador')}
          </h2>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          {grabador_scores.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400 dark:text-gray-500">
              {t('feedbackDashboard.noScores', 'Sem dados de gravadores')}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    {t('feedbackDashboard.grabador', 'Gravador')}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                    {t('feedbackDashboard.distribution', 'Distribuição')}
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    {t('feedbackDashboard.counts', 'Contagens')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {grabador_scores.map((g, idx) => {
                  const total = g.positive + g.neutral + g.negative;
                  const pctPos = total > 0 ? (g.positive / total) * 100 : 0;
                  const pctNeu = total > 0 ? (g.neutral / total) * 100 : 0;
                  const pctNeg = total > 0 ? (g.negative / total) * 100 : 0;

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      {/* Name */}
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {g.name}
                      </td>

                      {/* Progress bar — hidden on mobile */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {total > 0 ? (
                          <div className="flex h-3 w-full min-w-[120px] rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                            {pctPos > 0 && (
                              <div
                                className="bg-emerald-500 h-full transition-all"
                                style={{ width: `${pctPos}%` }}
                                title={`Positivo: ${g.positive}`}
                              />
                            )}
                            {pctNeu > 0 && (
                              <div
                                className="bg-amber-400 h-full transition-all"
                                style={{ width: `${pctNeu}%` }}
                                title={`Neutro: ${g.neutral}`}
                              />
                            )}
                            {pctNeg > 0 && (
                              <div
                                className="bg-[#EC0000] h-full transition-all"
                                style={{ width: `${pctNeg}%` }}
                                title={`Negativo: ${g.negative}`}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-700" />
                        )}
                      </td>

                      {/* Counts */}
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-2 text-xs font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            +{g.positive}
                          </span>
                          <span className="text-amber-500 dark:text-amber-400 font-semibold">
                            ={g.neutral}
                          </span>
                          <span className="text-[#EC0000] dark:text-red-400 font-semibold">
                            -{g.negative}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
