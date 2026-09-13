import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "./client";
import type { User } from "@/types/domain";

type UserRow = { id: string; email: string; name: string; picture: string | null };

/** Creates or refreshes the user for a verified Google identity. Keyed on the
 * stable `sub`, never on email, since a Google account's email can change. */
export function upsertGoogleUser(profile: { sub: string; email: string; name: string; picture: string | null }): User {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (id, google_sub, email, name, picture, created_at, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email, name = excluded.name,
       picture = excluded.picture, last_login_at = excluded.last_login_at`
  ).run(randomUUID(), profile.sub, profile.email, profile.name, profile.picture, now, now);
  return db.prepare(`SELECT id, email, name, picture FROM users WHERE google_sub = ?`).get(profile.sub) as UserRow;
}

export function getUserById(id: string): User | null {
  return (getDb().prepare(`SELECT id, email, name, picture FROM users WHERE id = ?`).get(id) as UserRow) ?? null;
}

export function recordAudit(actorEmail: string, action: string, target: string, detail?: string): void {
  getDb()
    .prepare(`INSERT INTO admin_audit (actor_email, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(actorEmail, action, target, detail ?? null, new Date().toISOString());
}

export function listAudit(limit = 100) {
  return getDb()
    .prepare(`SELECT actor_email, action, target, detail, created_at FROM admin_audit ORDER BY id DESC LIMIT ?`)
    .all(limit) as { actor_email: string; action: string; target: string; detail: string | null; created_at: string }[];
}
