import type { CommunityAttachmentKind } from "@/services/app/community/social.api";

/** Primary MIME subtype (strip `;codecs=…` etc.) for presign + gateway validation. */
export function primaryMime(mime: string | undefined | null): string {
  if (!mime) return "";
  const p = String(mime).split(";")[0].trim();
  return p || "";
}

const EXT_FALLBACK: Record<
  string,
  { kind: CommunityAttachmentKind; contentType: string }
> = {
  png: { kind: "IMAGE", contentType: "image/png" },
  jpg: { kind: "IMAGE", contentType: "image/jpeg" },
  jpeg: { kind: "IMAGE", contentType: "image/jpeg" },
  gif: { kind: "IMAGE", contentType: "image/gif" },
  webp: { kind: "IMAGE", contentType: "image/webp" },
  avif: { kind: "IMAGE", contentType: "image/avif" },
  heic: { kind: "IMAGE", contentType: "image/heic" },
  heif: { kind: "IMAGE", contentType: "image/heif" },
  mp4: { kind: "VIDEO", contentType: "video/mp4" },
  mov: { kind: "VIDEO", contentType: "video/quicktime" },
  webm: { kind: "VIDEO", contentType: "video/webm" },
  mkv: { kind: "VIDEO", contentType: "video/x-matroska" },
  pdf: { kind: "PDF", contentType: "application/pdf" },
  m4a: { kind: "VOICE", contentType: "audio/mp4" },
  ogg: { kind: "VOICE", contentType: "audio/ogg" },
  mp3: { kind: "VOICE", contentType: "audio/mpeg" },
  wav: { kind: "VOICE", contentType: "audio/wav" },
};

/**
 * Windows / some browsers omit `file.type` or use `application/octet-stream`.
 * Gateway `validateUpload` requires kind + extension + MIME to agree.
 */
export function resolveFileMessageUploadMeta(file: File): {
  kind: CommunityAttachmentKind;
  contentType: string;
} {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const primary = primaryMime(file.type).toLowerCase();
  const generic =
    !primary || primary === "application/octet-stream";

  if (primary.startsWith("image/")) {
    return { kind: "IMAGE", contentType: primary };
  }
  if (primary.startsWith("video/")) {
    return { kind: "VIDEO", contentType: primary };
  }
  if (primary.startsWith("audio/")) {
    return { kind: "VOICE", contentType: primary };
  }
  if (primary === "application/pdf") {
    return { kind: "PDF", contentType: primary };
  }

  if (generic && ext && EXT_FALLBACK[ext]) {
    const m = EXT_FALLBACK[ext];
    return { kind: m.kind, contentType: m.contentType };
  }

  return {
    kind: "FILE",
    contentType: primary || "application/octet-stream",
  };
}

export function resolveVoiceMessageUploadMeta(rec: {
  mimeType: string;
}): { contentType: string; filenameExt: string } {
  const primary = primaryMime(rec.mimeType).toLowerCase();
  let filenameExt = "webm";
  if (primary.includes("mp4") || primary === "audio/mp4") {
    filenameExt = "m4a";
  } else if (primary.includes("ogg")) {
    filenameExt = "ogg";
  } else if (primary.includes("mpeg") || primary.includes("mp3")) {
    filenameExt = "mp3";
  } else if (primary.includes("wav")) {
    filenameExt = "wav";
  } else if (primary.includes("webm")) {
    filenameExt = "webm";
  }
  const contentType =
    primary && primary !== "application/octet-stream"
      ? primary
      : filenameExt === "m4a"
        ? "audio/mp4"
        : `audio/${filenameExt}`;
  return { contentType, filenameExt };
}
