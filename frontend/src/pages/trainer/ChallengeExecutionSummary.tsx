import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Check, AlertCircle, TrendingUp, Target,
  Clock, User, Plus, Trash2, CheckCircle, XCircle,
} from 'lucide-react';
import api from '../../lib/axios';

/* ── Types ── */

interface Challenge {
  id: number;
  title: string;
  description: string;
  challenge_type: string;
  operations_required: number;
  time_limit_minutes: number;
  target_mpu: number;
  max_errors?: number;
  target_kpi?: string;
}

interface ErrorDetail {
  id: number;
  error_type: 'METHODOLOGY' | 'KNOWLEDGE' | 'DETAIL' | 'PROCEDURE';
  description: string;
  operation_reference: string;
}

const ERROR_TYPES = [
  { value: 'METHODOLOGY', label: 'challengeExecution.errorMethodology', description: 'challengeExecution.errorMethodologyDesc' },
  { value: 'KNOWLEDGE', label: 'challengeExecution.errorKnowledge', description: 'challengeExecution.errorKnowledgeDesc' },
  { value: 'DETAIL', label: 'challengeExecution.errorDetail', description: 'challengeExecution.errorDetailDesc' },
  { value: 'PROCEDURE', label: 'challengeExecution.errorProcedure', description: 'challengeExecution.errorProcedureDesc' },
];

/* ── Shared styles ── */

const inputCls = 'w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#EC0000]/20 focus:border-[#EC0000]/40 transition-colors';
const labelCls = 'flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5';
const hintCls = 'text-[11px] text-gray-400 dark:text-gray-500 mt-1';
const sectionLabel = 'flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider';

