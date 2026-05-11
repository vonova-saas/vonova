import Background from "@/components/global/background";
import {
  MarketingFeatureCard,
  MarketingHero,
  MarketingSection,
  MarketingStatCard,
} from "@/components/site/marketing/page-shell";
import {
  Bug,
  Eye,
  Fingerprint,
  Key,
  LockKeyhole,
  Mail,
  ScanFace,
  Server,
  ShieldCheck,
  Timer,
} from "lucide-react";

export default function SecurityPage() {
  return (
    <Background>
      <MarketingHero
        badge="Trust & Safety"
        eyebrow="Security"
        title="Security is the foundation, not a feature."
        description="Every layer of Vonova — authentication, data, course content, and AI — is engineered with defense-in-depth. Here is exactly how."
        actions={[
          {
            label: "Report a vulnerability",
            href: "mailto:security@vonova.app",
            icon: Bug,
            variant: "default",
          },
          {
            label: "Email security team",
            href: "mailto:security@vonova.app",
            icon: Mail,
            variant: "outline",
          },
        ]}
      />

      <MarketingSection>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MarketingStatCard
            label="Encryption at rest"
            value="AES-256"
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <MarketingStatCard
            label="In transit"
            value="TLS 1.3"
            accent="text-sky-600 dark:text-sky-400"
          />
          <MarketingStatCard
            label="Signed URLs"
            value="≤ 60 min"
            accent="text-violet-600 dark:text-violet-400"
          />
          <MarketingStatCard
            label="2FA support"
            value="TOTP"
            accent="text-amber-600 dark:text-amber-400"
          />
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Pillars"
        title="How we protect your account & your content"
        description="Each pillar is owned by a named engineer and tested in CI on every deploy."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MarketingFeatureCard
            icon={Fingerprint}
            accent="primary"
            title="Identity"
            description="Hashed passwords (Argon2id), TOTP-based 2FA, session rotation on privilege change, and detection of credential-stuffing patterns."
          />
          <MarketingFeatureCard
            icon={LockKeyhole}
            accent="sky"
            title="Data"
            description="All databases encrypted at rest with AES-256. Backups encrypted and rotated daily; production secrets sealed in a managed KMS."
          />
          <MarketingFeatureCard
            icon={Server}
            accent="violet"
            title="Infrastructure"
            description="Microservice isolation, mutual-TLS between services, principle-of-least-privilege IAM, and segregated production/staging networks."
          />
          <MarketingFeatureCard
            icon={Timer}
            accent="emerald"
            title="Short-lived secrets"
            description="Every download / video URL is presigned with a tight TTL. Course content cannot be linked from outside the protected viewer."
          />
          <MarketingFeatureCard
            icon={Eye}
            accent="amber"
            title="Watermarked viewer"
            description="Books, slides, and videos open in our in-app viewer with a tiled diagonal watermark carrying the viewer's identity & timestamp."
          />
          <MarketingFeatureCard
            icon={ScanFace}
            accent="rose"
            title="Abuse detection"
            description="Per-account rate limits on auth, presign, and AI endpoints; anomaly alerts on bulk material exports."
          />
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Responsible disclosure"
        title="Found a vulnerability?"
        description="We welcome reports from security researchers. We commit to acknowledging within 48 hours, status updates every 72 hours, and a public credit when the issue is resolved."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MarketingFeatureCard
            icon={Mail}
            title="1. Email us"
            description="Send details to security@vonova.app with reproduction steps and the affected URL."
          />
          <MarketingFeatureCard
            icon={ShieldCheck}
            title="2. We triage"
            description="Severity assessment within 48 h, timeline shared with you, and a CVE filed where appropriate."
          />
          <MarketingFeatureCard
            icon={Key}
            title="3. Coordinated fix"
            description="We patch, deploy, validate, and publicly credit you once it is safe to disclose."
          />
        </div>
      </MarketingSection>
    </Background>
  );
}
