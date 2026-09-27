import { createContext, useEffect, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export const THEMES = [
  { id: "light", label: "Site Paper", swatch: "#F5F1E8" },
  { id: "dark", label: "Site Night", swatch: "#10161B" },
  { id: "blueprint", label: "Blueprint", swatch: "#0B3D5C" },
];

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage("siteflow.theme", "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      themes: THEMES,
      cycleTheme: () =>
        setTheme((current) => {
          const idx = THEMES.findIndex((t) => t.id === current);
          return THEMES[(idx + 1) % THEMES.length].id;
        }),
    }),
    [theme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
