import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { themeOptions, type Theme } from "@/lib/themes";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const themeValues = new Set<Theme>(themeOptions.map((option) => option.value));

const getStoredTheme = (): Theme => {
  const stored = localStorage.getItem("sl-theme");
  return themeValues.has(stored as Theme) ? (stored as Theme) : "light";
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  toggle: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    document.documentElement.classList.remove(...themeOptions.map((option) => option.value));
    document.documentElement.classList.add(theme);
    localStorage.setItem("sl-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
