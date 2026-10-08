import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { EB_Garamond, Literata, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const display = EB_Garamond({
  variable: "--font-display-var",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const body = Literata({
  variable: "--font-body-var",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const label = Plus_Jakarta_Sans({
  variable: "--font-label-var",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bachpartytrivia.com"
  ),
  title: {
    default: "Bach Party Trivia — the bachelorette & bachelor party game",
    template: "%s · Bach Party Trivia",
  },
  description:
    "The bachelorette & bachelor party game: they answer on video before the party, the guest of honor guesses live. The easiest party game you'll ever run.",
  // Link previews (iMessage, Slack, socials) read these — brand-first.
  openGraph: {
    title: "Bach Party Trivia",
    description:
      "The bachelorette & bachelor party game — they answer on video before the party, the guessing happens live.",
    siteName: "Bach Party Trivia",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bach Party Trivia",
    description:
      "The bachelorette & bachelor party game — they answer on video before the party, the guessing happens live.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="blush"
      className={`${display.variable} ${body.variable} ${label.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          localization={{
            signUp: {
              emailCode: {
                subtitle:
                  "Enter the verification code sent to your email. Don't see it? Check your spam folder.",
              },
              emailLink: {
                subtitle:
                  "Use the verification link sent to your email. Don't see it? Check your spam folder.",
                formSubtitle:
                  "Use the verification link sent to your email address. Don't see it? Check your spam folder.",
              },
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
