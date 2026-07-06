import "server-only";
import { createPrivateKey, type KeyObject } from "node:crypto";
import { SignJWT } from "jose";
import { supabaseAdmin } from "@/lib/db/server";
import { embeddedRows } from "@/lib/db/types";

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

let signingConfig: { kid: string; key: KeyObject } | null = null;

function getSigningConfig(): { kid: string; key: KeyObject } {
  if (signingConfig) return signingConfig;

  const rawId = process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID;
  const rawPem = process.env.CLOUDFLARE_STREAM_SIGNING_KEY_PEM;
  if (!rawId || !rawPem) {
    throw new StreamError("Stream signing key is not configured.");
  }

  // Cloudflare's key-creation API returns `id`, a base64 `pem`, and a
  // base64 `jwk`. Accept either the bare hex id or the whole JWK blob in
  // the ID variable.
  let kid = rawId;
  if (!/^[a-f0-9]{16,64}$/i.test(rawId)) {
    try {
      const jwk = JSON.parse(Buffer.from(rawId, "base64").toString("utf-8"));
      if (typeof jwk.kid === "string") kid = jwk.kid;
    } catch {
      throw new StreamError("Unrecognized Stream signing key id format.");
    }
  }

  const pem = rawPem.includes("-----BEGIN")
    ? rawPem
    : Buffer.from(rawPem, "base64").toString("utf-8");
  // createPrivateKey handles both PKCS1 (Cloudflare's format) and PKCS8.
  const key = createPrivateKey(pem.replace(/\\n/g, "\n"));

  signingConfig = { kid, key };
  return signingConfig;
}

/**
 * Short-lived signed playback token for one video UID. Videos are uploaded
 * with requireSignedURLs, so a scraped UID is unplayable without this.
 */
export async function signPlaybackToken(
  uid: string,
  opts: { downloadable?: boolean; ttlSeconds?: number } = {}
): Promise<string> {
  const { kid, key } = getSigningConfig();
  return new SignJWT({
    sub: uid,
    kid,
    ...(opts.downloadable ? { downloadable: true } : {}),
  })
    .setProtectedHeader({ alg: "RS256", kid })
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
  const uids = (questions ?? [])
    .flatMap(
      (q: {
        responses:
          | { stream_video_uid: string | null }
          | Array<{ stream_video_uid: string | null }>
          | null;
      }) => embeddedRows(q.responses)
    )
    .map((r) => r.stream_video_uid)
    .filter((u): u is string => !!u);
  for (const uid of uids) {
    await deleteVideo(uid);
  }
  return uids.length;
}
