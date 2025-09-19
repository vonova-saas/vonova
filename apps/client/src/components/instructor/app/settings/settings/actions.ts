'use server'

import { revalidatePath } from 'next/cache'
import { appearanceFormSchema, type AppearanceFormValues } from './schema'

type GetAppearanceResult = 
  | { status: 'success', data: AppearanceFormValues }
  | { status: 'error', message: string }

export async function getAppearance(): Promise<GetAppearanceResult> {
  try {
    return {
      status: 'success',
      data: {
        font: 'inter',
        fontSize: '16',
        lineHeight: '1.5',
        reducedMotion: false,
        highContrast: false,
        theme: 'dark',
        language: 'en',
      } as unknown as AppearanceFormValues
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch appearance'
    }
  }
}

type UpdateAppearanceResult = 
  | { status: 'success', message: string }
  | { status: 'error', message: string }

export async function updateAppearance(data: AppearanceFormValues): Promise<UpdateAppearanceResult> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validatedData = appearanceFormSchema.parse(data)

  try {
    revalidatePath('/settings/appearance')
    
    return { status: 'success', message: 'Appearance updated successfully' }
  } catch (error) {
    return { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Failed to update appearance' 
    }
  }
}
