"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { welcomeUserMutationFn, welcomeUserOAuthGoogleMutationFn } from "@/services";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Loader } from "lucide-react";
import { useState } from "react";

type RoleType = 'STUDENT_USER' | 'INSTRUCTOR_USER' | null;
type KnowAboutUsType = 'social_media' | 'friend_referral' | 'search_engine' | 'advertisement' | 'other';

const roleOptions = [
  {
    id: 'STUDENT_USER' as const,
    title: 'Student',
    description: 'Learn from top instructors and advance your career.',
    icon: '🎓',
  },
  {
    id: 'INSTRUCTOR_USER' as const,
    title: 'Instructor',
    description: 'Share your expertise and help students grow.',
    icon: '🧑‍🏫',
  },
];

const knowAboutUsOptions = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'friend_referral', label: 'Friend Referral' },
  { value: 'search_engine', label: 'Search Engine' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'other', label: 'Other' },
];

interface WelcomeFormProps {
  email?: string;
  onSuccess?: (data: { role: string }) => void;
}

export function WelcomeForm({ email, onSuccess }: WelcomeFormProps) {
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [couponCode, setCouponCode] = useState("");
  const [knowAboutUs, setKnowAboutUs] = useState<KnowAboutUsType>('social_media');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: welcomeEmail } = useMutation({ mutationFn: welcomeUserMutationFn });
  const { mutateAsync: welcomeOAuth } = useMutation({ mutationFn: welcomeUserOAuthGoogleMutationFn });

  const handleRoleSelect = (roleId: RoleType) => {
    setSelectedRole(roleId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    try {
      setIsLoading(true);
      setError(null);

      const storedEmail = email || (typeof window !== 'undefined' ? sessionStorage.getItem('verifyEmail') : null);
      const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';

      if (storedEmail) {
        // Email registration flow
        await welcomeEmail({
          email: storedEmail,
          role: selectedRole,
          couponCode: couponCode || undefined,
          knowAboutUs,
          userAgent,
        });
      } else {
        // OAuth flow
        await welcomeOAuth({
          role: selectedRole,
          knowAboutUs,
        });
      }

      onSuccess?.({ role: selectedRole });
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { message?: string } } };
      setError(maybeAxios?.response?.data?.message || 'Failed to complete setup');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome to Vonova</h1>
        <p className="text-muted-foreground">Choose your role to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Selection */}
        <div className="grid gap-4">
          {roleOptions.map((role) => (
            <div
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className={`border rounded-lg p-4 cursor-pointer transition-colors flex items-start gap-4 ${
                selectedRole === role.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/50'
              }`}
            >
              <div className="text-3xl">{role.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold">{role.title}</h3>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedRole === role.id
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`}
              >
                {selectedRole === role.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Know About Us Select */}
        <div className="grid gap-2">
          <Label htmlFor="knowAboutUs">How did you hear about us?</Label>
          <Select
            value={knowAboutUs}
            onValueChange={(value) => setKnowAboutUs(value as KnowAboutUsType)}
          >
            <SelectTrigger id="knowAboutUs">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {knowAboutUsOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Coupon Code (Optional) */}
        <div className="grid gap-2">
          <Label htmlFor="couponCode">
            Coupon Code <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <Input
            id="couponCode"
            placeholder="e.g. WELCOME20"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!selectedRole || isLoading}
        >
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Privacy & Terms */}
      <div className="w-full flex justify-center items-center mt-8 mb-2">
        <p className="text-xs text-muted-foreground text-center max-w-md">
          By using Vonova, you are agreeing to our{" "}
          <a
            className="underline underline-offset-2 hover:text-primary"
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            privacy policy
          </a>{" "}
          and{" "}
          <a
            className="underline underline-offset-2 hover:text-primary"
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            terms of service
          </a>
          .
        </p>
      </div>
    </div>
  );
}
