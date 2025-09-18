'use server'

import { revalidatePath } from 'next/cache'
import { billingFormSchema, type BillingFormValues } from './schema'

type GetBillingResult =
  | { status: 'success', data: BillingFormValues }
  | { status: 'error', message: string }

export async function getBilling(): Promise<GetBillingResult> {
  try {
    return {
      status: 'success',
      data: {
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
        plan: 'basic',
        billingEmail: '',
        address: '',
        city: '',
        country: '',
        zipCode: '',
      } as BillingFormValues
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch billing information',
    }
  }
}

type UpdateBillingResult =
  | { status: 'success', message: string }
  | { status: 'error', message: string }

export async function updateBilling(
  data: BillingFormValues
): Promise<UpdateBillingResult> {
  const validatedData = billingFormSchema.parse(data)

  try {

    revalidatePath('/dashboard/settings/billing')

    return {
      status: 'success',
      message: 'Billing information updated successfully',
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update billing information',
    }
  }
}
