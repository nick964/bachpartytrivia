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

  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (
      !window.confirm(
        "Delete this event? Questions and any recorded videos are gone for good."
      )
    ) {
      return;
    }
    setBusy(true);
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (res.ok) {
        // Keep the overlay up through the redirect.
        router.push("/dashboard");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not delete the event.");
      setDeleting(false);
      setBusy(false);
    } catch {
      setError("Network hiccup — try again.");
      setDeleting(false);
      setBusy(false);
    }
  }

  const inputCls =
    "w-full border-b border-soft/50 bg-transparent px-0.5 py-2 font-serif text-base outline-none transition focus:border-b-2 focus:border-primary";

  return (
    <section className="keyline p-6 sm:p-8">
      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="double-keyline animate-pop flex flex-col items-center px-10 py-8 text-center shadow-xl">
            <span
              className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent"
              aria-hidden
            />
            <p className="mt-4 font-display text-xl italic text-primary">
              Deleting the event…
            </p>
            <p className="mt-1 text-xs text-soft">
              Removing the videos too — this can take a few seconds.
            </p>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="font-display text-2xl text-primary">Event settings</h2>
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
                    className={`border px-3 py-2.5 text-sm transition ${
                      role === value
                        ? "border-primary bg-raised font-semibold text-primary"
                        : "border-line bg-surface hover:border-primary/50"
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
                    className={`border px-3 py-2.5 text-left text-sm transition ${
                      theme === t
                        ? "border-primary bg-raised font-semibold text-primary"
                        : "border-line bg-surface hover:border-primary/50"
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
              className="label-caps bg-primary px-7 py-3 text-[11px] text-on-primary transition hover:bg-primary-deep disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save settings"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="flex items-center gap-2 text-sm font-semibold text-soft underline-offset-2 hover:underline disabled:opacity-60"
            >
              {deleting && (
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-soft border-t-transparent"
                  aria-hidden
                />
              )}
              {deleting ? "Deleting…" : "Delete event"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
