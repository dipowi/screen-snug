import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import OliReminder from "@/components/OliReminder.jsx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oli Reminder — Pengingat Ganti Oli Motor" },
      {
        name: "description",
        content:
          "Aplikasi pengingat ganti oli motor berbasis riset tribologi. Pantau jadwal, KM, dan riwayat servis motor matic, bebek, dan sport.",
      },
      { property: "og:title", content: "Oli Reminder — Pengingat Ganti Oli Motor" },
      {
        property: "og:description",
        content:
          "Pantau jadwal ganti oli motormu. Data tersimpan lokal di browser, tanpa akun.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  // OliReminder uses IndexedDB & Notification API — render only on client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <OliReminder />;
}
