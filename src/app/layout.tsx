import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE } from "@/lib/site-config";
// Self-hosted variable fonts (bundled in node_modules, no runtime fetch to
// Google's CDN at build time). That decision predates the overhaul and is kept;
// only the faces changed. Bricolage Grotesque is the display grotesque and
// Geist the body sans (overhaul 2026-08-30); Geist Mono carries tabular
// figures for times, durations, and prices.
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: SITE.name,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-canvas text-text-primary">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
