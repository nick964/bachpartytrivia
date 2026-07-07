import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-ticking mx-auto flex min-h-screen w-full flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-5xl italic text-primary">Nothing here</p>
      <p className="mt-4 max-w-md text-soft">
        That page doesn&apos;t exist — maybe the link got mangled in a group
        chat somewhere.
      </p>
      <Link
        href="/"
        className="label-caps mt-6 bg-primary px-8 py-3.5 text-[11px] text-on-primary"
      >
        Back to the start
      </Link>
    </div>
  );
}
