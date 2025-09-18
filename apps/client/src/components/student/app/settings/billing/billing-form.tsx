import { getBilling } from './actions'
import { BillingFormClient } from './billing-form-client'

export async function BillingForm() {
  const result = await getBilling()
  
  if (result.status === 'error') {
    throw new Error(result.message)
  }

  return <BillingFormClient defaultValues={result.data} />
}
