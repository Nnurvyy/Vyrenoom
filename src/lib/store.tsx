"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppData, RoomStatus, Settings, Tenant, User } from "./types";

const EMPTY_DATA: AppData = {
  rooms: [],
  tenants: [],
  bills: [],
  annuals: [],
  notifications: [],
  settings: {
    kos_name: "",
    address: "",
    electricity_rate: 100000,
    annual_rent_rate: 12000000,
  },
};

async function api(
  path: string,
  method: string = "GET",
  body?: unknown
): Promise<{ ok: boolean; error?: string; json?: unknown }> {
  try {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok)
      return {
        ok: false,
        error:
          (json as { error?: string }).error ?? "Terjadi kesalahan server.",
      };
    return { ok: true, json };
  } catch {
    return { ok: false, error: "Tidak dapat terhubung ke server." };
  }
}

interface StoreValue {
  ready: boolean;
  data: AppData;
  session: string | null; // email admin yang login
  account: User | null;
  refresh: () => Promise<void>;
  // auth
  login: (email: string, password: string) => Promise<string | null>;
  register: (acc: {
    name: string;
    email: string;
    password: string;
  }) => Promise<string | null>;
  resetPassword: (email: string, newPassword: string) => Promise<string | null>;
  logout: () => Promise<void>;
  // settings
  updateSettings: (s: Settings) => Promise<string | null>;
  // rooms
  addRoom: (
    room_number: string,
    floor: string,
    annual_rate: number
  ) => Promise<string | null>;
  updateRoomStatus: (roomId: number, status: RoomStatus) => Promise<void>;
  updateRoomRate: (roomId: number, annual_rate: number) => Promise<void>;
  // tenants
  addTenant: (t: Omit<Tenant, "id" | "status">) => Promise<string | null>;
  updateTenant: (t: Tenant) => Promise<string | null>;
  deactivateTenant: (tenantId: number) => Promise<void>;
  deleteTenant: (tenantId: number) => Promise<void>;
  // electricity bills (tarif tetap per bulan)
  addBill: (input: {
    room_id: number;
    period: string; // yyyy-mm
    amount: number;
    due_date: string;
    paid: boolean;
  }) => Promise<string | null>;
  payBill: (billId: number) => Promise<void>;
  // annual payments
  addAnnual: (input: {
    room_id: number;
    period: string; // "2025-2026"
    amount: number;
    due_date: string;
    paid: boolean;
  }) => Promise<string | null>;
  payAnnual: (id: number) => Promise<void>;
  // notifications
  markNotifRead: (id: number) => Promise<void>;
  markAllNotifsRead: () => Promise<void>;
  unreadCount: number;
  // util
  resetDemoData: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [account, setAccount] = useState<User | null>(null);

  const refresh = useCallback(async () => {
    const res = await api("/api/bootstrap");
    if (res.ok) {
      const payload = res.json as { user: User; data: AppData };
      setAccount(payload.user);
      setData(payload.data);
    } else {
      setAccount(null);
      setData(EMPTY_DATA);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, [refresh]);

  /** Jalankan aksi tulis lalu muat ulang data dari server. */
  const act = useCallback(
    async (path: string, method: string, body?: unknown) => {
      const res = await api(path, method, body);
      if (res.ok) await refresh();
      return res.error ?? null;
    },
    [refresh]
  );

  // ---------- Auth ----------
  const login = useCallback(
    async (email: string, password: string) =>
      act("/api/auth/login", "POST", { email, password }),
    [act]
  );

  const register = useCallback(
    async (acc: { name: string; email: string; password: string }) =>
      act("/api/auth/register", "POST", acc),
    [act]
  );

  const resetPassword = useCallback(
    async (email: string, newPassword: string) => {
      const res = await api("/api/auth/reset-password", "POST", {
        email,
        newPassword,
      });
      return res.error ?? null;
    },
    []
  );

  const logout = useCallback(async () => {
    await api("/api/auth/logout", "POST");
    setAccount(null);
    setData(EMPTY_DATA);
  }, []);

  // ---------- Mutasi data ----------
  const updateSettings = useCallback(
    (s: Settings) => act("/api/settings", "PUT", s),
    [act]
  );

  const addRoom = useCallback(
    (room_number: string, floor: string, annual_rate: number) =>
      act("/api/rooms", "POST", { room_number, floor, annual_rate }),
    [act]
  );

  const updateRoomStatus = useCallback(
    async (roomId: number, status: RoomStatus) => {
      await act(`/api/rooms/${roomId}`, "PATCH", { status });
    },
    [act]
  );

  const updateRoomRate = useCallback(
    async (roomId: number, annual_rate: number) => {
      await act(`/api/rooms/${roomId}`, "PATCH", { annual_rate });
    },
    [act]
  );

  const addTenant = useCallback(
    (t: Omit<Tenant, "id" | "status">) => act("/api/tenants", "POST", t),
    [act]
  );

  const updateTenant = useCallback(
    (t: Tenant) => act(`/api/tenants/${t.id}`, "PUT", t),
    [act]
  );

  const deactivateTenant = useCallback(
    async (tenantId: number) => {
      await act(`/api/tenants/${tenantId}`, "PATCH");
    },
    [act]
  );

  const deleteTenant = useCallback(
    async (tenantId: number) => {
      await act(`/api/tenants/${tenantId}`, "DELETE");
    },
    [act]
  );

  const addBill = useCallback(
    (input: {
      room_id: number;
      period: string;
      amount: number;
      due_date: string;
      paid: boolean;
    }) => act("/api/bills", "POST", input),
    [act]
  );

  const payBill = useCallback(
    async (billId: number) => {
      await act(`/api/bills/${billId}`, "PATCH");
    },
    [act]
  );

  const addAnnual = useCallback(
    (input: {
      room_id: number;
      period: string;
      amount: number;
      due_date: string;
      paid: boolean;
    }) => act("/api/annuals", "POST", input),
    [act]
  );

  const payAnnual = useCallback(
    async (id: number) => {
      await act(`/api/annuals/${id}`, "PATCH");
    },
    [act]
  );

  const markNotifRead = useCallback(
    async (id: number) => {
      await act("/api/notifications", "PATCH", { id });
    },
    [act]
  );

  const markAllNotifsRead = useCallback(async () => {
    await act("/api/notifications", "PATCH", { all: true });
  }, [act]);

  const resetDemoData = useCallback(async () => {
    await act("/api/reset-demo", "POST");
  }, [act]);

  const unreadCount = useMemo(
    () => data.notifications.filter((n) => n.status === "unread").length,
    [data.notifications]
  );

  const value: StoreValue = {
    ready,
    data,
    session: account?.email ?? null,
    account,
    refresh,
    login,
    register,
    resetPassword,
    logout,
    updateSettings,
    addRoom,
    updateRoomStatus,
    updateRoomRate,
    addTenant,
    updateTenant,
    deactivateTenant,
    deleteTenant,
    addBill,
    payBill,
    addAnnual,
    payAnnual,
    markNotifRead,
    markAllNotifsRead,
    unreadCount,
    resetDemoData,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore harus dipakai di dalam StoreProvider");
  return ctx;
}
