import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/JsonLd";
import { SITE, SITE_URL } from "@/lib/site-config";

/** Public site chrome. The admin area has its own layout and skips this. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const a = SITE.address;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": `${SITE_URL}/#business`,
          name: SITE.name,
          description: SITE.tagline,
          url: SITE_URL,
          email: SITE.contactEmail,
          telephone: SITE.phone,
          logo: `${SITE_URL}/icon.svg`,
          address: {
            "@type": "PostalAddress",
            streetAddress: [a.line1, a.line2].filter(Boolean).join(", "),
            addressLocality: a.city,
            addressRegion: a.region,
            postalCode: a.zip,
            addressCountry: "US",
          },
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            opens: SITE.hours.opensAt,
            closes: SITE.hours.closesAt,
          },
          sameAs: Object.values(SITE.social),
        }}
      />
      {/* WCAG 2.4.1: first focusable element, visible only when focused. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-token-full focus:bg-accent focus:px-5 focus:py-3 focus:font-semibold focus:text-on-accent"
      >
        Skip to content
      </a>
      <SiteHeader />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </div>
      <SiteFooter />
    </>
  );
}
