"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button, ErrorText, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const { login } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) setError(err);
    else router.replace("/peta");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-base font-black">Masuk 👋</h2>
      <ErrorText>{error}</ErrorText>
      <Field label="Email">
        <Input
          type="email"
          required
          autoComplete="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Kata Sandi">
        <Input
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Memproses…" : "Masuk"}
      </Button>
      <div className="flex items-center justify-between text-xs font-bold">
        <Link href="/lupa-password" className="text-brand hover:underline">
          Lupa kata sandi?
        </Link>
        <Link href="/daftar" className="text-brand hover:underline">
          Daftar akun baru
        </Link>
      </div>
      <p className="rounded-xl border-2 border-ink bg-sunny-soft px-3 py-2 text-[11px] font-bold">
        Akun demo: <span className="font-mono">demo@pantaukosan.id</span> /{" "}
        <span className="font-mono">demo123</span>
      </p>
    </form>
  );
}
