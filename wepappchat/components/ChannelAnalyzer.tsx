
import React, { useState } from 'react';
import { generateChannelAnalysis } from '../services/geminiService';
import { fetchChannelData } from '../services/youtubeDataService';
import { ChannelAnalysis, YouTubeChannel } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ActionButton } from './common/ActionButton';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';

const ChannelHeader: React.FC<{ channel: YouTubeChannel }> = ({ channel }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-slate-800/50 rounded-lg p-6 mb-6 border border-slate-700 flex flex-col sm:flex-row items-center gap-6 animate-fade-in">
            <img src={channel.thumbnailUrl.replace('default.jpg', 'high.jpg')} alt={`${channel.title} thumbnail`} className="w-24 h-24 rounded-full border-2 border-cyan-400" />
            <div className="text-center sm:text-left">
                <h3 className="text-2xl font-bold text-white">{channel.title}</h3>
                <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 mt-2 text-slate-300">
                    <span><strong className="text-white">{Number(channel.stats.subscriberCount).toLocaleString()}</strong> {t('channelAnalyzer.subscribers')}</span>
                    <span><strong className="text-white">{Number(channel.stats.viewCount).toLocaleString()}</strong> {t('channelAnalyzer.views')}</span>
                    <span><strong className="text-white">{Number(channel.stats.videoCount).toLocaleString()}</strong> {t('channelAnalyzer.videos')}</span>
                </div>
            </div>
        </div>
    );
}


// FIX: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
const AnalysisSection: React.FC<{ title: string; items: string[] | {title: string; description: string}[]; icon: React.ReactElement; }> = ({ title, items, icon }) => (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h3 className="flex items-center text-xl font-bold text-cyan-400 mb-4">
            {icon}
            <span className="ml-2">{title}</span>
        </h3>
        <ul className="space-y-3">
            {items.map((item, index) => (
                <li key={index} className="flex items-start text-slate-300">
                    <svg className="w-5 h-5 text-cyan-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {typeof item === 'string' ? <span>{item}</span> : <div><p className="font-semibold text-slate-100">{item.title}</p><p className="text-sm text-slate-400">{item.description}</p></div>}
                </li>
            ))}
        </ul>
    </div>
);


export const ChannelAnalyzer: React.FC = () => {
    const [channelId, setChannelId] = useState('');
    const [channelData, setChannelData] = useState<YouTubeChannel | null>(null);
    const [analysis, setAnalysis] = useState<ChannelAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState('');
    const { apiKey, incrementQuotaUsage } = useSettings();
    const { t, language } = useLanguage();


    const handleAnalyze = async () => {
        if (!apiKey) {
            setError('error.youtubeApiKeyNotSet');
            return;
        }
        if (!channelId.trim()) {
            setError('error.enterChannel');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        setChannelData(null);
        try {
            setLoadingStep(t('channelAnalyzer.loading.fetching'));
            const result = await fetchChannelData(channelId, apiKey);
            setChannelData(result);
            incrementQuotaUsage();

            setLoadingStep(t('channelAnalyzer.loading.generating'));
            const aiAnalysis = await generateChannelAnalysis(result, language);
            setAnalysis(aiAnalysis);

        } catch (e: any) {
            let errorMessageKey = 'error.unknown';
            if (e.message) {
                const lowerCaseMessage = e.message.toLowerCase();
                if (lowerCaseMessage.includes("not found")) {
                    errorMessageKey = 'error.channelNotFound';
                } else if (lowerCaseMessage.includes("failed to fetch")) {
                    errorMessageKey = 'error.fetchFailed';
                }
            }
            setError(errorMessageKey);
            console.error(e);
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">{t('channelAnalyzer.title')}</h2>
                <p className="mt-4 text-lg text-slate-400">{t('channelAnalyzer.description')}</p>
            </div>

            <div className="flex gap-2 mb-8">
                <input
                    type="text"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    placeholder={t('channelAnalyzer.placeholder')}
                    className="flex-grow bg-slate-800 border border-slate-600 text-white placeholder-slate-400 text-base rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-3.5"
                    disabled={isLoading}
                />
                <ActionButton onClick={handleAnalyze} isLoading={isLoading}>
                    {t('channelAnalyzer.button')}
                </ActionButton>
            </div>

            {error && <p className="text-center text-red-400 mb-4 bg-red-900/20 p-3 rounded-lg">{t(error)}</p>}
            
            {isLoading && (
              <div className="text-center">
                <LoadingSpinner />
                <p className="text-slate-400 mt-2">{loadingStep}</p>
              </div>
            )}

            {channelData && <ChannelHeader channel={channelData} />}

            {analysis && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    <AnalysisSection title={t('channelAnalyzer.strengths')} items={analysis.strengths} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>} />
                    <AnalysisSection title={t('channelAnalyzer.weaknesses')} items={analysis.weaknesses} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>} />
                    <AnalysisSection title={t('channelAnalyzer.opportunities')} items={analysis.opportunities} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>}/>
                    <AnalysisSection title={t('channelAnalyzer.videoIdeas')} items={analysis.videoIdeas} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.311a7.5 7.5 0 0 1-7.5 0c-1.42 0-2.798-.31-4.117-.862M12 10.5h.008v.008H12V10.5Z" /></svg>} />
                </div>
            )}
             {!isLoading && !analysis && !error && (
                <div className="text-center py-10">
                    <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-semibold text-slate-300">{t('channelAnalyzer.ready.title')}</h3>
                    <p className="mt-1 text-sm text-slate-500">{t('channelAnalyzer.ready.description')}</p>
                </div>
            )}
        </div>
    );
};
