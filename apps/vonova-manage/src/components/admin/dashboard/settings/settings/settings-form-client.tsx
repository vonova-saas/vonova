/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Button, buttonVariants } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { toast } from "sonner";
import { getSettingsMutationFn, resetSettingsMutationFn, updateSettingsMutationFn } from '@/services/app/settings.api'
import { cn } from '@/lib/utils'
import { CaretSortIcon, CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useAuthContext } from '@/context/auth/auth-context'

const languages = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Arabic', value: 'ar' },
]

interface SettingsFormClientProps {
  defaultValues: Partial<{
    font: string
    fontSize: string
    theme: 'light' | 'dark'
    language: string
  }>
}

/** Align with next-themes stored preference before React resolves `useTheme` (avoids forcing light on first paint). */
function readClientThemePreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') return 'dark'
    if (stored === 'light') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  } catch {
    return 'light'
  }
}

export function SettingsFormClient({ defaultValues }: SettingsFormClientProps) {
  const { setTheme } = useTheme()
  const { user } = useAuthContext()
  const userId = useMemo(() => {
    // Always use the authenticated user's ID if available
    if (user?._id) return user._id
    return ''
  }, [user?._id])

  type SettingsFormValues = {
    font: string
    fontSize: string
    theme: 'light' | 'dark'
    language: string
  }

  const hasParentTheme =
    defaultValues.theme === 'light' || defaultValues.theme === 'dark'

  const form = useForm<SettingsFormValues>({
    defaultValues: {
      font: defaultValues.font ?? 'cairo',
      fontSize: defaultValues.fontSize ?? '16',
      language: defaultValues.language ?? 'en',
      theme: hasParentTheme ? defaultValues.theme! : 'light',
    },
  })

  // Match the theme radio to next-themes / localStorage on first client mount (no hardcoded light).
  useEffect(() => {
    if (hasParentTheme) return
    const t = readClientThemePreference()
    form.setValue('theme', t, { shouldDirty: false, shouldTouch: false })
  }, [hasParentTheme, form])

  // cache to avoid re-loading a font that is already registered
  const loadedFontsRef = useRef<Set<string>>(new Set())

  function loadLocalFontIfNeeded(fontKey: string) {
    try {
      // Adjust paths to match your public folder structure if different
      // We will try to load a few common weights for each family. If a file is missing, we skip it.
      const sources: Record<string, { family: string; files: Record<string, string[]> }> = {
        cairo: {
          family: 'Cairo',
          files: {
            '400': [
              '/fonts/Cairo/Cairo-Regular.ttf',
              '/fonts/Cairo-Regular.ttf',
              '/fonts/Cairo/cairo.ttf',
            ],
            '500': [
              '/fonts/Cairo/Cairo-Medium.ttf',
              '/fonts/Cairo-Medium.ttf',
            ],
            '600': [
              '/fonts/Cairo/Cairo-SemiBold.ttf',
              '/fonts/Cairo-SemiBold.ttf',
            ],
            '700': [
              '/fonts/Cairo/Cairo-Bold.ttf',
              '/fonts/Cairo-Bold.ttf',
            ],
          },
        },
        lato: {
          family: 'Lato',
          files: {
            '400': [
              '/fonts/Lato/Lato-Regular.ttf',
              '/fonts/Lato-Regular.ttf',
              '/fonts/Lato/lato.ttf',
            ],
            '700': [
              '/fonts/Lato/Lato-Bold.ttf',
              '/fonts/Lato-Bold.ttf',
            ],
          },
        },
      }
      const entry = sources[fontKey]
      if (!entry) return
      if (loadedFontsRef.current.has(entry.family)) return
      if (!(document as any).fonts) return
      const FaceCtor = (window as any).FontFace
      if (!FaceCtor) return

      const loaders: Promise<any>[] = []
      for (const [weight, urls] of Object.entries(entry.files)) {
        if (!urls || !urls.length) continue
        // pick first candidate; if it fails, try others sequentially
        const attempt = async () => {
          for (const url of urls) {
            try {
              const face = new FaceCtor(entry.family, `url(${url}) format('truetype')`, { weight })
              const loaded = await face.load()
              ;(document as any).fonts.add(loaded)
              return true
            } catch {
              // try next url
            }
          }
          return false
        }
        loaders.push(attempt())
      }

      Promise.all(loaders).finally(() => {
        loadedFontsRef.current.add(entry.family)
      })
    } catch {
      // ignore
    }
  }

  function applyTypography(v: Pick<SettingsFormValues, 'font' | 'fontSize'>) {
    try {
      loadLocalFontIfNeeded(v.font)
      const families: Record<string, string> = {
        cairo: "Cairo, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        lato: "Lato, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        system: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      }
      const family = families[v.font] || families.system
      document.body.style.fontFamily = family

      const sizeNum = Number(v.fontSize)
      if (!Number.isNaN(sizeNum) && sizeNum > 0) {
        document.documentElement.style.fontSize = `${sizeNum}px`
      }
    } catch {
      // no-op if DOM not available (SSR) or any error occurs
    }
  }

  /** Theme must go through next-themes so it stays in sync with the rest of the app and localStorage. */
  function applyThemePreference(theme: 'light' | 'dark') {
    setTheme(theme)
  }

  function applyAppearance(v: SettingsFormValues) {
    applyTypography(v)
    if (v.theme === 'light' || v.theme === 'dark') {
      applyThemePreference(v.theme)
    }
  }

  // Live preview: font + size only. Theme is not applied on every watch tick (that used to force `light` from stale defaults and fought next-themes).
  useEffect(() => {
    const subscription = form.watch((value) => {
      const v = value as SettingsFormValues
      if (v?.font && v?.fontSize) {
        applyTypography({ font: v.font, fontSize: v.fontSize })
      }
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  async function onSubmit(data: SettingsFormValues) {
    if (!userId) {
      toast.error('Missing user id in URL');
      return
    }
    try {
      const res = await updateSettingsMutationFn(userId, {
        font: data.font,
        fontSize: String(data.fontSize),
        theme: data.theme,
        language: data.language,
      })
      const nextVals: SettingsFormValues = {
        font: res.data.font,
        fontSize: res.data.fontSize,
        theme: res.data.theme as 'light' | 'dark',
        language: res.data.language,
      }
      form.reset(nextVals)
      applyAppearance(nextVals)
      toast.success(res.message)
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || 'Failed to update settings'
      toast.error(message)
    }
  }

  // Load settings on mount/by userId from backend
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!userId) return
        const res = await getSettingsMutationFn(userId)
        if (!mounted) return
        const nextVals: SettingsFormValues = {
          font: res.data.font,
          fontSize: res.data.fontSize,
          theme: res.data.theme as 'light'|'dark',
          language: res.data.language,
        }
        form.reset(nextVals)
        applyAppearance(nextVals)
      } catch {
        // keep defaults
      }
    })()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function onReset() {
    if (!userId) {
      toast.error('Missing user id in URL');
      return
    }
    try {
      const res = await resetSettingsMutationFn(userId)
      const nextVals: SettingsFormValues = {
        font: res.data.font,
        fontSize: res.data.fontSize,
        theme: res.data.theme as 'light'|'dark',
        language: res.data.language,
      }
      form.reset(nextVals)
      applyAppearance(nextVals)
      toast.success(res.message)
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || 'Failed to reset settings'
      toast.error(message)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='font'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Font</FormLabel>
              <div className='relative w-max'>
                <FormControl>
                  <select
                    suppressHydrationWarning
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'w-[200px] appearance-none font-normal'
                    )}
                    {...field}
                  >
                    <option value='cairo'>Cairo</option>
                    <option value='lato'>Lato</option>
                    <option value='system'>System</option>
                  </select>
                </FormControl>
                <ChevronDownIcon className='absolute right-3 top-2.5 h-4 w-4 opacity-50' />
              </div>
              <FormDescription>
                Set the font you want to use in the dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fontSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Font Size: {field.value}px</FormLabel>
              <FormControl>
                <Slider
                  min={12}
                  max={24}
                  step={1}
                  value={[Number(field.value ?? '16')]}
                  onValueChange={([value]) => field.onChange(String(value))}
                />
              </FormControl>
              <FormDescription>
                Adjust the base font size of the application.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='theme'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel>Theme</FormLabel>
              <FormDescription>
                Select the theme for the dashboard.
              </FormDescription>
              <FormMessage />
              <RadioGroup
                onValueChange={(val) => {
                  field.onChange(val)
                  if (val === 'light' || val === 'dark') {
                    applyThemePreference(val)
                  }
                }}
                value={field.value}
                className='grid max-w-md grid-cols-2 gap-8 pt-2'
              >
                <FormItem>
                  <FormLabel className='[&:has([data-state=checked])>div]:border-primary'>
                    <FormControl>
                      <RadioGroupItem value='light' className='sr-only' />
                    </FormControl>
                    <div className='items-center rounded-md border-2 border-muted p-1 hover:border-accent'>
                      <div className='space-y-2 rounded-sm bg-[#ecedef] p-2'>
                        <div className='space-y-2 rounded-md bg-white p-2 shadow-sm'>
                          <div className='h-2 w-[80px] rounded-lg bg-[#ecedef]' />
                          <div className='h-2 w-[100px] rounded-lg bg-[#ecedef]' />
                        </div>
                        <div className='flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm'>
                          <div className='h-4 w-4 rounded-full bg-[#ecedef]' />
                          <div className='h-2 w-[100px] rounded-lg bg-[#ecedef]' />
                        </div>
                        <div className='flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm'>
                          <div className='h-4 w-4 rounded-full bg-[#ecedef]' />
                          <div className='h-2 w-[100px] rounded-lg bg-[#ecedef]' />
                        </div>
                      </div>
                    </div>
                    <span className='block w-full p-2 text-center font-normal'>
                      Light
                    </span>
                  </FormLabel>
                </FormItem>
                <FormItem>
                  <FormLabel className='[&:has([data-state=checked])>div]:border-primary'>
                    <FormControl>
                      <RadioGroupItem value='dark' className='sr-only' />
                    </FormControl>
                    <div className='items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground'>
                      <div className='space-y-2 rounded-sm bg-slate-950 p-2'>
                        <div className='space-y-2 rounded-md bg-slate-800 p-2 shadow-sm'>
                          <div className='h-2 w-[80px] rounded-lg bg-slate-400' />
                          <div className='h-2 w-[100px] rounded-lg bg-slate-400' />
                        </div>
                        <div className='flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm'>
                          <div className='h-4 w-4 rounded-full bg-slate-400' />
                          <div className='h-2 w-[100px] rounded-lg bg-slate-400' />
                        </div>
                        <div className='flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm'>
                          <div className='h-4 w-4 rounded-full bg-slate-400' />
                          <div className='h-2 w-[100px] rounded-lg bg-slate-400' />
                        </div>
                      </div>
                    </div>
                    <span className='block w-full p-2 text-center font-normal'>
                      Dark
                    </span>
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='language'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Language</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant='outline'
                      role='combobox'
                      className={cn(
                        'w-[200px] justify-between',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value
                        ? languages.find(
                          (language) => language.value === field.value
                        )?.label
                        : 'Select language'}
                      <CaretSortIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className='w-[200px] p-0'>
                  <Command>
                    <CommandInput placeholder='Search language...' />
                    <CommandEmpty>No language found.</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {languages.map((language) => (
                          <CommandItem
                            value={language.label}
                            key={language.value}
                            onSelect={() => {
                              form.setValue('language', language.value)
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                'mr-2 h-4 w-4',
                                language.value === field.value
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            {language.label}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                This is the language that will be used in the dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex items-center gap-3'>
          <Button type='submit' className='cursor-pointer'>Update preferences</Button>
          <Button type='button' variant='outline' onClick={onReset} className='cursor-pointer'>Reset to defaults</Button>
        </div>
      </form>
    </Form>
  )
}
