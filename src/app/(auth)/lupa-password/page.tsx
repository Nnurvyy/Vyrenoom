"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button, ErrorText, Field, Input } from "@/components/ui";

export default function LupaPasswordPage() {
  const { resetPassword } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Kata sandi baru minimal 6 karakter.");
      return;
    }
    setLoading(true);
    const err = await resetPassword(email, password);
    setLoading(false);
    if (err) setError(err);
    else {
      setError(null);
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-base font-black">Kata Sandi Diperbarui ✅</h2>
        <p className="text-sm text-ink/60">
          Kata sandi Anda berhasil diatur ulang. Silakan masuk kembali dengan
          kata sandi baru.
        </p>
        <Link href="/login">
          <Button className="w-full">Ke Halaman Masuk</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-base font-black">Atur Ulang Kata Sandi 🔑</h2>
      <p className="text-xs text-ink/60">
        Masukkan email akun Anda dan kata sandi baru. (Demo — tanpa email
        verifikasi.)
      </p>
      <ErrorText>{error}</ErrorText>
      <Field label="Email">
        <Input
          type="email"
          required
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Kata Sandi Baru" hint="Minimal 6 karakter">
        <Input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Menyimpan…" : "Simpan Kata Sandi Baru"}
      </Button>
      <p className="text-center text-xs font-bold">
        <Link href="/login" className="text-brand hover:underline">
          Kembali ke halaman masuk
        </Link>
      </p>
    </form>
  );
}
