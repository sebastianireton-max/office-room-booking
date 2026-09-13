"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth/session";

/** Server Action, so Next's built-in Origin check covers it against CSRF. */
export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}
