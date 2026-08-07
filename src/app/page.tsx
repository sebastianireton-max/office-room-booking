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
          <p className="text-sm font-medium uppercase tracking-[2px] text-text-accent">
            On-demand rooms, ready when you are
          </p>
          <h1 className="font-display text-5xl font-medium tracking-[-0.5px] text-text-primary sm:text-7xl">
            <span className="lowercase italic">your room is</span>{" "}
            <span className="uppercase">READY.</span>
            <br />
            <span className="lowercase italic">show up &amp;</span>{" "}
            <span className="uppercase">CREATE.</span>
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
            <p className="text-sm font-medium uppercase tracking-[2px] text-text-accent">Our Rooms</p>
            <h2 className="font-display text-4xl font-medium tracking-[-0.5px] text-text-primary">
              <span className="lowercase italic">six rooms,</span>{" "}
              <span className="uppercase">THREE WAYS TO WORK.</span>
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
