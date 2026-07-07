import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().trim().min(1, "Give the event a name").max(120),
  honoree_name: z.string().trim().min(1, "Who's recording?").max(60),
  honoree_role: z.enum(["bride", "groom"]),
  party_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a party date"),
  theme: z.enum(["blush", "navy"]),
});

export const updateEventSchema = createEventSchema.partial().extend({
  respond_message: z.string().trim().max(500).nullable().optional(),
});

export const createQuestionSchema = z.object({
  event_id: z.string().uuid(),
  text: z.string().trim().min(1, "Question can't be empty").max(300),
  source: z.enum(["sample", "custom"]).default("custom"),
});

export const updateQuestionSchema = z.object({
  text: z.string().trim().min(1).max(300).optional(),
  is_hidden: z.boolean().optional(),
  needs_redo: z.boolean().optional(),
  redo_note: z.string().trim().max(300).nullable().optional(),
});

export const reorderQuestionsSchema = z.object({
  event_id: z.string().uuid(),
  ordered_ids: z.array(z.string().uuid()).min(1),
});
