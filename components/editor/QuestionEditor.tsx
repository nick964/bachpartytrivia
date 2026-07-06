"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  EventRow,
  QuestionWithResponse,
  SampleQuestionRow,
} from "@/lib/db/types";
import { UpgradeCard } from "@/components/editor/UpgradeCard";
import { ResponseReview } from "@/components/editor/ResponseReview";

const FREE_LIMIT = 3;

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.error ?? "Something went wrong."), {
      code: data.code,
    });
  }
  return data;
}

export function QuestionEditor({
  event,
  questions,
  samples,
}: {
  event: EventRow;
  questions: QuestionWithResponse[];
  samples: SampleQuestionRow[];
}) {
  const router = useRouter();
  const [order, setOrder] = useState(() => questions.map((q) => q.id));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hitWall, setHitWall] = useState(false);
  const [newText, setNewText] = useState("");
  const [showSamples, setShowSamples] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const serverIds = questions.map((q) => q.id).join(",");
  useEffect(() => {
    setOrder(questions.map((q) => q.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverIds]);

  const byId = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions]
  );
  const ordered = order
    .map((id) => byId.get(id))
    .filter((q): q is QuestionWithResponse => !!q);

  const atFreeLimit = !event.is_premium && questions.length >= FREE_LIMIT;
  const existingTexts = useMemo(
    () => new Set(questions.map((q) => q.text.trim().toLowerCase())),
    [questions]
  );

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === "upgrade_required") setHitWall(true);
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function addQuestion(text: string, source: "sample" | "custom") {
    if (!text.trim()) return;
    if (atFreeLimit) {
      setHitWall(true);
      return;
    }
    void run(async () => {
      await api("/api/questions", "POST", {
        event_id: event.id,
        text: text.trim(),
        source,
      });
      if (source === "custom") setNewText("");
    });
  }

  function saveEdit(id: string) {
    const text = editText.trim();
    if (!text) return;
    void run(async () => {
      await api(`/api/questions/${id}`, "PATCH", { text });
      setEditingId(null);
    });
  }

  function remove(id: string) {
    const q = byId.get(id);
    const hasVideo = q?.responses.some((r) => r.stream_video_uid);
    if (
      hasVideo &&
      !window.confirm(
        "This question already has a recorded answer — deleting it deletes the video too. Delete anyway?"
      )
    ) {
      return;
    }
    void run(async () => {
      await api(`/api/questions/${id}`, "DELETE");
    });
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || from === to) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
    void run(async () => {
      await api("/api/questions/reorder", "POST", {
        event_id: event.id,
        ordered_ids: next,
      });
    });
  }

  const inputCls =
    "w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm outline-none transition focus:border-primary";

  return (
    <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">Questions</h2>
        <span className="text-xs font-medium text-soft">
          {questions.length}
          {event.is_premium ? "" : ` of ${FREE_LIMIT} free`} ·{" "}
          {event.honoree_name} answers each on video (60s max)
        </span>
      </div>

      {ordered.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-line bg-bg px-4 py-6 text-center text-sm text-soft">
          No questions yet — write one below or grab a few from the library.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {ordered.map((q, i) => (
            <li
              key={q.id}
              draggable={editingId !== q.id}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
              className={`rounded-2xl border border-line bg-bg p-4 ${
                dragIndex === i ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 cursor-grab select-none text-soft"
                  title="Drag to reorder"
                >
                  ⠿
                </span>
                <div className="min-w-0 flex-1">
                  {editingId === q.id ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        maxLength={300}
                        autoFocus
                        className={inputCls}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(q.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(q.id)}
                          disabled={busy}
                          className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-full px-3 py-2 text-xs font-medium text-soft"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium leading-snug">
                        <span className="mr-1.5 text-soft">{i + 1}.</span>
                        {q.text}
                      </p>
                      <ResponseReview event={event} question={q} />
                    </>
                  )}
                </div>
                {editingId !== q.id && (
                  <div className="flex shrink-0 items-center gap-1 text-soft">
                    <button
                      onClick={() => move(i, i - 1)}
                      disabled={i === 0 || busy}
                      className="rounded p-1 hover:text-ink disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(i, i + 1)}
                      disabled={i === ordered.length - 1 || busy}
                      className="rounded p-1 hover:text-ink disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(q.id);
                        setEditText(q.text);
                      }}
                      className="rounded p-1 text-xs hover:text-ink"
                      aria-label="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => remove(q.id)}
                      disabled={busy}
                      className="rounded p-1 text-xs hover:text-ink"
                      aria-label="Delete"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium">
          {error}
        </p>
      )}

      {(hitWall || atFreeLimit) && !event.is_premium ? (
        <UpgradeCard eventId={event.id} />
      ) : (
        <div className="mt-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addQuestion(newText, "custom");
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              maxLength={300}
              placeholder={`e.g. What's ${event.honoree_name}'s most useless talent?`}
              className={inputCls}
            />
            <button
              type="submit"
              disabled={busy || !newText.trim()}
              className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-deep disabled:opacity-50"
            >
              Add question
            </button>
          </form>

          <div>
            <button
              onClick={() => setShowSamples((s) => !s)}
              className="text-sm font-semibold text-primary hover:text-primary-deep"
            >
              {showSamples ? "Hide" : "Browse"} the question library{" "}
              {showSamples ? "▴" : "▾"}
            </button>
            {showSamples && (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {samples
                  .filter(
                    (s) => !existingTexts.has(s.text.trim().toLowerCase())
                  )
                  .map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => addQuestion(s.text, "sample")}
                        disabled={busy}
                        className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-left text-sm transition hover:border-primary/50"
                      >
                        <span className="mr-1 text-primary">+</span> {s.text}
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
