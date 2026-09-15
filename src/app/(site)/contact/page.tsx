import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site-config";

const a = SITE.address;
const hours = `${SITE.hours.open} to ${SITE.hours.close}, ${SITE.hours.days}`;

export const metadata: Metadata = {
  title: "Contact",
  description: `Email ${SITE.contactEmail} or call ${SITE.phone} about a room or a change to a booking. ${SITE.name} is at ${a.line1}, ${a.city}, open ${hours}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="flex-1 px-6 pb-20 pt-12 sm:pb-24 sm:pt-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex max-w-[65ch] flex-col gap-4">
          <h1 className="type-page text-text-primary">Contact</h1>
          <p className="text-lg leading-relaxed text-text-secondary">
            Questions about a room, or a change to a booking. For changes, include the room and the date.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3">
          {/* overflow-wrap: an address has no break points and would push past 390px at display size. */}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="font-display text-[1.75rem] font-semibold leading-tight text-text-accent underline underline-offset-[6px] [overflow-wrap:anywhere] sm:text-4xl lg:text-[2.5rem]"
          >
            {SITE.contactEmail}
          </a>
          <a
            href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`}
            className="inline-flex min-h-11 items-center text-2xl text-text-primary hover:text-text-accent"
          >
            {SITE.phone}
          </a>
        </div>

        <dl className="grid max-w-[65ch] grid-cols-1 border-t border-border-subtle sm:grid-cols-[8rem_minmax(0,1fr)]">
          <dt className="pt-4 text-sm text-text-secondary sm:border-b sm:border-border-subtle sm:pb-4">Address</dt>
          <dd className="border-b border-border-subtle pb-4 pt-1 text-text-primary sm:pt-4">
            <address className="not-italic">
              <span className="block">
                {a.line1}, {a.line2},
              </span>
              <span className="block">
                {a.city}, {a.region} {a.zip}
              </span>
            </address>
          </dd>
          <dt className="pt-4 text-sm text-text-secondary sm:border-b sm:border-border-subtle sm:pb-4">Hours</dt>
          <dd className="border-b border-border-subtle pb-4 pt-1 text-text-primary sm:pt-4">{hours}</dd>
        </dl>

        <p className="text-text-secondary">
          Quick answers on holds, payment and hours are in the{" "}
          <Link href="/faq" className="font-medium text-text-accent underline underline-offset-4">
            FAQ
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
