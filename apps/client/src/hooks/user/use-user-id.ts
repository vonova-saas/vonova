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
  
  const studentParam = params.studentId as string | undefined;
  const instructorParam = params.instructorId as string | undefined;
  const paramId =
    (studentParam && studentParam !== "undefined" ? studentParam : "") ||
    (instructorParam && instructorParam !== "undefined" ? instructorParam : "");
  const validParamId = paramId || "";
  
  return (userId as string) || validParamId || "";
};

export default useUserId;