import Link from "next/link";
import Image from "next/image";
import type { Room } from "@/types/domain";
import { ROOM_TYPE_LABELS } from "@/types/domain";
import { formatUsdPerHour } from "@/lib/format";

/** Compact cross-sell card. The whole card is the link. */
export function RoomCard({ room }: { room: Room }) {
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-token-md border border-border-subtle bg-canvas transition-colors hover:border-border-default"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={`/rooms/art/${room.id}.webp`}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 360px"
          className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-expo)] group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <p className="text-sm text-text-secondary">
          {ROOM_TYPE_LABELS[room.type]} · {room.capacity} people
        </p>
        <h3 className="font-display text-2xl font-semibold text-text-primary group-hover:text-text-accent">{room.name}</h3>
        <p className="tabular mt-auto pt-2 font-semibold text-text-primary">{formatUsdPerHour(room.hourlyRateCents)}</p>
      </div>
    </Link>
  );
}
