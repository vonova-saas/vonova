import { useEffect, useState } from "react";
import { getMockVideoUrl } from "@/lib/mock-data/courses/storage";

export default function useConstructUrl(key: string): string {
  const [url, setUrl] = useState<string>("/images/placeholder.svg");

  useEffect(() => {
    async function fetchUrl() {
      if (typeof window !== "undefined" && key) {
        console.log("[useConstructUrl] Looking up key:", key);
        const mockUrl = await getMockVideoUrl(key);
        console.log("[useConstructUrl] Found URL:", mockUrl ? "Yes" : "No");

        if (mockUrl) {
          setUrl(mockUrl);
        } else {
          setUrl("/images/placeholder.svg");
        }
      }
    }

    fetchUrl();

    // Cleanup: revoke blob URL when component unmounts or key changes
    return () => {
      if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    };
  }, [key]);

  return url;
}
