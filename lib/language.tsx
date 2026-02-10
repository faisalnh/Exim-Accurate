"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type AppLanguage = "id";

export interface LanguageOption {
  value: AppLanguage;
  label: string;
}

const STORAGE_KEY = "exima.language";

const languageOptions: LanguageOption[] = [
  { value: "id", label: "Bahasa Indonesia" },
];

interface LanguageContextValue {
  language: AppLanguage;
  options: LanguageOption[];
  setLanguage: (value: string | null) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === "undefined") {
      return "id";
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "id" ? "id" : "id";
    } catch {
      return "id";
    }
  });

  const setLanguage = useCallback((value: string | null) => {
    if (value !== "id") {
      return;
    }

    setLanguageState("id");
    try {
      localStorage.setItem(STORAGE_KEY, "id");
    } catch {
      // Ignore localStorage access errors in restricted environments.
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      language,
      options: languageOptions,
      setLanguage,
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
