"use client";

import { useParams } from "next/navigation";

const useInstructorId = () => {
  const params = useParams();
  return params.instructorId as string;
};

export default useInstructorId;
