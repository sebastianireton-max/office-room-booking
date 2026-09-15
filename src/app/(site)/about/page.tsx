import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About",
  description:
    "Content studios with lights and backdrops, podcast rooms with treated walls and mics, and sound-isolated meeting rooms, booked by the hour with no membership.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="flex-1 px-6 pb-20 pt-12 sm:pb-24 sm:pt-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <div className="flex max-w-[65ch] flex-col items-start gap-4">
          <h1 className="type-page text-text-primary">About {SITE.name}</h1>
          <p className="text-lg leading-relaxed text-text-secondary">
            {SITE.name} rents out rooms by the hour. The content studios have lights and backdrops, the
            podcast rooms have acoustically treated walls and microphones, and the meeting rooms are
            sound-isolated with a display and a webcam.
          </p>
          <p className="text-lg leading-relaxed text-text-secondary">
            Rooms are open {SITE.hours.open} to {SITE.hours.close}, {SITE.hours.days}. There is no
            membership. Pick a room and a time, pay, and the room is yours for that booking. The
            equipment listed on each room&rsquo;s page is included in the rate.
          </p>
          <Link href="/#rooms" className="mt-2 inline-flex min-h-11 items-center font-medium text-text-accent underline underline-offset-4">
            Browse the rooms
          </Link>
        </div>

        {/* PLACEHOLDER: founder story. The owner supplies the real story,
            names, and photography; intentionally not invented for them. */}
        <div className="flex max-w-[65ch] flex-col gap-3 rounded-token-lg border border-dashed border-border-default bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
            Placeholder: your story goes here
          </p>
          <p className="font-display text-2xl font-semibold text-text-primary">The part only you can write</p>
          <p className="text-sm leading-relaxed text-text-secondary">
            Who built this space, why, and for whom, in your own words. A paragraph or two about the
            people behind the rooms, with a photo, turns this page from a brochure into a reason to book
            here instead of anywhere else. Send it over and it drops straight in.
          </p>
        </div>
      </div>
    </main>
  );
}
