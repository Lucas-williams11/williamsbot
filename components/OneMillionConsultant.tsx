import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { ActionButton } from './common/ActionButton';
import { LoadingSpinner } from './common/LoadingSpinner';
import { getVideoIdFromUrl, fetchVideoDetails, findBenchmarkVideo } from '../services/youtubeDataService';
import { generateOneMillionConsulting, generateThumbnailImage, generateFullScript, generateStoryboardPrompts } from '../services/geminiService';
import { OneMillionAnalysis, YouTubeVideoDetails, VideoProposal, ComparativeAnalysis, StoryboardScene } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

type Workflow = 'new' | 'improve';

// --- Sub-components for Rendering Results ---

// FIX: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
const Section: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactElement }> = ({ title, icon, children }) => (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 animate-fade-in">
        <h3 className="flex items-center text-xl font-bold text-cyan-400 mb-4">{icon}<span className="ml-2">{title}</span></h3>
        <div className="space-y-3 text-slate-300 prose prose-invert prose-sm max-w-none">{children}</div>
    </div>
);

const VideoCard: React.FC<{ video: YouTubeVideoDetails, label: string }> = ({ video, label }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-slate-800 rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-center border border-slate-700 animate-fade-in">
            <div className="flex-shrink-0">
                <span className="block text-center text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wider">{label}</span>
                <img src={video.thumbnailUrl} alt={video.title} className="w-48 h-27 object-cover rounded-md shadow-lg" />
            </div>
            <div className="text-center sm:text-left">
                <h4 className="font-bold text-white">{video.title}</h4>
                <p className="text-sm text-slate-400">{video.channelTitle}</p>
                <p className="text-sm text-slate-400 mt-1"><strong className="text-white">{(video?.stats?.viewCount ? Number(video.stats.viewCount).toLocaleString() : '0').toLocaleString()}</strong> {t('oneMillion.views')} &middot; <strong className="text-white">{(video?.stats?.likeCount ? Number(video.stats.likeCount).toLocaleString() : '0').toLocaleString()}</strong> {t('oneMillion.likes')}</p>
            </div>
        </div>
    );
}

const ThumbnailGenerator: React.FC<{ concept: string }> = ({ concept }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const { t } = useLanguage();

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const base64Data = await generateThumbnailImage(concept);
            setImageUrl(`data:image/jpeg;base64,${base64Data}`);
        } catch (e: any) {
            setError(t('error.thumbnailGenerationFailed'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/50 p-4 rounded-lg flex flex-col justify-between border border-slate-700">
            <div>
                <p className="text-sm text-slate-300 mb-4">{concept}</p>
            </div>
            <div className="mt-auto">
                {error && <p className="text-red-400 text-xs mb-2 text-center">{error}</p>}
                {imageUrl ? (
                    <img src={imageUrl} alt="Generated thumbnail" className="w-full aspect-video object-cover rounded-md shadow-lg" />
                ) : (
                    <ActionButton
                        onClick={handleGenerate}
                        isLoading={isLoading}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>}
                        className="w-full text-sm py-2"
                    >
                        {t('oneMillion.generateThumbnail')}
                    </ActionButton>
                )}
            </div>
        </div>
    );
};

