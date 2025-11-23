import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const YOUTUBE_API_QUOTA = 10000;
const QUOTA_COST_PER_ANALYSIS = 201; // search(channel)=100 + channels(stats)=1 + search(videos)=100

interface SettingsContextType {
    apiKey: string | null;
    setApiKey: (key: string | null) => void;
    quotaUsed: number;
    incrementQuotaUsage: () => void;
    isKeyValid: boolean;
    testApiKey: (key: string) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apiKey, setApiKeyState] = useState<string | null>(() => localStorage.getItem('youtube_api_key'));
    const [quotaUsed, setQuotaUsed] = useState<number>(0);
    const [isKeyValid, setIsKeyValid] = useState(false);

    const testApiKey = useCallback(async (key: string): Promise<boolean> => {
        // A low-cost check using a known, popular channel ID (Google Developers)
        const testUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=${key}`;
        try {
            const response = await fetch(testUrl);
            return response.ok;
        } catch (error) {
            console.error("API Key test failed:", error);
            return false;
        }
    }, []);

    useEffect(() => {
        const storedQuota = localStorage.getItem('youtube_quota_used');
        const lastReset = localStorage.getItem('youtube_quota_last_reset');
        const today = new Date().toISOString().split('T')[0];

        if (lastReset !== today) {
            localStorage.setItem('youtube_quota_used', '0');
            localStorage.setItem('youtube_quota_last_reset', today);
            setQuotaUsed(0);
        } else {
            setQuotaUsed(storedQuota ? parseInt(storedQuota, 10) : 0);
        }

        if (apiKey) {
            testApiKey(apiKey).then(setIsKeyValid);
        }

    }, [apiKey, testApiKey]);


    const setApiKey = (key: string | null) => {
        if (key && key.trim() !== "") {
            localStorage.setItem('youtube_api_key', key);
            testApiKey(key).then(isValid => {
                setIsKeyValid(isValid);
                setApiKeyState(key); // Set key regardless of validity to allow user to save it
            });
        } else {
            localStorage.removeItem('youtube_api_key');
            setApiKeyState(null);
            setIsKeyValid(false);
        }
    };

    const incrementQuotaUsage = () => {
        setQuotaUsed(prev => {
            const newQuota = prev + QUOTA_COST_PER_ANALYSIS;
            localStorage.setItem('youtube_quota_used', newQuota.toString());
            return newQuota;
        });
    };
    

    return (
        <SettingsContext.Provider value={{ apiKey, setApiKey, quotaUsed, incrementQuotaUsage, isKeyValid, testApiKey }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
