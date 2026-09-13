import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { Wordmark } from "@/components/Wordmark";
import { signOut } from "@/app/actions/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

const NAV = [
  ["/admin", "Today"],
  ["/admin/bookings", "Bookings"],
  ["/admin/blocks", "Block-outs"],
  ["/admin/activity", "Activity"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Gate for pages. Actions and route handlers re-check on their own.
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border-subtle bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-baseline gap-2">
              <Wordmark className="text-lg" />
              <span className="text-sm text-text-secondary">admin</span>
            </Link>
            <nav aria-label="Admin" className="flex flex-wrap gap-1">
              {NAV.map(([href, label]) => (
                <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-token-sm px-3 text-sm font-medium text-text-secondary hover:bg-surface-raised hover:text-text-primary">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <span className="hidden sm:inline">{admin.email}</span>
            <form action={signOut}>
              <button className="inline-flex min-h-11 items-center px-2 font-medium underline underline-offset-4 hover:text-text-primary">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
