export default function WatchNotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-5xl italic text-primary">
        No party here
      </p>
      <p className="mt-4 text-soft">
        This link doesn&apos;t match any game. Double-check the link from your
        host — every character counts.
      </p>
    </div>
  );
}
