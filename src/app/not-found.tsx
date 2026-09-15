import type { Metadata } from "next";
import { ROOMS } from "@/lib/rooms-data";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/Button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
    <SiteHeader />
    <main className="flex flex-1 items-center px-6 py-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <p className="tabular text-sm text-text-secondary">404</p>
        <h1 className="type-page text-text-primary">That page doesn&apos;t exist</h1>
        <p className="max-w-[65ch] text-lg text-text-secondary">The link may be old. These will get you where you were going:</p>
        <ul className="flex flex-wrap gap-3">
          <li>
            <Button variant="ghost" href="/#rooms">Find an open room</Button>
          </li>
          {ROOMS.filter((r) => r.active).map((r) => (
            <li key={r.id}>
              <Button variant="secondary" href={`/rooms/${r.id}`}>
                {r.name}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
