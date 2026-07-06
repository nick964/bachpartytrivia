"use client";

import { useState } from "react";

interface DownloadItem {
  question: string;
  status: "ready" | "preparing" | "missing" | "error";
  url?: string;
  percent?: number;
}

/**
 * Bad-wifi fallback: prepares MP4 renditions on Stream and hands out
 * signed download links so the party can run off local files.
 */
export function DownloadVideos({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<DownloadItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function prepare() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stream/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not prepare downloads.");
        return;
      }
      setItems(data.items);
    } catch {
      setError("Network hiccup — try again.");
    } finally {
      setBusy(false);
    }
  }

  const anyPreparing = items?.some((i) => i.status === "preparing");

  return (
    <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
      <h2 className="text-lg font-bold">Download all videos</h2>
      <p className="mt-1 text-sm text-soft">
        Venue wifi can't be trusted. Download the MP4s beforehand and play
        them from your laptop if the stream stutters.
      </p>

      <button
        onClick={() => void prepare()}
        disabled={busy}
        className="mt-4 rounded-full border border-line bg-bg px-5 py-2.5 text-sm font-bold transition hover:border-primary disabled:opacity-50"
      >
        {busy
          ? "Preparing…"
          : items
            ? anyPreparing
              ? "Check again"
              : "Refresh links"
            : "Prepare downloads"}
      </button>

      {error && (
        <p className="mt-3 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium">
          {error}
        </p>
      )}

      {items && (
        <ul className="mt-4 space-y-2">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-2.5 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">{item.question}</span>
              {item.status === "ready" && item.url ? (
                <a
                  href={item.url}
                  download
                  className="shrink-0 font-bold text-primary hover:text-primary-deep"
                >
                  Download ↓
                </a>
              ) : item.status === "preparing" ? (
                <span className="shrink-0 text-xs text-soft">
                  Preparing {item.percent ?? 0}% — check again shortly
                </span>
              ) : item.status === "missing" ? (
                <span className="shrink-0 text-xs text-soft">No video</span>
              ) : (
                <span className="shrink-0 text-xs text-soft">Failed</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
