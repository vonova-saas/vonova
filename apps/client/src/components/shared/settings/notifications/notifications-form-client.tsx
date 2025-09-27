"use client"

import { useForm } from 'react-hook-form'
import { toast } from "sonner";
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { getNotificationMutationFn, updateNotificationMutationFn, resetNotificationMutationFn } from '@/services/app/settings/notification.api'
import { useAuthContext } from '@/context/app/auth/auth-context'

type NotificationsFormValues = {
  type: 'all' | 'mentions' | 'none'
  communication_emails: boolean
  marketing_emails: boolean
  social_emails: boolean
  security_emails: boolean
  mobile: boolean
}

interface NotificationsFormClientProps {
  defaultValues: Partial<NotificationsFormValues>
}

export function NotificationsFormClient({ defaultValues }: NotificationsFormClientProps) {
  const pathname = usePathname()
  const { user } = useAuthContext()
  const userId = useMemo(() => {
    if (user?._id) return user._id
    if (!pathname) return ''
    const parts = pathname.split('/').filter(Boolean)
    return parts[0] || ''
  }, [pathname, user?._id])

  const form = useForm<NotificationsFormValues>({
    defaultValues: {
      type: (defaultValues.type) || 'all',
      communication_emails: !!defaultValues.communication_emails,
      marketing_emails: !!defaultValues.marketing_emails,
      social_emails: !!defaultValues.social_emails,
      security_emails: defaultValues.security_emails ?? true,
      mobile: !!defaultValues.mobile,
    },
  })

  // Load notification settings on mount/by userId
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!userId) return
        const res = await getNotificationMutationFn(userId)
        if (!mounted) return
        form.reset({
          type: (res.data.notifyMe as NotificationsFormValues['type']) || 'all',
          communication_emails: !!res.data.communicationEmails,
          marketing_emails: !!res.data.marketingEmails,
          social_emails: !!res.data.socialEmails,
          security_emails: !!res.data.securityEmails,
          mobile: false,
        })
      } catch {
        // keep defaults
      }
    })()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function onSubmit(data: NotificationsFormValues) {
    if (!userId) {
      toast.error('Missing user id in URL')
      return
    }
    try {
      const res = await updateNotificationMutationFn(userId, {
        notifyMe: data.type,
        communicationEmails: data.communication_emails,
        marketingEmails: data.marketing_emails,
        socialEmails: data.social_emails,
        securityEmails: data.security_emails,
      })
      // reflect response immediately
      form.reset({
        type: (res.data.notifyMe as NotificationsFormValues['type']) || 'all',
        communication_emails: !!res.data.communicationEmails,
        marketing_emails: !!res.data.marketingEmails,
        social_emails: !!res.data.socialEmails,
        security_emails: !!res.data.securityEmails,
        mobile: form.getValues('mobile'),
      })
      toast.success(res.message)
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || 'Failed to update notifications'
      toast.error(message)
    }
  }

  async function onReset() {
    if (!userId) {
      toast.error('Missing user id in URL')
      return
    }
    try {
      const res = await resetNotificationMutationFn(userId)
      form.reset({
        type: (res.data.notifyMe as NotificationsFormValues['type']) || 'all',
        communication_emails: !!res.data.communicationEmails,
        marketing_emails: !!res.data.marketingEmails,
        social_emails: !!res.data.socialEmails,
        security_emails: !!res.data.securityEmails,
        mobile: false,
      })
      toast.success(res.message)
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || 'Failed to reset notifications'
      toast.error(message)
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='type'
          render={({ field }) => (
            <FormItem className='space-y-3 relative'>
              <FormLabel>Notify me about...</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className='flex flex-col space-y-1'
                >
                  <FormItem className='flex items-center space-x-3 space-y-0'>
                    <FormControl>
                      <RadioGroupItem value='all' />
                    </FormControl>
                    <FormLabel className='font-normal'>
                      All new messages
                    </FormLabel>
                  </FormItem>
                  <FormItem className='flex items-center space-x-3 space-y-0'>
                    <FormControl>
                      <RadioGroupItem value='mentions' />
                    </FormControl>
                    <FormLabel className='font-normal'>
                      Direct messages and mentions
                    </FormLabel>
                  </FormItem>
                  <FormItem className='flex items-center space-x-3 space-y-0'>
                    <FormControl>
                      <RadioGroupItem value='none' />
                    </FormControl>
                    <FormLabel className='font-normal'>Nothing</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='relative'>
          <h3 className='mb-4 text-lg font-medium'>Email Notifications</h3>
          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='communication_emails'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Communication emails
                    </FormLabel>
                    <FormDescription>
                      Receive emails about your account activity.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='marketing_emails'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Marketing emails
                    </FormLabel>
                    <FormDescription>
                      Receive emails about new products, features, and more.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='social_emails'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>Social emails</FormLabel>
                    <FormDescription>
                      Receive emails for friend requests, follows, and more.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='security_emails'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>Security emails</FormLabel>
                    <FormDescription>
                      Receive emails about your account activity and security.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled
                      aria-readonly
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Button type='submit' className='cursor-pointer'>Update notifications</Button>
          <Button type='button' variant='outline' onClick={onReset} className='cursor-pointer'>Reset to defaults</Button>
        </div>
      </form>
    </Form>
  )
}
