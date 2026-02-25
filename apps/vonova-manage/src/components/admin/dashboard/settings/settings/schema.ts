import { z } from 'zod'

export const languages = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Spanish', value: 'es' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese', value: 'zh' },
] as const

export const appearanceFormSchema = z.object({
  // appearance settings
  font: z.enum(['inter', 'manrope', 'system'], {
    invalid_type_error: 'Select a font',
    required_error: 'Please select a font.',
  }),
  fontSize: z.enum(
    ['12', '14', '16', '18', '20', '22', '24'],
    {
      invalid_type_error: 'Select a font size',
      required_error: 'Please select a font size.',
    }
  ),
  lineHeight: z.enum(
    ['1', '1.2', '1.4', '1.6', '1.8', '2', '2.2', '2.4'],
    {
      invalid_type_error: 'Select a line height',
      required_error: 'Please select a line height.',
    }
  ),
  reducedMotion: z.boolean(
    {
      invalid_type_error: 'Select a reduced motion preference',
      required_error: 'Please select a reduced motion preference.',
    }
  ),
  highContrast: z.boolean(
    {
      invalid_type_error: 'Select a high contrast preference',
      required_error: 'Please select a high contrast preference.',
    }
  ),
  theme: z.enum(['light', 'dark'], {
    required_error: 'Please select a theme.',
  }),
  // language settings
  language: z.string({
    required_error: 'Please select a language.',
  }),
})

export type AppearanceFormValues = z.infer<typeof appearanceFormSchema>
