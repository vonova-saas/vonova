"use client";

import { useParams } from "next/navigation";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";

const useUserId = () => {
  const params = useParams();
  const auth = useAuthContextOptional();
  const userId = auth?.user?._id;
  return (userId as string) || (params.userId as string) || "";
};

export default useUserId;