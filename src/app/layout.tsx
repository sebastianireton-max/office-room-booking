import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE } from "@/lib/site-config";
// Self-hosted variable fonts (bundled in node_modules, no runtime fetch to
// Google's CDN needed at build time) — see PROJECT_CONTEXT.md for why this
// was chosen over next/font/google. Fraunces is the editorial display serif
// for headlines (restyle 2026-08-07); Inter stays as the body sans.
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: SITE.name,
    template: `%s — ${SITE.name}`,
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
