"use client";

import "./globals.css";
import SiteError from "./(site)/error";

// Replaces the root layout when it fails, so it brings its own document and styles.
export default function GlobalError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-canvas text-text-primary">
        <title>Something went wrong</title>
        <SiteError {...props} />
      </body>
    </html>
  );
}
