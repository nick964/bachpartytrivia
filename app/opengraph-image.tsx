import { ImageResponse } from "next/og";

export const alt =
  "Bach Party Trivia — you may now quiz the bride. He answers on video, she guesses live.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
            "repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(62,94,127,0.1) 48px, rgba(62,94,127,0.1) 49px)",
          color: "#23364a",
          fontFamily: "Georgia, serif",
          padding: 48,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            border: "2px solid #3e5e7f",
            padding: "64px 96px",
            boxShadow: "inset 0 0 0 6px #ffffff, inset 0 0 0 7px rgba(62,94,127,0.3)",
          }}
        >
          <div
            style={{
              fontSize: 26,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#5b6b7d",
              display: "flex",
            }}
          >
            You may now quiz the bride
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 96,
              fontStyle: "italic",
              color: "#3e5e7f",
              display: "flex",
            }}
          >
            What did the groom say?
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 38,
              display: "flex",
              textAlign: "center",
            }}
          >
            He answers on video. She guesses live.
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 38,
              color: "#284968",
              fontStyle: "italic",
              display: "flex",
            }}
          >
            How well does she really know him?
          </div>
          <div
            style={{
              marginTop: 44,
              fontSize: 24,
              color: "#5b6b7d",
              display: "flex",
            }}
          >
            Bach Party Trivia · bachpartytrivia.com
          </div>
        </div>
      </div>
    ),
    size
  );
}
