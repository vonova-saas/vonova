import { z } from 'zod'

export const accountFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: 'Name must be at least 2 characters.',
    })
    .max(30, {
      message: 'Name must not be longer than 30 characters.',
    }),
  email: z
    .string({
      required_error: 'Please select an email to display.',
    })
    .email(),
  bio: z.string().max(160).min(4),
  dob: z.date({
    required_error: 'A date of birth is required.',
  }),
  urls: z
  .array(
    z.object({
      value: z.string().url({ message: 'Please enter a valid URL.' }),
    })
  )
  .optional(),
})

export type AccountFormValues = z.infer<typeof accountFormSchema>
