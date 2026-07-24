import { useState, useEffect } from "react";

type FontSize = "small" | "normal" | "large";

const fontSizeMap = {
  small: 0.85,
  normal: 1,
  large: 1.15,
};

export function useFontSize() {
  const [fontSize, setFontSize] = useState<FontSize>("normal");

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem("wchgt-font-size") as FontSize | null;
    if (saved && fontSizeMap[saved]) {
      setFontSize(saved);
      document.documentElement.style.fontSize = (16 * fontSizeMap[saved]) + "px";
    }
  }, []);

  const handleFontSize = (size: FontSize) => {
    setFontSize(size);
    localStorage.setItem("wchgt-font-size", size);
    document.documentElement.style.fontSize = (16 * fontSizeMap[size]) + "px";
  };

  return { fontSize, setFontSize: handleFontSize };
}
