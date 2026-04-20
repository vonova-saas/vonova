"use client"
import { AccountFormClient } from './account-form-client'

export default function AccountForm() {
  // Sane defaults; the client will fetch actual data on mount
  const defaults = {
    name: '',
    email: '',
    avatarUrl: '',
    bio: '',
    dateOfBirth: '',
    address: '',
  } as const

  return <AccountFormClient defaultValues={defaults} />
}
