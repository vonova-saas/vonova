import { Logo } from "@/components/global/logo";
import Image from "next/image";
import { LoginForm } from "@/components/site/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left Pane: BG image with marketing content */}
      <div className="relative hidden lg:flex items-center justify-center">
        <div className="relative h-[96%] w-[96%] rounded-3xl overflow-hidden">
          <Image
            src="/images/auth/BG.png"
            alt="Decorative background"
            fill
            priority
          />
          <div className="absolute inset-0 bg-black/30" aria-hidden />

          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-10 pb-10 md:pb-14 lg:pb-16">
            <div className="w-full max-w-md text-center">
              <div className="mb-6 flex items-center justify-center gap-2 text-white/90">
                <Link href="/" className="flex items-center gap-2 font-medium">
                  <Logo className="size-6" />
                  Vonova
                </Link>
              </div>

              <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="mt-2 text-xs md:text-sm text-white/70">
                Sign in to your account.
              </p>

            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Login form */}
      <div className="flex p-6 md:p-10 items-center justify-center">
        <div className="mx-auto w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
