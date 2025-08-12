'use server'

import { revalidatePath } from 'next/cache'
import { accountFormSchema, type AccountFormValues } from './schema'

type GetAccountResult = 
  | { status: 'success', data: AccountFormValues }
  | { status: 'error', message: string }

export async function getAccount(): Promise<GetAccountResult> {
  try {
    return {
      status: 'success',
      data: {
        name: 'Demo User',
        dob: new Date('1990-01-01'),
        email: 'm@example.com',
        bio: 'I own a computer.',
        urls: [
          { value: 'https://link-one.com' },
          { value: 'http://link-two.com' },
        ],
      } as AccountFormValues
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch account'
    }
  }
}

type UpdateAccountResult = 
  | { status: 'success', message: string }
  | { status: 'error', message: string }

export async function updateAccount(data: AccountFormValues): Promise<UpdateAccountResult> {

  const validatedData = accountFormSchema.parse(data)

  try {
    revalidatePath('/settings/account')
    
    return { status: 'success', message: 'Account updated successfully' }
  } catch (error) {
    return { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Failed to update account' 
    }
  }
}
