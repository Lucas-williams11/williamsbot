import React, { useState } from 'react';
import { Header } from './components/Header';
import { KeywordAnalyzer } from './components/KeywordAnalyzer';
import { ChannelAnalyzer } from './components/ChannelAnalyzer';
import { ChatConsultant } from './components/ChatConsultant';
import { Footer } from './components/Footer';
import { SettingsProvider } from './contexts/SettingsContext';
import { SettingsModal } from './components/SettingsModal';
import { OneMillionConsultant } from './components/OneMillionConsultant';
import { LanguageProvider } from './contexts/LanguageContext';


type View = 'keyword' | 'channel' | 'chat' | 'one-million';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('keyword');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case 'keyword':
        return <KeywordAnalyzer />;
      case 'channel':
        return <ChannelAnalyzer />;
      case 'chat':
        return <ChatConsultant />;
      case 'one-million':
        return <OneMillionConsultant />;
      default:
        return <KeywordAnalyzer />;
    }
  };

  return (
    <SettingsProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col font-sans">
          <Header activeView={activeView} setActiveView={setActiveView} onSettingsClick={() => setIsSettingsOpen(true)} />
          <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            {renderView()}
          </main>
          <Footer />
          <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
      </LanguageProvider>
    </SettingsProvider>
  );
};

export default App;