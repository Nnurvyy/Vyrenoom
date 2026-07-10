import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { hashPassword } from "./auth-crypto";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "pantau-kosan.db");

declare global {
  // Cache koneksi antar hot-reload di dev
  var __pkDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (global.__pkDb) return global.__pkDb;
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  seedDemo(db);
  global.__pkDb = db;
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      kos_name TEXT NOT NULL DEFAULT 'Kos Saya',
      address TEXT NOT NULL DEFAULT '',
      electricity_rate REAL NOT NULL DEFAULT 100000,
      annual_rent_rate REAL NOT NULL DEFAULT 12000000,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      room_number TEXT NOT NULL,
      floor TEXT NOT NULL DEFAULT '1',
      status TEXT NOT NULL DEFAULT 'kosong',
      annual_rate REAL NOT NULL DEFAULT 12000000,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      id_card_number TEXT NOT NULL DEFAULT '',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'aktif',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS electricity_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      period TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'belum_bayar',
      due_date TEXT NOT NULL,
      paid_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS annual_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      period TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'belum_bayar',
      due_date TEXT NOT NULL,
      paid_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unread',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_rooms_user ON rooms(user_id);
    CREATE INDEX IF NOT EXISTS idx_tenants_user ON tenants(user_id);
    CREATE INDEX IF NOT EXISTS idx_bills_user ON electricity_bills(user_id);
    CREATE INDEX IF NOT EXISTS idx_annuals_user ON annual_payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id);
  `);
}

export const DEMO_EMAIL = "demo@pantaukosan.id";

function seedDemo(db: Database.Database) {
  const exists = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(DEMO_EMAIL) as { id: number } | undefined;
  if (exists) return;

  const info = db
    .prepare("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)")
    .run(DEMO_EMAIL, hashPassword("demo123"), "Pemilik Kos");
  const userId = Number(info.lastInsertRowid);
  seedUserData(db, userId);
}

/** Isi data contoh untuk satu akun (dipakai saat seed demo & reset data demo). */
export function seedUserData(db: Database.Database, userId: number) {
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO settings (user_id, kos_name, address, electricity_rate, annual_rent_rate)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         kos_name=excluded.kos_name, address=excluded.address,
         electricity_rate=excluded.electricity_rate, annual_rent_rate=excluded.annual_rent_rate`
    ).run(userId, "Kos Vyrenoom", "Jl. Melati No. 12, Sleman, Yogyakarta", 100000, 12000000);

    const insRoom = db.prepare(
      "INSERT INTO rooms (user_id, room_number, floor, status, annual_rate) VALUES (?, ?, ?, ?, ?)"
    );
    const rooms: [string, string, string, number][] = [
      ["A1", "1", "terisi", 12000000],
      ["A2", "1", "terisi", 12000000],
      ["A3", "1", "kosong", 11000000],
      ["A4", "1", "terisi", 12500000],
      ["A5", "1", "perbaikan", 11000000],
      ["A6", "1", "terisi", 12000000],
      ["B1", "2", "terisi", 13000000],
      ["B2", "2", "kosong", 12000000],
      ["B3", "2", "terisi", 12000000],
      ["B4", "2", "terisi", 13500000],
      ["B5", "2", "terisi", 12000000],
      ["B6", "2", "kosong", 12000000],
    ];
    const roomIds: Record<string, number> = {};
    for (const [no, fl, st, rate] of rooms) {
      const r = insRoom.run(userId, no, fl, st, rate);
      roomIds[no] = Number(r.lastInsertRowid);
    }

    const insTenant = db.prepare(
      `INSERT INTO tenants (user_id, room_id, name, phone, id_card_number, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const tenants: [string | null, string, string, string, string, string, string][] = [
      ["A1", "Budi Santoso", "081234567801", "3404012345670001", "2025-08-01", "2026-08-01", "aktif"],
      ["A2", "Siti Rahma", "081234567802", "3404012345670002", "2025-10-15", "2026-10-15", "aktif"],
      ["A4", "Andi Wijaya", "081234567803", "3404012345670003", "2026-01-10", "2027-01-10", "aktif"],
      ["A6", "Dewi Lestari", "081234567804", "3404012345670004", "2025-07-20", "2026-07-20", "aktif"],
      ["B1", "Rizky Pratama", "081234567805", "3404012345670005", "2026-03-01", "2027-03-01", "aktif"],
      ["B3", "Fitri Handayani", "081234567806", "3404012345670006", "2025-12-05", "2026-12-05", "aktif"],
      ["B4", "Agus Salim", "081234567807", "3404012345670007", "2026-02-14", "2027-02-14", "aktif"],
      ["B5", "Maya Puspita", "081234567808", "3404012345670008", "2025-09-01", "2026-09-01", "aktif"],
      [null, "Joko Susilo", "081234567809", "3404012345670009", "2024-06-01", "2025-06-01", "nonaktif"],
    ];
    const tenantIds: Record<string, number> = {};
    for (const [roomNo, name, phone, ktp, start, end, status] of tenants) {
      const r = insTenant.run(
        userId,
        roomNo ? roomIds[roomNo] : null,
        name,
        phone,
        ktp,
        start,
        end,
        status
      );
      tenantIds[name] = Number(r.lastInsertRowid);
    }

    const insBill = db.prepare(
      `INSERT INTO electricity_bills (user_id, room_id, tenant_id, period, amount, status, due_date, paid_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    // Tarif listrik tetap per bulan (Rp100.000)
    const bills: [string, string, string, number, string, string, string | null][] = [
      ["A1", "Budi Santoso", "2026-06", 100000, "lunas", "2026-06-10", "2026-06-08"],
      ["A2", "Siti Rahma", "2026-06", 100000, "lunas", "2026-06-10", "2026-06-09"],
      ["A4", "Andi Wijaya", "2026-06", 100000, "lunas", "2026-06-10", "2026-06-11"],
      ["A6", "Dewi Lestari", "2026-06", 100000, "belum_bayar", "2026-06-10", null],
      ["B1", "Rizky Pratama", "2026-06", 100000, "lunas", "2026-06-10", "2026-06-07"],
      ["B3", "Fitri Handayani", "2026-06", 100000, "lunas", "2026-06-10", "2026-06-10"],
      ["B4", "Agus Salim", "2026-06", 100000, "lunas", "2026-06-10", "2026-06-09"],
      ["B5", "Maya Puspita", "2026-06", 100000, "lunas", "2026-06-10", "2026-06-12"],
      ["A1", "Budi Santoso", "2026-07", 100000, "lunas", "2026-07-10", "2026-07-06"],
      ["A2", "Siti Rahma", "2026-07", 100000, "belum_bayar", "2026-07-10", null],
      ["A4", "Andi Wijaya", "2026-07", 100000, "belum_bayar", "2026-07-10", null],
      ["B1", "Rizky Pratama", "2026-07", 100000, "lunas", "2026-07-10", "2026-07-05"],
      ["B3", "Fitri Handayani", "2026-07", 100000, "belum_bayar", "2026-07-15", null],
    ];
    for (const [roomNo, tenant, period, amount, status, due, paid] of bills) {
      insBill.run(userId, roomIds[roomNo], tenantIds[tenant], period, amount, status, due, paid);
    }

    const insAnnual = db.prepare(
      `INSERT INTO annual_payments (user_id, room_id, tenant_id, period, amount, status, due_date, paid_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const annuals: [string, string, string, number, string, string, string | null][] = [
      ["A1", "Budi Santoso", "2025-2026", 12000000, "lunas", "2025-08-01", "2025-08-01"],
      ["A2", "Siti Rahma", "2025-2026", 12000000, "lunas", "2025-10-15", "2025-10-14"],
      ["A4", "Andi Wijaya", "2026-2027", 12500000, "lunas", "2026-01-10", "2026-01-09"],
      ["A6", "Dewi Lestari", "2025-2026", 12000000, "lunas", "2025-07-20", "2025-07-19"],
      ["A6", "Dewi Lestari", "2026-2027", 12000000, "belum_bayar", "2026-07-20", null],
      ["B1", "Rizky Pratama", "2026-2027", 13000000, "lunas", "2026-03-01", "2026-03-01"],
      ["B3", "Fitri Handayani", "2025-2026", 12000000, "lunas", "2025-12-05", "2025-12-05"],
      ["B4", "Agus Salim", "2026-2027", 13500000, "lunas", "2026-02-14", "2026-02-13"],
      ["B5", "Maya Puspita", "2025-2026", 12000000, "lunas", "2025-09-01", "2025-09-02"],
    ];
    for (const [roomNo, tenant, period, amount, status, due, paid] of annuals) {
      insAnnual.run(userId, roomIds[roomNo], tenantIds[tenant], period, amount, status, due, paid);
    }
  });
  tx();
}

/** Hapus seluruh data (kecuali akun) milik satu user, lalu isi ulang data contoh. */
export function resetUserData(db: Database.Database, userId: number) {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM notifications WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM electricity_bills WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM annual_payments WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM tenants WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM rooms WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM settings WHERE user_id = ?").run(userId);
  });
  tx();
  seedUserData(db, userId);
}
