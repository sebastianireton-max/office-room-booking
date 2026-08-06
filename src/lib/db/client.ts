import "server-only";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

/**
 * Embedded SQLite via Node's built-in `node:sqlite` module.
 *
 * This is the v1 persistence layer for BOOKINGS ONLY (transactional data that
 * needs real concurrency control). Room catalog data stays in
 * src/lib/rooms-data.ts (see the comment there for why).
 *
 * IMPORTANT — production note: a single SQLite file works for a single
 * long-running server process. Most serverless hosts (Vercel, etc.) have an
 * ephemeral or read-only filesystem, so this file will NOT persist across
 * deployments or scale across multiple instances. A `prisma/schema.prisma`
 * (Postgres) is included as the intended production data model — swap this
 * module for a Prisma-backed implementation of the same repository functions
 * in src/lib/db/bookings-repository.ts before going live with real traffic.
 * Nothing outside that one file needs to change.
 */

const DB_PATH = path.join(process.cwd(), "data", "bookings.db");

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      price_cents INTEGER NOT NULL,
      status TEXT NOT NULL,
      stripe_payment_intent_id TEXT,
      hold_expires_at TEXT,
      calendar_event_uid TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_bookings_room_date ON bookings(room_id, date);`
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);`
  );

  return db;
}
