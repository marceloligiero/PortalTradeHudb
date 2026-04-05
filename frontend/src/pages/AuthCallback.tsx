import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/axios';

/**
 * Página intermédia após SSO Microsoft.
 * Recebe ?token=<JWT PTH> do backend, obtém os dados do utilizador via /auth/me,
 * e redireciona para o dashboard.
 */
export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const { t } = useTranslation();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      navigate(`/login?error=${error ?? 'sso_failed'}`, { replace: true });
      return;
    }

    // Buscar dados completos do utilizador usando o JWT recebido
    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        login(res.data, token);
        navigate('/', { replace: true });
      })
      .catch(() => {
        navigate('/login?error=sso_failed', { replace: true });
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#09090B]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#EC0000]/20 border-t-[#EC0000] rounded-full animate-spin" />
        <p className="font-body text-sm text-gray-500 dark:text-gray-400">
          {t('auth.sso.authenticating')}
        </p>
      </div>
    </div>
  );
}
