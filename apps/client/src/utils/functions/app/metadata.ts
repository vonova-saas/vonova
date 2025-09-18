import { Metadata } from "next";

interface MetadataProps {
  title?: string;
  description?: string;
  image?: string | null;
  icons?: Metadata["icons"];
  noIndex?: boolean;
  keywords?: string[];
  author?: string;
  type?: "website" | "article" | "profile";
  locale?: string;
  alternates?: Record<string, string>;
  publishedTime?: string;
  modifiedTime?: string;
}

export const generateMetadata = ({
  title = `${process.env.NEXT_PUBLIC_APP_NAME} - AI-powered LMS for Developers and Students | Join the Waitlist`,
  description = "Vonova is an upcoming AI-powered Learning Management System tailored for CS students and developers in the Arab world. Join our waitlist today to get early access to personalized, engaging, and structured learning journeys.",
  image = "/thumbnail.png",
  icons = [
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "/icons/favicon-32x32.png"
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      url: "/icons/favicon-16x16.png"
    },
  ],
  noIndex = false,
  keywords = [
    "AI Learning Management System",
    "AI LMS",
    "Education Technology",
    "Online Courses",
    "AI Tutoring",
    "Student Platform",
    "Developer Learning",
    "Personalized Learning",
    "Middle East EdTech",
    "Vonova"
  ],
  author = process.env.NEXT_PUBLIC_AUTHOR_NAME || "Vonova Company",
  type = "website",
  locale = "en_US",
  alternates = {},
  publishedTime,
  modifiedTime
}: MetadataProps = {}): Metadata => {
  const metadataBase = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://vonova.vercel.app");
  const imageUrl = image ? new URL(image, metadataBase).toString() : null;

  return {
    metadataBase,
    title: {
      template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME}`,
      default: title
    },
    description,
    keywords,
    authors: [{ name: author }],
    creator: author,
    publisher: process.env.NEXT_PUBLIC_APP_NAME,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons,

    // OpenGraph
    openGraph: {
      type,
      siteName: process.env.NEXT_PUBLIC_APP_NAME,
      title,
      description,
      ...(imageUrl && {
        images: [{
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${title} | ${description}`
        }]
      }),
      locale,
      alternateLocale: Object.keys(alternates ?? {}),
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime })
    },

    // Robots
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Verification
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
      yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
    },
  };
};