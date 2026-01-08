import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  ArrowRight,
  Globe,
  FileText,
  CreditCard,
  Landmark,
  CheckCircle,
  Shield,
  BookOpen,
  Layers,
  RefreshCw,
  Clock,
  Target,
  Award,
  ChevronRight,
  Database,
  Workflow,
  GraduationCap,
  LogIn,
  UserPlus
} from 'lucide-react';

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

// Section Component
const Section = ({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={staggerContainer}
      className={`py-20 px-6 ${className}`}
    >
      {children}
    </motion.section>
  );
};

// Process Card Component
const ProcessCard = ({ 
  icon: Icon, 
  title, 
  description, 
  items, 
  focus,
  gradient 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  items: string[];
  focus: string;
  gradient: string;
}) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6 }}
      className="group relative"
    >
      <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-red-500/30 transition-all duration-500 h-full">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        
        {/* Title */}
        <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
        
        {/* Description */}
        <p className="text-white/60 mb-6 leading-relaxed">{description}</p>
        
        {/* Items */}
        <div className="space-y-3 mb-6">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-white/80 text-sm">{item}</span>
            </div>
          ))}
        </div>
        
        {/* Focus */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-red-400">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">Foco: {focus}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Benefit Item Component
const BenefitItem = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <motion.div variants={fadeInUp} className="flex items-start gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
    <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0">
      <Icon className="w-6 h-6 text-red-400" />
    </div>
    <div>
      <h4 className="text-lg font-semibold text-white mb-1">{title}</h4>
      <p className="text-white/60 text-sm">{description}</p>
    </div>
  </motion.div>
);

// Step Component
const Step = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <motion.div variants={fadeInUp} className="relative flex items-start gap-6">
    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-red-600/30">
      {number}
    </div>
    <div className="pt-2">
      <h4 className="text-xl font-semibold text-white mb-2">{title}</h4>
      <p className="text-white/60 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

