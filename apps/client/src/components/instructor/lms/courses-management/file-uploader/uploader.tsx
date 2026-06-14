"use client";
import { useCallback, useEffect, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  RenderEmptyState,
  RenderErrorState,
  RenderUploadedState,
  RenderUploadingState,
} from "./render-state";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useConstructUrl } from "@/hooks";
import {
  uploadFileMutationFn,
  getLessonVideoPresignedUrlMutationFn,
  getInstructorCourseByIdQueryFn,
} from "@/services/instructor/course-managment/courses.api";
import {
  isPresignedUrlExpired,
  isLikelyS3ObjectKey,
  extractS3KeyFromHttpsUrl,
  resolveS3ObjectKeyForDelete,
} from "@/lib/lms/presigned-url";
import {
  uploadLessonVideoViaPresignedPut,
  isAllowedLessonVideoFile,
  formatLessonVideoUploadError,
  shouldUseS3UploadProxy,
  S3_UPLOAD_PROXY_SAFE_MAX_BYTES,
} from "@/lib/lms/lesson-video-s3-upload";

interface UploaderState {
  id: string | null;
  file: File | null;
  uploading: boolean;
  progress: number;
  key?: string;
  isDeleting: boolean;
  error: boolean;
  objectUrl?: string;
  fileType: "image" | "video";
}

interface iAppProps {
  value?: string;
  onChange?: (value: string, file?: File) => void;
  fileTypeAccepted: "image" | "video";
  courseId?: string;
  contentType?: "lesson" | "chapter" | "course";
  contentId?: string;
  /** Required with lesson video to resolve presigned preview from objectKey. */
  chapterId?: string;
  /** Bare S3 key used when `value` is a stable `/api/v1/media/...` display URL. */
  storageDeleteKey?: string;
}

