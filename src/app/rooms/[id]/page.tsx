import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRoomById, ROOMS } from "@/lib/rooms-data";
import { SITE } from "@/lib/site-config";
import Image from "next/image";
import { RoomTypeBadge } from "@/components/RoomTypeBadge";
import { RoomCard } from "@/components/RoomCard";
import { formatUsdPerHour } from "@/lib/format";
import { BookingFlow } from "@/components/booking/BookingFlow";

export function generateStaticParams() {
  return ROOMS.map((r) => ({ id: r.id }));
}

export async function generateMetadata(props: PageProps<"/rooms/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const room = getRoomById(id);
  if (!room) return {};
  return {
    title: `${room.name} · ${SITE.name}`,
    description: `${room.tagline} ${room.description}`,
  };
}

export default async function RoomDetailPage(props: PageProps<"/rooms/[id]">) {
  const { id } = await props.params;
  const room = getRoomById(id);
  if (!room || !room.active) notFound();

  // Cross-sell: same-type room first, then the rest, capped at 3.
  const otherRooms = [
    ...ROOMS.filter((r) => r.active && r.id !== room.id && r.type === room.type),
    ...ROOMS.filter((r) => r.active && r.id !== room.id && r.type !== room.type),
  ].slice(0, 3);

  return (
    <main className="flex-1">
      {/* Landing hero — room-as-identity treatment */}
      <section className="border-b border-border-subtle px-6 pb-12 pt-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <RoomTypeBadge type={room.type} />
          <h1 className="font-display text-5xl font-medium lowercase italic tracking-[-0.014em] text-text-primary sm:text-6xl">
            {room.name}
          </h1>
          <p className="max-w-2xl font-display text-2xl text-text-secondary">{room.tagline}</p>
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-text-secondary">
            {room.capacity} people · {room.sqft} sq ft · from {formatUsdPerHour(room.hourlyRateCents)}
          </p>
        </div>
      </section>

      <div className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-token-lg shadow-[var(--shadow-subtle)]">
            <Image
              src={`/rooms/art/${room.id}.webp`}
              alt={`Illustration of ${room.name}: ${room.description}`}
              fill
              priority
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover"
            />
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="order-2 flex flex-col gap-8 lg:order-1">
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-2xl font-medium text-text-primary">
                <span className="lowercase italic">the</span>{" "}
                <span className="uppercase">ROOM</span>
              </h2>
              <p className="text-base leading-relaxed text-text-secondary">{room.marketingDescription}</p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-display text-2xl font-medium text-text-primary">
                <span className="lowercase italic">made</span>{" "}
                <span className="uppercase">FOR</span>
              </h2>
              <ul className="flex flex-wrap gap-2">
                {room.idealFor.map((use) => (
                  <li
                    key={use}
                    className="rounded-token-full border border-border-subtle bg-surface px-4 py-2 text-sm font-medium text-text-primary"
                  >
                    {use}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 rounded-token-lg bg-surface p-6 shadow-[var(--shadow-subtle)]">
              <h2 className="font-display text-2xl font-medium text-text-primary">
                <span className="lowercase italic">what&apos;s</span>{" "}
                <span className="uppercase">INCLUDED</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {room.equipment.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-secondary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div id="book" className="order-1 scroll-mt-24 lg:order-2 lg:sticky lg:top-24 lg:self-start">
            <BookingFlow room={room} />
          </div>
          </div>
        </div>
      </div>

      {/* Cross-links — keep people in the funnel if this room isn't the fit */}
      {otherRooms.length > 0 && (
        <section className="border-t border-border-subtle px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 font-display text-3xl font-medium text-text-primary">
              <span className="lowercase italic">not quite right?</span>{" "}
              <span className="uppercase">TRY THESE.</span>
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {otherRooms.map((r) => (
                <RoomCard key={r.id} room={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
