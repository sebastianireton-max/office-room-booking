import type { Metadata } from "next";

// Blocking in robots.txt stops crawling, not indexing of a leaked URL.
export const metadata: Metadata = { title: "Your booking", robots: { index: false, follow: false } };

export default function ConfirmationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
