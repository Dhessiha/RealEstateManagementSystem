import { useRef, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { useLanguage } from "../hooks/useLanguage";
import { useFont } from "../hooks/useFont";
import { useOutsideClick } from "../hooks/useOutsideClick";
import {
  IconSettings,
  IconSun,
  IconMoon,
  IconBlueprint,
  IconGlobe,
  IconType,
  IconChevronDown,
  IconCheck,
} from "./Icons";
import "./PreferencesMenu.css";

const THEME_ICON = { light: IconSun, dark: IconMoon, blueprint: IconBlueprint };

export default function PreferencesMenu({ align = "right" }) {
  const { theme, setTheme, themes } = useTheme();
  const { lang, setLang, languages, t } = useLanguage();
  const { fontId, setFontId, sizeId, setSizeId, fontFamilies, fontSizes } = useFont();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useOutsideClick(ref, () => setOpen(false), open);

  return (
    <div className="prefs-menu" ref={ref}>
      <button
        type="button"
        className="prefs-menu__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t("settings")}
      >
        <IconSettings />
        <span className="prefs-menu__trigger-label">{t("settings")}</span>
        <IconChevronDown className="prefs-menu__chevron" />
      </button>

      {open && (
        <div className={`prefs-menu__panel prefs-menu__panel--${align}`}>
          <section className="prefs-menu__section">
            <h4>{t("theme")}</h4>
            <div className="prefs-menu__options">
              {themes.map((opt) => {
                const Icon = THEME_ICON[opt.id] ?? IconSun;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`prefs-swatch ${theme === opt.id ? "is-active" : ""}`}
                    onClick={() => setTheme(opt.id)}
                  >
                    <span className="prefs-swatch__dot" style={{ background: opt.swatch }}>
                      <Icon />
                    </span>
                    <span>{opt.label}</span>
                    {theme === opt.id && <IconCheck className="prefs-swatch__check" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="prefs-menu__section">
            <h4>
              <IconGlobe /> {t("language")}
            </h4>
            <div className="prefs-menu__options prefs-menu__options--row">
              {languages.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`prefs-chip ${lang === opt.id ? "is-active" : ""}`}
                  onClick={() => setLang(opt.id)}
                >
                  {opt.nativeLabel}
                </button>
              ))}
            </div>
          </section>

          <section className="prefs-menu__section">
            <h4>
              <IconType /> {t("font")}
            </h4>
            <select
              className="prefs-select"
              value={fontId}
              onChange={(e) => setFontId(e.target.value)}
            >
              {fontFamilies.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>

            <div className="prefs-menu__options prefs-menu__options--row" style={{ marginTop: 8 }}>
              {fontSizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`prefs-chip ${sizeId === s.id ? "is-active" : ""}`}
                  onClick={() => setSizeId(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
