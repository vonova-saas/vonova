"use client"

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function useSignOut() {
  const router = useRouter();

  const handleSignOut = async function signOut() {
    // Fake sign-out: no auth client, just pretend and update UI
    try {
      router.push("/");
      toast.success("Signed out successfully (demo mode)");
    } catch {
      toast.error("Failed to sign out (demo mode)");
    }
  };

  return handleSignOut;
}