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
  title: {
    default: "Bach Party Trivia — the bachelorette & bachelor party game",
    template: "%s · Bach Party Trivia",
  },
  description:
    "You may now quiz the bride: he answers on video before the party, she guesses live at the bachelorette. The easiest party game you'll ever run.",
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
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
