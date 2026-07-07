import { ImageResponse } from "next/og";

export const alt =
  "Bach Party Trivia — the bachelorette & bachelor party game. They answer on video before the party; the guessing happens live.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Link-preview card (iMessage, Slack, socials): brand-first and quiet —
 * the wordmark does the talking, one line of subtext, nothing else. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f9ff",
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(62,94,127,0.08) 48px, rgba(62,94,127,0.08) 49px)",
          color: "#23364a",
          fontFamily: "Georgia, serif",
          padding: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "#ffffff",
            border: "2px solid #3e5e7f",
            boxShadow:
              "inset 0 0 0 8px #ffffff, inset 0 0 0 9px rgba(62,94,127,0.35)",
          }}
        >
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "radial-gradient(circle at 30% 30%, #f3e5ab 0%, #d4af37 60%, #b8860b 100%)",
              boxShadow: "2px 3px 8px rgba(0,0,0,0.18)",
              color: "#ffffff",
              fontSize: 60,
              fontStyle: "italic",
            }}
          >
            B
          </div>
          <div
            style={{
              marginTop: 36,
              fontSize: 110,
              color: "#3e5e7f",
              display: "flex",
              lineHeight: 1,
            }}
          >
            Bach Party Trivia
          </div>
          <div
            style={{
              marginTop: 30,
              fontSize: 36,
              fontStyle: "italic",
              color: "#5b6b7d",
              display: "flex",
            }}
          >
            The bachelorette &amp; bachelor party game
          </div>
          <div
            style={{
              marginTop: 46,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div style={{ width: 56, height: 1, background: "#c9a227", display: "flex" }} />
            <div
              style={{
                fontSize: 24,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "#5b6b7d",
                display: "flex",
              }}
            >
              bachpartytrivia.com
            </div>
            <div style={{ width: 56, height: 1, background: "#c9a227", display: "flex" }} />
          </div>
        </div>
      </div>
    ),
    size
  );
}
