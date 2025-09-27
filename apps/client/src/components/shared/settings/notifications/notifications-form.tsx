"use client"
import { NotificationsFormClient } from './notifications-form-client'

export default function NotificationsForm() {
  const defaults = {
    type: 'all',
    communication_emails: false,
    marketing_emails: false,
    social_emails: false,
    security_emails: true,
    mobile: false,
  } as const

  return <NotificationsFormClient defaultValues={defaults} />
}
