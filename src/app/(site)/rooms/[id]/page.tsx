import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getRoomById, ROOMS } from "@/lib/rooms-data";
import { SITE, SITE_URL } from "@/lib/site-config";
import { MediaSlot } from "@/components/MediaSlot";
import Image from "next/image";
import { JsonLd } from "@/components/JsonLd";
import { formatUsdPerHour } from "@/lib/format";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { BOOKING_CONFIG, ROOM_TYPE_LABELS } from "@/types/domain";

export function generateStaticParams() {
  return ROOMS.filter((r) => r.active).map((r) => ({ id: r.id }));
}

export async function generateMetadata(props: PageProps<"/rooms/[id]">): Promise<Metadata> {
  const room = getRoomById((await props.params).id);
  if (!room) return {};
  const title = `${room.name}: ${ROOM_TYPE_LABELS[room.type].toLowerCase()} room, ${formatUsdPerHour(room.hourlyRateCents)}`;
  const description = `${room.tagline} ${room.description}`;
  return {
    title,
    description,
    alternates: { canonical: `/rooms/${room.id}` },
    // openGraph replaces the root layout's object wholesale, so repeat its fields.
    openGraph: {
      title,
      description,
      url: `/rooms/${room.id}`,
      type: "website",
      siteName: SITE.name,
      locale: "en_US",
      images: [`/rooms/og/${room.id}.png`],
    },
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
              { "@type": "ListItem", position: 2, name: room.name, item: url },
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
          <div className="flex flex-col gap-3 border-t border-border-subtle pt-5 lg:border-t-0 lg:pt-0">
            <dl className="grid grid-cols-2 gap-x-6 sm:grid-cols-4 gap-y-4">
              {[
                ["Type", ROOM_TYPE_LABELS[room.type], ""],
                ["Fits", `${room.capacity} people`, "tabular-nums"],
                ["Size", `${room.sqft} sq ft`, "tabular-nums"],
                ["Rate", formatUsdPerHour(room.hourlyRateCents), "tabular"],
              ].map(([k, v, figures]) => (
                <div key={k} className="flex flex-col gap-1">
                  <dt className="text-sm text-text-secondary">{k}</dt>
                  <dd className={`whitespace-nowrap font-semibold text-text-primary ${figures}`}>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-text-secondary">
              Starts on the hour · 1 to 3 hours · {BOOKING_CONFIG.minBookingNoticeHours} hours&apos; notice same day
            </p>
          </div>
        </div>
      </section>

      <figure>
        <MediaSlot
          video={room.reel}
          poster={`/rooms/art/${room.id}.webp`}
          alt={`Illustration of ${room.name}: ${room.description}`}
          preload
          sizes="100vw"
          className="aspect-[16/10] w-full sm:aspect-[21/9] lg:max-h-[40vh]"
          imageClassName="object-cover object-center"
        />
        {!room.reel && (
          <figcaption className="px-6 pt-3 text-sm text-text-secondary">
            <span className="mx-auto block max-w-6xl">Illustration of the setup</span>
          </figcaption>
        )}
      </figure>

      <div className="px-6 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
          <div className="order-2 flex flex-col gap-12 lg:order-1">
            <section className="flex flex-col gap-4">
              <h2 className="type-section text-text-primary">About the room</h2>
              <p className="text-lg leading-relaxed text-text-secondary">{room.marketingDescription}</p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="type-section text-text-primary">Included in the rate</h2>
              <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {room.equipment.map((item) => (
                  <li key={item} className="border-t border-border-subtle pt-3 leading-snug text-text-primary">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="type-section text-text-primary">Good for</h2>
              <p className="text-lg leading-relaxed text-text-primary">{room.idealFor.join(", ")}</p>
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
            <h2 className="type-section mb-8 text-text-primary">Inside the room</h2>
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
        <section className="border-t border-border-subtle px-6 py-14">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
            <h2 className="type-section text-text-primary">Other rooms</h2>
            <ul className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
              {others.map((r) => (
                <li key={r.id}>
                  <Link href={`/rooms/${r.id}`} className="group flex min-h-16 items-center gap-4 py-3">
                    <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-token-sm">
                      {/* The 16:9 art covers a 4:3 box, so it renders ~86px wide, not 64. */}
                      <Image src={`/rooms/art/${r.id}.webp`} alt="" fill sizes="96px" className="object-cover" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold text-text-primary group-hover:text-text-accent">{r.name}</span>
                      <span className="text-sm text-text-secondary">
                        {ROOM_TYPE_LABELS[r.type]} · {r.capacity} people
                      </span>
                    </span>
                    <span className="tabular whitespace-nowrap font-semibold text-text-primary">{formatUsdPerHour(r.hourlyRateCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
