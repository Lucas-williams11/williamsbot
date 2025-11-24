
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';

export const Footer: React.FC = () => {
    const { quotaUsed } = useSettings();
    const { t } = useLanguage();

    return (
        <footer className="bg-slate-900 mt-auto border-t border-slate-800">
            <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-slate-500 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <p>&copy; {new Date().getFullYear()} Creator Boost AI. {t('footer.rights')}</p>
                  <p className="mt-1">{t('footer.tagline')}</p>
                  <p className="mt-2 text-cyan-500 font-medium">Created by Lucas Williams</p>
                </div>
                <div className="text-right font-mono text-xs">
                    <span>{t('footer.quota')}: </span>
                    <span className="text-slate-400">~{quotaUsed.toLocaleString()} / 10,000 {t('footer.units')}</span>
                </div>
            </div>
        </footer>
    );
};
