import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { apiKey, setApiKey, isKeyValid, testApiKey } = useSettings();
    const { t } = useLanguage();
    const [localApiKey, setLocalApiKey] = useState(apiKey || '');
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        setLocalApiKey(apiKey || '');
        if (apiKey) {
            setTestStatus(isKeyValid ? 'success' : 'error');
        } else {
            setTestStatus('idle');
        }
    }, [apiKey, isKeyValid, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        setApiKey(localApiKey);
        onClose();
    };
    
    const handleTest = async () => {
        setIsTesting(true);
        setTestStatus('idle');
        const isValid = await testApiKey(localApiKey);
        setTestStatus(isValid ? 'success' : 'error');
        setIsTesting(false);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-md border border-slate-700 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 className="text-2xl font-bold text-white mb-4">{t('settingsModal.title')}</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="api-key" className="block text-sm font-medium text-slate-300 mb-1">{t('settingsModal.apiKey.label')}</label>
                        <p className="text-xs text-slate-500 mb-2">{t('settingsModal.apiKey.description')}</p>
                        <div className="flex items-center gap-2">
                            <input
                                id="api-key"
                                type="password"
                                value={localApiKey}
                                onChange={(e) => {
                                    setLocalApiKey(e.target.value);
                                    setTestStatus('idle');
                                }}
                                className="flex-grow bg-slate-900 border border-slate-600 text-white placeholder-slate-400 text-base rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
                                placeholder={t('settingsModal.apiKey.placeholder')}
                            />
                             <button onClick={handleTest} disabled={isTesting || !localApiKey} className="px-4 py-2.5 text-sm font-medium text-white bg-slate-600 rounded-lg hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isTesting ? t('settingsModal.apiKey.testing') : t('settingsModal.apiKey.test')}
                            </button>
                        </div>
                        {testStatus === 'success' && <p className="text-green-400 text-xs mt-2">{t('settingsModal.apiKey.success')}</p>}
                        {testStatus === 'error' && <p className="text-red-400 text-xs mt-2">{t('settingsModal.apiKey.error')}</p>}
                         <a href="https://developers.google.com/youtube/v3/getting-started" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline mt-2 inline-block">{t('settingsModal.apiKey.howTo')}</a>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-transparent rounded-lg hover:bg-slate-700">{t('settingsModal.cancel')}</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-500">{t('settingsModal.save')}</button>
                </div>
            </div>
        </div>
    );
};