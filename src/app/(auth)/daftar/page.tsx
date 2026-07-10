"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button, ErrorText, Field, Input } from "@/components/ui";

export default function DaftarPage() {
  const { register } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setLoading(true);
    const err = await register({ name, email, password });
    setLoading(false);
    if (err) setError(err);
    else router.replace("/peta");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-base font-black">Daftar Akun Pemilik Kos ✨</h2>
      <ErrorText>{error}</ErrorText>
      <Field label="Nama Lengkap">
        <Input
          required
          placeholder="Nama Anda"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
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
      <Field label="Kata Sandi" hint="Minimal 6 karakter">
        <Input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Field label="Ulangi Kata Sandi">
        <Input
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Memproses…" : "Daftar"}
      </Button>
      <p className="text-center text-xs font-bold text-ink/60">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Masuk di sini
        </Link>
      </p>
    </form>
  );
}
