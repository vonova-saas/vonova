"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GraduationCap,
  Github,
  Globe,
  Linkedin,
  Loader2,
  MessageCircle,
  Pencil,
  ShieldCheck,
  Sparkles,
  ImageIcon,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { communityAvatarDisplayUrl } from "@/lib/media/community-avatar-display-url";
import {
  useCommunityProfile,
  useCommunityArticles,
  useFindOrCreateConversation,
  useFollowers,
  useFollowing,
  useUpdateMyCommunityProfile,
  useUserPosts,
  useProfileLmsIntegration,
} from "@/hooks/app/community/use-social";
import {
  presignProfileAvatarUpload,
  presignProfileCoverUpload,
  uploadToPresignedUrl,
} from "@/services/app/community/social.api";
import { ProfileCoverBanner } from "@/components/community/profile/profile-cover-banner";
import { FollowButton } from "@/components/community/social/follow-button";
import { PostCard } from "@/components/community/social/post-card";
import { CommunityArticleCard } from "@/components/community/articles/community-article-card";
import { CommunityMediaLightbox } from "@/components/community/social/community-media-lightbox";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import type {
  CommunityFeedItem,
  CommunityGroup,
} from "@/types/api/app/community/social.types";
import type { Course } from "@/types/api/lms/courses.type";
import { CourseProgressCard } from "@/components/student/lms/courses/course-progress-card";
import useUserId from "@/hooks/user/use-user-id";
import { plainTextFromCourseDescription } from "@/components/student/lms/courses/course-description-rich";

type ProfileTab = "posts" | "articles" | "media" | "courses" | "groups";

