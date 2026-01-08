import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Clock, BookOpen, 
  CheckCircle2, Shield, Star, GraduationCap, Sparkles, Printer
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
  const [celebrationPhase, setCelebrationPhase] = useState<'intro' | 'rolling' | 'unrolling' | 'complete'>('intro');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCertificate();
  }, [id, token]);

  // Celebration animation sequence - longer timings
  useEffect(() => {
    if (!loading && certificate && showCelebration) {
      // Phase 1: Intro (person appears with certificate) - 3 seconds
      const timer1 = setTimeout(() => {
        setCelebrationPhase('rolling');
      }, 3000);
      
      // Phase 2: Rolling into tube - 3 seconds
      const timer2 = setTimeout(() => {
        setCelebrationPhase('unrolling');
      }, 6000);
      
      // Phase 3: Unrolling and revealing - 2.5 seconds
      const timer3 = setTimeout(() => {
        setCelebrationPhase('complete');
      }, 8500);
      
      // Phase 4: Hide celebration, show certificate - 1.5 seconds
      const timer4 = setTimeout(() => {
        setShowCelebration(false);
      }, 10000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [loading, certificate, showCelebration]);

  // Print function
  const handlePrint = () => {
    window.print();
  };

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

  // Celebration Animation Component with Scroll/Tube Effect
  const CelebrationOverlay = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-red-900/30 to-slate-900 flex items-center justify-center print:hidden"
    >
      {/* Skip Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setShowCelebration(false)}
        className="absolute top-6 right-6 px-4 py-2 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all text-sm z-50"
      >
        Pular animação →
      </motion.button>

      {/* Confetti/Sparkles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              y: -100,
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              rotate: 0,
              scale: 0.5 + Math.random() * 0.5
            }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 100,
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1)
            }}
            transition={{ 
              duration: 4 + Math.random() * 3,
              delay: Math.random() * 4,
              ease: "easeOut"
            }}
            className="absolute"
          >
            <Sparkles className={`w-8 h-8 ${
              ['text-yellow-400', 'text-red-400', 'text-orange-400', 'text-amber-400', 'text-pink-400'][Math.floor(Math.random() * 5)]
            }`} />
          </motion.div>
        ))}
      </div>

      <div className="relative text-center">
        <AnimatePresence mode="wait">
          {/* Phase 1: Graduate Person with Certificate */}
          {celebrationPhase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0, y: -50 }}
              transition={{ type: "spring", damping: 12 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative"
              >
                {/* Larger Graduate Person SVG */}
                <svg viewBox="0 0 200 250" className="w-72 h-72 mx-auto">
                  {/* Body */}
                  <motion.ellipse
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.2 }}
                    cx="100" cy="180" rx="40" ry="55"
                    className="fill-red-600"
                  />
                  {/* Head */}
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                    cx="100" cy="85" r="35"
                    className="fill-amber-200"
                  />
                  {/* Graduation Cap */}
                  <motion.g
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", delay: 0.5, bounce: 0.5 }}
                  >
                    <rect x="55" y="55" width="90" height="10" className="fill-gray-800" rx="3" />
                    <polygon points="100,35 135,55 100,62 65,55" className="fill-gray-900" />
                    <line x1="135" y1="55" x2="150" y2="80" stroke="#fbbf24" strokeWidth="3" />
                    <circle cx="150" cy="82" r="6" className="fill-yellow-400" />
                    <motion.circle
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      cx="150" cy="82" r="3" className="fill-yellow-300"
                    />
                  </motion.g>
                  {/* Happy Face */}
                  <circle cx="85" cy="82" r="4" className="fill-gray-800" />
                  <circle cx="115" cy="82" r="4" className="fill-gray-800" />
                  {/* Smile */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    d="M 82 100 Q 100 118 118 100"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Arms holding certificate */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    d="M 65 155 Q 40 130 50 100"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    d="M 135 155 Q 160 130 150 100"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* Hands */}
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 }}
                    cx="50" cy="98" r="10"
                    className="fill-amber-200"
                  />
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 }}
                    cx="150" cy="98" r="10"
                    className="fill-amber-200"
                  />
                  {/* Certificate being held */}
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                  >
                    <rect x="55" y="95" width="90" height="60" rx="3" className="fill-red-50" stroke="#dc2626" strokeWidth="2" />
                    <text x="100" y="115" textAnchor="middle" className="fill-red-700 text-[8px] font-bold">CERTIFICADO</text>
                    <line x1="70" y1="125" x2="130" y2="125" stroke="#f87171" strokeWidth="1" />
                    <line x1="75" y1="135" x2="125" y2="135" stroke="#fca5a5" strokeWidth="1" />
                    <line x1="80" y1="145" x2="120" y2="145" stroke="#fca5a5" strokeWidth="1" />
                  </motion.g>
                </svg>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="text-3xl font-bold text-white mt-6"
              >
                🎓 Parabéns, {certificate.student_name}!
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="text-xl text-white/70 mt-2"
              >
                Você conquistou seu certificado!
              </motion.p>
            </motion.div>
          )}

          {/* Phase 2: Certificate Rolling into Tube */}
          {celebrationPhase === 'rolling' && (
            <motion.div
              key="rolling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="relative w-80 h-64">
                {/* Certificate Paper */}
                <motion.div
                  initial={{ rotateX: 0, scaleY: 1 }}
                  animate={{ 
                    rotateX: [0, 0, 90, 180],
                    scaleY: [1, 1, 0.5, 0],
                    y: [0, 0, 30, 60]
                  }}
                  transition={{ duration: 2.5, ease: "easeInOut" }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-48 bg-gradient-to-br from-red-50 via-white to-red-50 rounded-lg border-2 border-red-300 shadow-2xl origin-top"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="p-4 text-center">
                    <GraduationCap className="w-10 h-10 text-red-600 mx-auto mb-2" />
                    <h3 className="text-lg font-serif font-bold text-red-800">CERTIFICADO</h3>
                    <p className="text-xs text-gray-600">de Conclusão</p>
                    <div className="border-t border-red-200 mt-2 pt-2">
                      <p className="text-sm font-bold text-gray-800 truncate">{certificate.student_name}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Scroll Tube */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5, duration: 0.5 }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2"
                >
                  {/* Tube Body */}
                  <div className="relative">
                    <div className="w-20 h-48 bg-gradient-to-b from-amber-700 via-amber-600 to-amber-800 rounded-full shadow-2xl" />
                    {/* Tube Cap Top */}
                    <motion.div
                      initial={{ y: 0 }}
                      animate={{ y: [-5, 0, -5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 rounded-full shadow-lg"
                    />
                    {/* Tube Cap Bottom */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 rounded-full" />
                    {/* Ribbon */}
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute top-1/2 -left-6 w-16 h-3 bg-gradient-to-r from-red-600 to-red-500 rounded-full shadow-md origin-right"
                      style={{ transform: 'rotate(-30deg)' }}
                    />
                  </div>
                </motion.div>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-2xl font-bold text-white mt-8"
              >
                📜 Preparando seu certificado...
              </motion.p>
            </motion.div>
          )}

          {/* Phase 3: Certificate Unrolling from Tube */}
          {celebrationPhase === 'unrolling' && (
            <motion.div
              key="unrolling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                {/* Certificate Unrolling */}
                <motion.div
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="origin-top"
                >
                  <motion.div
                    animate={{ 
                      boxShadow: ["0 0 30px rgba(239, 68, 68, 0.4)", "0 0 80px rgba(239, 68, 68, 0.8)", "0 0 30px rgba(239, 68, 68, 0.4)"]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="bg-gradient-to-br from-red-50 via-white to-red-50 rounded-2xl p-8 max-w-lg mx-auto border-4 border-red-300 shadow-2xl"
                  >
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: "spring" }}
                      >
                        <GraduationCap className="w-20 h-20 text-red-600 mx-auto mb-4" />
                      </motion.div>
                      <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-3xl font-serif font-bold text-red-800 mb-2"
                      >
                        CERTIFICADO
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-gray-600 text-lg mb-4"
                      >
                        de Conclusão
                      </motion.p>
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.9 }}
                        className="border-t-2 border-b-2 border-red-200 py-4 my-4"
                      >
                        <p className="text-2xl font-bold text-gray-800">{certificate.student_name}</p>
                      </motion.div>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="text-gray-600"
                      >
                        Concluiu com êxito o plano de formação<br/>
                        <span className="font-semibold text-red-700">"{certificate.training_plan_title}"</span>
                      </motion.p>
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-xl text-white/80 mt-6"
              >
                ✨ Seu certificado está pronto!
              </motion.p>
            </motion.div>
          )}

          {/* Phase 4: Complete - Transition */}
          {celebrationPhase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <CheckCircle2 className="w-32 h-32 text-green-400 mx-auto mb-4" />
              </motion.div>
              <p className="text-3xl font-bold text-white">Exibindo certificado...</p>
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

      {/* Back Button and Print Button - Fixed at top */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10 print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-600/30 transition-all"
          >
            <Printer className="w-5 h-5" />
            Imprimir Certificado
          </motion.button>
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

        {/* Course Details Section - NOT printed (only certificate is printed) */}
        {certificate.courses && certificate.courses.length > 0 && (
          <div className="mt-8 print:hidden">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-red-400" />
              Detalhes da Formação
            </h3>
            
            <div className="space-y-6">
              {certificate.courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
                >
                  {/* Course Header */}
                  <div className="bg-gradient-to-r from-red-500/10 to-red-400/10 px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">{course.title}</h4>
                        <p className="text-sm text-gray-400">
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
                      <h5 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Aulas Completadas
                      </h5>
                      <div className="space-y-2">
                        {course.lessons.map((lesson) => (
                          <div 
                            key={lesson.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <span className="text-sm text-gray-300 flex-1">{lesson.title}</span>
                            <span className="text-xs text-gray-500 bg-white/10 px-2 py-1 rounded">
                              {lesson.estimated_minutes} min
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Challenges */}
                    <div>
                      <h5 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Desafios Aprovados
                      </h5>
                      <div className="space-y-2">
                        {course.challenges.map((challenge) => (
                          <div 
                            key={challenge.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <span className="text-sm text-gray-300 flex-1">{challenge.title}</span>
                            <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
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