export function Uploader({
  value,
  onChange,
  fileTypeAccepted,
  courseId,
  contentType,
  contentId,
  chapterId,
  storageDeleteKey,
}: iAppProps) {
  const [presignedPreview, setPresignedPreview] = useState<string | undefined>(
    undefined,
  );

  // Always call hook unconditionally - React Hook rule
  const constructedUrl = useConstructUrl(value || "");

  useEffect(() => {
    let cancelled = false;
    const key = value?.trim() ?? "";
    if (!key) {
      setPresignedPreview(undefined);
      return;
    }
    const httpPresignStale =
      key.startsWith("http") && isPresignedUrlExpired(key);
    const needsLessonVideoPresign =
      fileTypeAccepted === "video" &&
      contentType === "lesson" &&
      courseId &&
      contentId &&
      chapterId &&
      (isLikelyS3ObjectKey(key) || httpPresignStale);
    const needsCourseThumbPresign =
      fileTypeAccepted === "image" &&
      contentType === "course" &&
      courseId &&
      (isLikelyS3ObjectKey(key) || httpPresignStale);

    if (!needsLessonVideoPresign && !needsCourseThumbPresign) {
      setPresignedPreview(undefined);
      return;
    }

    void (async () => {
      try {
        if (needsLessonVideoPresign && courseId && contentId && chapterId) {
          const objectKey = isLikelyS3ObjectKey(key)
            ? key
            : extractS3KeyFromHttpsUrl(key) ?? key;
          const { streamUrl } = await getLessonVideoPresignedUrlMutationFn(
            courseId,
            chapterId,
            contentId,
            objectKey,
          );
          if (!cancelled) setPresignedPreview(streamUrl);
          return;
        }
        if (needsCourseThumbPresign && courseId) {
          const course = await getInstructorCourseByIdQueryFn(courseId);
          const thumb = (course.thumbnailUrl ?? "").trim();
          if (!cancelled && thumb) setPresignedPreview(thumb);
        }
      } catch {
        if (!cancelled) setPresignedPreview(undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, fileTypeAccepted, contentType, courseId, contentId, chapterId]);

  const directHttp =
    value?.startsWith("http") && !isPresignedUrlExpired(value) ? value : undefined;
  const fileUrl = directHttp ?? presignedPreview ?? constructedUrl;

  const [fileState, setFileState] = useState<UploaderState>({
    error: false,
    file: null,
    id: null,
    uploading: false,
    progress: 0,
    isDeleting: false,
    fileType: fileTypeAccepted,
    key: value,
    objectUrl: value?.startsWith("http") ? value : undefined,
  });

  useEffect(() => {
    setFileState((prev) => {
      if (prev.uploading) return prev;
      if (!value) {
        return {
          ...prev,
          objectUrl: undefined,
          key: undefined,
          file: null,
        };
      }
      if (value.startsWith("http") && !isPresignedUrlExpired(value)) {
        return { ...prev, objectUrl: value, key: value };
      }
      const next = presignedPreview ?? constructedUrl;
      if (next && next !== "/images/placeholder.svg") {
        return { ...prev, objectUrl: next, key: value };
      }
      return prev;
    });
  }, [value, fileTypeAccepted, presignedPreview, constructedUrl]);

  const uploadFile = useCallback(
    async (file: File) => {
      setFileState((prev) => ({
        ...prev,
        uploading: true,
        progress: 0,
      }));

      try {
        if (
          fileTypeAccepted === "video" &&
          contentType === "lesson" &&
          courseId &&
          contentId &&
          chapterId
        ) {
          if (!isAllowedLessonVideoFile(file)) {
            toast.error("Only MP4, MOV, or WebM lesson videos are allowed.");
            setFileState((prev) => ({
              ...prev,
              uploading: false,
              progress: 0,
              error: true,
            }));
            return;
          }
          if (
            file.size > S3_UPLOAD_PROXY_SAFE_MAX_BYTES &&
            !shouldUseS3UploadProxy(file.size)
          ) {
            toast.info(
              "Large video — uploading directly to S3. Ensure the LMS bucket CORS allows PUT from this site (see apps/client/.env.example).",
              { duration: 8000 },
            );
          }
          const objectKey = await uploadLessonVideoViaPresignedPut(
            courseId,
            chapterId,
            contentId,
            file,
            (pct) => {
              setFileState((prev) => ({ ...prev, progress: pct }));
            },
          );

          setFileState((prev) => ({
            ...prev,
            progress: 100,
            uploading: false,
            key: objectKey,
            file,
          }));
          onChange?.(objectKey, file);
          toast.success("File uploaded successfully");
        } else if (
          fileTypeAccepted === "image" &&
          contentType === "course" &&
          courseId &&
          contentId
        ) {
          // Course thumbnails are persisted on PATCH /courses/:id (multipart `image`).
          setFileState((prev) => ({
            ...prev,
            progress: 100,
            uploading: false,
            key: prev.key,
            file,
          }));
          onChange?.(value ?? "", file);
          toast.success("Thumbnail selected — click Update Course to save");
        } else if (courseId && contentType && contentId) {
          const result = await uploadFileMutationFn(
            courseId,
            contentType,
            contentId,
            file,
          );

          setFileState((prev) => ({
            ...prev,
            progress: 100,
            uploading: false,
            key: result.objectKey,
            file: file,
          }));
          onChange?.(result.objectKey, file);
          toast.success("File uploaded successfully");
        } else {
          toast.error(
            fileTypeAccepted === "video"
              ? "Open a lesson in the editor to upload video (presigned S3 upload)."
              : "Select where this file belongs (course/lesson) before uploading.",
          );
          setFileState((prev) => ({
            ...prev,
            uploading: false,
            progress: 0,
            error: true,
          }));
        }
      } catch (err) {
        const msg =
          fileTypeAccepted === "video"
            ? formatLessonVideoUploadError(err)
            : err instanceof Error
              ? err.message
              : "Upload failed — please try again";
        toast.error(msg, { duration: 12000 });
        setFileState((prev) => ({
          ...prev,
          progress: 0,
          error: true,
          uploading: false,
        }));
      }
    },
    [
      onChange,
      value,
      courseId,
      contentType,
      contentId,
      chapterId,
      fileTypeAccepted,
    ],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
          URL.revokeObjectURL(fileState.objectUrl);
        }

        setFileState({
          file: file,
          uploading: false,
          progress: 0,
          objectUrl: URL.createObjectURL(file),
          error: false,
          id: uuidv4(),
          isDeleting: false,
          fileType: fileTypeAccepted,
        });

        uploadFile(file);
      }
    },
    [fileState.objectUrl, uploadFile, fileTypeAccepted]
  );

  async function handleRemoveFile() {
    if (fileState.isDeleting || !fileState.objectUrl) return;

    try {
      setFileState((prev) => ({
        ...prev,
        isDeleting: true,
      }));

      const s3Key = resolveS3ObjectKeyForDelete(
        storageDeleteKey ?? fileState.key,
      );

      if (s3Key) {
        const response = await fetch("/api/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: s3Key }),
        });

        if (!response.ok) {
          toast.error("Failed to remove file from storage");
          setFileState((prev) => ({
            ...prev,
            isDeleting: false,
            error: true,
          }));
          return;
        }
      }

      if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }

      onChange?.("", undefined);

      setFileState(() => ({
        file: null,
        uploading: false,
        progress: 0,
        objectUrl: undefined,
        error: false,
        fileType: fileTypeAccepted,
        id: null,
        isDeleting: false,
      }));

      toast.success(
        contentType === "course" && fileTypeAccepted === "image"
          ? "Thumbnail removed — click Update Course to save"
          : "File removed successfully",
      );
    } catch {
      toast.error("Error removing file. please try again");

      setFileState((prev) => ({
        ...prev,
        isDeleting: false,
        error: true,
      }));
    }
  }

  function rejectedFiles(fileRejection: FileRejection[]) {
    if (fileRejection.length) {
      const tooManyFiles = fileRejection.find(
        (rejection) => rejection.errors[0].code === "too-many-files"
      );

      const fileSizeToBig = fileRejection.find(
        (rejection) => rejection.errors[0].code === "file-too-large"
      );

      if (fileSizeToBig) {
        toast.error("File Size exceeds the limit");
      }

      if (tooManyFiles) {
        toast.error("Too many files selected, max is 1");
      }
    }
  }

  function renderContent() {
    if (fileState.uploading) {
      return (
        <RenderUploadingState
          file={fileState.file as File}
          progress={fileState.progress}
        />
      );
    }

    if (fileState.error) {
      return (
        <RenderErrorState
          onRetry={() =>
            setFileState({
              error: false,
              file: null,
              id: null,
              uploading: false,
              progress: 0,
              isDeleting: false,
              fileType: fileTypeAccepted,
            })
          }
        />
      );
    }

    if (fileState.objectUrl) {
      return (
        <RenderUploadedState
          handleRemoveFile={handleRemoveFile}
          previewUrl={fileState.objectUrl}
          isDeleting={fileState.isDeleting}
          fileType={fileState.fileType}
        />
      );
    }

    return <RenderEmptyState isDragActive={isDragActive} />;
  }

  useEffect(() => {
    return () => {
      if (fileState.objectUrl && fileState.objectUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }
    };
  }, [fileState.objectUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:
      fileTypeAccepted === "video"
        ? {
            "video/mp4": [".mp4"],
            "video/quicktime": [".mov"],
            "video/webm": [".webm"],
          }
        : { "image/*": [] },
    maxFiles: 1,
    multiple: false,                     //  5 MB            : 5000 MB
    maxSize: fileTypeAccepted === 'image' ? 5 * 1024 * 1024 : 5000 * 1024 * 1024,
    onDropRejected: rejectedFiles,
    disabled: fileState.uploading || !!fileState.objectUrl,
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed transition-colors duration-200 ease-in-out w-full h-64",
        isDragActive
          ? "border-primary bg-primary/10 border-solid"
          : "border-border hover:border-primary"
      )}
    >
      <CardContent className="flex items-center justify-center h-full w-full p-4">
        <input {...getInputProps()} />
        {renderContent()}
      </CardContent>
    </Card>
  );
}
