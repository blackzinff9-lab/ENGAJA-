import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './i18n';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'pt',
  setLang: () => {},
  t: () => '',
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('engajai_lang') as Language) || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('engajai_lang', lang);
  }, [lang]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let result: any = translations[lang];
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key; // Retorna a chave se não encontrar
      }
    }
    return typeof result === 'string' ? result : key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
