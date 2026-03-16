import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/auth';
import { useAuthStore } from '../stores/authStore';
import {
  LogIn, Mail, Lock, Eye, EyeOff,
  ArrowRight, UserPlus, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingNavbar from '../components/landing/LandingNavbar';

/* ═══════════════════════════════════════════════════════════════════
   Mesh Gradient Background (interactive canvas)
   ═══════════════════════════════════════════════════════════════════ */
function MeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const blobs = [
      { x: 0.2, y: 0.3, r: 350, color: [220, 38, 38], speed: 0.0003 },
      { x: 0.8, y: 0.7, r: 300, color: [124, 58, 237], speed: 0.0004 },
      { x: 0.5, y: 0.2, r: 250, color: [8, 145, 178], speed: 0.0005 },
      { x: 0.3, y: 0.8, r: 200, color: [220, 38, 38], speed: 0.0002 },
    ];

    const draw = () => {
      timeRef.current += 1;
      const t = timeRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const b of blobs) {
        const bx = (b.x + Math.sin(t * b.speed) * 0.15 + (mouseRef.current.x - 0.5) * 0.05) * canvas.width;
        const by = (b.y + Math.cos(t * b.speed * 1.3) * 0.12 + (mouseRef.current.y - 0.5) * 0.05) * canvas.height;
        const grd = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
        grd.addColorStop(0, `rgba(${b.color.join(',')}, 0.08)`);
        grd.addColorStop(1, `rgba(${b.color.join(',')}, 0)`);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener('mousemove', onMove);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
}

/* ═══════════════════════════════════════════════════════════════════
   Noise Texture Overlay
   ═══════════════════════════════════════════════════════════════════ */
function NoiseOverlay() {
  return (
    <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      }}
    />
  );
}



/* ═══════════════════════════════════════════════════════════════════
   Input Component
   ═══════════════════════════════════════════════════════════════════ */
