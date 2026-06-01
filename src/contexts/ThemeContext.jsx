import { createContext, useContext, useState } from "react";

export const THEMES = {
  dark: {
    bg:         "#0D1B2A",
    surface:    "#112236",
    surfaceAlt: "#0D1B2A",
    border:     "#1E3A5F",
    primary:    "#2356A8",
    primaryHv:  "#1a4080",
    text:       "#FFFFFF",
    textSub:    "#CBD5E1",
    muted:      "#7A9BBF",
    input:      "#0D1B2A",
    inputBorder:"#1E3A5F",
    error:      "#ef4444",
    errorBg:    "#1f0a0a",
    errorBorder:"#ef4444",
    success:    "#4ade80",
    successBg:  "#052e16",
    successBorder:"#14532d",
    tabActive:  "#FFFFFF",
    tabInactive:"#4A6A8A",
    tabBorder:  "#2356A8",
  },
  light: {
    bg:         "#F1F5F9",
    surface:    "#FFFFFF",
    surfaceAlt: "#F8FAFC",
    border:     "#CBD5E1",
    primary:    "#2356A8",
    primaryHv:  "#1a4080",
    text:       "#0F172A",
    textSub:    "#334155",
    muted:      "#64748B",
    input:      "#FFFFFF",
    inputBorder:"#CBD5E1",
    error:      "#DC2626",
    errorBg:    "#FEF2F2",
    errorBorder:"#FECACA",
    success:    "#16A34A",
    successBg:  "#F0FDF4",
    successBorder:"#BBF7D0",
    tabActive:  "#0F172A",
    tabInactive:"#94A3B8",
    tabBorder:  "#2356A8",
  },
};

const B_PALETTE = {
  dark: {
    navy: "#0D1B2A", navyMid: "#112236", navyLight: "#1A3350",
    navyBorder: "#1E3A5F", blue: "#2356A8", blueLight: "#2E6AC4",
    white: "#FFFFFF", offWhite: "#C8D8E8", muted: "#7A9BBF",
    green: "#16a34a", greenLight: "#4ade80",
    red: "#dc2626", redLight: "#fca5a5", redBorder: "#7f1d1d",
    yellow: "#ca8a04", yellowLight: "#fde047",
    grey: "#4b5563",
    // status card backgrounds
    statusGreenBg: "#052e16",   statusGreenBorder: "#14532d",
    statusRedBg:   "#3a0e0a",   statusRedBorder:   "#7f1d1d",
    statusYellowBg:"#1a1500",   statusYellowBorder:"#713f12",
    statusGrayBg:  "#1c1917",   statusGrayBorder:  "#44403c",
  },
  light: {
    navy: "#F1F5F9", navyMid: "#FFFFFF", navyLight: "#F1F5F9",
    navyBorder: "#CBD5E1", blue: "#2356A8", blueLight: "#2E6AC4",
    white: "#0F172A", offWhite: "#334155", muted: "#64748B",
    green: "#16a34a", greenLight: "#4ade80",
    red: "#dc2626", redLight: "#fca5a5", redBorder: "#fecaca",
    yellow: "#ca8a04", yellowLight: "#fde047",
    grey: "#94A3B8",
    // status card backgrounds
    statusGreenBg: "#dcfce7",   statusGreenBorder: "#86efac",
    statusRedBg:   "#fee2e2",   statusRedBorder:   "#fca5a5",
    statusYellowBg:"#fef9c3",   statusYellowBorder:"#fde68a",
    statusGrayBg:  "#f1f5f9",   statusGrayBorder:  "#cbd5e1",
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("fleet_theme") || "dark"
  );

  function toggleTheme() {
    setTheme(t => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("fleet_theme", next);
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, colors: THEMES[theme], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function useB() {
  const { theme } = useTheme();
  return B_PALETTE[theme];
}
