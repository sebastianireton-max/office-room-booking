import Link from "next/link";
import { SITE } from "@/lib/site-config";
import { ROOMS } from "@/lib/rooms-data";

export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <p className="font-display text-lg lowercase italic text-text-primary">
            {SITE.name.toLowerCase()}
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">{SITE.tagline}</p>
          <p className="text-sm text-text-secondary">
            Open {SITE.hours.open}–{SITE.hours.close}, {SITE.hours.days}
          </p>
        </div>

        <nav className="flex flex-col gap-2.5" aria-label="Rooms">
          <p className="text-sm font-semibold uppercase tracking-[1.5px] text-text-primary">Rooms</p>
          {ROOMS.filter((r) => r.active).map((r) => (
            <Link
              key={r.id}
              href={`/rooms/${r.id}`}
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              {r.name}
            </Link>
          ))}
        </nav>

        <nav className="flex flex-col gap-2.5" aria-label="Company">
          <p className="text-sm font-semibold uppercase tracking-[1.5px] text-text-primary">Studio</p>
          <Link href="/pricing" className="text-sm text-text-secondary hover:text-text-primary">
            Pricing
          </Link>
          <Link href="/faq" className="text-sm text-text-secondary hover:text-text-primary">
            FAQ
          </Link>
          <Link href="/about" className="text-sm text-text-secondary hover:text-text-primary">
            About
          </Link>
          <Link href="/contact" className="text-sm text-text-secondary hover:text-text-primary">
            Contact
          </Link>
        </nav>

        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-semibold uppercase tracking-[1.5px] text-text-primary">Get in touch</p>
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            {SITE.contactEmail}
          </a>
          <p className="text-sm text-text-secondary">{SITE.phone}</p>
          <p className="text-sm text-text-secondary">
            {SITE.address.line1}, {SITE.address.line2}
            <br />
            {SITE.address.city}, {SITE.address.region} {SITE.address.zip}
          </p>
        </div>
      </div>

      <div className="border-t border-border-subtle px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-text-secondary">
            © {new Date().getFullYear()} {SITE.name}. All bookings are processed securely via Stripe.
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-xs text-text-secondary hover:text-text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="text-xs text-text-secondary hover:text-text-primary">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
