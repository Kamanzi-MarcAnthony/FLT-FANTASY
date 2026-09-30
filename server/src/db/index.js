import { createRequire } from 'node:module';
import bcrypt from 'bcryptjs';
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite'); // built into Node 22.13+

const db = new DatabaseSync(process.env.DATABASE_PATH || 'data.db');
db.exec(`
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
  name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin', created_by INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS leagues(id INTEGER PRIMARY KEY, admin_id INTEGER NOT NULL REFERENCES admins(id),
  name TEXT NOT NULL, location TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, recurrence TEXT NOT NULL,
  timezone TEXT NOT NULL, matchday_weekday INTEGER NOT NULL, kickoff_time TEXT NOT NULL, matchday_end_time TEXT NOT NULL,
  max_transfers INTEGER NOT NULL, transfer_deadline_hours INTEGER NOT NULL, scoring TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(admin_id, name));
CREATE TABLE IF NOT EXISTS matchdays(id INTEGER PRIMARY KEY, league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  number INTEGER NOT NULL, matchweek_start_at TEXT NOT NULL, transfer_deadline_at TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS players(id INTEGER PRIMARY KEY, league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL, photo_url TEXT, position TEXT NOT NULL, ovr INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);

export const tx = (fn) => { db.exec('BEGIN'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } };

export function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase(), pw = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !pw || db.prepare("SELECT id FROM admins WHERE role='super_admin'").get()) return;
  db.prepare("INSERT INTO admins(email,password_hash,name,role) VALUES(?,?,?,'super_admin')")
    .run(email, bcrypt.hashSync(pw, 10), process.env.SUPER_ADMIN_NAME || 'Super Admin');
  console.log(`Seeded super admin ${email}`);
}
export default db;
