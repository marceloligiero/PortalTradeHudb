import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Download, 
  Printer, 
  Calendar, 
  Clock, 
  TrendingUp,
  CheckCircle2,
  FileText,
  X,
  Sparkles
} from 'lucide-react';
import api from '../../lib/axios';
import { PremiumHeader, AnimatedStatCard, FloatingOrbs, GridBackground } from '../../components/premium';

interface Certificate {
  id: number;
  certificate_number: string;
  student_name: string;
  training_plan_title: string;
  issued_at: string;
  total_hours: number;
  courses_completed: number;
  average_mpu: number;
  average_approval_rate: number;
  is_valid: boolean;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

export default function CertificatesPage() {
  const { t } = useTranslation();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/student/certificates');
      setCertificates(response.data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (cert: Certificate) => {
    // TODO: Implement PDF download
    alert(`Download do certificado ${cert.certificate_number}`);
  };

  const handlePrint = (cert: Certificate) => {
    // TODO: Implement print
    window.print();
  };

  const totalHours = certificates.reduce((acc, c) => acc + (c.total_hours || 0), 0);
  const avgMpu = certificates.length > 0 
    ? certificates.reduce((acc, c) => acc + (c.average_mpu || 0), 0) / certificates.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <PremiumHeader
        icon={Award}
        title={t('certificates.title')}
        subtitle="As suas conquistas e certificações"
        badge="Área de Certificados"
        iconColor="from-yellow-500 to-orange-600"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatedStatCard
          icon={Award}
          label="Total de Certificados"
          value={certificates.length}
          color="from-yellow-500 to-orange-600"
          delay={0}
        />
        <AnimatedStatCard
          icon={Clock}
          label="Horas de Formação"
          value={totalHours}
          suffix="h"
          color="from-blue-500 to-blue-700"
          delay={0.1}
        />
        <AnimatedStatCard
          icon={TrendingUp}
          label="MPU Médio"
          value={Math.round(avgMpu)}
          color="from-green-500 to-emerald-600"
          delay={0.2}
        />
      </div>

      {/* Certificates Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-yellow-600 border-t-transparent rounded-full"
            />
          </div>
        ) : certificates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center"
          >
            <FloatingOrbs variant="subtle" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, delay: 0.2 }}
            >
              <Award className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Ainda não tem certificados
            </h3>
            <p className="text-gray-400 mb-2">
              Complete os seus planos de formação para obter certificados
            </p>
            <p className="text-gray-500 text-sm">
              {t('dashboard.student.emptyDescription')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {certificates.map((cert, index) => (
              <motion.div
                key={cert.id}
                variants={cardVariants}
                whileHover={{ y: -4, scale: 1.01 }}
                onClick={() => setSelectedCert(cert)}
                className="relative group cursor-pointer"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-yellow-500/30 transition-all overflow-hidden">
                  {/* Certificate Badge */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-bl-full" />
                  
                  <div className="flex items-start justify-between mb-4">
                    <motion.div
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg shadow-yellow-900/50"
                    >
                      <Award className="w-7 h-7 text-white" />
                    </motion.div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      cert.is_valid
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {cert.is_valid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Válido
                        </>
                      ) : (
                        'Revogado'
                      )}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Nº Certificado</span>
                    </div>
                    <p className="font-mono text-yellow-400 font-medium text-sm">{cert.certificate_number}</p>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors line-clamp-2">
                    {cert.training_plan_title}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-xs text-gray-500 mb-1">Horas</div>
                      <div className="text-sm font-semibold text-white">{cert.total_hours}h</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-xs text-gray-500 mb-1">MPU</div>
                      <div className="text-sm font-semibold text-purple-400">{cert.average_mpu || 0}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Emitido em {new Date(cert.issued_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); handleDownload(cert); }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-yellow-600/30 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); handlePrint(cert); }}
                      className="px-3 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <Printer className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Certificate Detail Modal */}
      <AnimatePresence>
        {selectedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedCert(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative overflow-hidden">
                <GridBackground opacity={0.2} color="234, 179, 8" />
                <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Certificado</h2>
                      <p className="text-xs text-yellow-400 font-mono">{selectedCert.certificate_number}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCert(null)}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div className="text-center mb-6">
                  <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-white">{selectedCert.training_plan_title}</h3>
                  <p className="text-gray-400 mt-1">Certificamos que <strong className="text-white">{selectedCert.student_name}</strong></p>
                  <p className="text-gray-400">concluiu com sucesso esta formação</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{selectedCert.total_hours}h</div>
                    <div className="text-xs text-gray-400">Horas de Formação</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <TrendingUp className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-400">{selectedCert.average_mpu}</div>
                    <div className="text-xs text-gray-400">MPU Médio</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-400">{selectedCert.courses_completed}</div>
                    <div className="text-xs text-gray-400">Cursos Concluídos</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <Calendar className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                    <div className="text-lg font-bold text-white">
                      {new Date(selectedCert.issued_at).toLocaleDateString('pt-PT')}
                    </div>
                    <div className="text-xs text-gray-400">Data de Emissão</div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDownload(selectedCert)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-yellow-600/30 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePrint(selectedCert)}
                    className="px-4 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
