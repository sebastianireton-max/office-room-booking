import "server-only";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

/**
 * Embedded SQLite via Node's built-in `node:sqlite`. Works for one long-running
 * server process only; serverless hosts have ephemeral disks. The Postgres model
 * in prisma/schema.prisma is the production target (PROJECT_CONTEXT §3).
 *
 * DATABASE_PATH overrides the file so tests never touch data/bookings.db.
 */
const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "bookings.db");

let db: DatabaseSync | null = null;

function hasColumn(d: DatabaseSync, table: string, column: string): boolean {
  const cols = d.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

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
    CREATE INDEX IF NOT EXISTS idx_bookings_room_date ON bookings(room_id, date);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_sub TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      picture TEXT,
      created_at TEXT NOT NULL,
      last_login_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS room_blocks (
      id TEXT PRIMARY KEY,
      room_id TEXT,            -- NULL blocks every room (holiday, maintenance)
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_blocks_date ON room_blocks(date);

    CREATE TABLE IF NOT EXISTS admin_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Additive migrations on the existing bookings table. Never destructive.
  if (!hasColumn(db, "bookings", "user_id")) db.exec("ALTER TABLE bookings ADD COLUMN user_id TEXT");
  // Set when Stripe says a payment succeeded for a hold that had already lapsed:
  // the customer paid, and a human has to refund or rebook them.
  if (!hasColumn(db, "bookings", "payment_issue")) db.exec("ALTER TABLE bookings ADD COLUMN payment_issue TEXT");
  if (!hasColumn(db, "bookings", "stripe_refund_id")) db.exec("ALTER TABLE bookings ADD COLUMN stripe_refund_id TEXT");
  if (!hasColumn(db, "bookings", "confirmation_sent_at"))
    db.exec("ALTER TABLE bookings ADD COLUMN confirmation_sent_at TEXT");
  db.exec("CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(customer_email COLLATE NOCASE);");

  return db;
}