function withHttps(url: string): string | undefined {
  const t = url.trim();
  if (!t) return undefined;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function collectPostImages(post: CommunityFeedItem): string[] {
  const imgs = [...(post.images?.filter(Boolean) ?? [])];
  if (post.image) imgs.push(post.image);
  return Array.from(new Set(imgs.filter(Boolean)));
}

function profileGroupCourseId(group: CommunityGroup): string {
  const raw = group.courseId as unknown;
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (
    typeof raw === "object" &&
    raw !== null &&
    "$oid" in (raw as object) &&
    typeof (raw as { $oid?: unknown }).$oid === "string"
  ) {
    return String((raw as { $oid: string }).$oid).trim();
  }
  return String(raw).trim();
}

export default function CommunityProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params?.username ?? "";
  const router = useRouter();
  const auth = useAuthContextOptional();

  const profile = useCommunityProfile(username);
  const profileData = profile.data;
  const refetchProfile = profile.refetch;

  const isMe = useMemo(
    () => !!auth?.user?._id && auth.user._id === profileData?._id,
    [auth?.user?._id, profileData?._id],
  );

  const followers = useFollowers(profileData?._id);
  const following = useFollowing(profileData?._id);
  const startConversation = useFindOrCreateConversation();
  const postsQ = useUserPosts(profileData?._id);
  const articlesQ = useCommunityArticles(
    {
      author: profileData?._id ?? "",
      limit: 30,
      status: isMe ? undefined : "published",
    },
    { enabled: !!profileData?._id },
  );

  const [tab, setTab] = useState<ProfileTab>("posts");

  const studentId = useUserId();
  const integrationQ = useProfileLmsIntegration(
    username,
    !!isMe && !!auth?.isAuthenticated && (tab === "courses" || tab === "groups"),
  );

  const [mediaGallery, setMediaGallery] = useState<{
    urls: string[];
    index: number;
  } | null>(null);

  const postPages = postsQ.data?.pages ?? [];
  const profilePosts = postPages.flatMap((p) => p.posts);
  const mediaFromPosts = useMemo(() => {
    const urls = new Set<string>();
    for (const p of profilePosts) {
      for (const u of collectPostImages(p)) urls.add(u);
    }
    return [...urls];
  }, [profilePosts]);

  const onRefreshProfileGallery = useCallback(
    async (index: number) => {
      const res = await postsQ.refetch();
      const pages = res.data?.pages ?? [];
      const posts = pages.flatMap(
        (p: { posts: CommunityFeedItem[] }) => p.posts,
      );
      const urls = new Set<string>();
      for (const p of posts) {
        for (const u of collectPostImages(p)) urls.add(u);
      }
      return Array.from(urls)[index] ?? null;
    },
    [postsQ],
  );

  const onRefreshProfileCover = useCallback(async () => {
    const r = await refetchProfile();
    return r.data?.coverImageUrl ?? null;
  }, [refetchProfile]);

  if (profile.isLoading) {
    return <ProfileSkeleton />;
  }

  if (profile.isError || !profileData) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center">
        <p className="text-sm font-medium">Profile not found.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The user @{username} doesn&apos;t exist or hasn&apos;t set up a community
          profile yet.
        </p>
      </div>
    );
  }

  const isInstructor =
    profileData.role === "INSTRUCTOR_USER" ||
    profileData.isVerifiedInstructor === true;

  const articles = articlesQ.data?.articles ?? [];
  const bundle = integrationQ.data;
  const enrollments = bundle?.enrolledCourses ?? [];
  const sid = studentId || auth?.user?._id || "";
  const profileGroupList = Array.from(
    new Map((bundle?.groups ?? []).map((g) => [g._id, g])).values(),
  );
  const teachingItems =
    (bundle?.teachingCourses?.items ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-8 md:space-y-10">
      <Card className="overflow-hidden border-violet-500/20 p-0 shadow-xl ring-1 ring-violet-500/10">
        <ProfileCoverBanner
          coverUrl={profileData.coverImageUrl}
          name={profileData.name}
          onRefreshCover={onRefreshProfileCover}
        />
        <div className="relative px-5 pb-6 pt-0 md:px-8 md:pb-8">
          <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between md:-mt-16">
            <div className="flex items-end gap-4 md:gap-5">
              <Avatar className="h-28 w-28 rounded-full border-4 border-card shadow-xl ring-2 ring-violet-500/20 md:h-32 md:w-32">
                <AvatarImage
                  src={communityAvatarDisplayUrl(profileData.profilePictureUrl)}
                  alt={profileData.name}
                />
                <AvatarFallback className="text-3xl">
                  {(profileData.name ?? "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    {profileData.name ?? "Anonymous"}
                  </h1>
                  {isInstructor && (
                    <Badge className="gap-1 rounded-full bg-violet-600 px-3 py-1 text-sm text-white">
                      <ShieldCheck className="h-3.5 w-3.5" /> Instructor
                    </Badge>
                  )}
                  {profileData.isVerifiedInstructor && (
                    <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1 text-sm">
                      <Sparkles className="h-3.5 w-3.5" /> Top Mentor
                    </Badge>
                  )}
                </div>
                {profileData.username && (
                  <p className="mt-0.5 text-base text-muted-foreground md:text-lg">
                    @{profileData.username}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {isMe ? (
                <EditProfileSheet profile={profileData} usernameInUrl={username} />
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 rounded-full px-5"
                    disabled={
                      !auth?.isAuthenticated || startConversation.isPending
                    }
                    onClick={() => {
                      if (!profileData._id) return;
                      startConversation.mutate(profileData._id, {
                        onSuccess: (conv) =>
                          router.push(`/community/messages/${conv._id}`),
                      });
                    }}
                  >
                    {startConversation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                    Message
                  </Button>
                  <FollowButton userId={profileData._id} size="lg" />
                </>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2 md:gap-5">
            <section className="rounded-2xl border border-border/80 bg-muted/25 px-4 py-4 md:px-5 md:py-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Headline
              </h2>
              <p className="mt-2 text-base leading-snug text-foreground md:text-lg">
                {profileData.headline?.trim() ||
                  (isMe
                    ? "Add a headline in Edit profile — it shows here on your public profile."
                    : "—")}
              </p>
            </section>
            <section className="rounded-2xl border border-border/80 bg-muted/25 px-4 py-4 md:px-5 md:py-5 md:col-span-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bio
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground md:text-[17px]">
                {profileData.bio?.trim() ||
                  (isMe
                    ? "Tell your story in Edit profile. Markdown isn’t needed here — keep it friendly and clear."
                    : "—")}
              </p>
            </section>
            <section className="rounded-2xl border border-border/80 bg-muted/25 px-4 py-4 md:px-5 md:py-5 md:col-span-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Experience
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground md:text-[17px]">
                {profileData.experience?.trim() ||
                  (isMe
                    ? "Add roles, projects, or education under Experience in Edit profile."
                    : "—")}
              </p>
            </section>
            <section className="rounded-2xl border border-border/80 bg-muted/25 px-4 py-4 md:col-span-2 md:px-5 md:py-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Skills
              </h2>
              {(profileData.skills?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profileData.skills!.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-violet-500/15 px-3 py-1.5 text-sm font-medium text-violet-800 dark:bg-violet-500/20 dark:text-violet-100"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-base text-muted-foreground">
                  {isMe
                    ? "List skills in Edit profile (comma-separated). They appear as chips here."
                    : "—"}
                </p>
              )}
            </section>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-base md:text-lg">
            <Stat
              label="Followers"
              value={
                profileData.followersCount ??
                followers.data?.pages[0]?.total ??
                0
              }
            />
            <Stat
              label="Following"
              value={
                profileData.followingCount ??
                following.data?.pages[0]?.total ??
                0
              }
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground md:text-base">
            {profileData.website && (
              <ProfileLink
                icon={<Globe className="h-3.5 w-3.5" />}
                href={profileData.website}
              >
                Website
              </ProfileLink>
            )}
            {profileData.github && (
              <ProfileLink
                icon={<Github className="h-3.5 w-3.5" />}
                href={
                  profileData.github.startsWith("http")
                    ? profileData.github
                    : `https://github.com/${profileData.github.replace(/^\/+/, "")}`
                }
              >
                GitHub
              </ProfileLink>
            )}
            {profileData.linkedin && (
              <ProfileLink
                icon={<Linkedin className="h-3.5 w-3.5" />}
                href={profileData.linkedin}
              >
                LinkedIn
              </ProfileLink>
            )}
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ProfileTab)}>
        <TabsList className="h-auto flex-wrap gap-1 rounded-full bg-muted/60 p-1.5 md:p-2">
          <TabsTrigger
            value="posts"
            className="rounded-full px-4 py-2 text-sm md:px-6 md:py-2.5 md:text-base"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger
            value="articles"
            className="rounded-full px-4 py-2 text-sm md:px-6 md:py-2.5 md:text-base"
          >
            Articles
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="rounded-full px-4 py-2 text-sm md:px-6 md:py-2.5 md:text-base"
          >
            Media
          </TabsTrigger>
          <TabsTrigger
            value="courses"
            className="rounded-full px-4 py-2 text-sm md:px-6 md:py-2.5 md:text-base"
          >
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 md:h-5 md:w-5" />
              Courses
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="rounded-full px-4 py-2 text-sm md:px-6 md:py-2.5 md:text-base"
          >
            Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6 space-y-4 md:mt-8 md:space-y-5">
          {postsQ.isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : profilePosts.length === 0 ? (
            <Empty label="No posts to show yet." />
          ) : (
            <>
              {profilePosts.map((p) => (
                <PostCard key={p._id} post={p} />
              ))}
              {postsQ.hasNextPage ? (
                <div className="flex justify-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={postsQ.isFetchingNextPage}
                    onClick={() => postsQ.fetchNextPage()}
                  >
                    {postsQ.isFetchingNextPage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </TabsContent>

        <TabsContent value="articles" className="mt-6 md:mt-8">
          {articlesQ.isLoading ? (
            <div className="flex justify-center py-16 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : articlesQ.isError ? (
            <Empty label="Could not load articles. Refresh the page or sign in again." />
          ) : articles.length === 0 ? (
            <Empty
              label={
                isMe
                  ? "No articles yet."
                  : "No published articles yet. Drafts stay private until the author publishes them."
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 md:gap-6">
              {articles.map((a) => (
                <CommunityArticleCard key={a._id} article={a} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="media" className="mt-6 md:mt-8">
          {mediaFromPosts.length === 0 ? (
            <Empty label="No images on posts yet." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {mediaFromPosts.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Open image ${i + 1} of ${mediaFromPosts.length} in gallery`}
                  className="relative aspect-square overflow-hidden rounded-2xl border bg-muted ring-offset-2 transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  onClick={() =>
                    setMediaGallery({ urls: mediaFromPosts, index: i })
                  }
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="220px"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="courses" className="mt-6 md:mt-8 space-y-8">
          {!isMe ? (
            <Empty label="Enrolled courses only appear on your own profile." />
          ) : !auth?.isAuthenticated ? (
            <Empty label="Sign in to see your courses here." />
          ) : integrationQ.isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : integrationQ.isError ? (
            <Empty label="Could not load LMS profile data. Refresh the page or try again later." />
          ) : enrollments.length === 0 && teachingItems.length === 0 ? (
            <Empty label="No LMS courses yet. Enroll from your student catalog or create a course as an instructor." />
          ) : (
            <>
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Enrolled courses
                </h3>
                {enrollments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You are not enrolled in any courses yet.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {enrollments.map((row) => {
                      const c = row.course as Course;
                      return (
                        <CourseProgressCard
                          key={c._id}
                          data={{
                            Course: c,
                            progress: row.progress ?? 0,
                          }}
                          studentId={sid}
                        />
                      );
                    })}
                  </div>
                )}
              </section>
              {isInstructor && teachingItems.length > 0 ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Courses you teach
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {teachingItems.map((c) => {
                      const id = String(c._id ?? "");
                      const title = String(c.title ?? "Course");
                      const iid = String(auth?.user?._id ?? "");
                      return (
                        <Card key={id} className="overflow-hidden">
                          <CardContent className="space-y-3 p-4">
                            <p className="line-clamp-2 font-medium">{title}</p>
                            <Button size="sm" variant="secondary" asChild>
                              <Link
                                href={`/instructor/${iid}/courses-management/${id}/edit`}
                              >
                                Manage course
                              </Link>
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </TabsContent>
        <TabsContent value="groups" className="mt-6 md:mt-8">
          {!isMe ? (
            <Empty label="Your groups only appear on your own profile." />
          ) : !auth?.isAuthenticated ? (
            <Empty label="Sign in to see your groups here." />
          ) : integrationQ.isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : integrationQ.isError ? (
            <Empty label="Could not load groups. Open Community → Groups from the nav." />
          ) : profileGroupList.length === 0 ? (
            <Empty label="You are not in any groups yet. Course communities appear after you create or enroll in a course." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {profileGroupList.map((g) => (
                <ProfileGroupCard key={g._id} group={g} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CommunityMediaLightbox
        open={mediaGallery !== null}
        onOpenChange={(o) => {
          if (!o) setMediaGallery(null);
        }}
        urls={mediaGallery?.urls ?? []}
        initialIndex={mediaGallery?.index ?? 0}
        onRefreshAtIndex={onRefreshProfileGallery}
      />
    </div>
  );
}

function EditProfileSheet({
  profile,
  usernameInUrl,
}: {
  profile: import("@/types/api/app/community/social.types").CommunityProfile;
  usernameInUrl: string;
}) {
  const router = useRouter();
  const update = useUpdateMyCommunityProfile();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(profile.username ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [experience, setExperience] = useState(profile.experience ?? "");
  const [skillsCsv, setSkillsCsv] = useState((profile.skills ?? []).join(", "));
  const [website, setWebsite] = useState(profile.website ?? "");
  const [github, setGithub] = useState(profile.github ?? "");
  const [linkedin, setLinkedin] = useState(profile.linkedin ?? "");
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    if (!open) return;
    setUsername(profile.username ?? "");
    setHeadline(profile.headline ?? "");
    setBio(profile.bio ?? "");
    setExperience(profile.experience ?? "");
    setSkillsCsv((profile.skills ?? []).join(", "));
    setWebsite(profile.website ?? "");
    setGithub(profile.github ?? "");
    setLinkedin(profile.linkedin ?? "");
    setAvatarFile(null);
    setCoverFile(null);
    setCoverPreviewUrl(null);
  }, [open, profile]);

  const onSubmit = useCallback(async () => {
    let profilePictureUrl: string | undefined;
    let coverImageUrl: string | undefined;

    if (avatarFile) {
      const presigned = await presignProfileAvatarUpload({
        originalName: avatarFile.name,
        contentType: avatarFile.type || "image/jpeg",
        kind: "IMAGE",
      });
      await uploadToPresignedUrl(
        presigned,
        avatarFile,
        (presigned.contentType ?? avatarFile.type) || "image/jpeg",
      );
      profilePictureUrl = presigned.location;
    }
    if (coverFile) {
      const presigned = await presignProfileCoverUpload({
        originalName: coverFile.name,
        contentType: coverFile.type || "image/jpeg",
        kind: "IMAGE",
      });
      await uploadToPresignedUrl(
        presigned,
        coverFile,
        (presigned.contentType ?? coverFile.type) || "image/jpeg",
      );
      coverImageUrl = presigned.location;
    }

    const skills = skillsCsv
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 30);

    const patch = {
      username: username.trim() || undefined,
      headline: headline.trim() || undefined,
      bio: bio.trim() || undefined,
      experience: experience.trim() || undefined,
      skills: skills.length ? skills : undefined,
      website: withHttps(website),
      github: github.trim() || undefined,
      linkedin: withHttps(linkedin),
      profilePictureUrl,
      coverImageUrl,
    };

    update.mutate(patch, {
      onSuccess: (next) => {
        setOpen(false);
        const nextSlug = next.username ?? next._id;
        if (nextSlug && nextSlug !== usernameInUrl) {
          router.replace(`/community/profile/${encodeURIComponent(nextSlug)}`);
        }
      },
    });
  }, [
    avatarFile,
    bio,
    experience,
    coverFile,
    github,
    headline,
    linkedin,
    router,
    skillsCsv,
    update,
    username,
    usernameInUrl,
    website,
  ]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2 rounded-full px-5">
          <Pencil className="h-4 w-4 md:h-5 md:w-5" />
          Edit profile
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-1 flex-col gap-4 px-1 pb-4">
          <div className="space-y-2">
            <Label>Profile photo</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => avatarRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4" />
                Choose image
              </Button>
              {avatarFile ? (
                <span className="truncate text-xs text-muted-foreground">
                  {avatarFile.name}
                </span>
              ) : null}
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Choose profile photo"
                onChange={(e) =>
                  setAvatarFile(e.target.files?.[0] ?? null)
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cover photo</Label>
            {(coverPreviewUrl || profile.coverImageUrl) && (
              <ProfileCoverBanner
                coverUrl={profile.coverImageUrl}
                previewUrl={coverPreviewUrl}
                name={profile.name}
                className="h-28 rounded-lg"
              />
            )}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => coverRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4" />
                Choose image
              </Button>
              {coverFile ? (
                <span className="truncate text-xs text-muted-foreground">
                  {coverFile.name}
                </span>
              ) : null}
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Choose cover photo"
                onChange={(e) =>
                  setCoverFile(e.target.files?.[0] ?? null)
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-username">Username</Label>
            <Input
              id="pf-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-headline">Headline</Label>
            <Input
              id="pf-headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="text-base"
              placeholder="e.g. Full-stack tutor"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-bio">Bio</Label>
            <Textarea
              id="pf-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="min-h-[120px] text-base"
              placeholder="Short intro: who you are and what you care about."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-experience">Experience</Label>
            <Textarea
              id="pf-experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={5}
              className="min-h-[140px] text-base"
              placeholder="Roles, projects, education, certifications — one per line or short paragraphs."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-skills">Skills (comma-separated)</Label>
            <Input
              id="pf-skills"
              value={skillsCsv}
              onChange={(e) => setSkillsCsv(e.target.value)}
              placeholder="TypeScript, NestJS, React"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-website">Website</Label>
            <Input
              id="pf-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-github">GitHub username or URL</Label>
            <Input
              id="pf-github"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-linkedin">LinkedIn URL</Label>
            <Input
              id="pf-linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/…"
            />
          </div>
        </div>
        <SheetFooter className="gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={update.isPending}
            onClick={() => void onSubmit()}
          >
            {update.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ProfileGroupCard({ group }: { group: CommunityGroup }) {
  const courseId = profileGroupCourseId(group);
  const isCourseCommunity = Boolean(group.isCourseGroup && courseId);
  const blurb =
    plainTextFromCourseDescription(group.description) ||
    group.description ||
    "";

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 rounded-xl">
            <AvatarImage src={group.avatarUrl ?? undefined} alt={group.name} />
            <AvatarFallback className="rounded-xl">
              <Users className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{group.name}</h3>
            {isCourseCommunity && (
              <p className="text-[10px] font-medium uppercase tracking-wide text-primary">
                Course community
              </p>
            )}
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {blurb || "No description"}
            </p>
          </div>
        </div>
        {isCourseCommunity ? (
          <Button size="sm" className="w-full" asChild>
            <Link href={`/community/courses/${courseId}`}>Open community</Link>
          </Button>
        ) : (
          <Button size="sm" className="w-full" variant="secondary" asChild>
            <Link href={`/community/groups`}>View in Groups</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="font-semibold">{value.toLocaleString()}</span>{" "}
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function ProfileLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-3 py-1 transition hover:bg-muted",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <Skeleton className="h-48 w-full rounded-none" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2 pb-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="mt-4 h-4 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>
      </Card>
    </div>
  );
}
