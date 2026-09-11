import type { Metadata } from "next";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions, changes to a booking, or something the FAQ didn't cover? Reach out.",
};

export default function ContactPage() {
  return (
    <main className="flex-1 px-6 py-14">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-text-accent">Contact</p>
          <h1 className="font-display text-5xl font-medium tracking-[-0.014em] text-text-primary">
            <span className="font-normal lowercase">say</span> <span className="font-extrabold uppercase">HELLO.</span>
          </h1>
          <p className="max-w-xl text-base text-text-secondary">
            Questions about a room, changes to an existing booking, or something the FAQ didn&apos;t
            cover. Email is fastest and a real person reads it.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-token-lg bg-surface p-6 shadow-[var(--shadow-subtle)]">
            <p className="text-sm font-semibold uppercase tracking-[1.5px] text-text-primary">Email</p>
            <a href={`mailto:${SITE.contactEmail}`} className="text-base font-medium text-text-accent hover:underline">
              {SITE.contactEmail}
            </a>
            <p className="text-sm text-text-secondary">For booking changes, include your booking date and the room name.</p>
          </div>

          <div className="flex flex-col gap-2 rounded-token-lg bg-surface p-6 shadow-[var(--shadow-subtle)]">
            <p className="text-sm font-semibold uppercase tracking-[1.5px] text-text-primary">Phone</p>
            <p className="text-base font-medium text-text-primary">{SITE.phone}</p>
            <p className="text-sm text-text-secondary">
              Staffed during open hours, {SITE.hours.open}–{SITE.hours.close}.
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-token-lg bg-surface p-6 shadow-[var(--shadow-subtle)]">
            <p className="text-sm font-semibold uppercase tracking-[1.5px] text-text-primary">Find us</p>
            <p className="text-base text-text-primary">
              {SITE.address.line1}, {SITE.address.line2}
              <br />
              {SITE.address.city}, {SITE.address.region} {SITE.address.zip}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-token-lg bg-surface p-6 shadow-[var(--shadow-subtle)]">
            <p className="text-sm font-semibold uppercase tracking-[1.5px] text-text-primary">Hours</p>
            <p className="text-base text-text-primary">
              {SITE.hours.open} – {SITE.hours.close}
            </p>
            <p className="text-sm text-text-secondary">{SITE.hours.days}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
