import { notFound } from "next/navigation";
import { getRoomById, ROOMS } from "@/lib/rooms-data";
import { RoomTypeBadge } from "@/components/RoomTypeBadge";
import { formatUsdPerHour } from "@/lib/format";
import { BookingFlow } from "@/components/booking/BookingFlow";

export function generateStaticParams() {
  return ROOMS.map((r) => ({ id: r.id }));
}

export default async function RoomDetailPage(props: PageProps<"/rooms/[id]">) {
  const { id } = await props.params;
  const room = getRoomById(id);
  if (!room || !room.active) notFound();

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG */}
          <img
            src={`/rooms/${room.id}.svg`}
            alt={`${room.name} — room photo placeholder`}
            className="aspect-[8/5] w-full rounded-token-lg object-cover"
          />
          <div className="flex flex-col gap-3">
            <RoomTypeBadge type={room.type} />
            <h1 className="font-display text-4xl font-medium lowercase italic tracking-[-0.5px] text-text-primary">{room.name}</h1>
            <p className="text-sm text-text-secondary">
              {room.capacity} people · {room.sqft} sq ft · {formatUsdPerHour(room.hourlyRateCents)}
            </p>
            <p className="text-base text-text-secondary">{room.description}</p>
          </div>
          <div className="flex flex-col gap-3 rounded-token-lg bg-surface p-6">
            <h2 className="text-xl font-semibold text-text-primary">What&apos;s included</h2>
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

        <div className="lg:sticky lg:top-24 lg:self-start">
          <BookingFlow room={room} />
        </div>
      </div>
    </main>
  );
}
