import { z } from 'zod'

export const billingFormSchema = z.object({
  cardNumber: z.string().min(16, {
    message: 'Card number must be at least 16 digits.',
  }),
  cardName: z.string().min(2, {
    message: 'Name on card must be at least 2 characters.',
  }),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, {
    message: 'Please enter a valid expiry date (MM/YY)',
  }),
  cvv: z.string().min(3, {
    message: 'CVV must be at least 3 digits.',
  }),
  plan: z.enum(['basic', 'pro', 'enterprise'] as const, {
    required_error: 'Please select a plan.',
  }),
  billingEmail: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  address: z.string().min(5, {
    message: 'Address must be at least 5 characters.',
  }),
  city: z.string().min(2, {
    message: 'City must be at least 2 characters.',
  }),
  country: z.string().min(2, {
    message: 'Please select a country.',
  }),
  zipCode: z.string().min(3, {
    message: 'ZIP code must be at least 3 characters.',
  }),
})

export type BillingFormValues = z.infer<typeof billingFormSchema>
