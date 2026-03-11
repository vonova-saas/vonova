export default function StudentIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
/*"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import useAuth from "@/hooks/app/auth/use-auth";

export default function StudentIdLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const { data: authData } = useAuth();

  useEffect(() => {
    const realId = authData?.user?._id;
    const currentId = params?.studentId as string;
    if ((currentId === "undefined" || !currentId) && realId) {
      router.replace(`/student/${realId}/dashboard`);
    }
  }, [authData?.user?._id, params?.studentId, router]);

  return <>{children}</>;
}*/

