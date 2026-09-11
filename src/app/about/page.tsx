import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About",
  description:
    "One space, six rooms, three ways to work. Built so creators and teams can walk in, plug in, and get to it.",
};

export default function AboutPage() {
  return (
    <main className="flex-1 px-6 py-14">
      <div className="mx-auto flex max-w-3xl flex-col gap-12">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-text-accent">About</p>
          <h1 className="font-display text-5xl font-medium tracking-[-0.014em] text-text-primary">
            <span className="font-normal lowercase">rooms that</span>{" "}
            <span className="font-extrabold uppercase">WORK AS HARD AS YOU DO.</span>
          </h1>
          <p className="text-lg leading-relaxed text-text-secondary">
            This space runs on one belief: the hardest part of making something shouldn&apos;t be finding
            somewhere to make it. Content studios with the lighting and
            backdrops already standing, podcast rooms where the acoustics and mics are handled, and
            sound-isolated meeting rooms where the technology just works.
          </p>
          <p className="text-lg leading-relaxed text-text-secondary">
            Everything is booked by the hour, {SITE.hours.open}–{SITE.hours.close}, {SITE.hours.days}. No
            memberships, no minimums, no gatekeeping. Pick a room, pick a time, pay, and the door is yours.
            The gear listed on each room&apos;s page is included and set up before you arrive.
          </p>
        </div>

        {/* PLACEHOLDER: founder story. The owner supplies the real story,
            names, and photography — intentionally not invented for them. */}
        <div className="flex flex-col gap-3 rounded-token-lg border border-dashed border-border-default bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
            Placeholder: your story goes here
          </p>
          <p className="font-display text-2xl lowercase text-text-primary">the part only you can write</p>
          <p className="text-sm leading-relaxed text-text-secondary">
            Who built this space, why, and for whom, in your own words. A paragraph or two about the
            people behind the rooms, with a photo, turns this page from a brochure into a reason to book
            here instead of anywhere else. Send it over and it drops straight in.
          </p>
        </div>

        <div className="flex flex-col items-start gap-4">
          <h2 className="font-display text-3xl font-medium text-text-primary">
            <span className="font-normal lowercase">come see</span>{" "}
            <span className="font-extrabold uppercase">FOR YOURSELF.</span>
          </h2>
          <Link
            href="/#rooms"
            className="rounded-token-full bg-accent px-6 py-3 text-base font-semibold text-on-accent transition-colors hover:bg-accent-hover"
          >
            Browse the rooms
          </Link>
        </div>
      </div>
    </main>
  );
}
