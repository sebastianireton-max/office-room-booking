import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { FAQS } from "@/lib/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Hours, booking holds, equipment, payment, accounts and what happens after you book, answered.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <main className="flex-1 px-6 pb-20 pt-12 sm:pt-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
        <div className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
          <h1 className="font-display text-5xl font-semibold leading-[1] text-text-primary sm:text-6xl">Questions, answered</h1>
          <p className="text-text-secondary">
            Something not covered?{" "}
            <Link href="/contact" className="font-medium text-text-accent underline underline-offset-4">
              Ask the studio
            </Link>
            .
          </p>
        </div>

        <dl className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
          {FAQS.map((item) => (
            <div key={item.q} className="flex flex-col gap-2 py-6">
              <dt className="text-lg font-semibold text-text-primary">{item.q}</dt>
              <dd className="max-w-[62ch] leading-relaxed text-text-secondary">
                {item.a}
                {item.link && (
                  <>
                    {" "}
                    <Link href={item.link.href} className="font-medium text-text-accent hover:underline">
                      {item.link.label}
                    </Link>
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
