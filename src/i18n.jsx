/*
lee el idioma desde la URL (/en/... o /es/...) y 
expone la función t('clave') para traducir cualquier texto. 
Cuando llamas a changeLocale('es') cambia la URL y 
todos los textos sin recargar la página.
*/

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import en from './locales/en.json';
import es from './locales/es.json';

const dictionaries = { en, es };
const SUPPORTED = ['en', 'es'];
const DEFAULT_LOCALE = 'en';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const urlLocale = params.lang;
  const [locale, setLocale] = useState(
    SUPPORTED.includes(urlLocale) ? urlLocale : DEFAULT_LOCALE
  );

  useEffect(() => {
    if (urlLocale && SUPPORTED.includes(urlLocale) && urlLocale !== locale) {
      setLocale(urlLocale);
    }
  }, [urlLocale, locale]);

  const t = useCallback(
    (key, vars = {}) => {
      const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
      let str = dict[key] ?? key;
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replaceAll(`{{${k}}}`, String(v));
      });
      return str;
    },
    [locale]
  );

  const changeLocale = useCallback(
    (newLocale) => {
      if (!SUPPORTED.includes(newLocale)) return;
      const newPath = location.pathname.replace(/^\/(en|es)/, `/${newLocale}`);
      navigate(newPath + location.search, { replace: false });
      setLocale(newLocale);
    },
    [location, navigate]
  );

  return (
    <I18nContext.Provider value={{ locale, t, changeLocale, SUPPORTED }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}