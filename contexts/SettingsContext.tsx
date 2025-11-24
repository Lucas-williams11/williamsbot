
import React, { createContext, useContext, useState } from "react";

interface SettingsContextType {
  apiKey: string;
  youtubeApiKey: string;
  geminiApiKey: string;
  incrementQuotaUsage: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY || "";
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  const apiKey = youtubeApiKey;

  const [quota, setQuota] = useState(0);
  const incrementQuotaUsage = () => setQuota(q => q + 1);

  return (
    <SettingsContext.Provider value={{ apiKey, youtubeApiKey, geminiApiKey, incrementQuotaUsage }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
