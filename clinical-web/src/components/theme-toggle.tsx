"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ktt_theme";

/**
 * Yorug'/tungi rejim almashtirgich.
 * `data-theme` atributi <html>'ga qo'yiladi, tanlov localStorage'da saqlanadi.
 * Flash-of-light oldini olish uchun boshlang'ich qiymat layout'dagi inline
 * skript orqali sahifa render bo'lishidan oldin o'rnatiladi (ThemeScript).
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // Hidratsiyadan keyin haqiqiy holatni o'qish
  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage yo'q — e'tiborsiz
    }
    setDark(!dark);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Mavzuni almashtirish"
      title={dark ? "Yorug' rejim" : "Tungi rejim"}
      className="grid place-items-center h-9 w-9 rounded-md text-ink-2 hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

/**
 * Flash-of-light oldini oluvchi inline skript. Layout `<head>` ichida
 * render qilinadi — React hidratsiyasidan oldin sinxron ishlaydi.
 */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;
  // biome-ignore lint/security/noDangerouslySetInnerHtml: statik, foydalanuvchi kiritmaydi
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
