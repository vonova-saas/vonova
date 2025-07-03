import { Logo } from "@/components/global/logo";
import Image from "next/image";
import { ChangePasswordForm } from "@/components/forms/auth/change-password-form";
import Link from "next/link";

export default function ChangePassPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
              <Logo className="size-8" />
            Vonova
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/images/placeholder.svg"
          alt="Image"
          width="100"
          height="100"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
