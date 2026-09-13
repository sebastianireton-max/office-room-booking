import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { SITE } from "@/lib/site-config";
import { ROOMS } from "@/lib/rooms-data";

const LINKS = [
  ["/pricing", "Pricing"],
  ["/faq", "FAQ"],
  ["/about", "About"],
  ["/contact", "Contact"],
  ["/account", "Your bookings"],
  ["/accessibility", "Accessibility"],
  ["/terms", "Terms"],
  ["/privacy", "Privacy"],
];

/**
 * Statement footer: closes the page on the one fact a visitor needs (when the
 * doors are open) plus the full name/address/phone block Google matches
 * against the business listing. Replaced the four-column link index.
 */
export function SiteFooter() {
  const a = SITE.address;
  return (
    <footer className="mt-auto bg-inverse px-6 pb-8 pt-16 text-on-inverse sm:pt-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
          <p className="font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1] text-on-inverse-strong">
            Open every day,
            <br />
            {SITE.hours.open} to {SITE.hours.close}.
          </p>
          <div className="flex flex-col gap-5 text-sm leading-relaxed">
            <address className="not-italic">
              <span className="block font-semibold text-on-inverse-strong">{SITE.name}</span>
              <span className="block">{a.line1}, {a.line2},</span>
              <span className="block">{a.city}, {a.region} {a.zip}</span>
            </address>
            <p>
              <a href={`mailto:${SITE.contactEmail}`} className="underline underline-offset-4 hover:text-on-inverse-strong">
                {SITE.contactEmail}
              </a>
              <br />
              <a href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`} className="hover:text-on-inverse-strong">
                {SITE.phone}
              </a>
            </p>
          </div>
        </div>

        <nav aria-label="Rooms" className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border-inverse pt-6 text-sm">
          {ROOMS.filter((r) => r.active).map((r) => (
            <Link key={r.id} href={`/rooms/${r.id}`} className="inline-flex min-h-11 items-center whitespace-nowrap hover:text-on-inverse-strong">
              {r.name}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Site" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {LINKS.map(([href, label]) => (
              <Link key={href} href={href} className="inline-flex min-h-11 items-center whitespace-nowrap hover:text-on-inverse-strong">
                {label}
              </Link>
            ))}
          </nav>
          <p className="flex items-center gap-3 text-sm">
            <Wordmark className="text-base text-on-inverse-strong" />
            <span>© {new Date().getFullYear()}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
