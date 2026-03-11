"use client"

import { useForm } from 'react-hook-form'
import { toast } from "sonner";
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CreditCard } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Image from "next/image";
import { useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { getBillingMutationFn, updateBillingMutationFn } from '@/services/app/settings/billings.api'
import { useAuthContext } from '@/context/app/auth/auth-context'

type BillingFormValues = {
  plan: string
  cardNumber: string
  cardName: string
  expiryDate: string
  cvv: string
  billingEmail: string
  address: string
  city: string
  country: string
  zipCode: string
}

interface BillingFormClientProps {
  defaultValues: Partial<BillingFormValues>
}

export function BillingFormClient({ defaultValues }: BillingFormClientProps) {
  const pathname = usePathname()
  const { user } = useAuthContext()
  const userId = useMemo(() => {
    // Always use the authenticated user's ID if available
    if (user?._id) return user._id
    return ''
  }, [user?._id])

  const form = useForm<BillingFormValues>({
    defaultValues: {
      plan: defaultValues.plan || 'basic',
      cardNumber: defaultValues.cardNumber || '',
      cardName: defaultValues.cardName || '',
      expiryDate: defaultValues.expiryDate || '',
      cvv: defaultValues.cvv || '',
      billingEmail: defaultValues.billingEmail || '',
      address: defaultValues.address || '',
      city: defaultValues.city || '',
      country: defaultValues.country || '',
      zipCode: defaultValues.zipCode || '',
    },
  })

  // Load billing on mount/by userId
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!userId) return
        const res = await getBillingMutationFn(userId)
        if (!mounted) return
        form.reset({
          plan: res.data.plan || 'basic',
          cardNumber: res.data.cardNumber || '',
          cardName: res.data.nameOfCard || '',
          expiryDate: res.data.expiryDate || '',
          cvv: res.data.cvv || '',
          billingEmail: res.data.billingEmail || '',
          address: res.data.cardAddress || '',
          city: res.data.city || '',
          country: res.data.country || '',
          zipCode: res.data.zipCode || '',
        })
      } catch {
        // keep defaults
      }
    })()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function onSubmit(data: BillingFormValues) {
    if (!userId) {
      toast.error('Missing user id in URL')
      return
    }
    try {
      const res = await updateBillingMutationFn(userId, {
        plan: data.plan,
        cardNumber: data.cardNumber,
        nameOfCard: data.cardName,
        expiryDate: data.expiryDate,
        cvv: data.cvv,
        billingEmail: data.billingEmail,
        cardAddress: data.address,
        city: data.city,
        country: data.country,
        zipCode: data.zipCode,
      })
      form.reset({
        plan: res.data.plan || 'basic',
        cardNumber: res.data.cardNumber || '',
        cardName: res.data.nameOfCard || '',
        expiryDate: res.data.expiryDate || '',
        cvv: res.data.cvv || '',
        billingEmail: res.data.billingEmail || '',
        address: res.data.cardAddress || '',
        city: res.data.city || '',
        country: res.data.country || '',
        zipCode: res.data.zipCode || '',
      })
      toast.success(res.message)
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || 'Failed to update billing'
      toast.error(message)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        {/* Plan Selection */}
        <FormField
          control={form.control}
          name='plan'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a plan' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {['basic', 'pro', 'enterprise'].map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the plan that best fits your needs.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Method */}
        <div className='space-y-4'>
          <h3 className='text-sm font-medium'>Payment Method</h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='cardNumber'
              render={({ field: { onChange, value, ...field } }) => {
                const getCardType = (cardNumber: string): string => {
                  const num = cardNumber.replace(/\D/g, '')
                  
                  if (/^4/.test(num)) return 'visa'
                  if (/^5[1-5]/.test(num)) return 'mastercard'
                  if (/^3[47]/.test(num)) return 'amex'
                  if (/^6(?:011|5)/.test(num)) return 'discover'
                  
                  return ''
                }
                
                const formatCardNumber = (value: string) => {
                  const numbers = value.replace(/\D/g, '')
                  return numbers.replace(/(\d{4})(?=\d)/g, '$1 ')
                }
                
                const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const formattedValue = formatCardNumber(e.target.value)
                  onChange(formattedValue)
                }
                
                const cardType = getCardType(value || '')
                
                const getCardIcon = () => {
                  if (!cardType) return <CreditCard className='h-5 w-5 text-muted-foreground' />
                  
                  return (
                    <Image
                      src={`/icons/cards/${cardType}.svg`}
                      alt={cardType}
                      className='h-5 w-8 object-contain'
                      width={8}
                      height={5}
                    />
                  )
                }
                
                return (
                  <FormItem>
                    <FormLabel>Card Number</FormLabel>
                    <div className='relative'>
                      <Input
                        placeholder='4242 4242 4242 4242'
                        value={value || ''}
                        onChange={handleChange}
                        maxLength={19} // 16 digits + 3 spaces
                        className={cardType ? 'pr-10' : ''}
                        {...field}
                      />
                      <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                        {getCardIcon()}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <FormField
              control={form.control}
              name='cardName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name on Card</FormLabel>
                  <FormControl>
                    <Input placeholder='John Doe' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <FormField
              control={form.control}
              name='expiryDate'
              render={({ field: { onChange, value, ...field } }) => {
                const formatExpiryDate = (value: string) => {
                  const numbers = value.replace(/\D/g, '')

                  if (numbers.length > 2) {
                    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`
                  }
                  return numbers
                }

                const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const formattedValue = formatExpiryDate(e.target.value)
                  onChange(formattedValue)
                }

                return (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='MM/YY'
                        value={value || ''}
                        onChange={handleChange}
                        maxLength={5} // MM/YY (5 characters)
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <FormField
              control={form.control}
              name='cvv'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CVV</FormLabel>
                  <FormControl>
                    <Input type='password' placeholder='123' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Billing Address */}
        <div className='space-y-4'>
          <h3 className='text-sm font-medium'>Billing Address</h3>

          <FormField
            control={form.control}
            name='billingEmail'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Email</FormLabel>
                <FormControl>
                  <Input type='email' placeholder='billing@example.com' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='address'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder='123 Main St' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='city'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder='Cairo' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='country'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder='Egypt' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='zipCode'
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP / Postal Code</FormLabel>
                <FormControl>
                  <Input placeholder='10001' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='flex justify-end'>
          <Button type='submit' disabled={form.formState.isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  )
}
