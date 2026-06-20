import React, { createContext, useContext, useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';

const LANGUAGE_FILE = `${FileSystem.documentDirectory}lang.txt`;
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const info = await FileSystem.getInfoAsync(LANGUAGE_FILE);
        if (info.exists) {
          const saved = await FileSystem.readAsStringAsync(LANGUAGE_FILE);
          if (saved === 'en' || saved === 'zh') {
            setLang(saved);
          }
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  const toggleLang = async () => {
    const next = lang === 'en' ? 'zh' : 'en';
    setLang(next);
    try {
      await FileSystem.writeAsStringAsync(LANGUAGE_FILE, next);
    } catch {}
  };

  if (!ready) return null;

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
