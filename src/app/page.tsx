import { ROOMS } from "@/lib/rooms-data";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/Button";

export default function HomePage() {
  const activeRooms = ROOMS.filter((r) => r.active);

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero — design package Section 6.1 */}
      <section className="border-b border-border-subtle px-6 py-24 sm:py-32">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <p className="text-sm font-medium tracking-[0.3px] text-text-accent">
            On-demand rooms, ready when you are
          </p>
          <h1 className="text-4xl font-bold tracking-[-1.5px] text-text-primary sm:text-6xl">
            Book your room. Show up and create.
          </h1>
          <p className="max-w-2xl text-lg text-text-secondary">
            Content rooms, podcast suites, and a conference room — available by the hour.
          </p>
          <Button href="#rooms" variant="primary" className="mt-2">
            Check availability
          </Button>
        </div>
      </section>

      {/* Room grid — design package Section 6.1 */}
      <section id="rooms" className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-2">
            <p className="text-sm font-medium tracking-[0.3px] text-text-accent">Our Rooms</p>
            <h2 className="text-3xl font-semibold tracking-[-0.5px] text-text-primary">
              Six rooms. Three ways to work.
            </h2>
          </div>
          <div className="grid grid-cols-1 place-items-center gap-8 sm:grid-cols-2 sm:place-items-stretch lg:grid-cols-3">
            {activeRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
