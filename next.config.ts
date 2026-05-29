import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Production xavfsizlik sarlavhalari (har bir javobga qo'shiladi).
const securityHeaders = [
  // HTTPS'ni majburlash (faqat https domenlarda kuchga kiradi)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Clickjacking himoyasi
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // MIME-sniffing himoyasi
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referer faqat origin darajasida
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Sezgir brauzer API'larini o'chirish (klinik ilova ularni ishlatmaydi)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
