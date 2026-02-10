"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { id } from "./translations/id";
import { en } from "./translations/en";

export type AppLanguage = "id" | "en";

const translations = { id, en };

export interface LanguageOption {
  value: AppLanguage;
  label: string;
}

const STORAGE_KEY = "exima.language";

const languageOptions: LanguageOption[] = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
];

interface LanguageContextValue {
  language: AppLanguage;
  options: LanguageOption[];
  setLanguage: (value: string | null) => void;
  t: typeof id;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === "undefined") {
      return "id";
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "id") {
        return stored as AppLanguage;
      }
    } catch {
      // Ignore localStorage access errors in restricted environments.
    }

    return "id";
  });

  const setLanguage = useCallback((value: string | null) => {
    if (value !== "id" && value !== "en") {
      return;
    }

    setLanguageState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore localStorage access errors in restricted environments.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const contextValue = useMemo(
    () => ({
      language,
      options: languageOptions,
      setLanguage,
      t: translations[language],
    }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
