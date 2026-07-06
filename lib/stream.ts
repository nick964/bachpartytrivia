import "server-only";
import { SignJWT, importPKCS8 } from "jose";
import { supabaseAdmin } from "@/lib/db/server";

const API_BASE = "https://api.cloudflare.com/client/v4";

class StreamError extends Error {}

async function streamFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  if (!accountId || !token) {
    throw new StreamError("Cloudflare Stream is not configured.");
  }
  const res = await fetch(`${API_BASE}/accounts/${accountId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = (await res.json().catch(() => null)) as {
    success?: boolean;
    result?: T;
    errors?: Array<{ message?: string }>;
  } | null;
  if (!res.ok || !body?.success) {
    const msg = body?.errors?.[0]?.message ?? `Stream API error (${res.status})`;
    throw new StreamError(msg);
  }
  return body.result as T;
}

/**
 * Mint a one-time direct creator upload URL. The phone uploads straight to
 * Cloudflare — video bytes never touch our servers (Vercel ~4.5MB body cap).
 */
export async function createDirectUpload(meta: {
  eventId: string;
  questionId: string;
}): Promise<{ uploadURL: string; uid: string }> {
  return streamFetch<{ uploadURL: string; uid: string }>(
    "/stream/direct_upload",
    {
      method: "POST",
      body: JSON.stringify({
        maxDurationSeconds: 65, // belt-and-suspenders on the 60s UI cap
        requireSignedURLs: true,
        meta: {
          name: `event:${meta.eventId} question:${meta.questionId}`,
        },
      }),
    }
  );
}

export async function deleteVideo(uid: string): Promise<void> {
  await streamFetch(`/stream/${uid}`, { method: "DELETE" }).catch((err) => {
    // Deleting an already-deleted video is fine.
    if (err instanceof StreamError && /not found/i.test(err.message)) return;
    throw err;
  });
}

export async function getVideo(uid: string): Promise<{
  readyToStream: boolean;
  duration: number;
  status: { state: string };
}> {
  return streamFetch(`/stream/${uid}`);
}

/** Kick off (or fetch) the MP4 download rendition for a video. */
export async function enableDownload(
  uid: string
): Promise<{ default: { url: string; status: string; percentComplete: number } }> {
  return streamFetch(`/stream/${uid}/downloads`, { method: "POST" });
}

let signingKey: Promise<CryptoKey> | null = null;

function getSigningKey(): Promise<CryptoKey> {
  if (!signingKey) {
    const raw = process.env.CLOUDFLARE_STREAM_SIGNING_KEY_PEM;
    if (!raw) throw new StreamError("Stream signing key is not configured.");
    // Cloudflare returns the key base64-encoded; accept raw PEM too.
    const pem = raw.includes("-----BEGIN")
      ? raw
      : Buffer.from(raw, "base64").toString("utf-8");
    signingKey = importPKCS8(pem.replace(/\\n/g, "\n"), "RS256");
  }
  return signingKey;
}

/**
 * Short-lived signed playback token for one video UID. Videos are uploaded
 * with requireSignedURLs, so a scraped UID is unplayable without this.
 */
export async function signPlaybackToken(
  uid: string,
  opts: { downloadable?: boolean; ttlSeconds?: number } = {}
): Promise<string> {
  const keyId = process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID;
  if (!keyId) throw new StreamError("Stream signing key id is not configured.");
  const key = await getSigningKey();
  return new SignJWT({
    sub: uid,
    kid: keyId,
    ...(opts.downloadable ? { downloadable: true } : {}),
  })
    .setProtectedHeader({ alg: "RS256", kid: keyId })
    .setExpirationTime(
      Math.floor(Date.now() / 1000) + (opts.ttlSeconds ?? 60 * 60 * 6)
    )
    .sign(key);
}

/** Playback/thumbnail URLs for a signed token (videodelivery.net works for all accounts). */
export function playbackUrls(token: string) {
  return {
    hls: `https://videodelivery.net/${token}/manifest/video.m3u8`,
    mp4Download: `https://videodelivery.net/${token}/downloads/default.mp4`,
    thumbnail: `https://videodelivery.net/${token}/thumbnails/thumbnail.jpg?time=1s&width=320`,
    iframe: `https://iframe.videodelivery.net/${token}`,
  };
}

/** Delete every Stream video attached to an event (event deletion + expiry cron). */
export async function deleteEventVideos(eventId: string): Promise<number> {
  const db = supabaseAdmin();
  const { data: questions } = await db
    .from("questions")
    .select("id, responses(stream_video_uid)")
    .eq("event_id", eventId);
  const uids =
    (questions ?? [])
      .flatMap(
        (q: { responses: Array<{ stream_video_uid: string | null }> }) =>
          q.responses
      )
      .map((r) => r.stream_video_uid)
      .filter((u): u is string => !!u) ?? [];
  for (const uid of uids) {
    await deleteVideo(uid);
  }
  return uids.length;
}
