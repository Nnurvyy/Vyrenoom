"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, session } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (ready && session) router.replace("/peta");
  }, [ready, session, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black">🏠 Pantau Kosan</h1>
        <p className="mt-1 text-xs font-bold text-ink/60">
          Kelola kamar, penghuni, dan tagihan kos dalam satu tempat
        </p>
      </div>
      <div className="w-full max-w-sm rounded-3xl border-2 border-ink bg-card p-5 shadow-[6px_6px_0_0_var(--color-ink)] sm:p-6">
        {children}
      </div>
    </div>
  );
}
