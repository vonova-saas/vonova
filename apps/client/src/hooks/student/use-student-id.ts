"use client";

import { useParams } from "next/navigation";

const useStudentId = () => {
  const params = useParams();
  return params.studentId as string;
};

export default useStudentId;
