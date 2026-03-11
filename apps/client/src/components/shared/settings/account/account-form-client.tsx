"use client"

import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { CalendarIcon } from '@radix-ui/react-icons'
import { cn } from '@/utils/functions'
import { toast } from "sonner";
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getAccountMutationFn, updateAccountMutationFn } from '@/services/app/settings/account.api'
import { useAuthContext } from '@/context/app/auth/auth-context'

interface AccountFormClientProps {
  defaultValues: Partial<{ name: string; email: string; avatarUrl: string; bio: string; dateOfBirth: string; address: string }>
}

type AccountFormValues = {
  name: string
  email: string
  avatarUrl: string
  bio: string
  address: string
  dateOfBirth: Date | null
}

export function AccountFormClient({ defaultValues }: AccountFormClientProps) {
  const pathname = usePathname()
  const { user } = useAuthContext()
  const userId = useMemo(() => {
    // Always use the authenticated user's ID if available
    if (user?._id) return user._id
    return ''
  }, [user?._id])

  const form = useForm<AccountFormValues>({
    defaultValues: {
      name: defaultValues.name || '',
      email: defaultValues.email || '',
      avatarUrl: defaultValues.avatarUrl || '',
      bio: defaultValues.bio || '',
      address: defaultValues.address || '',
      dateOfBirth: defaultValues.dateOfBirth ? new Date(defaultValues.dateOfBirth) : null,
    },
  })

  const queryClient = useQueryClient()

  // Avatar upload handlers
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function onPickAvatar() {
    fileInputRef.current?.click()
  }

  function onRemoveAvatar() {
    form.setValue('avatarUrl', '')
  }

  function onAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const maxSizeMb = 3
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`Please select an image under ${maxSizeMb}MB.`)
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      form.setValue('avatarUrl', dataUrl)
      // clear value so selecting the same file again will trigger change event
      e.target.value = ''
    }
    reader.onerror = () => {
      toast.error('Failed to read image')
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  // Load account on mount/by userId
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!userId) return
        const res = await getAccountMutationFn(userId)
        if (!mounted) return
        form.reset({
          name: res.data.name || '',
          email: res.data.email || '',
          avatarUrl: res.data.avatarUrl || '',
          bio: res.data.bio || '',
          address: res.data.address || '',
          dateOfBirth: res.data.dateOfBirth ? new Date(res.data.dateOfBirth) : null,
        })
      } catch {
        // keep defaults
      }
    })()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function onSubmit(data: AccountFormValues) {
    if (!userId) {
      toast.error('Missing user id in URL')
      return
    }
    try {
      const res = await updateAccountMutationFn(userId, {
        name: data.name,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        address: data.address,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString() : '',
      })
      // Reflect response immediately
      form.reset({
        name: res.data.name || '',
        email: res.data.email || '',
        avatarUrl: res.data.avatarUrl || '',
        bio: res.data.bio || '',
        address: res.data.address || '',
        dateOfBirth: res.data.dateOfBirth ? new Date(res.data.dateOfBirth) : null,
      })
      // Update auth user cache so nav reflects new avatar/name immediately
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(['authUser'], (prev: any) => {
        const prevUser = prev?.user ?? {};
        return {
          ...(prev ?? {}),
          user: {
            ...prevUser,
            name: res.data.name ?? prevUser.name,
            email: res.data.email ?? prevUser.email,
            // Many APIs use profilePicture on auth user while account uses avatarUrl
            profilePicture: res.data.avatarUrl ?? prevUser.profilePicture ?? res.data.avatarUrl,
          },
        };
      })
      // Also revalidate immediately to sync with server
      await queryClient.invalidateQueries({ queryKey: ['authUser'] })
      await queryClient.refetchQueries({ queryKey: ['authUser'] })
      // Notify other parts of the app (e.g., nav) that account data changed
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('account:updated'))
      }
      toast.success(res.message)
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || 'Failed to update account'
      toast.error(message)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        {/* Avatar preview */}
        <div className='flex items-center gap-4'>
          <Avatar className='h-16 w-16'>
            {form.watch('avatarUrl') ? (
              <AvatarImage src={form.watch('avatarUrl') || ''} alt={form.watch('name') || 'User avatar'} />
            ) : null}
            <AvatarFallback>
              {(form.watch('name') || '')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join('') || '?'}
            </AvatarFallback>
          </Avatar>
          <div className='space-y-1.5'>
            <div className='text-sm text-muted-foreground'>Profile picture</div>
            <div className='flex items-center gap-2'>
              <Button type='button' variant='outline' size='sm' onClick={onPickAvatar} className='cursor-pointer'>Upload image</Button>
              {form.watch('avatarUrl') ? (
                <Button type='button' variant='ghost' size='sm' onClick={onRemoveAvatar} className='cursor-pointer'>Remove</Button>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={onAvatarFileChange}
              className='hidden'
            />
            <div className='text-xs text-muted-foreground'>You can also paste an image URL below, or leave empty to use your initials</div>
          </div>
        </div>

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Your name' {...field} />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed on your profile and in
                emails.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='avatarUrl'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar URL</FormLabel>
              <FormControl>
                <Input placeholder='https://...' {...field} />
              </FormControl>
              <FormDescription>
                Paste a direct image URL (jpg, png, gif). Leave blank to show your initials.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type='email' placeholder='Your email' {...field} disabled/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='bio'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Tell us a little bit about yourself'
                  className='resize-none'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can <span>@mention</span> other users and organizations to
                link to them.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='dateOfBirth'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Date of birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[240px] pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value as Date, 'MMM d, yyyy')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={field.value as Date | undefined}
                    onSelect={(d) => field.onChange(d ?? null)}
                    disabled={(date: Date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Your date of birth is used to calculate your age.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit'>Update account</Button>
      </form>
    </Form>
  )
}
