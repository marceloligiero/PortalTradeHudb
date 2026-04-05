import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, BookOpen,
  CheckCircle2, Shield, Star, GraduationCap, Printer
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

interface ChallengeDetail {
  id: number;
  title: string;
  target_mpu: number;
  is_approved: boolean;
  score: number | null;
  calculated_mpu: number | null;
  mpu_vs_target: number | null;
}

interface LessonDetail {
  id: number;
  title: string;
  estimated_minutes: number;
  completed: boolean;
  confirmed: boolean;
}

interface CourseDetail {
  id: number;
  title: string;
  description: string;
  lessons: LessonDetail[];
  challenges: ChallengeDetail[];
  total_lessons: number;
  total_challenges: number;
}

interface CertificateData {
  id: number;
  certificate_number: string;
  student_name: string;
  student_email: string;
  training_plan_title: string;
  total_hours: number;
  courses_completed: number;
  average_mpu: number;
  average_approval_rate: number;
  issued_at: string;
  is_valid: boolean;
  trainer_name: string;
  courses: CourseDetail[];
}

export default function CertificateView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const certificateRef = useRef<HTMLDivElement>(null);

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCertificate();
  }, [id, token]);

  // Celebration timeout
  useEffect(() => {
    if (!loading && certificate && showCelebration) {
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [loading, certificate, showCelebration]);

  const handlePrint = () => {
    window.print();
  };

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      const resp = await api.get(`/api/certificates/${id}`);
      setCertificate(resp.data);
      if (user && resp.data.student_email === user.email) {
        setShowCelebration(true);
      }
    } catch (err: any) {
      console.error('Error fetching certificate:', err);
      setError(err?.response?.data?.detail || 'Erro ao carregar certificado');
    } finally {
      setLoading(false);
    }
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-sm text-gray-500 dark:text-gray-400">Carregando certificado...</p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#EC0000]" />
          </div>
          <p className="font-body text-sm text-[#EC0000] mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // --- Not found ---
  if (!certificate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-body text-gray-500 dark:text-gray-400">Certificado não encontrado</p>
      </div>
    );
  }

  const issuedDate = certificate.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : 'N/A';

  return (
    <div className="space-y-6">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] bg-gray-900/95 flex items-center justify-center print:hidden animate-in fade-in duration-500">
          <button
            onClick={() => setShowCelebration(false)}
            className="absolute top-6 right-6 px-4 py-2 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all font-body text-sm z-50"
          >
            Pular animação →
          </button>

          <div className="text-center animate-in zoom-in-75 duration-700">
            <div className="w-24 h-24 rounded-full bg-[#EC0000]/20 flex items-center justify-center mx-auto mb-6 animate-bounce">
              <GraduationCap className="w-12 h-12 text-[#EC0000]" />
            </div>
            <p className="font-headline text-3xl font-bold text-white mb-2">
              Parabéns, {certificate.student_name}!
            </p>
            <p className="font-body text-lg text-gray-400">
              Você conquistou seu certificado!
            </p>
            <div className="mt-6">
              <div className="w-16 h-16 border-4 border-white/20 border-t-[#EC0000] rounded-full animate-spin mx-auto" />
              <p className="font-body text-sm text-gray-500 mt-4">Gerando certificado...</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-[#EC0000]" />
            </div>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-1">Certificado</p>
              <h1 className="font-headline text-2xl font-bold text-gray-900 dark:text-white">
                {certificate.training_plan_title}
              </h1>
              <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                {certificate.student_name}
              </p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl font-body font-bold text-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Certificate Document */}
      <div
        ref={certificateRef}
        className="certificate-container print:shadow-none"
      >
        <div className="relative bg-gradient-to-br from-red-50 via-white to-red-50 rounded-3xl overflow-hidden shadow-2xl shadow-red-900/20 dark:shadow-red-900/40 print:rounded-none print:shadow-none">

          {/* Decorative Border */}
          <div className="absolute inset-0 p-1">
            <div className="absolute inset-0 rounded-3xl border-8 border-red-200/50 print:rounded-none" />
            <div className="absolute inset-3 rounded-2xl border-4 border-red-300/30 print:rounded-none" />
            <div className="absolute inset-6 rounded-xl border-2 border-red-400/20 print:rounded-none" />
          </div>

          {/* Corner Decorations */}
          {[
            'top-4 left-4',
            'top-4 right-4 scale-x-[-1]',
            'bottom-4 left-4 scale-y-[-1]',
            'bottom-4 right-4 scale-[-1]',
          ].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-24 h-24 opacity-30`}>
              <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
                <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill="currentColor"/>
              </svg>
            </div>
          ))}

          {/* Watermark Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dc2626' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Certificate Content */}
          <div className="relative z-10 p-12 md:p-16">

            {/* Header with Logo */}
            <div className="text-center mb-10">
              <div className="inline-block mb-6">
                <img
                  src="/logo-sds.png"
                  alt="Logo SDS"
                  className="h-24 w-auto object-contain"
                  style={{ filter: 'brightness(0)' }}
                />
              </div>

              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-red-400 to-red-400" />
                <Star className="w-5 h-5 text-red-500" />
                <div className="h-px w-16 bg-gradient-to-l from-transparent via-red-400 to-red-400" />
              </div>

              <h1 className="text-4xl md:text-5xl font-serif font-bold text-red-800 tracking-wide mb-2">
                CERTIFICADO
              </h1>
              <p className="text-xl text-red-600 font-medium tracking-widest uppercase">
                de Conclusão
              </p>
            </div>

            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-4 mb-10">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-300 to-red-300" />
              <Star className="w-4 h-4 text-red-500" />
              <Star className="w-5 h-5 text-red-600" />
              <Star className="w-4 h-4 text-red-500" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-red-300 to-red-300" />
            </div>

            {/* Main Content */}
            <div className="text-center mb-10">
              <p className="text-lg text-gray-600 mb-4">
                Certificamos que
              </p>

              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-800 mb-6 py-4 border-b-2 border-t-2 border-red-200 inline-block px-8">
                {certificate.student_name}
              </h2>

              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                concluiu com êxito o plano de formação
              </p>

              <h3 className="text-2xl md:text-3xl font-semibold text-red-700 my-4">
                "{certificate.training_plan_title}"
              </h3>

              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                com carga horária total de <span className="font-bold text-gray-800">{certificate.total_hours.toFixed(1)} horas</span>,
                tendo completado com sucesso <span className="font-bold text-gray-800">{certificate.courses_completed} curso{certificate.courses_completed > 1 ? 's' : ''}</span> e
                demonstrado excelente aproveitamento em todos os desafios práticos.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { icon: Calendar, label: 'Emitido em', value: issuedDate },
                { icon: Clock, label: 'Carga Horária', value: `${certificate.total_hours.toFixed(1)} horas` },
                { icon: GraduationCap, label: 'Aprovação', value: '100%' },
                { icon: BookOpen, label: 'Cursos', value: `${certificate.courses_completed} concluído${certificate.courses_completed > 1 ? 's' : ''}` },
              ].map((stat, i) => (
                <div key={i} className="bg-gradient-to-br from-red-100 to-red-50 rounded-xl p-4 text-center border border-red-200">
                  <stat.icon className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-xs text-red-600 uppercase tracking-wide mb-1">{stat.label}</p>
                  <p className="text-sm font-bold text-gray-800">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Seal */}
            <div className="flex justify-center pt-8 border-t-2 border-red-200">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-red-100 to-white flex flex-col items-center justify-center border-4 border-red-400">
                    <CheckCircle2 className="w-8 h-8 text-red-600" />
                    <p className="text-[8px] font-bold text-red-700 uppercase tracking-widest mt-1">Certificado</p>
                    <p className="text-[8px] font-bold text-red-600 uppercase">Válido</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Number */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-100 via-white to-red-100 rounded-full border-2 border-red-300">
                <Shield className="w-5 h-5 text-red-600" />
                <span className="text-sm text-gray-600">Certificado Nº:</span>
                <span className="font-mono font-bold text-red-700 tracking-wider">
                  {certificate.certificate_number}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Details Section */}
      {certificate.courses && certificate.courses.length > 0 && (
        <div className="print:hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#EC0000]" />
            </div>
            <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white">
              Detalhes da Formação
            </h3>
          </div>

          <div className="space-y-4">
            {certificate.courses.map((course, index) => (
              <div
                key={course.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                {/* Course Header */}
                <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                      <span className="font-mono font-bold text-[#EC0000]">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline text-base font-bold text-gray-900 dark:text-white truncate">{course.title}</h4>
                      <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                        {course.total_lessons} módulos &bull; {course.total_challenges} desafios
                      </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg font-body text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30">
                      Concluído
                    </span>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6 grid md:grid-cols-2 gap-6">
                  {/* Lessons */}
                  <div>
                    <h5 className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Módulos Completados
                    </h5>
                    <div className="space-y-2">
                      {course.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="font-body text-sm text-gray-700 dark:text-gray-300 flex-1">{lesson.title}</span>
                          <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {lesson.estimated_minutes} min
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Challenges */}
                  <div>
                    <h5 className="font-body text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Desafios Aprovados
                    </h5>
                    <div className="space-y-2">
                      {course.challenges.map((challenge) => (
                        <div
                          key={challenge.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="font-body text-sm text-gray-700 dark:text-gray-300 flex-1">{challenge.title}</span>
                          <span className="font-body text-xs font-bold px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30">
                            Aprovado
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validity Note */}
      <div className="text-center print:hidden">
        <div className="inline-flex items-center gap-2 font-body text-sm text-gray-400 dark:text-gray-500">
          <Shield className="w-4 h-4" />
          <span>Este certificado é válido e pode ser verificado através do número de série acima.</span>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
