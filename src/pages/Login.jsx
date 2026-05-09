import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';

/*
reproduce exactamente tu vista Stitch de Astro-Auth con glassmorphism, nebula background y terminología aeroespacial. 
Al hacer submit llama a login() del AuthContext contra dummyjson y redirige al dashboard si tiene éxito.
*/

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, user } = useAuth();
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || `/${locale}/dashboard`;
      navigate(from, { replace: true });
    }
  }, [user, navigate, location, locale]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || t('login.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center nebula-bg relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]"></div>
      </div>

      <main className="relative z-10 w-full max-w-[440px] px-6">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl glass-panel mb-6 neon-glow">
            <span className="material-symbols-outlined text-primary text-[32px]">satellite_alt</span>
          </div>
          <h1 className="text-5xl font-bold text-on-surface tracking-tighter mb-2">
            {t('login.title')}
          </h1>
          <p className="text-[11px] font-mono text-on-surface-variant uppercase tracking-[0.2em]">
            {t('login.subtitle')}
          </p>
        </header>

        <section className="glass-panel p-8 rounded-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="username" className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest px-1 flex justify-between">
                <span>{t('login.identity')}</span>
                <span className="text-primary/50">SECURE_LINK_01</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors text-base">person</span>
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('login.identity.placeholder')}
                  required
                  autoComplete="username"
                  className="block w-full pl-10 pr-3 py-3 bg-surface-container-lowest/40 border border-outline-variant/30 rounded-lg text-on-surface font-mono text-base focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-on-surface-variant/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest px-1">
                {t('login.cipher')}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors text-base">key</span>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-10 py-3 bg-surface-container-lowest/40 border border-outline-variant/30 rounded-lg text-on-surface font-mono text-base focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-on-surface-variant/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-base">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-error text-sm font-mono">{error}</p>
            )}

            <p className="text-[10px] font-mono text-on-surface-variant/60 text-center">
              {t('login.demo_hint')}
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-on-surface text-surface-container-lowest rounded-lg text-base font-bold hover:bg-primary transition-all active:scale-[0.98] neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '...' : t('login.access')}
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </form>
        </section>

        <footer className="mt-8 text-center space-y-2">
          <div className="flex items-center justify-center space-x-5 font-mono text-[10px] text-primary/40">
            <span className="flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
              {t('login.station_stable')}
            </span>
            <span>ENC: AES-256-GCM</span>
            <span>V.4.8.2-AURORA</span>
          </div>
        </footer>
      </main>
    </div>
  );
}