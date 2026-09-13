import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions, changes to a booking, or something the FAQ didn't cover? Reach out.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const a = SITE.address;
  const rows: [string, React.ReactNode][] = [
    [
      "Email",
      <a key="e" href={`mailto:${SITE.contactEmail}`} className="font-medium text-text-accent underline underline-offset-4">
        {SITE.contactEmail}
      </a>,
    ],
    [
      "Phone",
      <a key="p" href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`} className="font-medium text-text-primary">
        {SITE.phone}
      </a>,
    ],
    [
      "Address",
      <address key="a" className="not-italic">
        <span className="block">{a.line1}, {a.line2},</span>
        <span className="block">{a.city}, {a.region} {a.zip}</span>
      </address>,
    ],
    ["Hours", `${SITE.hours.open} to ${SITE.hours.close}, ${SITE.hours.days}`],
  ];

  return (
    <main className="flex-1 px-6 pb-20 pt-12 sm:pt-16">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16">
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-5xl font-semibold leading-[1] text-text-primary sm:text-6xl">Contact</h1>
          <p className="max-w-md text-lg leading-relaxed text-text-secondary">
            Questions about a room, or a change to a booking. For changes, include the room and the date.
          </p>
          <p className="text-text-secondary">
            Quick answers on holds, payment and hours are in the{" "}
            <Link href="/faq" className="font-medium text-text-accent underline underline-offset-4">
              FAQ
            </Link>
            .
          </p>
        </div>

        <dl className="grid grid-cols-1 border-t border-border-default sm:grid-cols-[8rem_minmax(0,1fr)]">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="pt-5 text-sm text-text-secondary sm:border-b sm:border-border-subtle sm:pb-5">{label}</dt>
              <dd className="border-b border-border-subtle pb-5 pt-1 text-lg text-text-primary sm:pt-5">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
