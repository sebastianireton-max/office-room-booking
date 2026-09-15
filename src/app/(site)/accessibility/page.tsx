import type { Metadata } from "next";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Accessibility",
  description: `How ${SITE.name} builds this site to be usable by everyone, and how to reach us if something isn't.`,
  alternates: { canonical: "/accessibility" },
};

/** Commitments here are limited to what the site actually does and is tested for. */
export default function AccessibilityPage() {
  return (
    <main className="flex-1 px-6 pb-20 pt-12 sm:pb-24 sm:pt-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex max-w-[65ch] flex-col gap-4">
          <h1 className="type-page text-text-primary">Accessibility</h1>
          <p className="text-lg leading-relaxed text-text-secondary">
            We want anyone to be able to find a room and book it on this site, whatever device or assistive technology they
            use. We build to the Web Content Accessibility Guidelines (WCAG) 2.1, level AA.
          </p>
        </div>

        <section className="flex max-w-[65ch] flex-col gap-3">
          <h2 className="type-subhead text-text-primary">What that means in practice</h2>
          <ul className="flex list-disc flex-col gap-2 pl-5 leading-relaxed text-text-secondary">
            <li>Every page works with a keyboard, starting with a skip-to-content link, and shows where focus is.</li>
            <li>Text and controls meet AA color contrast.</li>
            <li>When times can&rsquo;t be booked, the booking panel says why in words.</li>
            <li>Form fields have labels, and errors are written out next to the field.</li>
            <li>Buttons and links are large enough to tap, and pages work at phone width without sideways scrolling.</li>
            <li>Motion is kept small and switches off if your device asks for reduced motion.</li>
          </ul>
        </section>

        <section className="flex max-w-[65ch] flex-col gap-3">
          <h2 className="type-subhead text-text-primary">Known limitation</h2>
          <p className="leading-relaxed text-text-secondary">
            The card payment form is provided by Stripe inside a secure frame. We don&rsquo;t control its markup, but Stripe
            publishes its own accessibility work for it.
          </p>
        </section>

        <section className="flex max-w-[65ch] flex-col gap-3">
          <h2 className="type-subhead text-text-primary">Something not working?</h2>
          <p className="leading-relaxed text-text-secondary">
            Tell us and we&rsquo;ll fix it, and help you book in the meantime. Email{" "}
            <a href={`mailto:${SITE.contactEmail}?subject=Accessibility`} className="font-medium text-text-accent underline underline-offset-4">
              {SITE.contactEmail}
            </a>{" "}
            or call {SITE.phone}.
          </p>
        </section>
      </div>
    </main>
  );
}
