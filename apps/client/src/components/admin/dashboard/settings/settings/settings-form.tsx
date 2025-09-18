import { getAppearance } from './actions'
import { SettingsFormClient } from './settings-form-client'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'

// Loading skeleton for better UX
function SettingsFormSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-64 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function SettingsForm() {
  const result = await getAppearance()
  
  if (result.status === 'error') {
    // Handle error state with a user-friendly message
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-medium mb-2">Failed to load settings</h3>
          <p className="text-muted-foreground">
            {result.message}. Please try again later.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Suspense fallback={<SettingsFormSkeleton />}>
      <SettingsFormClient defaultValues={result.data} />
    </Suspense>
  )
}