import React, { createContext, useContext, useState } from "react";

interface SettingsContextType {
  apiKey: string;            // Usada por OneMillionConsultant (YouTube)
  youtubeApiKey: string;     // Por si la necesitás directo
  geminiApiKey: string;      // Ya funciona con GEMINI
  incrementQuotaUsage: () => void; // Para que no rompa cuando se llama
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY || "";
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

  // Esta es la que usa OneMillionConsultant internamente
  const apiKey = youtubeApiKey;

  const [quota, setQuota] = useState(0);

  const incrementQuotaUsage = () => {
    setQuota((q) => q + 1);
    // Por ahora solo suma, después si querés lo usamos para límites, etc.
  };

  return (
    <SettingsContext.Provider
      value={{
        apiKey,
        youtubeApiKey,
        geminiApiKey,
        incrementQuotaUsage,
      }}
    >
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
