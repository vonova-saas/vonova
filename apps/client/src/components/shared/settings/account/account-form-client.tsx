"use client"

import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  getAccountMutationFn,
  updateAccountMutationFn,
} from "@/services/app/settings/account.api"
import { useAuthContext } from "@/context/app/auth/auth-context"

interface AccountFormClientProps {
  defaultValues: Partial<{
    name: string
    email: string
    bio: string
    dateOfBirth: string
    address: string
  }>
}

type AccountFormValues = {
  name: string
  email: string
  bio: string
  address: string
  dateOfBirth: Date | null
}

function formatDateInputValue(value: Date | null): string {
  if (!value || Number.isNaN(value.getTime())) return ""
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, "0")
  const d = String(value.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Only pass URLs the browser can load; invalid strings avoid a broken <img> request. */
function isDisplayableImageSrc(src: string): boolean {
  const s = src.trim()
  if (!s) return false
  return (
    s.startsWith("https://") ||
    s.startsWith("http://") ||
    s.startsWith("blob:") ||
    s.startsWith("data:image/")
  )
}

/**
 * S3 objects often block hotlinked browser requests (Referer / ACL). Load via same-origin proxy.
 * Blob/data URLs and non-S3 https stay as-is.
 */
function avatarImgSrcForDisplay(url: string): string {
  const s = url.trim()
  if (!s || s.startsWith("blob:") || s.startsWith("data:")) return s
  try {
    const u = new URL(s)
    if (
      u.protocol === "https:" &&
      u.hostname.toLowerCase().endsWith(".amazonaws.com") &&
      u.hostname.toLowerCase().includes(".s3.")
    ) {
      return `/api/avatar?url=${encodeURIComponent(s)}`
    }
  } catch {
    return s
  }
  return s
}

export function AccountFormClient({ defaultValues }: AccountFormClientProps) {
  const { user } = useAuthContext()
  const userId = useMemo(() => {
    if (user?._id) return user._id
    return ""
  }, [user?._id])

  const form = useForm<AccountFormValues>({
    defaultValues: {
      name: defaultValues.name || "",
      email: defaultValues.email || "",
      bio: defaultValues.bio || "",
      address: defaultValues.address || "",
      dateOfBirth: defaultValues.dateOfBirth
        ? new Date(defaultValues.dateOfBirth)
        : null,
    },
  })

  /** Last avatar URL from the server (S3). Profile updates use multipart `file` only. */
  const serverAvatarUrlRef = useRef<string>("")
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const blobPreviewRef = useRef<string | null>(null)

  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function revokeBlobPreview() {
    if (blobPreviewRef.current) {
      URL.revokeObjectURL(blobPreviewRef.current)
      blobPreviewRef.current = null
    }
  }

  function onPickAvatar() {
    fileInputRef.current?.click()
  }

  function onRemoveAvatar() {
    revokeBlobPreview()
    setPendingAvatarFile(null)
    setAvatarPreview(serverAvatarUrlRef.current || "")
  }

  function onAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const maxSizeMb = 3
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`Please select an image under ${maxSizeMb}MB.`)
      e.target.value = ""
      return
    }
    revokeBlobPreview()
    const url = URL.createObjectURL(file)
    blobPreviewRef.current = url
    setPendingAvatarFile(file)
    setAvatarPreview(url)
    e.target.value = ""
  }

  useEffect(() => {
    return () => revokeBlobPreview()
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!userId) return
        const res = await getAccountMutationFn(userId)
        if (!mounted) return
        const raw = res.data.avatarUrl
        const url =
          raw != null && String(raw).trim() !== "" ? String(raw).trim() : ""
        serverAvatarUrlRef.current = url
        setAvatarPreview(url)
        setPendingAvatarFile(null)
        revokeBlobPreview()
        form.reset({
          name: res.data.name || "",
          email: res.data.email || "",
          bio: res.data.bio || "",
          address: res.data.address || "",
          dateOfBirth: res.data.dateOfBirth
            ? new Date(res.data.dateOfBirth)
            : null,
        })
      } catch {
        // keep defaults
      }
    })()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function onSubmit(data: AccountFormValues) {
    if (!userId) {
      toast.error("Missing user id")
      return
    }
    try {
      const fileToUpload = pendingAvatarFile
      // Gateway PUT runs the same S3 + DB upload as POST /auth/upload-profile-picture when `file`
      // is present, then applies text fields. One request keeps `avatarUrl` in the response in sync.
      const res = await updateAccountMutationFn(userId, {
        name: data.name,
        bio: data.bio,
        address: data.address,
        dateOfBirth: data.dateOfBirth
          ? format(data.dateOfBirth, "yyyy-MM-dd")
          : undefined,
        file: fileToUpload ?? undefined,
      })

      const normalizeAvatar = (v: unknown) =>
        v != null && String(v).trim() !== "" ? String(v).trim() : ""
      let nextUrl = normalizeAvatar(res.data.avatarUrl)
      if (!nextUrl && fileToUpload) {
        try {
          const fresh = await getAccountMutationFn(userId)
          nextUrl = normalizeAvatar(fresh.data.avatarUrl)
        } catch {
          // ignore
        }
      }
      serverAvatarUrlRef.current = nextUrl
      revokeBlobPreview()
      setPendingAvatarFile(null)
      setAvatarPreview(nextUrl)
      form.reset({
        name: res.data.name || "",
        email: res.data.email || "",
        bio: res.data.bio || "",
        address: res.data.address || "",
        dateOfBirth: res.data.dateOfBirth
          ? new Date(res.data.dateOfBirth)
          : null,
      })
      queryClient.setQueryData(["authUser"], (prev: unknown) => {
        const p = prev as { user?: Record<string, unknown> } | undefined
        const prevUser = p?.user ?? {}
        return {
          ...(p ?? {}),
          user: {
            ...prevUser,
            name: res.data.name ?? prevUser.name,
            email: res.data.email ?? prevUser.email,
            profilePicture:
              nextUrl ||
              res.data.avatarUrl ||
              prevUser.profilePicture,
          },
        }
      })
      await queryClient.invalidateQueries({ queryKey: ["authUser"] })
      await queryClient.refetchQueries({ queryKey: ["authUser"] })
      await queryClient.invalidateQueries({ queryKey: ["account", userId] })
      await queryClient.refetchQueries({ queryKey: ["account", userId] })
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("account:updated"))
      }
      toast.success(res.message)
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as Error)?.message ||
        "Failed to update account"
      toast.error(message)
    }
  }

  const displayName = form.watch("name")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {avatarPreview && isDisplayableImageSrc(avatarPreview) ? (
              <AvatarImage
                key={avatarPreview}
                src={avatarImgSrcForDisplay(avatarPreview)}
                alt={displayName || "User avatar"}
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <AvatarFallback>
              {displayName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join("") || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1.5">
            <div className="text-sm text-muted-foreground">Profile picture</div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onPickAvatar}
                className="cursor-pointer"
              >
                Upload image
              </Button>
              {avatarPreview ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveAvatar}
                  className="cursor-pointer"
                >
                  {pendingAvatarFile ? "Discard new image" : "Reset to saved avatar"}
                </Button>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              aria-label="Upload profile picture"
              title="Upload profile picture"
              onChange={onAvatarFileChange}
              className="hidden"
            />
            {/* <p className="max-w-md text-xs text-muted-foreground">
              Choose an image, then click{" "}
              <strong className="font-medium text-foreground">Update account</strong>
              . Your photo and other fields are saved together; the avatar uses your account{" "}
              <code className="rounded bg-muted px-1">avatarUrl</code>.
            </p>*/}
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed on your profile and in emails.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Your email" {...field} disabled />
              </FormControl>
              <FormDescription>Email cannot be changed from this screen.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A short description shown on your profile (max 500 characters on the server).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Street, city, country" {...field} />
              </FormControl>
              <FormDescription>Your mailing or contact address.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of birth</FormLabel>
              <div className="space-y-2">
                <FormControl>
                  <Input
                    type="date"
                    value={formatDateInputValue(field.value as Date | null)}
                    max={formatDateInputValue(new Date())}
                    min="1900-01-01"
                    onChange={(e) => {
                      const next = e.target.value
                      field.onChange(next ? new Date(`${next}T00:00:00`) : null)
                    }}
                    className="h-11 rounded-xl border-2 bg-card/50 px-3 font-medium backdrop-blur-sm"
                  />
                </FormControl>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => field.onChange(null)}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => field.onChange(new Date())}
                  >
                    Today
                  </Button>
                </div>
              </div>
              <FormDescription>Stored as YYYY-MM-DD when you save.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Update account</Button>
      </form>
    </Form>
  )
}
