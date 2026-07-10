"use client";

import { useEffect, useState } from "react";
import { LogOut, RotateCcw, Save } from "lucide-react";
import { useStore } from "@/lib/store";
import { rupiah } from "@/lib/format";
import {
  Button,
  Card,
  ErrorText,
  Field,
  Input,
  Modal,
  PageHeader,
} from "@/components/ui";

export default function PengaturanPage() {
  const { data, ready, account, updateSettings, logout, resetDemoData } =
    useStore();
  const [kosName, setKosName] = useState(data.settings.kos_name);
  const [address, setAddress] = useState(data.settings.address);
  const [elecRate, setElecRate] = useState(
    String(data.settings.electricity_rate)
  );
  const [rentRate, setRentRate] = useState(
    String(data.settings.annual_rent_rate)
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Isi ulang form saat data dari server tiba
  useEffect(() => {
    if (!ready) return;
    setKosName(data.settings.kos_name);
    setAddress(data.settings.address);
    setElecRate(String(data.settings.electricity_rate));
    setRentRate(String(data.settings.annual_rent_rate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = await updateSettings({
      kos_name: kosName.trim(),
      address: address.trim(),
      electricity_rate: Number(elecRate) || 0,
      annual_rent_rate: Number(rentRate) || 0,
    });
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <PageHeader
        emoji="⚙️"
        title="Pengaturan"
        subtitle="Profil kos & konfigurasi tarif"
      />

      <div className="grid max-w-3xl gap-4 lg:grid-cols-2">
        <form onSubmit={submit} className="contents">
          <Card className="bg-sky-soft p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-black">🏠 Profil Kos</h2>
            <div className="space-y-3">
              <Field label="Nama Kos">
                <Input
                  required
                  value={kosName}
                  onChange={(e) => setKosName(e.target.value)}
                />
              </Field>
              <Field label="Alamat">
                <Input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Field>
            </div>
          </Card>

          <Card className="bg-sunny-soft p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-black">💸 Tarif</h2>
            <div className="space-y-3">
              <Field
                label="Tarif Listrik Tetap (Rp / bulan)"
                hint={`Saat ini: ${rupiah(data.settings.electricity_rate)}/bulan — dipakai sebagai nominal default saat catat tagihan`}
              >
                <Input
                  type="number"
                  required
                  min={0}
                  inputMode="numeric"
                  value={elecRate}
                  onChange={(e) => setElecRate(e.target.value)}
                />
              </Field>
              <Field
                label="Default Harga Sewa Tahunan (Rp / kamar / tahun)"
                hint={`Saat ini: ${rupiah(data.settings.annual_rent_rate)} — harga tiap kamar bisa diubah sendiri di Peta Kamar`}
              >
                <Input
                  type="number"
                  required
                  min={0}
                  inputMode="numeric"
                  value={rentRate}
                  onChange={(e) => setRentRate(e.target.value)}
                />
              </Field>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
            <Button type="submit" variant="mint">
              <Save size={16} /> Simpan Pengaturan
            </Button>
            {saved && (
              <span className="rounded-full border-2 border-ink bg-mint px-3 py-1 text-xs font-black">
                ✓ Tersimpan
              </span>
            )}
            <ErrorText>{error}</ErrorText>
          </div>
        </form>

        <Card className="p-4 sm:p-5 lg:col-span-2">
          <h2 className="mb-1 text-sm font-black">👤 Akun</h2>
          <p className="text-xs text-ink/60">
            Masuk sebagai <b>{account?.name}</b> ({account?.email})
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => logout()}>
              <LogOut size={15} /> Keluar
            </Button>
            <Button variant="outline" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={15} /> Reset Data Demo
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="🔄 Reset Data Demo"
      >
        <p className="text-sm">
          Semua data akun ini (kamar, penghuni, tagihan, notifikasi) akan
          dikembalikan ke data contoh awal. Lanjutkan?
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setConfirmReset(false)}
          >
            Batal
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={async () => {
              await resetDemoData();
              setConfirmReset(false);
            }}
          >
            Ya, Reset
          </Button>
        </div>
      </Modal>
    </>
  );
}
