import React, { createContext, useContext } from "react";

interface SettingsContextType {
  youtubeApiKey: string;
  geminiApiKey: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY || "";
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

  return (
    <SettingsContext.Provider
      value={{
        youtubeApiKey,
        geminiApiKey,
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
