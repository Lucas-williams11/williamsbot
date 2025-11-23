import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../lib/translations';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: 'keyword' | 'channel' | 'chat' | 'one-million') => void;
  onSettingsClick: () => void;
}

const LanguageSelector: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="relative">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502" />
             </svg>
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-slate-700/50 text-white text-sm rounded-md py-2 pl-8 pr-4 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none hover:bg-slate-700 transition-colors"
                aria-label="Select language"
            >
                {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                ))}
            </select>
        </div>
    );
}

const NavButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  // FIX: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
  icon: React.ReactElement;
}> = ({ label, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
      isActive
        ? 'bg-cyan-500 text-white'
        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`}
  >
    {icon}
    {label}
  </button>
);


export const Header: React.FC<HeaderProps> = ({ activeView, setActiveView, onSettingsClick }) => {
  const { isKeyValid } = useSettings();
  const { t } = useLanguage();

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
             <svg className="w-8 h-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
             </svg>
            <h1 className="text-xl font-bold text-white tracking-tight">Creator Boost AI</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="flex items-center gap-1 sm:gap-2">
              <NavButton 
                  label={t('header.keywordIdeas')}
                  isActive={activeView === 'keyword'} 
                  onClick={() => setActiveView('keyword')}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>}
              />
              <NavButton 
                  label={t('header.channelAnalysis')}
                  isActive={activeView === 'channel'} 
                  onClick={() => setActiveView('channel')}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>}
              />
              <NavButton 
                  label={t('header.aiConsultant')}
                  isActive={activeView === 'chat'} 
                  onClick={() => setActiveView('chat')}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.455.09-.934.09-1.425v-2.134c0-2.616.21-5.148.608-7.526C8.154 4.043 9.97 3 12 3c4.97 0 9 3.694 9 8.25Z" /></svg>}
              />
               <NavButton 
                  label={t('header.oneMillion')}
                  isActive={activeView === 'one-million'} 
                  onClick={() => setActiveView('one-million')}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.452-2.452L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.452-2.452L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.452 2.452L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.452 2.452Z" /></svg>}
              />
            </nav>
            <div className="h-6 w-px bg-slate-600"></div>
            <LanguageSelector />
            <button onClick={onSettingsClick} className="relative px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors">
              {t('settingsModal.title')}
              {!isKeyValid && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-800"></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};