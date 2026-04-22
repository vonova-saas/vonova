"use client";

import { useParams } from "next/navigation";

const useAdminId = () => {
  const params = useParams();
  const value = params?.adminId;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
};

export default useAdminId;
