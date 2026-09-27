import { createContext, useEffect, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export const FONT_FAMILIES = [
  {
    id: "system",
    label: "Inter (Default)",
    heading: '"Space Grotesk", "Inter", sans-serif',
    body: '"Inter", sans-serif',
  },
  {
    id: "legible",
    label: "Atkinson Hyperlegible",
    heading: '"Atkinson Hyperlegible", sans-serif',
    body: '"Atkinson Hyperlegible", sans-serif',
  },
  {
    id: "mono",
    label: "JetBrains Mono",
    heading: '"JetBrains Mono", monospace',
    body: '"JetBrains Mono", monospace',
  },
  {
    id: "serif",
    label: "Merriweather",
    heading: '"Merriweather", serif',
    body: '"Merriweather", serif',
  },
];

export const FONT_SIZES = [
  { id: "sm", label: "Small", scale: 0.9 },
  { id: "md", label: "Medium", scale: 1 },
  { id: "lg", label: "Large", scale: 1.125 },
];

export const FontContext = createContext(null);

export function FontProvider({ children }) {
  const [fontId, setFontId] = useLocalStorage("siteflow.font", "system");
  const [sizeId, setSizeId] = useLocalStorage("siteflow.fontSize", "md");

  const family = FONT_FAMILIES.find((f) => f.id === fontId) ?? FONT_FAMILIES[0];
  const size = FONT_SIZES.find((s) => s.id === sizeId) ?? FONT_SIZES[1];

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--font-heading", family.heading);
    root.setProperty("--font-body", family.body);
    root.setProperty("--font-scale", size.scale);
  }, [family, size]);

  const value = useMemo(
    () => ({
      fontId,
      setFontId,
      sizeId,
      setSizeId,
      family,
      size,
      fontFamilies: FONT_FAMILIES,
      fontSizes: FONT_SIZES,
    }),
    [fontId, setFontId, sizeId, setSizeId, family, size]
  );

  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
}
