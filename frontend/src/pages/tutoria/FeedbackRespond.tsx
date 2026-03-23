import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, Star } from 'lucide-react';
import axios from '../../lib/axios';
import { useTheme } from '../../contexts/ThemeContext';

interface PendingSurvey {
  id: number;
  title: string;
  week_start: string;
  week_end: string;
  status: string;
  responded_grabadors: number[];
}

interface TeamMember {
  id: number;
  full_name: string;
}

export default function FeedbackRespond() {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const [surveys, setSurveys] = useState<PendingSurvey[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<PendingSurvey | null>(null);
  const [form, setForm] = useState({
    grabador_id: '',
    opinion: '',
    sentiment: '',
    concrete_situations: '',
    needs_tutor_intervention: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get('/api/feedback/my-pending'),
      axios.get('/api/tutoria/team'),
    ]).then(([sRes, tRes]) => {
      setSurveys(Array.isArray(sRes.data) ? sRes.data : []);
      setTeam(Array.isArray(tRes.data) ? tRes.data : []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!selectedSurvey || !form.grabador_id) return;
    setSubmitting(true);
    try {
      await axios.post('/api/feedback/responses', {
        survey_id: selectedSurvey.id,
        grabador_id: parseInt(form.grabador_id),
        opinion: form.opinion || null,
        sentiment: form.sentiment || null,
        concrete_situations: form.concrete_situations || null,
        needs_tutor_intervention: form.needs_tutor_intervention,
      });
      setSubmitted(true);
      setForm({ grabador_id: '', opinion: '', sentiment: '', concrete_situations: '', needs_tutor_intervention: false });
      setSelectedSurvey(null);
      // Refresh surveys
      const res = await axios.get('/api/feedback/my-pending');
      setSurveys(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao submeter feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#EC0000]" /></div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('feedback.respondTitle', 'Responder Feedback')}
        </h1>
        <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('feedback.respondSubtitle', 'Avalie os gravadores da sua equipa')}
        </p>
      </div>

      {submitted && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          {t('feedback.submittedSuccess', 'Feedback submetido com sucesso!')}
        </div>
      )}

      {surveys.length === 0 ? (
        <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-white border-gray-200'}`}>
          <Star className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {t('feedback.noPendingSurveys', 'Não há surveys pendentes')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Survey selection */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('feedback.selectSurvey', 'Selecionar Survey')}
            </label>
            <div className="space-y-2">
              {surveys.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSurvey(s)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-sm transition-colors ${
                    selectedSurvey?.id === s.id
                      ? 'border-[#EC0000] bg-[#EC0000]/5 text-[#EC0000]'
                      : `border-gray-200 dark:border-white/10 ${isDark ? 'text-gray-300 hover:bg-white/[0.03]' : 'text-gray-700 hover:bg-gray-50'}`
                  }`}
                >
                  <Star className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-xs opacity-70">{s.week_start} → {s.week_end}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Response form */}
          {selectedSurvey && (
            <div className={`rounded-2xl border p-5 space-y-4 ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('feedback.responseForm', 'Formulário de Resposta')} — {selectedSurvey.title}
              </h2>

              {/* Grabador select */}
              <div>
                <label className={`block text-xs font-semibold uppercase mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('feedback.grabadorLabel', 'Gravador')} *
                </label>
                <select value={form.grabador_id} onChange={e => setForm(p => ({ ...p, grabador_id: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                  <option value="">{t('feedback.selectGrabador', 'Selecione o gravador...')}</option>
                  {team.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Sentiment */}
              <div>
                <label className={`block text-xs font-semibold uppercase mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('feedback.sentimentLabel', 'Sentimento Geral')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'POSITIVE', label: t('feedback.sentimentPositive', 'Positivo'), cls: 'text-emerald-600 border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' },
                    { value: 'NEUTRAL', label: t('feedback.sentimentNeutral', 'Neutro'), cls: 'text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-500/10' },
                    { value: 'NEGATIVE', label: t('feedback.sentimentNegative', 'Negativo'), cls: 'text-red-600 border-red-400 bg-red-50 dark:bg-red-500/10' },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(p => ({ ...p, sentiment: p.sentiment === opt.value ? '' : opt.value }))}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                        form.sentiment === opt.value ? opt.cls + ' border-current' : 'border-gray-200 dark:border-white/10 text-gray-500'
                      }`}>{opt.label}</button>
                  ))}
                </div>
              </div>

              {/* Opinion */}
              <div>
                <label className={`block text-xs font-semibold uppercase mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('feedback.opinionLabel', 'Opinião')}
                </label>
                <textarea rows={3} value={form.opinion} onChange={e => setForm(p => ({ ...p, opinion: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-[#EC0000]/30`}
                  placeholder={t('feedback.opinionPlaceholder', 'Opinião geral sobre o desempenho do gravador...')} />
              </div>

              {/* Concrete situations */}
              <div>
                <label className={`block text-xs font-semibold uppercase mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('feedback.concreteLabel', 'Situações Concretas')}
                </label>
                <textarea rows={3} value={form.concrete_situations} onChange={e => setForm(p => ({ ...p, concrete_situations: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-[#EC0000]/30`}
                  placeholder={t('feedback.concretePlaceholder', 'Descreva situações específicas observadas...')} />
              </div>

              {/* Tutor intervention */}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="tutor-intervention" checked={form.needs_tutor_intervention}
                  onChange={e => setForm(p => ({ ...p, needs_tutor_intervention: e.target.checked }))}
                  className="w-4 h-4 accent-[#EC0000]" />
                <label htmlFor="tutor-intervention" className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('feedback.needsInterventionLabel', 'Requer intervenção do Tutor')}
                </label>
              </div>

              {/* Submit */}
              <div className="pt-1">
                <button onClick={handleSubmit} disabled={submitting || !form.grabador_id}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EC0000] text-white text-sm font-bold disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {t('feedback.submitResponse', 'Submeter Feedback')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
