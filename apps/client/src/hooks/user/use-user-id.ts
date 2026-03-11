/*"use client";

import { useParams } from "next/navigation";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";

const useUserId = () => {
  const params = useParams();
  const auth = useAuthContextOptional();
  const userId = auth?.user?._id;
  return (userId as string) || (params.studentId as string) || "";
};

export default useUserId;*/
"use client";

import { useParams } from "next/navigation";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";

const useUserId = () => {
  const params = useParams();
  const auth = useAuthContextOptional();
  const userId = auth?.user?._id;
  
  const paramId = params.studentId as string;
  const validParamId = paramId && paramId !== "undefined" ? paramId : "";
  
  return (userId as string) || validParamId || "";
};

export default useUserId;