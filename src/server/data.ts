import type Database from "better-sqlite3";
import { getDb } from "./db";
import {
  AnnualPayment,
  AppData,
  AppNotification,
  ElectricityBill,
  Room,
  Settings,
  Tenant,
} from "@/lib/types";

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return period;
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function fmtDate(d: string): string {
  const date = new Date(d + "T00:00:00");
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

/**
 * Buat pengingat otomatis (listrik jatuh tempo & sewa akan berakhir)
 * lalu simpan ke tabel notifications bila belum ada (dedup per pesan).
 */
export function syncNotifications(userId: number) {
  const db = getDb();
  const rooms = db
    .prepare("SELECT id, room_number FROM rooms WHERE user_id = ?")
    .all(userId) as { id: number; room_number: string }[];
  const roomNo = (id: number) =>
    rooms.find((r) => r.id === id)?.room_number ?? "?";

  const fresh: { room_id: number; type: string; message: string }[] = [];

  const bills = db
    .prepare(
      "SELECT * FROM electricity_bills WHERE user_id = ? AND status = 'belum_bayar'"
    )
    .all(userId) as ElectricityBill[];
  for (const b of bills) {
    const d = daysUntil(b.due_date);
    if (d < 0) {
      fresh.push({
        room_id: b.room_id,
        type: "listrik",
        message: `Tagihan listrik kamar ${roomNo(b.room_id)} periode ${fmtPeriod(b.period)} (${rupiah(b.amount)}) TERLAMBAT ${Math.abs(d)} hari dari jatuh tempo.`,
      });
    } else if (d <= 5) {
      fresh.push({
        room_id: b.room_id,
        type: "listrik",
        message: `Tagihan listrik kamar ${roomNo(b.room_id)} periode ${fmtPeriod(b.period)} (${rupiah(b.amount)}) jatuh tempo ${d === 0 ? "hari ini" : `dalam ${d} hari`}.`,
      });
    }
  }

  const annuals = db
    .prepare(
      "SELECT * FROM annual_payments WHERE user_id = ? AND status = 'belum_bayar'"
    )
    .all(userId) as AnnualPayment[];
  for (const a of annuals) {
    const d = daysUntil(a.due_date);
    if (d < 0) {
      fresh.push({
        room_id: a.room_id,
        type: "sewa",
        message: `Sewa tahunan kamar ${roomNo(a.room_id)} periode ${a.period} (${rupiah(a.amount)}) TERLAMBAT ${Math.abs(d)} hari.`,
      });
    } else if (d <= 30) {
      fresh.push({
        room_id: a.room_id,
        type: "sewa",
        message: `Sewa tahunan kamar ${roomNo(a.room_id)} periode ${a.period} jatuh tempo dalam ${d} hari.`,
      });
    }
  }

  const tenants = db
    .prepare(
      "SELECT * FROM tenants WHERE user_id = ? AND status = 'aktif' AND room_id IS NOT NULL"
    )
    .all(userId) as Tenant[];
  for (const t of tenants) {
    const d = daysUntil(t.end_date);
    const hasPending = annuals.some((a) => a.tenant_id === t.id);
    if (d >= 0 && d <= 30 && !hasPending) {
      fresh.push({
        room_id: t.room_id!,
        type: "sewa",
        message: `Masa sewa ${t.name} (kamar ${roomNo(t.room_id!)}) berakhir ${fmtDate(t.end_date)} — ${d === 0 ? "hari ini" : `${d} hari lagi`}.`,
      });
    }
  }

  const insert = db.prepare(
    `INSERT INTO notifications (user_id, room_id, type, message)
     SELECT ?, ?, ?, ?
     WHERE NOT EXISTS (
       SELECT 1 FROM notifications
       WHERE user_id = ? AND room_id = ? AND type = ? AND message = ?
     )`
  );
  const tx = (db as Database.Database).transaction(() => {
    for (const f of fresh) {
      insert.run(
        userId, f.room_id, f.type, f.message,
        userId, f.room_id, f.type, f.message
      );
    }
  });
  tx();
}

/** Seluruh data milik user untuk dikirim ke frontend. */
export function loadAppData(userId: number): AppData {
  const db = getDb();
  syncNotifications(userId);

  const settings = db
    .prepare(
      "SELECT kos_name, address, electricity_rate, annual_rent_rate FROM settings WHERE user_id = ?"
    )
    .get(userId) as Settings | undefined;

  const rooms = db
    .prepare(
      "SELECT id, room_number, floor, status, annual_rate FROM rooms WHERE user_id = ? ORDER BY floor, room_number"
    )
    .all(userId) as Room[];

  const tenants = db
    .prepare(
      "SELECT id, room_id, name, phone, id_card_number, start_date, end_date, status FROM tenants WHERE user_id = ?"
    )
    .all(userId) as Tenant[];

  const bills = db
    .prepare(
      "SELECT id, room_id, tenant_id, period, amount, status, due_date, paid_date FROM electricity_bills WHERE user_id = ?"
    )
    .all(userId) as ElectricityBill[];

  const annuals = db
    .prepare(
      "SELECT id, room_id, tenant_id, period, amount, status, due_date, paid_date FROM annual_payments WHERE user_id = ?"
    )
    .all(userId) as AnnualPayment[];

  const notifications = db
    .prepare(
      "SELECT id, room_id, type, message, status, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC"
    )
    .all(userId) as AppNotification[];

  return {
    settings: settings ?? {
      kos_name: "Kos Saya",
      address: "",
      electricity_rate: 100000,
      annual_rent_rate: 12000000,
    },
    rooms,
    tenants,
    bills,
    annuals,
    notifications,
  };
}
