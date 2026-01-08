import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Clock, BookOpen, 
  CheckCircle2, Shield, Star, GraduationCap, Sparkles
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
  const { token } = useAuthStore();
  const certificateRef = useRef<HTMLDivElement>(null);

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCelebration, setShowCelebration] = useState(true);
  const [celebrationPhase, setCelebrationPhase] = useState<'intro' | 'reveal' | 'complete'>('intro');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCertificate();
  }, [id, token]);

  // Celebration animation sequence
  useEffect(() => {
    if (!loading && certificate && showCelebration) {
      // Phase 1: Intro (person appears)
      const timer1 = setTimeout(() => {
        setCelebrationPhase('reveal');
      }, 1500);
      
      // Phase 2: Certificate reveal
      const timer2 = setTimeout(() => {
        setCelebrationPhase('complete');
      }, 3500);
      
      // Phase 3: Hide celebration, show certificate
      const timer3 = setTimeout(() => {
        setShowCelebration(false);
      }, 4500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [loading, certificate, showCelebration]);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      const resp = await api.get(`/api/certificates/${id}`);
      setCertificate(resp.data);
    } catch (err: any) {
      console.error('Error fetching certificate:', err);
      setError(err?.response?.data?.detail || 'Erro ao carregar certificado');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-900">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-4"
          >
            <GraduationCap className="w-20 h-20 text-red-400" />
          </motion.div>
          <p className="text-red-200 text-lg">Carregando certificado...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
          >
            Voltar
          </button>
        </motion.div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <p className="text-gray-400">Certificado não encontrado</p>
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

  // Celebration Animation Component
  const CelebrationOverlay = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 flex items-center justify-center print:hidden"
    >
      {/* Skip Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => setShowCelebration(false)}
        className="absolute top-6 right-6 px-4 py-2 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all text-sm"
      >
        Pular animação →
      </motion.button>

      {/* Confetti/Sparkles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              y: -100,
              x: Math.random() * window.innerWidth,
              rotate: 0 
            }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              y: window.innerHeight + 100,
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1)
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
            className="absolute"
          >
            <Sparkles className={`w-6 h-6 ${
              ['text-yellow-400', 'text-red-400', 'text-orange-400', 'text-amber-400'][Math.floor(Math.random() * 4)]
            }`} />
          </motion.div>
        ))}
      </div>

      <div className="relative text-center">
        {/* Person/Graduate Animation */}
        <AnimatePresence mode="wait">
          {celebrationPhase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 12 }}
              className="mb-8"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="relative"
              >
                {/* Graduate Person SVG */}
                <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto">
                  {/* Body */}
                  <motion.ellipse
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.2 }}
                    cx="100" cy="150" rx="35" ry="45"
                    className="fill-red-600"
                  />
                  {/* Head */}
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                    cx="100" cy="75" r="30"
                    className="fill-amber-200"
                  />
                  {/* Graduation Cap */}
                  <motion.g
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", delay: 0.5 }}
                  >
                    <rect x="65" y="50" width="70" height="8" className="fill-gray-800" rx="2" />
                    <polygon points="100,35 125,50 100,55 75,50" className="fill-gray-900" />
                    <line x1="125" y1="50" x2="135" y2="70" stroke="#fbbf24" strokeWidth="2" />
                    <circle cx="135" cy="72" r="4" className="fill-yellow-400" />
                  </motion.g>
                  {/* Happy Face */}
                  <circle cx="90" cy="72" r="3" className="fill-gray-800" />
                  <circle cx="110" cy="72" r="3" className="fill-gray-800" />
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.6 }}
                    d="M 88 85 Q 100 95 112 85"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Arms reaching up */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    d="M 70 130 Q 50 100 55 80"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    d="M 130 130 Q 150 100 145 80"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Hands */}
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7 }}
                    cx="55" cy="78" r="8"
                    className="fill-amber-200"
                  />
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7 }}
                    cx="145" cy="78" r="8"
                    className="fill-amber-200"
                  />
                </svg>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-2xl font-bold text-white mt-4"
              >
                🎓 Parabéns, {certificate.student_name}!
              </motion.p>
            </motion.div>
          )}

          {celebrationPhase === 'reveal' && (
            <motion.div
              key="reveal"
              initial={{ scale: 0, rotateY: 180 }}
              animate={{ scale: 1, rotateY: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="relative"
            >
              {/* Mini Certificate Preview */}
              <motion.div
                animate={{ 
                  boxShadow: ["0 0 20px rgba(239, 68, 68, 0.3)", "0 0 60px rgba(239, 68, 68, 0.6)", "0 0 20px rgba(239, 68, 68, 0.3)"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-gradient-to-br from-red-50 via-white to-red-50 rounded-2xl p-8 max-w-md mx-auto border-4 border-red-300"
              >
                <div className="text-center">
                  <GraduationCap className="w-16 h-16 text-red-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-serif font-bold text-red-800 mb-2">CERTIFICADO</h3>
                  <p className="text-gray-600 text-sm mb-3">de Conclusão</p>
                  <div className="border-t border-b border-red-200 py-3 my-3">
                    <p className="text-xl font-bold text-gray-800">{certificate.student_name}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Concluiu com êxito<br/>
                    <span className="font-semibold text-red-700">"{certificate.training_plan_title}"</span>
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-center"
              >
                <p className="text-white/80 text-lg">Seu certificado está pronto!</p>
              </motion.div>
            </motion.div>
          )}

          {celebrationPhase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <CheckCircle2 className="w-24 h-24 text-green-400 mx-auto mb-4" />
              </motion.div>
              <p className="text-2xl font-bold text-white">Carregando seu certificado...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 print:bg-white">
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && <CelebrationOverlay />}
      </AnimatePresence>

      {/* Back Button - Fixed at top */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10 print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
        </div>
      </div>

      {/* Certificate Container */}
      <div className="max-w-5xl mx-auto px-4 py-8 print:p-0 print:max-w-none">
        {/* Main Certificate */}
        <motion.div
          ref={certificateRef}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: showCelebration ? 0 : 1, y: showCelebration ? 30 : 0 }}
          transition={{ duration: 0.6 }}
          className="relative print:shadow-none certificate-container"
        >
          {/* Certificate Frame */}
          <div className="relative bg-gradient-to-br from-red-50 via-white to-red-50 rounded-3xl overflow-hidden shadow-2xl shadow-red-900/20 print:rounded-none print:shadow-none">
            
            {/* Decorative Border */}
            <div className="absolute inset-0 p-1">
              <div className="absolute inset-0 rounded-3xl border-8 border-red-200/50 print:rounded-none" />
              <div className="absolute inset-3 rounded-2xl border-4 border-red-300/30 print:rounded-none" />
              <div className="absolute inset-6 rounded-xl border-2 border-red-400/20 print:rounded-none" />
            </div>
            
            {/* Corner Decorations */}
            <div className="absolute top-4 left-4 w-24 h-24 opacity-30">
              <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
                <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="absolute top-4 right-4 w-24 h-24 opacity-30 transform scale-x-[-1]">
              <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
                <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="absolute bottom-4 left-4 w-24 h-24 opacity-30 transform scale-y-[-1]">
              <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
                <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="absolute bottom-4 right-4 w-24 h-24 opacity-30 transform scale-[-1]">
              <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
                <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill="currentColor"/>
              </svg>
            </div>

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
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="inline-block mb-6"
                >
                  <img 
                    src="/logo-sds.png" 
                    alt="Logo SDS" 
                    className="h-24 w-auto object-contain"
                    style={{ filter: 'brightness(0)' }}
                  />
                </motion.div>
                
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
                
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl md:text-5xl font-serif font-bold text-gray-800 mb-6 py-4 border-b-2 border-t-2 border-red-200 inline-block px-8"
                >
                  {certificate.student_name}
                </motion.h2>
                
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
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-red-100 to-red-50 rounded-xl p-4 text-center border border-red-200"
                >
                  <Calendar className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-xs text-red-600 uppercase tracking-wide mb-1">Emitido em</p>
                  <p className="text-sm font-bold text-gray-800">{issuedDate}</p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="bg-gradient-to-br from-red-100 to-red-50 rounded-xl p-4 text-center border border-red-200"
                >
                  <Clock className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-xs text-red-600 uppercase tracking-wide mb-1">Carga Horária</p>
                  <p className="text-sm font-bold text-gray-800">{certificate.total_hours.toFixed(1)} horas</p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-br from-red-100 to-red-50 rounded-xl p-4 text-center border border-red-200"
                >
                  <GraduationCap className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-xs text-red-600 uppercase tracking-wide mb-1">Aprovação</p>
                  <p className="text-sm font-bold text-gray-800">100%</p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="bg-gradient-to-br from-red-100 to-red-50 rounded-xl p-4 text-center border border-red-200"
                >
                  <BookOpen className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-xs text-red-600 uppercase tracking-wide mb-1">Cursos</p>
                  <p className="text-sm font-bold text-gray-800">{certificate.courses_completed} concluído{certificate.courses_completed > 1 ? 's' : ''}</p>
                </motion.div>
              </div>

              {/* Seal - Centered */}
              <div className="flex justify-center pt-8 border-t-2 border-red-200">
                <motion.div 
                  initial={{ rotate: -10, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                  className="relative"
                >
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 p-1 shadow-xl">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-red-100 to-white flex flex-col items-center justify-center border-4 border-red-400">
                      <CheckCircle2 className="w-8 h-8 text-red-600" />
                      <p className="text-[8px] font-bold text-red-700 uppercase tracking-widest mt-1">Certificado</p>
                      <p className="text-[8px] font-bold text-red-600 uppercase">Válido</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Certificate Number */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 text-center"
              >
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-100 via-white to-red-100 rounded-full border-2 border-red-300">
                  <Shield className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-gray-600">Certificado Nº:</span>
                  <span className="font-mono font-bold text-red-700 tracking-wider">
                    {certificate.certificate_number}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Course Details Section - Anexo do Certificado */}
        {certificate.courses && certificate.courses.length > 0 && (
          <div className="mt-8 print:mt-0 print:page-break-before">
            {/* Page break header for print */}
            <div className="hidden print:block print:mb-6">
              <div className="border-b-2 border-red-300 pb-4 mb-6">
                <div className="flex items-center justify-between">
                  <img src="/logo-sds.png" alt="Logo" className="h-12" />
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Anexo ao Certificado</p>
                    <p className="font-mono text-red-700 font-bold">{certificate.certificate_number}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-white print:text-gray-800 flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-red-400 print:text-red-600" />
              Detalhes da Formação
            </h3>
            
            <div className="space-y-6">
              {certificate.courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 print:bg-white backdrop-blur-xl rounded-2xl print:rounded-xl border border-white/10 print:border-red-200 overflow-hidden print:shadow-sm"
                >
                  {/* Course Header */}
                  <div className="bg-gradient-to-r from-red-500/10 to-red-400/10 print:from-red-100 print:to-red-50 px-6 py-4 border-b border-white/10 print:border-red-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold print:shadow-md">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white print:text-gray-800">{course.title}</h4>
                        <p className="text-sm text-gray-400 print:text-gray-600">
                          {course.total_lessons} aulas • {course.total_challenges} desafios
                        </p>
                      </div>
                      <div className="ml-auto">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 print:bg-green-100 text-green-400 print:text-green-700 border border-green-500/30 print:border-green-300">
                          ✓ Concluído
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Course Content */}
                  <div className="p-6 grid md:grid-cols-2 gap-6">
                    {/* Lessons */}
                    <div>
                      <h5 className="text-sm font-semibold text-red-400 print:text-red-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Aulas Completadas
                      </h5>
                      <div className="space-y-2">
                        {course.lessons.map((lesson) => (
                          <div 
                            key={lesson.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 print:bg-gray-50 border border-white/5 print:border-gray-200"
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-400 print:text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-300 print:text-gray-700 flex-1">{lesson.title}</span>
                            <span className="text-xs text-gray-500 print:text-gray-600 bg-white/10 print:bg-gray-200 px-2 py-1 rounded">
                              {lesson.estimated_minutes} min
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Challenges */}
                    <div>
                      <h5 className="text-sm font-semibold text-red-400 print:text-red-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Desafios Aprovados
                      </h5>
                      <div className="space-y-2">
                        {course.challenges.map((challenge) => (
                          <div 
                            key={challenge.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 print:bg-gray-50 border border-white/5 print:border-gray-200"
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-400 print:text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-300 print:text-gray-700 flex-1">{challenge.title}</span>
                            <span className="text-xs px-2 py-1 rounded bg-green-500/20 print:bg-green-100 text-green-400 print:text-green-700 border border-green-500/30 print:border-green-300">
                              Aprovado
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Validity Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center print:hidden"
        >
          <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
            <Shield className="w-4 h-4" />
            <span>Este certificado é válido e pode ser verificado através do número de série acima.</span>
          </div>
        </motion.div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:page-break-before {
            page-break-before: always;
            margin-top: 0 !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          .print\\:mt-0 {
            margin-top: 0 !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:text-gray-800 {
            color: #1f2937 !important;
          }
          .print\\:text-gray-700 {
            color: #374151 !important;
          }
          .print\\:text-gray-600 {
            color: #4b5563 !important;
          }
          .print\\:text-red-600 {
            color: #dc2626 !important;
          }
          .print\\:text-red-700 {
            color: #b91c1c !important;
          }
          .print\\:text-green-600 {
            color: #16a34a !important;
          }
          .print\\:text-green-700 {
            color: #15803d !important;
          }
          .print\\:border-red-200 {
            border-color: #fecaca !important;
          }
          .print\\:border-gray-200 {
            border-color: #e5e7eb !important;
          }
          .print\\:border-green-300 {
            border-color: #86efac !important;
          }
          .print\\:bg-gray-50 {
            background-color: #f9fafb !important;
          }
          .print\\:bg-gray-200 {
            background-color: #e5e7eb !important;
          }
          .print\\:bg-green-100 {
            background-color: #dcfce7 !important;
          }
          .print\\:from-red-100 {
            --tw-gradient-from: #fee2e2 !important;
          }
          .print\\:to-red-50 {
            --tw-gradient-to: #fef2f2 !important;
          }
          .print\\:shadow-sm {
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
          }
          .print\\:shadow-md {
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
          }
          .print\\:rounded-xl {
            border-radius: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}
