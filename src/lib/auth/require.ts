import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "./session";
import type { User } from "@/types/domain";

export async function requireUser(next: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return user;
}

/**
 * Call at the top of EVERY admin page, route handler and server action. A layout
 * check alone does not protect actions or route handlers, which are reachable
 * directly. SECURITY-RELEVANT.
 */
export async function requireAdmin(next = "/admin"): Promise<User> {
  const user = await requireUser(next);
  if (!isAdmin(user)) redirect("/account?denied=1");
  return user;
}
