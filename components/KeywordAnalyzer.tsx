
import React, { useState } from 'react';
import { generateKeywordIdeas } from '../services/geminiService';
import { VideoIdea } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ActionButton } from './common/ActionButton';
import { useLanguage } from '../contexts/LanguageContext';

const IdeaCard: React.FC<{ idea: VideoIdea }> = ({ idea }) => (
  <div className="bg-slate-800/50 rounded-lg shadow-lg p-6 border border-slate-700 transform hover:scale-105 hover:border-cyan-500 transition-all duration-300">
    <h3 className="text-xl font-bold text-cyan-400 mb-2">{idea.title}</h3>
    <p className="text-slate-300 mb-4">{idea.description}</p>
    <div className="flex flex-wrap gap-2">
      {idea.tags.map((tag, index) => (
        <span key={index} className="px-3 py-1 text-xs font-medium text-cyan-200 bg-cyan-900/50 rounded-full">
          {tag}
        </span>
      ))}
    </div>
  </div>
);

export const KeywordAnalyzer: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, language } = useLanguage();

  const handleAnalyze = async () => {
    if (!keyword.trim()) {
      setError('keywordAnalyzer.error.enterKeyword');
      return;
    }
    setIsLoading(true);
    setError(null);
    setIdeas([]);
    try {
      const result = await generateKeywordIdeas(keyword, language);
      setIdeas(result);
    } catch (e) {
      setError('keywordAnalyzer.error.generateFailed');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">{t('keywordAnalyzer.title')}</h2>
        <p className="mt-4 text-lg text-slate-400">{t('keywordAnalyzer.description')}</p>
      </div>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          placeholder={t('keywordAnalyzer.placeholder')}
          className="flex-grow bg-slate-800 border border-slate-600 text-white placeholder-slate-400 text-base rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-3.5"
          disabled={isLoading}
        />
        <ActionButton onClick={handleAnalyze} isLoading={isLoading}>
          {t('keywordAnalyzer.button')}
        </ActionButton>
      </div>

      {error && <p className="text-center text-red-400 mb-4">{t(error)}</p>}

      {isLoading && <LoadingSpinner />}

      {ideas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {ideas.map((idea, index) => (
            <IdeaCard key={index} idea={idea} />
          ))}
        </div>
      )}
      
      {!isLoading && ideas.length === 0 && !error && (
        <div className="text-center py-10">
          <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-slate-300">{t('keywordAnalyzer.ready.title')}</h3>
          <p className="mt-1 text-sm text-slate-500">{t('keywordAnalyzer.ready.description')}</p>
        </div>
      )}
    </div>
  );
};
