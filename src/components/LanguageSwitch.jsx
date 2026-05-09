import { useTranslation } from '../i18n';

/*
muestra dos botones EN y ES, el activo aparece resaltado con tu color primario. 
Al hacer click llama a changeLocale que actualiza la URL y cambia todos los textos sin recargar.
*/

export function LanguageSwitch() {
  const { locale, changeLocale, SUPPORTED } = useTranslation();

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full glass-panel border border-white/5">
      {SUPPORTED.map((lang) => (
        <button
          key={lang}
          onClick={() => changeLocale(lang)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all ${
            locale === lang
              ? 'bg-primary text-on-primary'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          aria-pressed={locale === lang}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}