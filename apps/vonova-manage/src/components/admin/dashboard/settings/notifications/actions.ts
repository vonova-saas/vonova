'use server'

import { revalidatePath } from 'next/cache'
import { notificationsFormSchema, type NotificationsFormValues } from './schema'

type GetNotificationsResult = 
  | { status: 'success', data: NotificationsFormValues }
  | { status: 'error', message: string }

export async function getNotifications(): Promise<GetNotificationsResult> {
  try {
    return {
      status: 'success',
      data: {
        type: 'all',
        communication_emails: false,
        marketing_emails: false,
        social_emails: true,
        security_emails: true,
        mobile: false,
      } as NotificationsFormValues
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch notification settings'
    }
  }
}

type UpdateNotificationsResult = 
  | { status: 'success', message: string }
  | { status: 'error', message: string }

export async function updateNotifications(data: NotificationsFormValues): Promise<UpdateNotificationsResult> {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validatedData = notificationsFormSchema.parse(data)

  try {
    revalidatePath('/settings/notifications')
    
    return { status: 'success', message: 'Notification settings updated successfully' }
  } catch (error) {
    return { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Failed to update notification settings' 
    }
  }
}
