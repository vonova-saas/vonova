"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getPendingInstructorsQueryFn, approveInstructorMutationFn, rejectInstructorMutationFn } from "@/services"
import { PendingInstructor } from "@/types/api/admin/admin.type"
import { useToast } from "@/hooks/use-toast"
import { 
  Mail, 
  Briefcase, 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ExternalLink,
  GraduationCap,
  User,
  Award,
  Download,
  Eye
} from "lucide-react"

function InstructorCard({
  instructor,
  onViewDetails,
  onApprove,
  onReject,
  isApproving,
  isRejecting
}: {
  instructor: PendingInstructor
  onViewDetails: (instructor: PendingInstructor) => void
  onApprove: (userId: string) => void
  onReject: (userId: string) => void
  isApproving: boolean
  isRejecting: boolean
}) {
  const { user, onboarding } = instructor
  const { instructor: instructorData } = onboarding

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending Review
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Track & Experience */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Track:</span>
            <span className="font-medium">{instructorData.track}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Experience:</span>
            <span className="font-medium">{instructorData.experienceYears} years</span>
          </div>
        </div>

        <Separator />

        {/* Bio */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Bio</p>
          <p className="text-sm line-clamp-2">{instructorData.bio}</p>
        </div>

        {/* Teaching Style */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Teaching Style</p>
          <p className="text-sm">{instructorData.teachingStyle}</p>
        </div>

        {/* Motivation */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Motivation</p>
          <p className="text-sm line-clamp-2">{instructorData.motivation}</p>
        </div>

        <Separator />

        {/* CV Preview Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>CV Available</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(instructor)}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View CV
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            onClick={() => onApprove(user._id)}
            disabled={isApproving}
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {isApproving ? 'Approving...' : 'Approve'}
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onReject(user._id)}
            disabled={isApproving || isRejecting}
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function PendingInstructors() {
  const [selectedInstructor, setSelectedInstructor] = useState<PendingInstructor | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['pendingInstructors'],
    queryFn: getPendingInstructorsQueryFn,
  })

  // Approve instructor mutation
  const approveMutation = useMutation({
    mutationFn: approveInstructorMutationFn,
    onSuccess: (data) => {
      toast({
        title: "Instructor approved",
        description: `Successfully approved instructor. Status: ${data.data.status}`,
      })
      // Refresh the pending instructors list
      queryClient.invalidateQueries({ queryKey: ['pendingInstructors'] })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve instructor. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Reject instructor mutation
  const rejectMutation = useMutation({
    mutationFn: rejectInstructorMutationFn,
    onSuccess: (data) => {
      toast({
        title: "Instructor rejected",
        description: `Successfully rejected instructor. Status: ${data.data.status}`,
        variant: "destructive",
      })
      // Refresh the pending instructors list
      queryClient.invalidateQueries({ queryKey: ['pendingInstructors'] })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject instructor. Please try again.",
        variant: "destructive",
      })
    },
  })

  const instructors = data?.data.instructors || []

  // Helper to proxy S3 CV URLs through same-origin to avoid CORS/access issues
  function cvProxyUrl(url: string): string {
    if (!url || url.startsWith("blob:") || url.startsWith("data:")) return url
    try {
      const u = new URL(url)
      if (
        u.protocol === "https:" &&
        u.hostname.toLowerCase().endsWith(".amazonaws.com") &&
        u.hostname.toLowerCase().includes(".s3.")
      ) {
        return `/api/cv-proxy?url=${encodeURIComponent(url)}`
      }
    } catch {
      return url
    }
    return url
  }

  const handleViewCV = (cvUrl: string) => {
    // Open PDF in new tab - Chrome handles PDFs perfectly this way
    const proxyUrl = cvProxyUrl(cvUrl)
    window.open(proxyUrl, '_blank', 'noopener,noreferrer')
  }

  const handleApprove = (userId: string) => {
    approveMutation.mutate(userId)
  }

  const handleReject = (userId: string) => {
    rejectMutation.mutate(userId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Failed to load pending instructors</p>
        </CardContent>
      </Card>
    )
  }

  if (instructors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No Pending Instructors</h3>
          <p className="text-sm text-muted-foreground mt-1">
            There are no instructors waiting for approval at the moment.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pending Instructors</h3>
          <p className="text-sm text-muted-foreground">
            {instructors.length} instructor{instructors.length !== 1 ? 's' : ''} waiting for approval
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {instructors.map((instructor) => (
          <InstructorCard
            key={instructor.user._id}
            instructor={instructor}
            onViewDetails={setSelectedInstructor}
            onApprove={handleApprove}
            onReject={handleReject}
            isApproving={approveMutation.isPending}
            isRejecting={rejectMutation.isPending}
          />
        ))}
      </div>

      {/* Instructor Details Dialog */}
      <Dialog open={!!selectedInstructor} onOpenChange={() => setSelectedInstructor(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Instructor Details
            </DialogTitle>
            <DialogDescription>
              Review the instructor&apos;s information and CV before making a decision
            </DialogDescription>
          </DialogHeader>
          
          {selectedInstructor && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {selectedInstructor.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedInstructor.user.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="h-3.5 w-3.5" />
                    {selectedInstructor.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Applied {new Date(selectedInstructor.user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                  Pending
                </Badge>
              </div>

              <Separator />

              {/* Professional Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    Track
                  </p>
                  <p className="font-medium">{selectedInstructor.onboarding.instructor.track}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    Experience
                  </p>
                  <p className="font-medium">{selectedInstructor.onboarding.instructor.experienceYears} years</p>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  Bio
                </p>
                <p className="text-sm">{selectedInstructor.onboarding.instructor.bio}</p>
              </div>

              <Separator />

              {/* CV Section */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Curriculum Vitae
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleViewCV(selectedInstructor.cvUrl)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View CV
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    asChild
                  >
                    <a 
                      href={cvProxyUrl(selectedInstructor.cvUrl)} 
                      download={`${selectedInstructor.user.name.replace(/\s+/g, '_')}_CV.pdf`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedInstructor(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleReject(selectedInstructor.user._id)
                    setSelectedInstructor(null)
                  }}
                  disabled={rejectMutation.isPending && rejectMutation.variables === selectedInstructor.user._id}
                >
                  {rejectMutation.isPending && rejectMutation.variables === selectedInstructor.user._id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    handleApprove(selectedInstructor.user._id)
                    setSelectedInstructor(null)
                  }}
                  disabled={approveMutation.isPending && approveMutation.variables === selectedInstructor.user._id}
                >
                  {approveMutation.isPending && approveMutation.variables === selectedInstructor.user._id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
