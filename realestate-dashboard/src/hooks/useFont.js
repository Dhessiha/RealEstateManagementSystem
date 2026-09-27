import { useContext } from "react";
import { FontContext } from "../contexts/FontContext";

export function useFont() {
  const ctx = useContext(FontContext);
  if (!ctx) throw new Error("useFont must be used within a FontProvider");
  return ctx;
}
