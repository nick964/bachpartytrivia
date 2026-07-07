export type HonoreeRole = "bride" | "groom";
export type EventStatus =
  | "draft"
  | "awaiting_responses"
  | "ready"
  | "completed"
  | "expired";
export type ResponseStatus = "pending" | "uploading" | "ready" | "errored";
export type QuestionSource = "sample" | "custom";
export type PlaybackPhase = "question" | "reveal";
export type ThemeName = "blush" | "navy";

export interface EventRow {
  id: string;
  owner_clerk_id: string;
  title: string;
  honoree_name: string;
  honoree_role: HonoreeRole;
  responder_role: HonoreeRole | null;
  theme: string;
  party_date: string; // ISO date
  status: EventStatus;
  respond_token: string;
  playback_token: string;
  is_premium: boolean;
  stripe_payment_id: string | null;
  greeting_video_uid: string | null;
  respond_message: string | null;
  videos_deleted_at: string | null;
  reminder_sent_at: string | null;
  deletion_warning_sent_at: string | null;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  event_id: string;
  text: string;
  sort_order: number;
  is_hidden: boolean;
  source: QuestionSource;
  needs_redo: boolean;
  redo_note: string | null;
  created_at: string;
}

export interface ResponseRow {
  id: string;
  question_id: string;
  stream_video_uid: string | null;
  status: ResponseStatus;
  duration_seconds: number | null;
  recorded_at: string | null;
}

export interface PlaybackTally {
  /** question id -> "right" | "wrong" */
  [questionId: string]: "right" | "wrong";
}

export interface PlaybackStateRow {
  event_id: string;
  /** -1 = title slide; 0..N-1 = visible question index; >= N = end slide */
  current_question_index: number;
  phase: PlaybackPhase;
  tally: PlaybackTally;
  updated_at: string;
}

export interface SampleQuestionRow {
  id: string;
  text: string;
  role: HonoreeRole | null;
  sort_hint: number;
}

export type QuestionWithResponse = QuestionRow & {
  responses: ResponseRow[];
};

/**
 * responses.question_id is UNIQUE, so PostgREST embeds `responses` as a
 * to-one object (or null) rather than an array. Normalize to an array so
 * app code has one shape.
 */
export function embeddedRows<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}
