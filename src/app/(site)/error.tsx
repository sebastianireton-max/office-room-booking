"use client";

import { Button } from "@/components/Button";
import { SITE } from "@/lib/site-config";

// No error message or stack: production sends only a digest, which the server log carries.
export default function SiteError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex flex-1 items-center px-6 pt-12 pb-20 sm:pt-16 sm:pb-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6">
        <h1 className="type-page text-text-primary">Something went wrong on our side.</h1>
        <p className="max-w-[65ch] text-lg text-text-secondary">
          Try again in a moment. If it keeps happening, email{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="font-semibold text-text-accent underline underline-offset-4">
            {SITE.contactEmail}
          </a>
          .
        </p>
        <Button onClick={() => retry()}>Try again</Button>
      </div>
    </main>
  );
}
