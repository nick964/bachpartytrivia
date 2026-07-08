import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface px-5 py-6 lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/bachtrivia_logo.png"
            alt="Bach Party Trivia logo"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
          <span className="min-w-0">
            <span className="block font-display text-xl leading-tight text-primary">
              Bach Party Trivia
            </span>
            <span className="label-caps block text-[9px] text-soft">
              Modern heirloom
            </span>
          </span>
        </Link>

        <nav className="mt-10 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 border-l-2 border-primary bg-raised px-3 py-2.5 text-sm font-semibold text-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4.5 w-4.5">
              <rect x="4" y="3" width="13" height="17" rx="1.5" transform="rotate(-6 10.5 11.5)" />
              <path strokeLinecap="round" d="M9 8.5h6M9 12h4" transform="rotate(-6 10.5 11.5)" />
            </svg>
            My Games
          </Link>
        </nav>

        <div className="mt-auto space-y-4">
          <Link
            href="/dashboard#create"
            className="label-caps block bg-primary px-4 py-3 text-center text-[11px] text-on-primary transition hover:bg-primary-deep"
          >
            + New game
          </Link>
          <div className="engraved-divider" />
          <div className="flex items-center justify-between px-1">
            <span className="text-xs italic text-soft">Your account</span>
            <UserButton />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-line bg-surface lg:hidden">
          <div className="flex items-center justify-between px-5 py-3">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Image
                src="/bachtrivia_logo.png"
                alt="Bach Party Trivia logo"
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
              />
              <span className="font-display text-xl leading-none text-primary">
                Bach Party Trivia
              </span>
            </Link>
            <UserButton />
          </div>
        </header>
        <main className="bg-ticking w-full flex-1">
          <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
