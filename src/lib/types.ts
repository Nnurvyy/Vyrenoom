export type RoomStatus = "kosong" | "terisi" | "perbaikan";
export type PayStatus = "belum_bayar" | "lunas";
export type TenantStatus = "aktif" | "nonaktif";
export type NotifType = "listrik" | "sewa";
export type NotifStatus = "unread" | "read";

export interface Room {
  id: number;
  room_number: string;
  floor: string;
  status: RoomStatus;
  annual_rate: number; // harga sewa tahunan kamar ini (default 12 jt)
}

export interface Tenant {
  id: number;
  room_id: number | null;
  name: string;
  phone: string;
  id_card_number: string;
  start_date: string; // yyyy-mm-dd
  end_date: string; // yyyy-mm-dd (akhir masa sewa berjalan)
  status: TenantStatus;
}

export interface ElectricityBill {
  id: number;
  room_id: number;
  tenant_id: number;
  period: string; // yyyy-mm (tarif tetap per bulan)
  amount: number;
  status: PayStatus;
  due_date: string; // yyyy-mm-dd
  paid_date: string | null;
}

export interface AnnualPayment {
  id: number;
  room_id: number;
  tenant_id: number;
  period: string; // ex: "2025-2026"
  amount: number;
  status: PayStatus;
  due_date: string;
  paid_date: string | null;
}

export interface AppNotification {
  id: number;
  room_id: number;
  type: NotifType;
  message: string;
  status: NotifStatus;
  created_at: string; // ISO
}

export interface Settings {
  kos_name: string;
  address: string;
  electricity_rate: number; // tarif listrik tetap per bulan
  annual_rent_rate: number; // default harga sewa tahunan utk kamar baru
}

export interface User {
  name: string;
  email: string;
}

export interface AppData {
  rooms: Room[];
  tenants: Tenant[];
  bills: ElectricityBill[];
  annuals: AnnualPayment[];
  notifications: AppNotification[];
  settings: Settings;
}
