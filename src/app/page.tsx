"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Home() {
  const { ready, session } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(session ? "/peta" : "/login");
  }, [ready, session, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center text-sm text-ink/50">
      Memuat…
    </div>
  );
}
