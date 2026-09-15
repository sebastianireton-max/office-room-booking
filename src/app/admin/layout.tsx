import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { Wordmark } from "@/components/Wordmark";
import { signOut } from "@/app/actions/auth";
import { AdminNav } from "./nav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Gate for pages. Actions and route handlers re-check on their own.
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border-subtle bg-surface">
        {/* Below lg the nav takes its own scrolling row, so the header stays two rows tall. */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 px-6 py-1.5">
          <Link href="/" className="flex min-h-11 items-center gap-2">
            <Wordmark className="text-lg" />
            <span className="text-sm text-text-secondary">admin</span>
          </Link>
          <AdminNav className="order-last -mx-6 w-[calc(100%+3rem)] px-5 lg:order-none lg:mx-0 lg:w-auto lg:px-0" />
          <div className="ml-auto flex items-center gap-3 text-sm text-text-secondary">
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
