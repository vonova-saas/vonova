"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from '@/hooks/use-toast'
import { updateBilling } from './actions'
import { type BillingFormValues, billingFormSchema } from './schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CreditCard, Loader2 } from 'lucide-react'
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
// import { Icons } from '@/components/icons'

interface BillingFormClientProps {
  defaultValues: Partial<BillingFormValues>
}

export function BillingFormClient({ defaultValues }: BillingFormClientProps) {
  const form = useForm<BillingFormValues>({
    resolver: zodResolver(billingFormSchema),
    defaultValues: {
      plan: 'basic',
      ...defaultValues,
    },
  })

  async function onSubmit(data: BillingFormValues) {
    const result = await updateBilling(data)

    if (result.status === 'error') {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Success',
      description: result.message,
    })
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <img
                      src={`/icons/cards/${cardType}.svg`}
                      alt={cardType}
                      className='h-5 w-8 object-contain'
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
