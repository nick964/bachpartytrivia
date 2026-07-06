export default function RespondNotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-script text-5xl text-primary">Hmm, nothing here</p>
      <p className="mt-4 text-soft">
        This link doesn&apos;t match any game. Double-check the link you were
        sent — every character counts.
      </p>
    </div>
  );
}