function FloatInput({ type = 'text', placeholder, value, onChange, icon, right, autoFocus }: {
  type?: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode; right?: React.ReactNode; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-300 ${
      focused
        ? 'border-red-500/50 bg-white/[0.06] shadow-[0_0_0_4px_rgba(220,38,38,0.08)]'
        : 'border-white/[0.08] bg-white/[0.025] hover:border-white/[0.15] hover:bg-white/[0.04]'
    }`}>
      <div className={`flex-shrink-0 transition-colors duration-200 ${focused ? 'text-red-400' : 'text-white/25'}`}>
        {icon}
      </div>
      <style>{`input:-webkit-autofill,input:-webkit-autofill:hover,input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 1000px transparent inset!important;-webkit-text-fill-color:#fff!important;caret-color:#fff!important;background-color:transparent!important;transition:background-color 5000s ease-in-out 0s}`}</style>
      <input
        type={type} value={value} onChange={onChange} autoFocus={autoFocus}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white placeholder-white/20 outline-none text-[15px] font-medium"
      />
      {right}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Brand Panel — Left side showcase
   ═══════════════════════════════════════════════════════════════════ */
function BrandPanel({ t }: { t: (key: string) => string }) {
  return (
    <div className="hidden lg:flex flex-col justify-between p-14 relative">
      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Large decorative arrow */}
      <div className="absolute -right-20 top-1/2 -translate-y-1/2 text-[28rem] font-black text-white/[0.015] leading-none select-none pointer-events-none">
        →
      </div>

      <div className="relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-8">
            <Zap className="w-3 h-3 text-red-400" />
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
              {t('auth.brandPanel.loginBadge')}
            </span>
          </div>

          <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.05] tracking-tight">
            {t('auth.brandPanel.loginTitle1')}<br />
            {t('auth.brandPanel.loginTitle2')} <span className="bg-gradient-to-r from-red-500 via-red-400 to-orange-400 bg-clip-text text-transparent">{t('auth.brandPanel.loginHighlight')}</span><br />
            {t('auth.brandPanel.loginTitle3')}
          </h1>

          <p className="mt-6 text-white/30 text-base leading-relaxed max-w-md">
            {t('auth.brandPanel.loginDesc')}
          </p>
        </motion.div>
      </div>

      {/* Bottom accent line */}
      <div className="relative z-10 mt-8">
        <div className="h-px bg-gradient-to-r from-red-500/30 via-white/10 to-transparent" />
        <p className="mt-4 text-[11px] text-white/15 font-medium">
          {t('auth.copyrightFull')}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(s => s.login);
  const rawRedirect = new URLSearchParams(location.search).get('redirect') || '/';
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: any) => { login(data.user, data.access_token); navigate(redirectTo); },
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); loginMutation.mutate({ email, password }); };

  return (
    <div className="min-h-screen bg-[#050508] relative overflow-hidden">
      <MeshBackground />
      <NoiseOverlay />
      <LandingNavbar minimal />

      <div className="relative z-10 min-h-screen flex items-stretch">
        {/* LEFT: Brand Panel */}
        <div className="hidden lg:flex lg:w-[55%]">
          <BrandPanel t={t} />
        </div>

        {/* Vertical divider */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

        {/* RIGHT: Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[400px]">

            {/* Mobile brand */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:hidden flex items-center gap-2.5 mb-10">
              <img src="/logo-sds.png" alt="SDS" className="h-8 w-auto" />
              <span className="text-base font-black text-white/80">
                Trade<span className="text-red-500">Data</span>Hub
              </span>
            </motion.div>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}>
              <p className="text-white/30 text-sm font-medium mb-2">{t('auth.loginToContinue')}</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {t('common.welcome')}<span className="text-red-500">.</span>
              </h2>
            </motion.div>

            {/* Form */}
            <motion.form onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-10 space-y-4">

              <FloatInput
                type="email" placeholder={t('auth.emailPlaceholder')} value={email}
                onChange={e => setEmail(e.target.value)} autoFocus
                icon={<Mail className="w-[18px] h-[18px]" />}
              />

              <FloatInput
                type={showPassword ? 'text' : 'password'} placeholder={t('auth.password')} value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<Lock className="w-[18px] h-[18px]" />}
                right={
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0 p-0.5">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <div className="flex justify-end pt-1">
                <Link to="/forgot-password"
                  className="text-xs font-medium text-white/25 hover:text-red-400 transition-colors">
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              {/* Error */}
              <AnimatePresence>
                {loginMutation.isError && (
                  <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-400 font-medium">{t('auth.loginError')}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <div className="pt-2">
                <motion.button type="submit" disabled={loginMutation.isPending}
                  whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.985 }}
                  className="relative w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold text-[15px] overflow-hidden disabled:opacity-50 group cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}>
                  {/* Shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: '0 12px 40px rgba(220,38,38,0.4), 0 4px 12px rgba(220,38,38,0.3)' }} />
                  {loginMutation.isPending ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <span className="relative flex items-center gap-2.5">
                      <LogIn className="w-[18px] h-[18px]" />
                      <span>{t('auth.login')}</span>
                      <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </motion.button>
              </div>
            </motion.form>

            {/* Divider */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-white/15 font-medium uppercase tracking-wider">{t('common.or')}</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </motion.div>

            {/* Register link */}
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              type="button" onClick={() => navigate('/register')}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-white/[0.06] text-sm font-semibold text-white/30 hover:text-white/60 hover:bg-white/[0.03] hover:border-white/[0.12] transition-all duration-300 group cursor-pointer">
              <UserPlus className="w-4 h-4" />
              <span>{t('auth.noAccount')}</span>
              <span className="text-red-500 font-bold">{t('auth.register')}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </motion.button>

            {/* Footer (mobile) */}
            <p className="lg:hidden text-center text-[11px] text-white/10 mt-10">
              {t('auth.copyright')}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
