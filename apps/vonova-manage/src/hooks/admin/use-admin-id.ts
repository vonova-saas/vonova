"use client";

import { useParams } from "next/navigation";

const useAdminId = () => {
  const params = useParams();
  return params.adminId as string;
};

export default useAdminId;
