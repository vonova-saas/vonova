"use client"
import { BillingFormClient } from './billing-form-client'

export function BillingForm() {
  const defaults = {
    plan: 'basic',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    billingEmail: '',
    address: '',
    city: '',
    country: '',
    zipCode: '',
  } as const

  return <BillingFormClient defaultValues={defaults} />
}
