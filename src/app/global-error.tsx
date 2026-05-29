"use client";

import { useEffect } from "react";

/**
 * Root-darajadagi xato chegarasi — ildiz layout ham yiqilganda ishlaydi.
 * i18n provayderidan tashqarida, shuning uchun matn statik (uz).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="uz">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#F1F5F9",
          color: "#0F172A",
        }}
      >
        <div style={{ textAlign: "center", padding: 24, maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Server xatosi</h1>
          <p style={{ fontSize: 14, color: "#475569", marginTop: 8 }}>
            Nimadir noto'g'ri ketdi. Iltimos, qayta urinib ko'ring.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              height: 44,
              padding: "0 20px",
              borderRadius: 10,
              border: 0,
              background: "#0F766E",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Qayta yuklash
          </button>
        </div>
      </body>
    </html>
  );
}
