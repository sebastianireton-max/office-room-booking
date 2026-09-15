import type { Metadata, Viewport } from "next";
import { SITE, SITE_URL } from "@/lib/site-config";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted latin subsets. next/font preloads them and generates metric-matched
// fallbacks, so the swap does not shift layout. globals.css maps the variables.
const geist = localFont({ src: "./fonts/geist-latin-wght-normal.woff2", weight: "100 900", variable: "--font-geist-face" });
const geistMono = localFont({ src: "./fonts/geist-mono-latin-wght-normal.woff2", weight: "100 900", variable: "--font-geist-mono-face" });
const bricolage = localFont({
  src: "./fonts/bricolage-grotesque-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-bricolage-face",
  // The generated fallback runs 6-11% wide at the weights we set, which rewraps
  // headings on swap. Hand-tuned fallback lives in globals.css.
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE.name}: content, podcast and conference rooms by the hour`, template: `%s · ${SITE.name}` },
  description: SITE.tagline,
  applicationName: SITE.name,
  openGraph: { siteName: SITE.name, type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image" },
  // Next omits the tag when the variable is unset.
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
};

export const viewport: Viewport = { themeColor: "#f7f1e6" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${geist.variable} ${geistMono.variable} ${bricolage.variable}`}>
      <body className="flex min-h-full flex-col bg-canvas text-text-primary">{children}</body>
    </html>
  );
}
