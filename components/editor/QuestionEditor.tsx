"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  EventRow,
  QuestionWithResponse,
  SampleQuestionRow,
} from "@/lib/db/types";
import { UpgradeCard } from "@/components/editor/UpgradeCard";
import { ResponseReview } from "@/components/editor/ResponseReview";
import { FREE_QUESTION_LIMIT as FREE_LIMIT } from "@/lib/constants";

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
  // Order lives in state so drags feel instant, but must re-derive when the
  // server list changes (adds/deletes) — the render-time adjustment pattern.
  const serverIds = questions.map((q) => q.id).join(",");
  const [orderState, setOrderState] = useState({
    key: serverIds,
    ids: questions.map((q) => q.id),
  });
  if (orderState.key !== serverIds) {
    setOrderState({ key: serverIds, ids: questions.map((q) => q.id) });
  }
  const order =
    orderState.key === serverIds ? orderState.ids : questions.map((q) => q.id);
  const setOrder = (ids: string[]) => setOrderState({ key: serverIds, ids });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hitWall, setHitWall] = useState(false);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

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
  const availableSamples = samples.filter(
    (s) => !existingTexts.has(s.text.trim().toLowerCase())
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
    "w-full border-b border-soft/50 bg-transparent px-0.5 py-2 font-serif text-base italic outline-none transition focus:border-b-2 focus:border-primary";

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* Question list */}
      <div className="min-w-0">
        <h2 className="font-display text-3xl text-primary">
          Curate your questions
        </h2>
        <p className="mt-1 text-sm italic text-soft">
          Build your questions, and have {event.honoree_name}{" "}
          answer each on video (60s max).
        </p>

        {ordered.length === 0 ? (
          <p className="mt-6 border border-dashed border-line bg-surface/60 px-4 py-8 text-center text-sm italic text-soft">
            No questions yet — write one below or add a few from the ideas
            list.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
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
                className={`double-keyline p-5 sm:p-6 ${
                  dragIndex === i ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className="mt-1 cursor-grab select-none text-lg leading-none text-soft/70"
                    title="Drag to reorder"
                  >
                    ⠿
                  </span>
                  <div className="min-w-0 flex-1">
                    {editingId === q.id ? (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => saveEdit(q.id)}
                            disabled={busy}
                            className="label-caps bg-primary px-4 py-2 text-[10px] text-on-primary"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="label-caps px-3 py-2 text-[10px] text-soft"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="label-caps text-[10px] tracking-[0.2em] text-primary">
                          Question {i + 1}
                        </p>
                        <p className="mt-1.5 font-display text-xl italic leading-snug text-ink">
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
                        className="p-1 hover:text-primary disabled:opacity-30"
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => move(i, i + 1)}
                        disabled={i === ordered.length - 1 || busy}
                        className="p-1 hover:text-primary disabled:opacity-30"
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(q.id);
                          setEditText(q.text);
                        }}
                        className="p-1 text-xs hover:text-primary"
                        aria-label="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => remove(q.id)}
                        disabled={busy}
                        className="p-1 text-xs hover:text-primary"
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
          <p className="mt-5 border border-line bg-raised px-4 py-2.5 text-sm">
            {error}
          </p>
        )}

        {(hitWall || atFreeLimit) && !event.is_premium ? (
          <UpgradeCard eventId={event.id} />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addQuestion(newText, "custom");
            }}
            className="mt-6 border border-dashed border-soft/50 bg-surface/60 p-6 text-center transition focus-within:border-primary"
          >
            <p className="label-caps text-[11px] text-soft">
              ⊕ Create custom question
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
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
                className="label-caps shrink-0 bg-primary px-6 py-3 text-[10px] text-on-primary transition hover:bg-primary-deep disabled:opacity-50"
              >
                Add question
              </button>
            </div>
          </form>
        )}

        <p className="mt-4 text-xs italic text-soft">
          {event.is_premium ? (
            <>✨ Premium event — unlimited questions.</>
          ) : (
            <>
              You have {questions.length} / {FREE_LIMIT} questions used in the
              free tier.
            </>
          )}
        </p>
      </div>

      {/* Question ideas */}
      <aside className="lg:pt-2">
        <div className="keyline p-6">
          <h3 className="font-display text-xl text-primary">Question Ideas</h3>
          {availableSamples.length === 0 ? (
            <p className="mt-3 text-sm italic text-soft">
              You&apos;ve used every idea in the library — impressive.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {availableSamples.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => addQuestion(s.text, "sample")}
                    disabled={busy}
                    className="group flex w-full items-baseline gap-2.5 px-1 py-3 text-left transition hover:bg-accent/60 disabled:opacity-50"
                    title="Add to your list"
                  >
                    <span className="shrink-0 text-sm font-semibold leading-none text-primary transition group-hover:scale-110">
                      +
                    </span>
                    <span className="font-display text-[17px] italic leading-snug text-ink transition group-hover:text-primary">
                      {s.text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="engraved-divider my-5" />
          <p className="text-center text-xs italic text-soft">
            Questions added here will appear at the bottom of your active list.
          </p>
        </div>
      </aside>
    </section>
  );
}
