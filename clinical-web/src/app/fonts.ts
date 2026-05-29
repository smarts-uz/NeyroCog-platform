import localFont from "next/font/local";

export const outfit = localFont({
  src: [
    { path: "../../public/fonts/Outfit-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Outfit-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/Outfit-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/Outfit-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/Outfit-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-outfit",
  display: "swap",
});
