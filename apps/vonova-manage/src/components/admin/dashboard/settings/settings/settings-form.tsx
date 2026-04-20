"use client"
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

export default function SettingsForm() {
  const defaults = {
    font: 'cairo',
    fontSize: '16',
    theme: 'light',
    language: 'en',
  } as const

  return (
    <Suspense fallback={<SettingsFormSkeleton />}>
      <SettingsFormClient defaultValues={defaults} />
    </Suspense>
  )
}