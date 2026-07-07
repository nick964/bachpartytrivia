"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { HonoreeRole, ThemeName } from "@/lib/db/types";
import { THEMES, defaultThemeForRole } from "@/lib/theme";

export function CreateEventForm() {
  const router = useRouter();
  const [role, setRole] = useState<HonoreeRole>("bride");
  const [responder, setResponder] = useState<HonoreeRole>("groom");
  const [responderTouched, setResponderTouched] = useState(false);
  const [theme, setTheme] = useState<ThemeName>("blush");
  const [themeTouched, setThemeTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickRole(next: HonoreeRole) {
    setRole(next);
    if (!themeTouched) setTheme(defaultThemeForRole(next));
    // Assume the classic pairing until the host says otherwise.
    if (!responderTouched) setResponder(next === "bride" ? "groom" : "bride");
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
          responder_role: responder,
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
    "w-full border-b border-soft/50 bg-transparent px-0.5 py-2 font-serif text-base outline-none transition focus:border-b-2 focus:border-primary";
  const labelCls = "label-caps block text-[10px] text-soft";

  return (
    <form
      id="create"
      onSubmit={onSubmit}
      className="double-keyline scroll-mt-8 p-6 sm:p-10"
    >
      <h2 className="font-display text-3xl text-primary">Create an event</h2>
      <p className="mt-2 text-sm italic text-soft">
        One event per party. You can change everything later.
      </p>

      <div className="mt-8 grid gap-7 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>Event name</span>
          <input
            name="title"
            required
            maxLength={120}
            placeholder="Sarah's Bachelorette"
            className={`mt-2 ${inputCls}`}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Party date</span>
          <input
            name="party_date"
            type="date"
            required
            className={`mt-2 ${inputCls}`}
          />
        </label>
        <div>
          <span className={labelCls}>
            Who&apos;s the guest of honor? (guesses at the party)
          </span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["bride", "Bride 👰"],
                ["groom", "Groom 🤵"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => pickRole(value)}
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
        <div>
          <span className={labelCls}>
            Who is being interviewed? (records the answers)
          </span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["bride", "Bride 👰"],
                ["groom", "Groom 🤵"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setResponder(value);
                  setResponderTouched(true);
                }}
                className={`border px-3 py-2.5 text-sm transition ${
                  responder === value
                    ? "border-primary bg-raised font-semibold text-primary"
                    : "border-line bg-surface hover:border-primary/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className={labelCls}>
            {responder === "groom" ? "Groom's" : "Bride's"} first name
          </span>
          <input
            name="honoree_name"
            required
            maxLength={60}
            placeholder={responder === "groom" ? "Mike" : "Sarah"}
            className={`mt-2 ${inputCls}`}
          />
        </label>
        <div className="sm:col-span-2">
          <span className={labelCls}>Theme</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Object.keys(THEMES) as ThemeName[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTheme(t);
                  setThemeTouched(true);
                }}
                className={`border px-3 py-2.5 text-left text-sm transition ${
                  theme === t
                    ? "border-primary bg-raised font-semibold text-primary"
                    : "border-line bg-surface hover:border-primary/50"
                }`}
              >
                <span className="block font-display text-base">
                  {THEMES[t].label}
                </span>
                <span className="block text-xs font-normal italic text-soft">
                  {THEMES[t].description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-5 border border-line bg-raised px-4 py-2.5 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="label-caps mt-8 w-full bg-primary px-8 py-3.5 text-[11px] text-on-primary transition hover:bg-primary-deep disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Creating…" : "Create event"}
      </button>
    </form>
  );
}
