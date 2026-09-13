import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getRoomById, ROOMS } from "@/lib/rooms-data";
import { SITE_URL } from "@/lib/site-config";
import { MediaSlot } from "@/components/MediaSlot";
import { RoomCard } from "@/components/RoomCard";
import { JsonLd } from "@/components/JsonLd";
import { formatUsd, formatUsdPerHour } from "@/lib/format";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { ROOM_TYPE_LABELS } from "@/types/domain";

export function generateStaticParams() {
  return ROOMS.filter((r) => r.active).map((r) => ({ id: r.id }));
}

export async function generateMetadata(props: PageProps<"/rooms/[id]">): Promise<Metadata> {
  const room = getRoomById((await props.params).id);
  if (!room) return {};
  const title = `${room.name}: ${ROOM_TYPE_LABELS[room.type].toLowerCase()} room, ${formatUsdPerHour(room.hourlyRateCents)}`;
  return {
    title,
    description: `${room.tagline} ${room.description}`,
    alternates: { canonical: `/rooms/${room.id}` },
    openGraph: { title, description: room.tagline, url: `/rooms/${room.id}`, images: [`/rooms/og/${room.id}.png`] },
  };
}

export default async function RoomDetailPage(props: PageProps<"/rooms/[id]">) {
  const { id } = await props.params;
  const room = getRoomById(id);
  if (!room || !room.active) notFound();

  const others = [
    ...ROOMS.filter((r) => r.active && r.id !== room.id && r.type === room.type),
    ...ROOMS.filter((r) => r.active && r.id !== room.id && r.type !== room.type),
  ].slice(0, 3);
  const url = `${SITE_URL}/rooms/${room.id}`;

  return (
    <main className="flex-1">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: room.name,
            serviceType: `${ROOM_TYPE_LABELS[room.type]} room rental`,
            description: room.marketingDescription,
            image: `${SITE_URL}/rooms/art/${room.id}.webp`,
            url,
            provider: { "@id": `${SITE_URL}/#business` },
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "USD",
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: room.hourlyRateCents / 100,
                priceCurrency: "USD",
                unitCode: "HUR",
              },
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Rooms", item: `${SITE_URL}/#rooms` },
              { "@type": "ListItem", position: 3, name: room.name, item: url },
            ],
          },
        ]}
      />

      <div className="px-6 pt-8">
        <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl text-sm text-text-secondary">
          <ol className="flex flex-wrap gap-2">
            <li><Link href="/" className="hover:text-text-primary">Home</Link> /</li>
            <li><Link href="/#rooms" className="hover:text-text-primary">Rooms</Link> /</li>
            <li aria-current="page" className="text-text-primary">{room.name}</li>
          </ol>
        </nav>
      </div>

      <section className="px-6 pb-10 pt-8 sm:pb-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-3xl flex-col gap-4">
            <h1 className="font-display text-5xl font-semibold leading-[0.98] text-text-primary sm:text-7xl">{room.name}</h1>
            <p className="text-xl text-text-secondary sm:text-2xl">{room.tagline}</p>
          </div>
          <dl className="grid grid-cols-3 gap-6 border-t border-border-subtle pt-5 lg:border-t-0 lg:pt-0">
            {[
              ["Type", ROOM_TYPE_LABELS[room.type]],
              ["Fits", `${room.capacity} people`],
              ["Size", `${room.sqft} sq ft`],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1">
                <dt className="text-sm text-text-secondary">{k}</dt>
                <dd className="tabular font-semibold text-text-primary">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <figure className="relative">
        <MediaSlot
          video={room.reel}
          poster={`/rooms/art/${room.id}.webp`}
          alt={`Illustration of ${room.name}: ${room.description}`}
          priority
          sizes="100vw"
          className="aspect-[16/10] w-full sm:aspect-[21/9]"
          imageClassName="object-cover"
        />
        {!room.reel && (
          <figcaption className="absolute bottom-3 left-3 rounded-token-full bg-surface/90 px-3 py-1 text-xs text-text-secondary">
            Illustration of the setup
          </figcaption>
        )}
      </figure>

      <div className="px-6 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
          <div className="order-2 flex flex-col gap-12 lg:order-1">
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-3xl font-semibold text-text-primary">About the room</h2>
              <p className="text-lg leading-relaxed text-text-secondary">{room.marketingDescription}</p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="font-display text-3xl font-semibold text-text-primary">Included in the rate</h2>
              <ul className="flex flex-col border-t border-border-subtle">
                {room.equipment.map((item) => (
                  <li key={item} className="flex items-start gap-3 border-b border-border-subtle py-3.5 text-text-primary">
                    <svg className="mt-1 h-4 w-4 shrink-0 text-text-accent" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="font-display text-3xl font-semibold text-text-primary">Good for</h2>
              <ul className="flex flex-wrap gap-2">
                {room.idealFor.map((use) => (
                  <li key={use} className="rounded-token-full border border-border-default px-4 py-2 text-sm text-text-primary">
                    {use}
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-3 rounded-token-md bg-surface p-6">
              <h2 className="text-lg font-semibold text-text-primary">Rates</h2>
              <p className="tabular text-text-secondary">
                1 hour {formatUsd(room.hourlyRateCents)} · 2 hours {formatUsd(room.hourlyRateCents * 2)} · 3 hours{" "}
                {formatUsd(room.hourlyRateCents * 3)}
              </p>
              <p className="text-sm text-text-secondary">
                The total at checkout is the total you pay.{" "}
                <Link href="/faq" className="font-medium text-text-accent hover:underline">
                  Booking questions
                </Link>
              </p>
            </section>
          </div>

          <div id="book" className="order-1 scroll-mt-24 lg:order-2 lg:sticky lg:top-24 lg:self-start">
            <Suspense fallback={<div className="h-[36rem] rounded-token-lg bg-surface" />}>
              <BookingFlow room={room} />
            </Suspense>
          </div>
        </div>
      </div>

      {room.clips && room.clips.length > 0 && (
        <section className="border-t border-border-subtle px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 font-display text-3xl font-semibold text-text-primary">Inside the room</h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {room.clips.map((clip, i) => (
                <MediaSlot
                  key={clip}
                  video={clip}
                  poster={`/rooms/art/${room.id}.webp`}
                  alt={`${room.name}, detail ${i + 1}`}
                  sizes="(max-width: 1024px) 50vw, 280px"
                  className="aspect-[4/5] w-full overflow-hidden rounded-token-md"
                  imageClassName="object-cover"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="border-t border-border-subtle bg-surface px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 font-display text-3xl font-semibold text-text-primary">Other rooms</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((r) => (
                <RoomCard key={r.id} room={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
