import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitch } from './LanguageSwitch';

/*
 es el layout compartido por Dashboard, Wind y Aurora — 
 sidebar fijo a la izquierda con navegación, topbar con estado de sesión y switch de idioma. 
 El <Outlet /> es donde React Router renderiza la página activa (Dashboard, Wind o Aurora según la ruta).
*/

export default function AppLayout() {
  const { t, locale } = useTranslation();
  const { user, logout } = useAuth();

  const navItems = [
    { to: `/${locale}/dashboard`, icon: 'dashboard', label: t('nav.dashboard') },
    { to: `/${locale}/wind`, icon: 'air', label: t('nav.wind') },
    { to: `/${locale}/aurora`, icon: 'auto_awesome', label: t('nav.aurora') },
    { to: `/${locale}/stellarium`, icon: 'stars', label: 'Stellarium' },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-20 flex flex-col justify-between py-6 z-50 bg-surface-container-lowest/60 backdrop-blur-xl border-r border-white/10">
        <div className="flex flex-col items-center gap-8">
          <div className="text-3xl font-bold text-primary px-2">S</div>
          <nav className="flex flex-col w-full">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-4 transition-all duration-300 ${
                    isActive
                      ? 'text-primary border-l-2 border-primary bg-primary/5'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                  }`
                }
              >
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                <span className="text-[10px] font-semibold mt-1">
                  {item.label.split(' ')[0]}
                </span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={logout}
            className="text-on-surface-variant hover:text-error transition-colors"
            title={t('nav.logout')}
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
          <div className="w-10 h-10 rounded-full border border-white/10 bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant">person</span>
          </div>
        </div>
      </aside>

      {/* Top bar */}
      <header className="fixed top-0 left-20 right-0 flex justify-between items-center px-8 py-5 z-40 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-medium tracking-tight">{t('app.station')}</h1>
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-[0.2em]">
            Global Astro-Monitor v2.4
          </span>
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-3 px-4 py-2 glass-panel rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-[11px] font-mono text-emerald-400">{t('status.live')}</span>
          </div>
          <LanguageSwitch />
          <div className="h-9 px-4 rounded-full glass-panel flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">token</span>
            <span className="text-[11px] font-mono text-primary/80">
              JWT: {user?.username?.toUpperCase() || 'ANON'}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="ml-20 pt-24 px-8 pb-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}