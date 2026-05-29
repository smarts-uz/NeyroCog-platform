import type { MetadataRoute } from "next";

// Maxfiy klinik ilova — qidiruv tizimlari indekslamasligi kerak.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
