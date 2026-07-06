"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { HonoreeRole, ThemeName } from "@/lib/db/types";
import { THEMES, defaultThemeForRole } from "@/lib/theme";

export function CreateEventForm() {
  const router = useRouter();
  const [role, setRole] = useState<HonoreeRole>("bride");
  const [theme, setTheme] = useState<ThemeName>("blush");
  const [themeTouched, setThemeTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickRole(next: HonoreeRole) {
    setRole(next);
    if (!themeTouched) setTheme(defaultThemeForRole(next));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          honoree_name: form.get("honoree_name"),
          honoree_role: role,
          party_date: form.get("party_date"),
          theme,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again?");
        return;
      }
      router.push(`/dashboard/events/${data.event.id}`);
      router.refresh();
    } catch {
      setError("Network hiccup — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm outline-none transition focus:border-primary";

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-line bg-surface p-6 sm:p-8"
    >
      <h2 className="text-lg font-bold">Create an event</h2>
      <p className="mt-1 text-sm text-soft">
        One event per party. You can change everything later.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Event name
          <input
            name="title"
            required
            maxLength={120}
            placeholder="Sarah's Bachelorette"
            className={`mt-1.5 ${inputCls}`}
          />
        </label>
        <label className="block text-sm font-medium">
          Party date
          <input
            name="party_date"
            type="date"
            required
            className={`mt-1.5 ${inputCls}`}
          />
        </label>
        <div className="text-sm font-medium">
          Who&apos;s the guest of honor?
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(
              [
                ["bride", "Bride 👰 (groom records)"],
                ["groom", "Groom 🤵 (bride records)"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => pickRole(value)}
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
        <label className="block text-sm font-medium">
          {role === "bride" ? "Groom's" : "Bride's"} first name
          <input
            name="honoree_name"
            required
            maxLength={60}
            placeholder={role === "bride" ? "Mike" : "Sarah"}
            className={`mt-1.5 ${inputCls}`}
          />
        </label>
        <div className="text-sm font-medium sm:col-span-2">
          Theme
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(Object.keys(THEMES) as ThemeName[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTheme(t);
                  setThemeTouched(true);
                }}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  theme === t
                    ? "border-primary bg-accent font-semibold"
                    : "border-line bg-bg hover:border-primary/50"
                }`}
              >
                <span className="block">{THEMES[t].label}</span>
                <span className="block text-xs font-normal text-soft">
                  {THEMES[t].description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-deep disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Creating…" : "Create event"}
      </button>
    </form>
  );
}