const FullScriptGenerator: React.FC<{ scriptOutline: VideoProposal['script'], videoTitle: string }> = ({ scriptOutline, videoTitle }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [fullScript, setFullScript] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { language, t } = useLanguage();

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const script = await generateFullScript(scriptOutline, videoTitle, language);
            setFullScript(script);
        } catch (e) {
            setError(t('error.unknown'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-slate-700">
            {isLoading && <p className="text-sm text-center text-slate-400">{t('oneMillion.loading.generatingScript')}</p>}
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            
            {!isLoading && !fullScript && (
                 <ActionButton onClick={handleGenerate} isLoading={isLoading} className="w-full text-sm py-2">
                    {t('oneMillion.generateFullScript')}
                </ActionButton>
            )}

            {fullScript && (
                <div>
                    <h4 className="font-bold text-slate-100 mb-2 text-base">{t('oneMillion.results.fullScript')}</h4>
                    <pre className="whitespace-pre-wrap p-4 bg-slate-900/50 rounded-md font-sans text-sm max-h-96 overflow-y-auto">{fullScript}</pre>
                </div>
            )}
        </div>
    );
};

interface GeneratedScene extends StoryboardScene {
    imageUrl: string;
}
const StoryboardVisualizer: React.FC<{ scriptOutline: VideoProposal['script'], videoTitle: string }> = ({ scriptOutline, videoTitle }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [storyboard, setStoryboard] = useState<GeneratedScene[]>([]);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);
    const { t, language } = useLanguage();

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setStoryboard([]);
        setProgress({ current: 0, total: 0 });

        try {
            const scenePrompts = await generateStoryboardPrompts(videoTitle, scriptOutline, language);
            if (scenePrompts.length === 0) throw new Error("No scenes generated.");
            
            setProgress({ current: 0, total: scenePrompts.length });
            setStoryboard(scenePrompts.map(p => ({ ...p, imageUrl: '' })));

            for (let i = 0; i < scenePrompts.length; i++) {
                setProgress(prev => ({ ...prev, current: i + 1 }));
                const base64Data = await generateThumbnailImage(scenePrompts[i].prompt);
                
                setStoryboard(prev => {
                    const newStoryboard = [...prev];
                    newStoryboard[i].imageUrl = `data:image/jpeg;base64,${base64Data}`;
                    return newStoryboard;
                });
            }
        } catch (e) {
            setError(t('error.unknown'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
             {!isLoading && storyboard.length === 0 && (
                <ActionButton onClick={handleGenerate} isLoading={isLoading} disabled={isLoading} className="w-full text-sm py-2">
                    {t('oneMillion.visualizeStoryboard')}
                </ActionButton>
            )}
            {isLoading && (
                <p className="text-sm text-center text-slate-400">
                    {t('oneMillion.loading.generatingStoryboard', { current: progress.current, total: progress.total })}
                </p>
            )}
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            {storyboard.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {storyboard.map((scene, index) => (
                        <div key={index} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                            <p className="font-bold text-slate-200 text-sm mb-2">{index + 1}. {scene.scene}</p>
                            {scene.imageUrl ? (
                                <img src={scene.imageUrl} alt={scene.scene} className="w-full aspect-video object-cover rounded" />
                            ) : (
                                <div className="w-full aspect-video bg-slate-800 rounded flex items-center justify-center">
                                    <LoadingSpinner />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const BenchmarkAnalysisDisplay: React.FC<{ analysis: OneMillionAnalysis['benchmarkVideoAnalysis'] }> = ({ analysis }) => {
    const { t } = useLanguage();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Section title={t('oneMillion.results.titleHookAnalysis')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" /></svg>}>
                <p>{analysis.titleHook}</p>
            </Section>
            <Section title={t('oneMillion.results.contentStrategy')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>}>
                <p>{analysis.contentStrategy}</p>
            </Section>
            <Section title={t('oneMillion.results.targetAudience')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962c.57-1.023.995-2.14 1.253-3.321m-1.253 3.321a3.991 3.991 0 1 1-7.48-1.543m7.48 1.543c.343.95 1.023 1.85 1.94 2.576m-1.94-2.576a3.991 3.991 0 0 0-6.428-3.432M12 6.042A8.967 8.967 0 0 0 6 3.75m6 2.292c.5-1.023.935-2.14 1.175-3.321m-1.175 3.321a3.991 3.991 0 0 1-6.428-3.432" /></svg>}>
                <p>{analysis.targetAudience}</p>
            </Section>
            <Section title={t('oneMillion.results.monetizationPotential')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}>
                <p>{analysis.monetizationPotential}</p>
            </Section>
        </div>
    );
};

const VideoProposalDisplay: React.FC<{ proposal: VideoProposal }> = ({ proposal }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-6 mt-6">
            <Section title={t('oneMillion.results.newTitles')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>}>
                <ul className="list-disc pl-5 space-y-2">
                    {proposal.titles.map((title, i) => <li key={i}>{title}</li>)}
                </ul>
            </Section>
            <Section title={t('oneMillion.results.scriptOutline')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>}>
                <div><strong>{t('oneMillion.results.hook')}:</strong> {proposal.script.hook}</div>
                <div><strong>{t('oneMillion.results.introduction')}:</strong> {proposal.script.introduction}</div>
                <div><strong>{t('oneMillion.results.mainPoints')}:</strong>
                    <ul className="list-disc pl-5">
                        {proposal.script.mainPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                    </ul>
                </div>
                <div><strong>{t('oneMillion.results.callToAction')}:</strong> {proposal.script.callToAction}</div>
                <div><strong>{t('oneMillion.results.outro')}:</strong> {proposal.script.outro}</div>
                <FullScriptGenerator scriptOutline={proposal.script} videoTitle={proposal.titles[0]} />
            </Section>
             <Section title={t('oneMillion.results.storyboard')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6" /></svg>}>
                <StoryboardVisualizer scriptOutline={proposal.script} videoTitle={proposal.titles[0]} />
            </Section>
            <Section title={t('oneMillion.results.thumbnailConcepts')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {proposal.thumbnailConcepts.map((concept, i) => (
                        <ThumbnailGenerator key={i} concept={concept} />
                    ))}
                </div>
            </Section>
            <Section title={t('oneMillion.results.seo')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>}>
                <p className="font-bold text-slate-100">{t('oneMillion.results.description')}:</p>
                <p className="whitespace-pre-wrap p-3 bg-slate-900/50 rounded-md">{proposal.description}</p>
                <p className="font-bold text-slate-100 mt-4">{t('oneMillion.results.tags')}:</p>
                <div className="flex flex-wrap gap-2">
                    {proposal.tags.map((tag, i) => <span key={i} className="px-3 py-1 text-xs font-medium text-cyan-200 bg-cyan-900/50 rounded-full">{tag}</span>)}
                </div>
            </Section>
        </div>
    );
};

const ComparativeAnalysisDisplay: React.FC<{ analysis: ComparativeAnalysis }> = ({ analysis }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Section title={t('oneMillion.results.yourVideoAnalysis')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>}>
                    <p><strong>{t('oneMillion.results.strength')}:</strong> {analysis.userVideo.strength}</p>
                    <p><strong>{t('oneMillion.results.weakness')}:</strong> {analysis.userVideo.weakness}</p>
                </Section>
                <Section title={t('oneMillion.results.benchmarkVideoAnalysis')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 0 1-9-9.75V4.5A.75.75 0 0 1 3.75 3h16.5a.75.75 0 0 1 .75.75v4.5a9.75 9.75 0 0 1-9 9.75Z" /></svg>}>
                    <p><strong>{t('oneMillion.results.strength')}:</strong> {analysis.benchmarkVideo.strength}</p>
                    <p><strong>{t('oneMillion.results.tacticToAdopt')}:</strong> {analysis.benchmarkVideo.tacticToAdopt}</p>
                </Section>
            </div>
            <Section title={t('oneMillion.results.recommendations')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>}>
                <p><strong>{t('oneMillion.results.title')}:</strong> {analysis.improvementAreas.title}</p>
                <p><strong>{t('oneMillion.results.thumbnail')}:</strong> {analysis.improvementAreas.thumbnail}</p>
                <p><strong>{t('oneMillion.results.content')}:</strong> {analysis.improvementAreas.content}</p>
            </Section>
        </div>
    );
};


// --- Main Component ---

export const OneMillionConsultant: React.FC = () => {
    const [workflow, setWorkflow] = useState<Workflow>('new');
    const [benchmarkInput, setBenchmarkInput] = useState('');
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState('');
    const [analysis, setAnalysis] = useState<OneMillionAnalysis | null>(null);
    const [benchmarkVideo, setBenchmarkVideo] = useState<YouTubeVideoDetails | null>(null);
    const [userVideo, setUserVideo] = useState<YouTubeVideoDetails | null>(null);

    const { apiKey, incrementQuotaUsage } = useSettings();
    const { t, language } = useLanguage();

    const handleAnalyze = async () => {
        if (!apiKey) {
            setError('error.youtubeApiKeyNotSet');
            return;
        }
        if (!benchmarkInput.trim()) {
            setError('error.enterBenchmark');
            return;
        }
        if (workflow === 'improve' && !userInput.trim()) {
            setError('error.enterYourVideo');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        setBenchmarkVideo(null);
        setUserVideo(null);
        setLoadingStep('');

        try {
            let userVideoDetails: YouTubeVideoDetails | undefined = undefined;
            if (workflow === 'improve') {
                setLoadingStep(t('oneMillion.loading.fetchingUser'));
                const userVideoId = getVideoIdFromUrl(userInput);
                if (!userVideoId) throw new Error("Invalid URL for your video.");
                userVideoDetails = await fetchVideoDetails(userVideoId, apiKey);
                setUserVideo(userVideoDetails);
                incrementQuotaUsage();
            }

            setLoadingStep(t('oneMillion.loading.fetchingBenchmark'));
            const benchmarkVideoId = getVideoIdFromUrl(benchmarkInput);
            let benchmarkVideoDetails: YouTubeVideoDetails;
            if (benchmarkVideoId) {
                benchmarkVideoDetails = await fetchVideoDetails(benchmarkVideoId, apiKey);
                incrementQuotaUsage();
            } else {
                benchmarkVideoDetails = await findBenchmarkVideo(benchmarkInput, apiKey);
                incrementQuotaUsage(); // search is more expensive
            }
            setBenchmarkVideo(benchmarkVideoDetails);

            setLoadingStep(t('oneMillion.loading.generating'));
            const result = await generateOneMillionConsulting(benchmarkVideoDetails, language, userVideoDetails);
            setAnalysis(result);

        } catch (e: any) {
            let errorMessageKey = 'error.unknown';
            if (e.message) {
                const lowerCaseMessage = e.message.toLowerCase();
                 if (lowerCaseMessage.includes("invalid url")) {
                    errorMessageKey = 'error.invalidUrl';
                } else if (lowerCaseMessage.includes("not found")) {
                    errorMessageKey = 'error.videoNotFound';
                } else if (lowerCaseMessage.includes("failed to fetch")) {
                     errorMessageKey = 'error.fetchFailed';
                } else if (lowerCaseMessage.includes("no videos found")) {
                    errorMessageKey = 'error.noVideosFound';
                }
            }
            setError(errorMessageKey);
            console.error(e);
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };
    
    const renderResults = () => {
        if (!analysis) return null;

        const isComparative = 'userVideo' in analysis.consultingResult;

        return (
            <div className="mt-8">
                <div className="flex flex-col gap-4">
                     {userVideo && <VideoCard video={userVideo} label={t('oneMillion.yourVideo')} />}
                     {benchmarkVideo && <VideoCard video={benchmarkVideo} label={t('oneMillion.benchmarkVideo')} />}
                </div>
               
                <BenchmarkAnalysisDisplay analysis={analysis.benchmarkVideoAnalysis} />
                
                {isComparative 
                    ? <ComparativeAnalysisDisplay analysis={analysis.consultingResult as ComparativeAnalysis} /> 
                    : <VideoProposalDisplay proposal={analysis.consultingResult as VideoProposal} />
                }
            </div>
        )
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">{t('oneMillion.title')}</h2>
                <p className="mt-4 text-lg text-slate-400">{t('oneMillion.description')}</p>
            </div>

            <div className="flex justify-center mb-6">
                <div className="bg-slate-800 p-1 rounded-lg flex gap-1">
                    <button onClick={() => setWorkflow('new')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${workflow === 'new' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>{t('oneMillion.workflow.new')}</button>
                    <button onClick={() => setWorkflow('improve')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${workflow === 'improve' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>{t('oneMillion.workflow.improve')}</button>
                </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-lg space-y-4">
                 {workflow === 'improve' && (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('oneMillion.yourVideoUrl')}</label>
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="bg-slate-800 border border-slate-600 text-white placeholder-slate-400 text-base rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-3"
                            disabled={isLoading}
                        />
                    </div>
                 )}
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('oneMillion.benchmarkVideoUrl')}</label>
                    <input
                        type="text"
                        value={benchmarkInput}
                        onChange={(e) => setBenchmarkInput(e.target.value)}
                        placeholder={t('oneMillion.benchmarkPlaceholder')}
                        className="bg-slate-800 border border-slate-600 text-white placeholder-slate-400 text-base rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-3"
                        disabled={isLoading}
                    />
                </div>
                <div className="pt-2 flex justify-end">
                    <ActionButton onClick={handleAnalyze} isLoading={isLoading}>
                       {isLoading ? loadingStep : t('oneMillion.button')}
                    </ActionButton>
                </div>
            </div>

            {error && <p className="text-center text-red-400 mt-4 bg-red-900/20 p-3 rounded-lg">{t(error)}</p>}
            
            {isLoading && !analysis && (
              <div className="text-center mt-6">
                <LoadingSpinner />
                <p className="text-slate-400 mt-2">{loadingStep}</p>
              </div>
            )}
            
            {renderResults()}
        </div>
    );
};