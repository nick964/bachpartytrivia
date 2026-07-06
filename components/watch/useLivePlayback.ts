"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/db/browser";
import type { PlaybackPhase, PlaybackTally } from "@/lib/db/types";

export interface LivePlaybackState {
  index: number; // 0 = title, 1..N = questions, N+1 = end
  phase: PlaybackPhase;
  tally: PlaybackTally;
}

/**
 * Live playback state: seeded from the server, updated via a read-only
 * Realtime subscription on playback_state, with slow polling as a
 * belt-and-suspenders fallback for flaky party wifi.
 */
export function useLivePlayback(
  eventId: string,
  playbackToken: string,
  initial: LivePlaybackState
): LivePlaybackState {
  const [state, setState] = useState<LivePlaybackState>(initial);

  useEffect(() => {
    const channel = supabaseBrowser()
      .channel(`playback:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "playback_state",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const row = payload.new as {
            current_question_index?: number;
            phase?: PlaybackPhase;
            tally?: PlaybackTally;
          };
          if (row && typeof row.current_question_index === "number") {
            setState({
              index: row.current_question_index,
              phase: row.phase ?? "question",
              tally: row.tally ?? {},
            });
          }
        }
      )
      .subscribe();

    const poll = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/watch/state?playback_token=${encodeURIComponent(playbackToken)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const s = data.state;
        setState((prev) => {
          if (
            prev.index === s.current_question_index &&
            prev.phase === s.phase &&
            JSON.stringify(prev.tally) === JSON.stringify(s.tally ?? {})
          ) {
            return prev;
          }
          return {
            index: s.current_question_index,
            phase: s.phase,
            tally: s.tally ?? {},
          };
        });
      } catch {
        // offline blip — realtime will catch us up
      }
    }, 8000);

    return () => {
      clearInterval(poll);
      void supabaseBrowser().removeChannel(channel);
    };
  }, [eventId, playbackToken]);

  return state;
}

export interface WatchQuestion {
  id: string;
  text: string;
  uid: string | null;
}
