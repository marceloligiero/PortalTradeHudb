import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  GraduationCap, 
  Target, 
  TrendingUp, 
  Users, 
  Award, 
  BarChart3,
  ChevronRight,
  CheckCircle
} from 'lucide-react';

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [learningStage, setLearningStage] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const stages = 5;
    const stageHeight = 200;
    const currentStage = Math.min(Math.floor(scrollY / stageHeight), stages - 1);
    setLearningStage(currentStage);
  }, [scrollY]);

  const features = [
    {
      icon: <GraduationCap className="w-12 h-12 text-red-600" />,
      title: t('landing.features.training.title'),
      description: t('landing.features.training.description')
    },
    {
      icon: <Target className="w-12 h-12 text-red-600" />,
      title: t('landing.features.personalized.title'),
      description: t('landing.features.personalized.description')
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-red-600" />,
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description')
    },
    {
      icon: <Award className="w-12 h-12 text-red-600" />,
      title: t('landing.features.certificates.title'),
      description: t('landing.features.certificates.description')
    }
  ];

  const stats = [
    { number: '1000+', label: t('landing.stats.students') },
    { number: '50+', label: t('landing.stats.courses') },
    { number: '95%', label: t('landing.stats.satisfaction') },
    { number: '24/7', label: t('landing.stats.support') }
  ];

  const benefits = [
    t('landing.benefits.flexible'),
    t('landing.benefits.practical'),
    t('landing.benefits.certified'),
    t('landing.benefits.mentorship'),
    t('landing.benefits.community'),
    t('landing.benefits.updates')
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section with Parallax */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background with Parallax Effect */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'linear-gradient(135deg, #000000 0%, #1a0000 50%, #330000 100%)',
            transform: `translateY(${scrollY * 0.5}px)`
          }}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-800 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Learning Journey Animation */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 z-5 hidden lg:flex flex-col items-center space-y-8">
          {/* Stage 0: Iniciante */}
          <div className={`transition-all duration-500 ${learningStage >= 0 ? 'opacity-100 scale-100' : 'opacity-30 scale-75'}`}>
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-xl">
                <GraduationCap className={`w-10 h-10 ${learningStage >= 0 ? 'text-red-500' : 'text-gray-500'}`} />
              </div>
              {learningStage >= 0 && (
                <div className="absolute -right-32 top-1/2 -translate-y-1/2 text-sm font-semibold text-red-500 whitespace-nowrap">
                  Iniciante
                </div>
              )}
            </div>
          </div>

          {/* Connector Line */}
          <div className={`w-1 h-12 rounded-full transition-all duration-500 ${learningStage >= 1 ? 'bg-gradient-to-b from-red-600 to-red-700' : 'bg-gray-700'}`}></div>

          {/* Stage 1: Aprendendo */}
          <div className={`transition-all duration-500 ${learningStage >= 1 ? 'opacity-100 scale-100' : 'opacity-30 scale-75'}`}>
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-800 to-red-900 flex items-center justify-center shadow-xl">
                <Target className={`w-10 h-10 ${learningStage >= 1 ? 'text-red-400' : 'text-gray-500'}`} />
              </div>
              {learningStage >= 1 && (
                <div className="absolute -right-32 top-1/2 -translate-y-1/2 text-sm font-semibold text-red-400 whitespace-nowrap">
                  Aprendendo
                </div>
              )}
            </div>
          </div>

          <div className={`w-1 h-12 rounded-full transition-all duration-500 ${learningStage >= 2 ? 'bg-gradient-to-b from-red-600 to-red-700' : 'bg-gray-700'}`}></div>

          {/* Stage 2: Praticando */}
          <div className={`transition-all duration-500 ${learningStage >= 2 ? 'opacity-100 scale-100' : 'opacity-30 scale-75'}`}>
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-700 to-red-800 flex items-center justify-center shadow-xl">
                <BarChart3 className={`w-10 h-10 ${learningStage >= 2 ? 'text-red-300' : 'text-gray-500'}`} />
              </div>
              {learningStage >= 2 && (
                <div className="absolute -right-32 top-1/2 -translate-y-1/2 text-sm font-semibold text-red-300 whitespace-nowrap">
                  Praticando
                </div>
              )}
            </div>
          </div>

          <div className={`w-1 h-12 rounded-full transition-all duration-500 ${learningStage >= 3 ? 'bg-gradient-to-b from-red-600 to-yellow-500' : 'bg-gray-700'}`}></div>

          {/* Stage 3: Avançado */}
          <div className={`transition-all duration-500 ${learningStage >= 3 ? 'opacity-100 scale-100' : 'opacity-30 scale-75'}`}>
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-yellow-600 flex items-center justify-center shadow-xl">
                <TrendingUp className={`w-10 h-10 ${learningStage >= 3 ? 'text-yellow-300' : 'text-gray-500'}`} />
              </div>
              {learningStage >= 3 && (
                <div className="absolute -right-32 top-1/2 -translate-y-1/2 text-sm font-semibold text-yellow-300 whitespace-nowrap">
                  Avançado
                </div>
              )}
            </div>
          </div>

          <div className={`w-1 h-12 rounded-full transition-all duration-500 ${learningStage >= 4 ? 'bg-gradient-to-b from-yellow-500 to-yellow-400' : 'bg-gray-700'}`}></div>

          {/* Stage 4: Expert */}
          <div className={`transition-all duration-500 ${learningStage >= 4 ? 'opacity-100 scale-110' : 'opacity-30 scale-75'}`}>
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-400 flex items-center justify-center shadow-2xl">
                <Award className={`w-12 h-12 ${learningStage >= 4 ? 'text-yellow-900' : 'text-gray-500'}`} />
              </div>
              {learningStage >= 4 && (
                <>
                  <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-20"></div>
                  <div className="absolute -right-32 top-1/2 -translate-y-1/2 text-sm font-bold text-yellow-400 whitespace-nowrap">
                    Expert! 🏆
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 
            className="text-6xl md:text-7xl font-bold mb-6 animate-fade-in"
            style={{
              transform: `translateY(${scrollY * 0.2}px)`,
              opacity: 1 - scrollY / 500
            }}
          >
            <span className="text-white">Trade</span>
            <span className="text-red-600">Hub</span>
            <span className="text-white"> Formações</span>
          </h1>
          
          <p 
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            style={{
              transform: `translateY(${scrollY * 0.3}px)`,
              opacity: 1 - scrollY / 500
            }}
          >
            {t('landing.hero.subtitle')}
          </p>

          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            style={{
              transform: `translateY(${scrollY * 0.4}px)`,
              opacity: 1 - scrollY / 500
            }}
          >
            <button
              onClick={() => navigate('/register')}
              className="group px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-red-600/50"
            >
              {t('landing.hero.cta')}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-transparent border-2 border-white hover:bg-white hover:text-black text-white rounded-lg font-semibold transition-all"
            >
              {t('landing.hero.login')}
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 bg-gray-800/50 rounded-lg border border-red-600/20 hover:border-red-600/50 transition-all"
              >
                <div className="text-4xl md:text-5xl font-bold text-red-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Parallax */}
      <section 
        className="py-32 relative"
        style={{
          backgroundImage: 'linear-gradient(180deg, #111111 0%, #000000 100%)',
        }}
      >
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            transform: `translateY(${(scrollY - 800) * 0.3}px)`
          }}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-gray-900 rounded-xl border border-gray-800 hover:border-red-600 transition-all hover:shadow-xl hover:shadow-red-600/20 transform hover:-translate-y-2"
              >
                <div className="mb-4 transform group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {t('landing.benefits.title')}
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                {t('landing.benefits.subtitle')}
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-all"
                  >
                    <CheckCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 p-8 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Users className="w-12 h-12 text-white" />
                    <div>
                      <div className="text-3xl font-bold text-white">
                        {t('landing.community.students')}
                      </div>
                      <div className="text-red-100">
                        {t('landing.community.active')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <TrendingUp className="w-12 h-12 text-white" />
                    <div>
                      <div className="text-3xl font-bold text-white">
                        {t('landing.community.growth')}
                      </div>
                      <div className="text-red-100">
                        {t('landing.community.monthly')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-red-600 rounded-2xl blur-3xl opacity-30 transform translate-x-4 translate-y-4"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'linear-gradient(135deg, #000000 0%, #330000 100%)',
            transform: `translateY(${(scrollY - 2000) * 0.2}px)`
          }}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600 rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {t('landing.cta.subtitle')}
          </p>
          <button
            onClick={() => navigate('/register')}
            className="group px-12 py-5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 inline-flex items-center gap-3 shadow-2xl shadow-red-600/50"
          >
            {t('landing.cta.button')}
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="text-white">Trade</span>
                <span className="text-red-600">Hub</span>
              </h3>
              <p className="text-gray-400">
                {t('landing.footer.description')}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">
                {t('landing.footer.links')}
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-red-600 cursor-pointer transition-colors">
                  {t('landing.footer.about')}
                </li>
                <li className="hover:text-red-600 cursor-pointer transition-colors">
                  {t('landing.footer.courses')}
                </li>
                <li className="hover:text-red-600 cursor-pointer transition-colors">
                  {t('landing.footer.contact')}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">
                {t('landing.footer.legal')}
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-red-600 cursor-pointer transition-colors">
                  {t('landing.footer.privacy')}
                </li>
                <li className="hover:text-red-600 cursor-pointer transition-colors">
                  {t('landing.footer.terms')}
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center text-gray-500 pt-8 border-t border-gray-800">
            <p>© 2025 TradeHub Formações - Santander Digital Services. {t('landing.footer.rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