export default function TradeDatahubLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] text-white">
      {/* Background Grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(220, 38, 38, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(220, 38, 38, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 w-full z-50 backdrop-blur-2xl bg-[#0a0a0a]/95 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="cursor-pointer flex items-center gap-3"
              onClick={() => navigate('/')}
            >
              <img 
                src="/logo-sds.png"
                alt="Santander Digital Services"
                className="h-10 w-auto filter brightness-0 invert"
              />
              <span className="hidden md:block text-sm text-white/60">|</span>
              <span className="hidden md:block text-lg font-semibold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
                Trade Datahub
              </span>
            </motion.div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all text-white/80 hover:text-white"
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 font-semibold hover:shadow-lg hover:shadow-red-600/30 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Registar
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 min-h-[90vh] flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] bg-red-600/10"
          />
          <motion.div
            animate={{ x: [0, -100, 0], y: [0, 50, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] bg-blue-600/10"
          />
        </div>

        <div className="max-w-6xl mx-auto w-full relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center space-y-8"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-600/20">
              <Database className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-300">Santander Digital Services</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-black leading-tight">
              <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                Portal de Formações
              </span>
              <br />
              <span className="bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
                Trade Datahub
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto leading-relaxed">
              Capacitação operacional para equipas de Trade Finance
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(220, 38, 38, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 font-bold text-lg shadow-xl shadow-red-600/20"
              >
                Aceder ao Portal
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('processos')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 font-bold text-lg hover:bg-white/10 transition-colors"
              >
                Explorar Processos
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Introduction Section */}
      <Section className="bg-gradient-to-b from-transparent to-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-6">
            O que é o Portal de Formações
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg text-white/70 leading-relaxed mb-8">
            O Portal de Formações do Trade Datahub é a plataforma oficial de capacitação operacional para as equipas 
            que atuam nos processos de comércio exterior. Desenvolvido no contexto de Shared Services do Santander Digital Services, 
            o portal centraliza todo o conhecimento necessário para a execução correta, padronizada e eficiente das operações de Trade Finance.
          </motion.p>
          <motion.p variants={fadeInUp} className="text-lg text-white/70 leading-relaxed">
            Através de trilhas de formação estruturadas por área operacional, os colaboradores desenvolvem competências técnicas 
            alinhadas com os processos oficiais, regulamentações internacionais e melhores práticas do setor.
          </motion.p>
        </div>
      </Section>

      {/* Trade Processes Section */}
      <Section id="processos" className="relative">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Áreas Operacionais de Trade
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Formação especializada para cada etapa do processo de Trade Finance
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Remessas Internacionais */}
            <ProcessCard
              icon={Globe}
              title="Remessas Internacionais"
              description="Execução dos fluxos financeiros associados às operações de comércio exterior, garantindo a correta movimentação de fundos entre ordenante e beneficiário."
              items={[
                "Processamento de remessas de entrada e saída",
                "Validação de dados do ordenante e beneficiário",
                "Envio e receção de mensagens SWIFT",
                "Validação de compliance e sanções",
                "Tratamento de exceções e devoluções",
                "Liquidação e conciliação de operações"
              ]}
              focus="Execução correta, redução de falhas e padronização global"
              gradient="from-blue-600 to-blue-700"
            />

            {/* Cobranças Internacionais */}
            <ProcessCard
              icon={FileText}
              title="Cobranças Internacionais (Eurocobros)"
              description="Operações de cobrança internacional onde o banco atua como intermediário entre exportador e importador, garantindo o fluxo documental e financeiro."
              items={[
                "Receção e conferência de documentos comerciais",
                "Envio de documentos ao banco do importador",
                "Controlo das modalidades D/P e D/A",
                "Acompanhamento de aceite e pagamento",
                "Gestão de prazos e instruções do cliente",
                "Tratamento de não pagamento ou devoluções",
                "Liquidação dos valores recebidos"
              ]}
              focus="Controlo de prazos e acompanhamento do ciclo da cobrança"
              gradient="from-green-600 to-green-700"
            />

            {/* Cartas de Crédito */}
            <ProcessCard
              icon={CreditCard}
              title="Cartas de Crédito (Trade Finance – LCs)"
              description="Operações em que o banco atua como garantidor do pagamento, mediante cumprimento das condições documentais estabelecidas pela UCP 600."
              items={[
                "Emissão e avisamento de cartas de crédito",
                "Processamento de alterações (amendments)",
                "Conferência documental conforme UCP 600 e ISBP",
                "Identificação e tratamento de discrepâncias",
                "Envio e receção de mensagens SWIFT",
                "Controlo de prazos, vencimentos e liquidação",
                "Interface operacional com bancos correspondentes"
              ]}
              focus="Rigor documental e aderência às regras internacionais"
              gradient="from-red-600 to-red-700"
            />

            {/* Financiamentos */}
            <ProcessCard
              icon={Landmark}
              title="Financiamentos ao Comércio Exterior"
              description="Gestão operacional dos produtos de crédito vinculados às operações de importação e exportação, assegurando o correto controlo e liquidação."
              items={[
                "Liberação de recursos conforme contrato",
                "Controlo de contratos ativos",
                "Cálculo de juros e encargos",
                "Interface operacional com área de câmbio",
                "Liquidação no vencimento",
                "Gestão de prorrogações e antecipações",
                "Encerramento e baixa de operações"
              ]}
              focus="Execução precisa e controlo de contratos"
              gradient="from-purple-600 to-purple-700"
            />
          </div>
        </div>
      </Section>

      {/* Trade Datahub Integration */}
      <Section className="bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeInUp}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-600/20 mb-6">
                <Workflow className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-300">Integração Total</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Integração com o Trade Datahub
              </h2>
              <p className="text-lg text-white/70 leading-relaxed mb-6">
                O Portal de Formações está totalmente integrado ao Trade Datahub, garantindo que todo o conteúdo 
                de capacitação reflete fielmente os processos oficiais, fluxos operacionais e padrões globais da organização.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white/80">Conteúdo alinhado com processos oficiais documentados</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white/80">Atualização contínua conforme evolução dos fluxos</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white/80">Fonte única de conhecimento operacional</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white/80">Conformidade com padrões internacionais (UCP, SWIFT)</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="relative"
            >
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Trade Datahub</h3>
                    <p className="text-white/60 text-sm">Plataforma Central de Dados</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Layers className="w-5 h-5 text-blue-400" />
                      <span className="font-medium text-white">Processos Documentados</span>
                    </div>
                    <p className="text-sm text-white/60">Fluxos oficiais por área operacional</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <RefreshCw className="w-5 h-5 text-green-400" />
                      <span className="font-medium text-white">Atualização em Tempo Real</span>
                    </div>
                    <p className="text-sm text-white/60">Sincronização automática de conteúdos</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <span className="font-medium text-white">Compliance Integrado</span>
                    </div>
                    <p className="text-sm text-white/60">Alinhamento regulatório garantido</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* How It Works */}
      <Section id="como-funciona">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-white/60">
              Acesso simples e direto ao conhecimento operacional
            </p>
          </motion.div>

          <div className="space-y-8">
            <Step 
              number="1" 
              title="Selecione a Área de Trade" 
              description="Escolha a área operacional onde atua: Remessas, Eurocobros, Cartas de Crédito ou Financiamentos. Cada área possui trilhas de formação específicas."
            />
            <Step 
              number="2" 
              title="Aceda aos Módulos de Formação" 
              description="Explore os módulos estruturados por processo, desde conceitos fundamentais até procedimentos avançados. Conteúdo desenvolvido por especialistas operacionais."
            />
            <Step 
              number="3" 
              title="Aplique no Dia a Dia" 
              description="Utilize o conhecimento adquirido na execução das suas atividades diárias. Consulte os materiais sempre que necessário como referência."
            />
            <Step 
              number="4" 
              title="Mantenha-se Atualizado" 
              description="Acompanhe as atualizações de conteúdo que refletem as evoluções dos processos e regulamentações do setor de Trade Finance."
            />
          </div>
        </div>
      </Section>

      {/* Benefits Section */}
      <Section className="bg-gradient-to-b from-transparent to-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Benefícios para as Equipas Operacionais
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Capacitação focada em resultados concretos para a operação
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BenefitItem
              icon={BookOpen}
              title="Clareza de Processo"
              description="Compreensão completa de cada etapa operacional, eliminando dúvidas e ambiguidades na execução."
            />
            <BenefitItem
              icon={Layers}
              title="Padronização"
              description="Uniformidade na execução das operações, garantindo consistência entre equipas e turnos."
            />
            <BenefitItem
              icon={Shield}
              title="Redução de Erros"
              description="Diminuição significativa de falhas operacionais através do conhecimento preciso dos procedimentos."
            />
            <BenefitItem
              icon={Award}
              title="Maior Autonomia"
              description="Colaboradores mais preparados para tomar decisões e resolver situações do dia a dia."
            />
            <BenefitItem
              icon={Clock}
              title="Onboarding Eficiente"
              description="Integração mais rápida de novos membros da equipa com acesso imediato ao conhecimento estruturado."
            />
            <BenefitItem
              icon={GraduationCap}
              title="Certificação"
              description="Reconhecimento formal das competências adquiridas através de certificados de conclusão."
            />
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/30 via-red-800/20 to-red-900/30" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div variants={fadeInUp}>
            <GraduationCap className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Aceda ao Portal de Formações
            </h2>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Explore as trilhas de capacitação por processo de Trade e desenvolva as competências 
              essenciais para a excelência operacional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(220, 38, 38, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 font-bold text-lg shadow-xl shadow-red-600/20"
              >
                Começar Agora
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 font-bold text-lg hover:bg-white/10 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Já tenho conta
              </motion.button>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-sds.png"
                alt="Santander Digital Services"
                className="h-8 w-auto filter brightness-0 invert opacity-60"
              />
              <span className="text-white/40">|</span>
              <span className="text-white/60 font-medium">Trade Datahub</span>
            </div>
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} Santander Digital Services. Portal de Formações - Trade Datahub.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
