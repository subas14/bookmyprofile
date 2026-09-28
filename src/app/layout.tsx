import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { THEME_INIT_SCRIPT } from "@/components/theme-toggle";

/**
 * Inter for UI text (optical sizing on, so tight headlines stay legible) and
 * JetBrains Mono for references, tokens and tabular figures.
 */
const sans = Inter({
  variable: "--font-sans-app",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-app",
  subsets: ["latin"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TAGLINE = "My audience will help you grow your product.";
const DESCRIPTION =
  "Book advertising placements on a real creator profile: your product link " +
  "in the bio, half of the cover photo, and dedicated promo posts. Transparent " +
  "audience analytics, published monthly prices, instant checkout.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `BookMyProfile · ${TAGLINE}`,
    template: "%s · BookMyProfile",
  },
  description: DESCRIPTION,
  keywords: [
    "creator advertising",
    "X profile advertising",
    "bio link sponsorship",
    "cover photo advertising",
    "influencer marketing",
    "founder marketing",
    "SaaS growth",
  ],
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "BookMyProfile",
    title: `BookMyProfile · ${TAGLINE}`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `BookMyProfile · ${TAGLINE}`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the stored theme before first paint to prevent a flash. */}
        <script
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body
        className={`${sans.variable} ${mono.variable} flex min-h-screen flex-col antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-fg"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}

