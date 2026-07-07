#!/usr/bin/env node
/**
 * Seed a demo event (questions included) for a Clerk user so you can click
 * around without manual setup.
 *
 * Usage:
 *   node scripts/seed-demo.mjs <clerk_user_id>
 *
 * Find your user id in the Clerk dashboard, or run: clerk users list
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const userId = process.argv[2];
if (!userId?.startsWith("user_")) {
  console.error("Usage: node scripts/seed-demo.mjs <clerk_user_id>");
  process.exit(1);
}

const env = loadEnv();
const db = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const partyDate = new Date(Date.now() + 14 * 86400_000)
  .toISOString()
  .slice(0, 10);

const { data: event, error } = await db
  .from("events")
  .insert({
    owner_clerk_id: userId,
    title: "Demo: Sarah's Bachelorette",
    honoree_name: "Mike",
    honoree_role: "bride",
    theme: "blush",
    party_date: partyDate,
    is_premium: true, // demo without the paywall in the way
  })
  .select("*")
  .single();
if (error) {
  console.error("Could not create event:", error.message);
  process.exit(1);
}

const questions = [
  "Where was your first date?",
  "Who said “I love you” first?",
  "What's her most annoying habit?",
  "Impersonate her ordering at a restaurant.",
  "What's one thing she'd grab in a fire (besides you)?",
];
for (const [i, text] of questions.entries()) {
  await db.from("questions").insert({
    event_id: event.id,
    text,
    sort_order: i + 1,
    source: "sample",
  });
}
await db.from("playback_state").insert({ event_id: event.id });

const app = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
console.log(`Demo event created ✔
  Dashboard:  ${app}/dashboard/events/${event.id}
  Respond as Mike: ${app}/respond/${event.respond_token}
  Party TV/remote: ${app}/watch/${event.playback_token}`);
