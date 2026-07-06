"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EventRow, HonoreeRole, ThemeName } from "@/lib/db/types";
import { THEMES, normalizeTheme } from "@/lib/theme";

export function EventSettings({ event }: { event: EventRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<HonoreeRole>(event.honoree_role);
  const [theme, setTheme] = useState<ThemeName>(normalizeTheme(event.theme));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          honoree_name: form.get("honoree_name"),
          party_date: form.get("party_date"),
          honoree_role: role,
          theme,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save changes.");
        return;
      }
      router.refresh();
      setOpen(false);
    } catch {
      setError("Network hiccup — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (
      !window.confirm(
        "Delete this event? Questions and any recorded videos are gone for good."
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not delete the event.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm outline-none transition focus:border-primary";

  return (
    <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-lg font-bold">Event settings</h2>
        <span className="text-soft">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Event name
              <input
                name="title"
                defaultValue={event.title}
                required
                maxLength={120}
                className={`mt-1.5 ${inputCls}`}
              />
            </label>
            <label className="block text-sm font-medium">
              Party date
              <input
                name="party_date"
                type="date"
                defaultValue={event.party_date}
                required
                className={`mt-1.5 ${inputCls}`}
              />
            </label>
            <label className="block text-sm font-medium">
              {role === "bride" ? "Groom's" : "Bride's"} first name
              <input
                name="honoree_name"
                defaultValue={event.honoree_name}
                required
                maxLength={60}
                className={`mt-1.5 ${inputCls}`}
              />
            </label>
            <div className="text-sm font-medium">
              Guest of honor
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(
                  [
                    ["bride", "Bride 👰"],
                    ["groom", "Groom 🤵"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                      role === value
                        ? "border-primary bg-accent font-semibold"
                        : "border-line bg-bg hover:border-primary/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm font-medium sm:col-span-2">
              Theme
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(Object.keys(THEMES) as ThemeName[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      theme === t
                        ? "border-primary bg-accent font-semibold"
                        : "border-line bg-bg hover:border-primary/50"
                    }`}
                  >
                    {THEMES[t].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-deep disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save settings"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="text-sm font-semibold text-soft underline-offset-2 hover:underline"
            >
              Delete event
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
