import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="bg-ticking flex min-h-screen w-full items-center justify-center">
      <SignIn />
    </div>
  );
}
