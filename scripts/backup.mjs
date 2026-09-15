// Nightly SQLite backup: a consistent copy via VACUUM INTO, keeping the newest 14.
//
//   DATABASE_PATH=data/bookings.db BACKUP_DIR=/var/backups/clockroom node scripts/backup.mjs
//
// Safe while the app is running (VACUUM INTO reads a snapshot). The copies hold
// customer PII: keep BACKUP_DIR off the web root and out of git. Restore drill is
// in PROJECT_CONTEXT.md (Backups).
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const KEEP = 14;
const source = process.env.DATABASE_PATH ?? "data/bookings.db";
const dir = process.env.BACKUP_DIR;
if (!dir) throw new Error("Set BACKUP_DIR to a folder outside the repo.");

mkdirSync(dir, { recursive: true });
const target = path.join(dir, `bookings-${new Date().toISOString().slice(0, 10)}.db`);
rmSync(target, { force: true }); // VACUUM INTO refuses an existing file; a same-day rerun replaces it.

const db = new DatabaseSync(source, { readOnly: true });
db.prepare("VACUUM INTO ?").run(target);
db.close();

const old = readdirSync(dir).filter((f) => /^bookings-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort().reverse().slice(KEEP);
for (const f of old) rmSync(path.join(dir, f));
console.log(`backup written: ${target}${old.length ? `; removed ${old.length} older` : ""}`);
