import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { translations, Language, languages } from '../lib/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (): Language => {
    if (typeof window !== 'undefined') {
        const storedLang = localStorage.getItem('language') as Language;
        if (storedLang && languages[storedLang]) {
            return storedLang;
        }
    }
    return 'es'; // Default to Spanish
};


export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(getInitialLanguage());

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', language);
        }
    }, [language]);
    
    const setLanguage = (lang: Language) => {
        if (languages[lang]) {
            setLanguageState(lang);
        }
    };

    const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
        const keys = key.split('.');
        
        const findTranslation = (lang: Language): string | null => {
            let result: any = translations[lang];
            for (const k of keys) {
                result = result?.[k];
                if (result === undefined) return null;
            }
            return typeof result === 'string' ? result : null;
        };

        let template = findTranslation(language) ?? findTranslation('en') ?? key;

        if (replacements) {
            Object.entries(replacements).forEach(([rKey, value]) => {
                template = template.replace(new RegExp(`\\{${rKey}\\}`, 'g'), String(value));
            });
        }

        return template;
    }, [language]);


    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};