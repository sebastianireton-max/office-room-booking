import type { Metadata } from "next";
import Link from "next/link";
import { ROOMS } from "@/lib/rooms-data";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
    <SiteHeader />
    <main className="flex flex-1 items-center px-6 py-20">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <p className="tabular text-sm text-text-secondary">404</p>
        <h1 className="font-display text-5xl font-semibold text-text-primary">That page doesn&apos;t exist</h1>
        <p className="text-lg text-text-secondary">The link may be old. These will get you where you were going:</p>
        <ul className="flex flex-wrap gap-3">
          <li>
            <Link href="/#find" className="inline-flex min-h-11 items-center rounded-token-full bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover">
              Find an open room
            </Link>
          </li>
          {ROOMS.filter((r) => r.active).map((r) => (
            <li key={r.id}>
              <Link href={`/rooms/${r.id}`} className="inline-flex min-h-11 items-center rounded-token-full border border-border-default px-4 text-sm text-text-primary hover:border-border-accent">
                {r.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
