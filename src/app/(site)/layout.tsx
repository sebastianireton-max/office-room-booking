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
            opens: "08:00",
            closes: "22:00",
          },
          sameAs: Object.values(SITE.social),
        }}
      />
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
