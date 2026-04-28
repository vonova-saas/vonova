/* eslint-disable @typescript-eslint/no-unused-vars */
// Fake data storage with localStorage persistence for courses
import type {
  Course,
  Chapter,
  Lesson,
  Enrollment,
  ContentUploadResponse,
} from "@/types/api/lms/courses.type";

const STORAGE_KEYS = {
  COURSES: "vonova_mock_courses",
  CHAPTERS: "vonova_mock_chapters",
  LESSONS: "vonova_mock_lessons",
  ENROLLMENTS: "vonova_mock_enrollments",
  UPLOADS: "vonova_mock_uploads",
  CURRENT_USER: "vonova_mock_current_user",
};

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get current mock user (instructor or student)
export function getCurrentMockUser() {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (stored) return JSON.parse(stored);
  // Default mock instructor
  return {
    _id: "mock_instructor_001",
    name: "Mock Instructor",
    email: "instructor@vonova.test",
    role: "instructor",
  };
}

// Storage helpers
function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Courses
export function getMockCourses(): Course[] {
  return getStorage<Course[]>(STORAGE_KEYS.COURSES, []);
}

export function setMockCourses(courses: Course[]): void {
  setStorage(STORAGE_KEYS.COURSES, courses);
}

export function addMockCourse(course: Omit<Course, "_id" | "createdAt" | "updatedAt">): Course {
  const courses = getMockCourses();
  const newCourse: Course = {
    ...course,
    _id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  courses.push(newCourse);
  setMockCourses(courses);
  return newCourse;
}

export function updateMockCourse(courseId: string, updates: Partial<Course>): Course | null {
  const courses = getMockCourses();
  const index = courses.findIndex((c) => c._id === courseId);
  if (index === -1) return null;
  courses[index] = { ...courses[index], ...updates, updatedAt: new Date().toISOString() };
  setMockCourses(courses);
  return courses[index];
}

export function deleteMockCourse(courseId: string): boolean {
  const courses = getMockCourses();
  const filtered = courses.filter((c) => c._id !== courseId);
  if (filtered.length === courses.length) return false;
  setMockCourses(filtered);
  // Also delete related chapters and lessons
  const chapters = getMockChapters().filter((ch) => ch.courseId !== courseId);
  setMockChapters(chapters);
  const lessons = getMockLessons().filter((l) => l.courseId !== courseId);
  setMockLessons(lessons);
  return true;
}

export function getMockCourseById(courseId: string): Course | undefined {
  return getMockCourses().find((c) => c._id === courseId);
}

// Chapters
export function getMockChapters(): Chapter[] {
  return getStorage<Chapter[]>(STORAGE_KEYS.CHAPTERS, []);
}

export function setMockChapters(chapters: Chapter[]): void {
  setStorage(STORAGE_KEYS.CHAPTERS, chapters);
}

export function addMockChapter(chapter: Omit<Chapter, "_id" | "createdAt" | "updatedAt">): Chapter {
  const chapters = getMockChapters();
  const newChapter: Chapter = {
    ...chapter,
    _id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  chapters.push(newChapter);
  setMockChapters(chapters);
  return newChapter;
}

export function updateMockChapter(chapterId: string, updates: Partial<Chapter>): Chapter | null {
  const chapters = getMockChapters();
  const index = chapters.findIndex((ch) => ch._id === chapterId);
  if (index === -1) return null;
  chapters[index] = { ...chapters[index], ...updates, updatedAt: new Date().toISOString() };
  setMockChapters(chapters);
  return chapters[index];
}

export function deleteMockChapter(chapterId: string): boolean {
  const chapters = getMockChapters();
  const filtered = chapters.filter((ch) => ch._id !== chapterId);
  if (filtered.length === chapters.length) return false;
  setMockChapters(filtered);
  // Also delete related lessons
  const lessons = getMockLessons().filter((l) => l.chapterId !== chapterId);
  setMockLessons(lessons);
  return true;
}

export function getMockChaptersByCourse(courseId: string): Chapter[] {
  return getMockChapters()
    .filter((ch) => ch.courseId === courseId)
    .sort((a, b) => a.index - b.index);
}

// Lessons
export function getMockLessons(): Lesson[] {
  return getStorage<Lesson[]>(STORAGE_KEYS.LESSONS, []);
}

export function setMockLessons(lessons: Lesson[]): void {
  setStorage(STORAGE_KEYS.LESSONS, lessons);
}

export function addMockLesson(lesson: Omit<Lesson, "_id" | "createdAt" | "updatedAt">): Lesson {
  const lessons = getMockLessons();
  const newLesson: Lesson = {
    ...lesson,
    _id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  lessons.push(newLesson);
  setMockLessons(lessons);
  return newLesson;
}

export function updateMockLesson(lessonId: string, updates: Partial<Lesson>): Lesson | null {
  const lessons = getMockLessons();
  const index = lessons.findIndex((l) => l._id === lessonId);
  if (index === -1) return null;
  lessons[index] = { ...lessons[index], ...updates, updatedAt: new Date().toISOString() };
  setMockLessons(lessons);
  return lessons[index];
}

export function deleteMockLesson(lessonId: string): boolean {
  const lessons = getMockLessons();
  const filtered = lessons.filter((l) => l._id !== lessonId);
  if (filtered.length === lessons.length) return false;
  setMockLessons(filtered);
  return true;
}

export function getMockLessonsByChapter(chapterId: string): Lesson[] {
  return getMockLessons()
    .filter((l) => l.chapterId === chapterId)
    .sort((a, b) => a.index - b.index);
}

export function getMockLessonsByCourse(courseId: string): Lesson[] {
  return getMockLessons()
    .filter((l) => l.courseId === courseId)
    .sort((a, b) => a.index - b.index);
}

export function getMockLessonById(lessonId: string): Lesson | undefined {
  const lessons = getMockLessons();
  const lesson = lessons.find((l) => l._id === lessonId);
  console.log(`[getMockLessonById] Looking for: ${lessonId}, Found: ${lesson ? 'YES' : 'NO'}, Total lessons: ${lessons.length}`);
  if (!lesson && lessons.length > 0) {
    console.log(`[getMockLessonById] Available lesson IDs:`, lessons.map(l => l._id));
  }
  return lesson;
}

// Enrollments
export function getMockEnrollments(): Enrollment[] {
  return getStorage<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, []);
}

export function setMockEnrollments(enrollments: Enrollment[]): void {
  setStorage(STORAGE_KEYS.ENROLLMENTS, enrollments);
}

export function addMockEnrollment(courseId: string, userId: string): Enrollment {
  const enrollments = getMockEnrollments();
  const existing = enrollments.find((e) => e.courseId === courseId && e.userId === userId);
  if (existing) return existing;

  const newEnrollment: Enrollment = {
    _id: generateId(),
    courseId,
    userId,
    enrolledAt: new Date().toISOString(),
    status: "ACTIVE",
    progress: 0,
    completedLessons: 0,
    totalLessons: getMockLessonsByCourse(courseId).length,
  };
  enrollments.push(newEnrollment);
  setMockEnrollments(enrollments);

  // Update enrollment count on course
  const course = getMockCourseById(courseId);
  if (course) {
    updateMockCourse(courseId, {
      enrollmentCount: (course.enrollmentCount || 0) + 1,
    });
  }

  return newEnrollment;
}

export function getMockEnrollment(courseId: string, userId: string): Enrollment | undefined {
  return getMockEnrollments().find((e) => e.courseId === courseId && e.userId === userId);
}

export function updateMockEnrollment(enrollmentId: string, updates: Partial<Enrollment>): Enrollment | null {
  const enrollments = getMockEnrollments();
  const index = enrollments.findIndex((e) => e._id === enrollmentId);
  if (index === -1) return null;
  enrollments[index] = { ...enrollments[index], ...updates };
  setMockEnrollments(enrollments);
  return enrollments[index];
}

export function isUserEnrolled(courseId: string, userId: string): boolean {
  const enrollment = getMockEnrollment(courseId, userId);
  return enrollment?.status === "ACTIVE" || enrollment?.status === "COMPLETED";
}

// File uploads - metadata and data stored in localStorage
export interface MockUpload {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  url: string;
  createdAt: string;
}

// Upload metadata (lightweight - stored in localStorage)
interface UploadMetadata {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export function getMockUploadMetadata(): Record<string, UploadMetadata> {
  return getStorage<Record<string, UploadMetadata>>(STORAGE_KEYS.UPLOADS, {});
}

export function setMockUploadMetadata(uploads: Record<string, UploadMetadata>): void {
  setStorage(STORAGE_KEYS.UPLOADS, uploads);
}

// IndexedDB for large file storage (much larger quota than localStorage)
const DB_NAME = "VonovaMockFiles";
const DB_VERSION = 1;
const STORE_NAME = "fileData";

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined") return Promise.reject("No window");
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return dbPromise;
}

async function getFileData(uploadId: string): Promise<string | undefined> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(uploadId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("[MockStorage] Failed to get file data from IndexedDB:", e);
    return undefined;
  }
}

async function setFileData(uploadId: string, base64Data: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(base64Data, uploadId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("[MockStorage] Failed to save file data to IndexedDB:", e);
    throw e;
  }
}

export async function uploadMockFile(
  file: File,
  courseId: string,
  contentId: string
): Promise<ContentUploadResponse> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const uploadId = generateId();
      const metadataStore = getMockUploadMetadata();

      // Create a blob URL for immediate playback (works until page refresh)
      const blob = new Blob([file], { type: file.type });
      const blobUrl = URL.createObjectURL(blob);

      // Store metadata in localStorage (lightweight)
      const metadata: UploadMetadata = {
        id: uploadId,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        createdAt: new Date().toISOString(),
      };

      metadataStore[uploadId] = metadata;
      setMockUploadMetadata(metadataStore);

      // Store actual file data in IndexedDB (async)
      setFileData(uploadId, base64).then(() => {
        console.log(`[uploadMockFile] Saved file data for ${uploadId}, size: ${base64.length} chars`);
      }).catch((e) => {
        console.error(`[uploadMockFile] Failed to save file data:`, e);
      });

      resolve({
        message: "File uploaded successfully",
        fileUrl: blobUrl,
        objectKey: uploadId,
        size: file.size,
        assetId: uploadId,
      });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function getMockUpload(uploadId: string): Promise<MockUpload | undefined> {
  const metadata = getMockUploadMetadata()[uploadId];
  if (!metadata) return undefined;

  // Check if we have the file data in IndexedDB
  const base64Data = await getFileData(uploadId);

  return {
    ...metadata,
    url: base64Data || "", // Return base64 if available, empty string otherwise
  };
}

// Alias for getting file by key (used by useConstructUrl)
export async function getMockFileByKey(key: string): Promise<MockUpload | undefined> {
  return getMockUpload(key);
}

// Get video URL from upload - returns blob URL created from base64 data
export async function getMockVideoUrl(key: string): Promise<string | undefined> {
  // First check IndexedDB for base64 data
  const base64Data = await getFileData(key);
  console.log(`[getMockVideoUrl] Looking for key: ${key}, found: ${base64Data ? 'YES' : 'NO'}`);

  if (base64Data) {
    // Convert base64 back to blob and create URL
    try {
      const blob = base64ToBlob(base64Data);
      const blobUrl = URL.createObjectURL(blob);
      console.log(`[getMockVideoUrl] Created blob URL for ${key}:`, blobUrl.substring(0, 50) + '...');
      return blobUrl;
    } catch (e) {
      console.error(`[getMockVideoUrl] Failed to create blob URL for ${key}:`, e);
      return base64Data; // Fallback to base64 data URL
    }
  }

  // Check if metadata exists (helps debugging)
  const metadata = getMockUploadMetadata()[key];
  if (metadata) {
    console.warn(`[getMockVideoUrl] Metadata exists for ${key} but no file data.`);
  } else {
    console.warn(`[getMockVideoUrl] No upload found for key: ${key}`);
  }
  return undefined;
}

// Helper to convert base64 back to Blob
function base64ToBlob(base64: string): Blob {
  // Extract content type from base64 string (data:video/mp4;base64,...)
  const match = base64.match(/^data:([^;]+);base64,/);
  const contentType = match ? match[1] : 'video/mp4';
  
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
  
  // Convert base64 to binary
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  
  return new Blob([byteArray], { type: contentType });
}

// Initialize with sample data if empty
export function initializeMockData(): void {
  if (typeof window === "undefined") return;

  // One-time cleanup: remove old sample course if exists
  const hasCleanedSample = localStorage.getItem("vonova_sample_cleaned") === "true";
  if (!hasCleanedSample) {
    const courses = getMockCourses();
    const sampleCourse = courses.find(c => c.slug === "intro-to-programming");
    if (sampleCourse) {
      // Delete the sample course and its chapters/lessons
      deleteMockCourse(sampleCourse._id);
      console.log("[MockData] Removed old sample course");
    }
    localStorage.setItem("vonova_sample_cleaned", "true");
  }

  if (getMockCourses().length === 0) {
    // No sample data - start fresh for user to create their own courses
    console.log("[MockData] Starting fresh - no sample data");
  }
}

// Clear all mock data
export function clearMockData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.COURSES);
  localStorage.removeItem(STORAGE_KEYS.CHAPTERS);
  localStorage.removeItem(STORAGE_KEYS.LESSONS);
  localStorage.removeItem(STORAGE_KEYS.ENROLLMENTS);
  localStorage.removeItem(STORAGE_KEYS.UPLOADS);
}
