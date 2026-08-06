import type { Metadata } from "next";
import Link from "next/link";
// Self-hosted variable Inter (bundled in node_modules, no runtime fetch to
// Google's CDN needed at build time) — see PROJECT_CONTEXT.md for why this
// was chosen over next/font/google.
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Room Booking Platform",
  description: "Book content rooms, podcast suites, and conference rooms by the hour.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-canvas text-text-primary">
        <header className="sticky top-0 z-40 border-b border-border-subtle bg-canvas/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-base font-semibold tracking-[-0.5px] text-text-primary">
              Room Booking Platform
            </Link>
            <Link href="/#rooms" className="text-sm font-medium text-text-secondary hover:text-text-primary">
              Browse rooms
            </Link>
          </div>
        </header>
        {children}
        <footer className="border-t border-border-subtle px-6 py-10 text-center text-sm text-text-secondary">
          © {new Date().getFullYear()} Room Booking Platform. All bookings are processed securely via Stripe.
        </footer>
      </body>
    </html>
  );
}