export default function ChallengeExecutionSummary() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { challengeId } = useParams<{ challengeId: string }>();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  const studentIdParam = searchParams.get('studentId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [planStudent, setPlanStudent] = useState<{ id: number; full_name: string; email: string } | null>(null);
  const [students, setStudents] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    total_operations: 0,
    total_time_minutes: 0,
    operation_reference: '',
    operations_with_errors: 0,
  });

  const [errorDetails, setErrorDetails] = useState<ErrorDetail[]>([]);
  const [nextErrorId, setNextErrorId] = useState(1);
  const [calculatedMpu, setCalculatedMpu] = useState(0);

  /* ── Data loading ── */

  useEffect(() => {
    loadChallenge();
    if (planId) loadPlanStudent();
    else loadStudents();
  }, [challengeId, planId]);

  useEffect(() => {
    if (formData.total_operations > 0 && formData.total_time_minutes > 0) {
      setCalculatedMpu(formData.total_time_minutes / formData.total_operations);
    } else {
      setCalculatedMpu(0);
    }
  }, [formData.total_operations, formData.total_time_minutes]);

  const loadChallenge = async () => {
    try {
      const response = await api.get(`/api/challenges/${challengeId}`);
      setChallenge(response.data);
    } catch {
      setError(t('challenges.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const loadPlanStudent = async () => {
    try {
      const response = await api.get(`/api/training-plans/${planId}`);
      const plan = response.data;
      const enrolled = plan.enrolled_students || [];

      if (studentIdParam && enrolled.length > 0) {
        const target = enrolled.find((s: any) => s.id === parseInt(studentIdParam));
        if (target) {
          setPlanStudent({ id: target.id, full_name: target.full_name, email: target.email });
          setSelectedStudentId(target.id);
          return;
        }
      }

      if (enrolled.length === 1) {
        const s = enrolled[0];
        setPlanStudent({ id: s.id, full_name: s.full_name, email: s.email });
        setSelectedStudentId(s.id);
        return;
      } else if (enrolled.length > 1) {
        setStudents(enrolled.map((s: any) => ({ id: s.id, full_name: s.full_name, email: s.email })));
        return;
      }

      if (plan.student) {
        setPlanStudent(plan.student);
        setSelectedStudentId(plan.student.id);
      } else if (plan.student_id) {
        const userResp = await api.get(`/api/admin/users/${plan.student_id}`);
        const user = userResp.data;
        setPlanStudent({ id: user.id, full_name: user.full_name, email: user.email });
        setSelectedStudentId(user.id);
      } else {
        loadStudents();
      }
    } catch {
      loadStudents();
    }
  };

  const loadStudents = async () => {
    try {
      const resp = await api.get(`/api/challenges/${challengeId}/eligible-students`);
      const remote = resp.data ?? [];
      const mapped = (Array.isArray(remote) ? remote : []).map((s: any) => ({
        id: s.id, full_name: s.full_name || s.name, email: s.email,
      }));
      if (mapped.length > 0) { setStudents(mapped); return; }

      try {
        const respT = await api.get('/api/trainer/reports/students');
        const m = (respT.data ?? []).map((s: any) => ({ id: s.id, full_name: s.full_name || s.name, email: s.email }));
        if (m.length > 0) { setStudents(m); return; }
      } catch { /* ignore */ }

      try {
        const respA = await api.get('/api/admin/students');
        setStudents((respA.data ?? []).map((s: any) => ({ id: s.id, full_name: s.full_name || s.name, email: s.email })));
      } catch {
        setStudents([]);
      }
    } catch {
      setStudents([]);
    }
  };

  /* ── Error management ── */

  const addError = () => {
    setErrorDetails([...errorDetails, { id: nextErrorId, error_type: 'METHODOLOGY', description: '', operation_reference: '' }]);
    setNextErrorId(nextErrorId + 1);
  };

  const updateError = (id: number, field: keyof ErrorDetail, value: string) => {
    setErrorDetails(errorDetails.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeError = (id: number) => {
    setErrorDetails(errorDetails.filter(e => e.id !== id));
  };

  /* ── Submit ── */

  const handleSubmit = async () => {
    if (!selectedStudentId) { setError(t('challenges.selectStudent')); return; }
    if (formData.total_operations === 0 || formData.total_time_minutes === 0) { setError(t('challenges.fillOperationsTime')); return; }

    const errorCounts = {
      methodology: errorDetails.filter(e => e.error_type === 'METHODOLOGY').length,
      knowledge: errorDetails.filter(e => e.error_type === 'KNOWLEDGE').length,
      detail: errorDetails.filter(e => e.error_type === 'DETAIL').length,
      procedure: errorDetails.filter(e => e.error_type === 'PROCEDURE').length,
    };

    setSubmitting(true);
    setError('');

    try {
      const response = await api.post('/api/challenges/submit/summary', {
        challenge_id: parseInt(challengeId || '0'),
        user_id: selectedStudentId,
        training_plan_id: planId ? parseInt(planId) : null,
        submission_type: 'SUMMARY',
        total_operations: formData.total_operations,
        total_time_minutes: formData.total_time_minutes,
        errors_count: formData.operations_with_errors,
        error_methodology: errorCounts.methodology,
        error_knowledge: errorCounts.knowledge,
        error_detail: errorCounts.detail,
        error_procedure: errorCounts.procedure,
        error_details: errorDetails.map(e => ({
          error_type: e.error_type,
          description: e.description,
          operation_reference: formData.operation_reference?.includes(',')
            ? (e.operation_reference || formData.operation_reference)
            : (formData.operation_reference || null),
        })),
        operation_reference: formData.operation_reference || null,
      });

      const resultUrl = planId
        ? `/challenges/result/${response.data.id}?planId=${planId}`
        : `/challenges/result/${response.data.id}`;
      navigate(resultUrl);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('challenges.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Computed ── */

  const getApprovalStatus = () => {
    if (!challenge || calculatedMpu === 0) return null;
    const isMpuOk = calculatedMpu <= challenge.target_mpu;
    const errorsOk = formData.operations_with_errors <= (challenge.max_errors ?? 0);
    const isApproved = isMpuOk && errorsOk;
    const percentage = (challenge.target_mpu / calculatedMpu) * 100;
    return { isApproved, percentage };
  };

  const approvalStatus = getApprovalStatus();
  const maxErrors = challenge?.max_errors ?? 0;
  const errorsExceeded = formData.operations_with_errors > maxErrors;
  const canSubmit = !!selectedStudentId && formData.total_operations > 0 && formData.total_time_minutes > 0 && !submitting;
  const refs = formData.operation_reference ? formData.operation_reference.split(',').map(r => r.trim()).filter(Boolean) : [];
  const hasMultipleRefs = refs.length > 1;

  /* ── Loading / Not found ── */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-[3px] border-[#EC0000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('submissionReview.challengeNotFound', 'Desafio não encontrado')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => planId ? navigate(`/training-plans/${planId}`) : navigate(-1)}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {challenge.title}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('challenges.typeSummaryTitle', 'Desafio Resumido')}
            {' · '}{challenge.operations_required} ops · {challenge.time_limit_minutes} min · MPU ≤ {challenge.target_mpu.toFixed(2)}
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#EC0000] hover:bg-[#CC0000] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {t('challengeExecution.submitChallenge', 'Submeter')}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Main card ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">

        {/* Student section */}
        <div className="p-5">
          <div className={sectionLabel + ' mb-3'}>
            <User className="w-3.5 h-3.5" />
            {t('submissionReview.student', 'Formando')}
          </div>
          {planStudent ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{planStudent.full_name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{planStudent.full_name}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{planStudent.email}</p>
              </div>
            </div>
          ) : (
            <select
              value={selectedStudentId ?? ''}
              onChange={(e) => setSelectedStudentId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className={inputCls}
            >
              <option value="">{t('placeholders.selectStudent')}</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
              ))}
            </select>
          )}
        </div>

        {/* Results section */}
        <div className="p-5 space-y-4">
          <div className={sectionLabel}>
            <Target className="w-3.5 h-3.5" />
            {t('challengeExecution.results', 'Resultados')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Operations */}
            <div>
              <label className={labelCls}>
                <Target className="w-3.5 h-3.5 text-[#EC0000]" />
                {t('challengeExecution.totalOperationsPerformed', 'Operações Realizadas')} *
              </label>
              <input
                type="number"
                value={formData.total_operations || ''}
                onChange={(e) => setFormData({ ...formData, total_operations: parseInt(e.target.value) || 0 })}
                className={inputCls}
                placeholder="Ex: 120"
                min="0"
              />
              <p className={hintCls}>{t('challengeExecution.operationsTarget', 'Meta')}: {challenge.operations_required} ops</p>
            </div>

            {/* Time */}
            <div>
              <label className={labelCls}>
                <Clock className="w-3.5 h-3.5 text-[#EC0000]" />
                {t('challengeExecution.totalTimeMinutes', 'Tempo (minutos)')} *
              </label>
              <input
                type="number"
                value={formData.total_time_minutes || ''}
                onChange={(e) => setFormData({ ...formData, total_time_minutes: parseInt(e.target.value) || 0 })}
                className={inputCls}
                placeholder="Ex: 55"
                min="0"
              />
              <p className={hintCls}>{t('challengeExecution.limit', 'Limite')}: {challenge.time_limit_minutes} min</p>
            </div>

            {/* Operations with errors */}
            <div>
              <label className={labelCls}>
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                {t('challengeExecution.operationsWithErrors', 'Ops com Erro')} *
              </label>
              <input
                type="number"
                value={formData.operations_with_errors || ''}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 0;
                  setFormData({ ...formData, operations_with_errors: v });
                  if (v === 0) setErrorDetails([]);
                }}
                className={`${inputCls} ${errorsExceeded ? '!border-red-400 dark:!border-red-500' : ''}`}
                placeholder="Ex: 2"
                min="0"
              />
              <p className={`${hintCls} ${errorsExceeded ? '!text-red-500' : ''}`}>
                {t('challengeExecution.maxAllowed', 'Máx')}: {maxErrors}
                {errorsExceeded && ` — ${t('challengeExecution.exceeded', 'EXCEDIDO')}`}
              </p>
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className={labelCls}>
              <Target className="w-3.5 h-3.5 text-gray-400" />
              {t('challengeExecution.operationReference', 'Referência da Operação')}
            </label>
            <input
              type="text"
              value={formData.operation_reference}
              onChange={(e) => setFormData({ ...formData, operation_reference: e.target.value })}
              className={inputCls}
              placeholder="Ex: OP-2024-001, REF-123456"
            />
            <p className={hintCls}>{t('challengeExecution.referencesHint', 'Separe por vírgula se forem várias')}</p>
          </div>
        </div>

        {/* MPU calculated panel */}
        {calculatedMpu > 0 && (
          <div className="p-5">
            <div className={`rounded-lg p-4 border ${
              approvalStatus?.isApproved
                ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    {t('submissionReview.calculatedMPU', 'MPU Calculado')}
                  </p>
                  <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">
                    {calculatedMpu.toFixed(2)} <span className="text-sm font-normal text-gray-400">min/op</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    approvalStatus?.isApproved
                      ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                  }`}>
                    {approvalStatus?.isApproved
                      ? <><CheckCircle className="w-3.5 h-3.5" />{t('submissionReview.approved', 'APROVADO')}</>
                      : <><XCircle className="w-3.5 h-3.5" />{t('submissionReview.rejected', 'REPROVADO')}</>
                    }
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                    {approvalStatus?.percentage && approvalStatus.percentage >= 100
                      ? t('challengeExecution.targetReached', 'Meta atingida')
                      : `${Math.min(approvalStatus?.percentage ?? 0, 100).toFixed(1)}% ${t('challengeExecution.ofTarget', 'da meta')}`
                    }
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.total_time_minutes} min ÷ {formData.total_operations} ops = {calculatedMpu.toFixed(2)} min/op
                  {' · '}{t('challengeExecution.approvalTarget', 'Meta')}: ≤ {challenge.target_mpu.toFixed(2)} min/op
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error details section */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className={sectionLabel}>
              <AlertCircle className="w-3.5 h-3.5" />
              {t('challengeExecution.errorsMade', 'Erros Detalhados')}
              <span className="text-[10px] font-mono font-normal text-gray-400 dark:text-gray-500 ml-1">
                ({errorDetails.length})
              </span>
            </div>
            <button
              type="button"
              onClick={addError}
              disabled={formData.operations_with_errors === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('submissionReview.addError', 'Adicionar')}
            </button>
          </div>

          {formData.operations_with_errors === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">
              {t('challengeExecution.informErrorsFirst', 'Informe o número de "Ops com Erro" para registar erros detalhados.')}
            </p>
          ) : errorDetails.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">
              {t('challengeExecution.noErrorsRegistered', 'Nenhum erro registado. Clique em "Adicionar" para registar.')}
            </p>
          ) : (
            <div className="space-y-2">
              {errorDetails.map((err, index) => (
                <div key={err.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                      {t('challengeExecution.errorNumber', 'Erro')} #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeError(err.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        {t('submissionReview.errorType', 'Tipo')}
                      </label>
                      <select
                        value={err.error_type}
                        onChange={(e) => updateError(err.id, 'error_type', e.target.value)}
                        className={inputCls}
                      >
                        {ERROR_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {t(type.label)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        {t('submissionReview.reference', 'Referência')}
                      </label>
                      {hasMultipleRefs ? (
                        <select
                          value={err.operation_reference}
                          onChange={(e) => updateError(err.id, 'operation_reference', e.target.value)}
                          className={inputCls}
                        >
                          <option value="">{t('submissionReview.selectReference', 'Selecione')}</option>
                          {refs.map((ref, i) => (
                            <option key={i} value={ref}>{ref}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400">
                          {formData.operation_reference || t('challengeExecution.notProvided', 'N/A')}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        {t('submissionReview.description', 'Descrição')}
                      </label>
                      <input
                        type="text"
                        value={err.description}
                        onChange={(e) => updateError(err.id, 'description', e.target.value)}
                        placeholder={t('submissionReview.describeError', 'Descreva o erro...')}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
