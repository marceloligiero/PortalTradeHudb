import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, CheckCircle, XCircle, Moon, Sun, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Alert } from '../components';
import api from '../lib/axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setError('Token não fornecido');
      return;
    }

    const validateToken = async () => {
      try {
        await api.get(`/api/auth/validate-reset-token/${token}`);
        setTokenValid(true);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Token inválido ou expirado');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/reset-password', {
        token,
        new_password: password
      });
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    // Loading state
    if (validating) {
      return (
        <div className="text-center">
          <div className={`animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4 ${
            isDark ? 'border-red-500' : 'border-red-600'
          }`} />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Validando token...</p>
        </div>
      );
    }

    // Token inválido
    if (!tokenValid && !success) {
      return (
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mb-6 shadow-lg shadow-red-600/20"
          >
            <XCircle className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className={`text-3xl font-black tracking-tight mb-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Link Inválido
          </h1>
          <p className={`font-medium mb-6 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {error || 'O link de recuperação é inválido ou já expirou.'}
          </p>
          <div className="space-y-4">
            <Link to="/forgot-password">
              <Button variant="primary" size="lg" className="w-full">
                Solicitar Novo Link
              </Button>
            </Link>
            <Link
              to="/login"
              className={`inline-flex items-center gap-2 font-medium ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Voltar ao Login
            </Link>
          </div>
        </div>
      );
    }

    // Sucesso
    if (success) {
      return (
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-6 shadow-lg shadow-green-600/20"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className={`text-3xl font-black tracking-tight mb-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Senha Alterada!
          </h1>
          <p className={`font-medium mb-6 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Sua senha foi redefinida com sucesso. Você será redirecionado para o login...
          </p>
          <Link to="/login">
            <Button variant="primary" size="lg" className="w-full">
              <ArrowRight className="w-4 h-4 rotate-180 mr-2" />
              Ir para o Login
            </Button>
          </Link>
        </div>
      );
    }

    // Formulário
    return (
      <>
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl mb-6 shadow-lg shadow-red-600/20"
          >
            <Lock className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className={`text-3xl font-black tracking-tight mb-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Nova Senha
          </h1>
          <p className={`font-medium ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Digite sua nova senha abaixo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert type="error" message={error} />
          )}

          <Input
            type="password"
            label="Nova Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            icon={<Lock className="w-5 h-5" />}
            theme={isDark ? 'dark' : 'light'}
            required
          />

          <Input
            type="password"
            label="Confirmar Nova Senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
            icon={<Lock className="w-5 h-5" />}
            theme={isDark ? 'dark' : 'light'}
            required
          />

          {password && confirmPassword && password !== confirmPassword && (
            <p className="text-red-500 text-sm">As senhas não coincidem</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={loading}
            disabled={!password || !confirmPassword || password !== confirmPassword}
            icon={<ArrowRight className="w-5 h-5" />}
          >
            Redefinir Senha
          </Button>
        </form>

        <div className="mt-10 text-center">
          <p className={`font-medium ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Lembrou a senha?{' '}
            <Link
              to="/login"
              className="text-red-500 hover:text-red-400 font-bold transition-colors"
            >
              Fazer Login
            </Link>
          </p>
        </div>
      </>
    );
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] animate-blob ${
          isDark ? 'bg-red-600/10' : 'bg-red-600/5'
        }`} />
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[120px] animate-blob animation-delay-2000 ${
          isDark ? 'bg-blue-600/5' : 'bg-blue-600/3'
        }`} />
      </div>

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80&auto=format&fit=crop"
          alt="Background"
          className={`w-full h-full object-cover ${
            isDark ? 'opacity-5' : 'opacity-[0.03]'
          }`}
        />
      </div>

      {/* Navbar — floating pill */}
      <div className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 pt-4 pointer-events-none">
        <motion.div
          initial={{ y: -28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-5xl mx-auto pointer-events-auto"
        >
          <div className={`rounded-2xl p-px ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.08]'}`}>
            <div className={`rounded-[15px] backdrop-blur-2xl px-5 h-14 flex items-center justify-between ${isDark ? 'bg-[#030307]/80' : 'bg-white/80'}`}>
              {/* Brand */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                <img src="/logo-sds.png" alt="SDS" className={`h-8 w-auto object-contain ${isDark ? '' : 'brightness-0'}`} />
                <div className={`h-5 w-px ${isDark ? 'bg-white/15' : 'bg-gray-300'}`} />
                <span className={`text-sm font-black tracking-tight ${isDark ? 'text-white/90' : 'text-gray-800'}`}>Trade<span className="text-red-500">Data</span>Hub</span>
              </motion.div>
              {/* Controls */}
              <div className="flex items-center gap-1.5">
                {/* Language */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setLangOpen(o => !o)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${isDark ? 'border-white/[0.09] text-gray-400 hover:bg-white/[0.07] hover:text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}>
                    <Globe className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{i18n.language.startsWith('es') ? '🇪🇸 ES' : i18n.language.startsWith('en') ? '🇺🇸 EN' : '🇵🇹 PT'}</span>
                  </button>
                  <AnimatePresence>
                    {langOpen && (
                      <motion.div initial={{opacity:0,scale:.92,y:-4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.92,y:-4}} transition={{duration:.14}} className={`absolute right-0 top-full mt-2 rounded-xl border shadow-2xl overflow-hidden z-20 min-w-[120px] ${isDark ? 'bg-[#0c0c12] border-white/10' : 'bg-white border-gray-200'}`}>
                        {[{code:'pt-PT',label:'🇵🇹 Português'},{code:'es',label:'🇪🇸 Español'},{code:'en',label:'🇺🇸 English'}].map(l=>(
                          <button key={l.code} onClick={()=>{i18n.changeLanguage(l.code);localStorage.setItem('language',l.code);setLangOpen(false);}} className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${i18n.language.startsWith(l.code.slice(0,2))?'text-red-500 font-bold':isDark?'text-gray-400 hover:bg-white/5 hover:text-white':'text-gray-600 hover:bg-gray-50'}`}>{l.label}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Theme */}
                <button onClick={toggleTheme} className={`p-1.5 rounded-xl border transition-all ${isDark ? 'border-white/[0.09] text-gray-400 hover:bg-white/[0.07]' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                  <AnimatePresence mode="wait">
                    <motion.div key={isDark?'sun':'moon'} initial={{rotate:-30,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:30,opacity:0}} transition={{duration:.2}}>
                      {isDark ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
                    </motion.div>
                  </AnimatePresence>
                </button>
                <div className={`h-5 w-px mx-0.5 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                <Link to="/login" className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/[0.06]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span className="hidden sm:inline">{t('auth.backToLogin', 'Voltar ao Login')}</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Form */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={`rounded-[32px] shadow-2xl p-10 border backdrop-blur-xl ${
              isDark
                ? 'bg-white/5 border-white/10'
                : 'bg-white border-gray-200'
            }`}
          >
            {renderContent()}
          </motion.div>

          {/* Additional Info */}
          <p className={`text-center text-sm mt-10 font-medium ${
            isDark ? 'text-gray-600' : 'text-gray-500'
          }`}>
            {t('common.appName')} © 2025
          </p>
        </motion.div>
      </div>
    </div>
  );
}
