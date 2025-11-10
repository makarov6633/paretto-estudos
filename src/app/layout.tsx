import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Inter, Work_Sans, Literata } from "next/font/google";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

// Keep brand headings on Inter; body font via next/font (Work Sans)
const inter = Inter({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});
const workSans = Work_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});
// Reader font optimized for long-form reading (similar to Kindle's Bookerly)
const literata = Literata({
  variable: "--font-reader",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Agentic Coding Boilerplate",
  description:
    "Complete agentic coding boilerplate with authentication, database, AI integration, and modern tooling - perfect for building AI-powered applications and autonomous agents by Leon van Zyl",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

// Viewport meta for proper mobile scaling
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${workSans.variable} ${literata.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader />
          {children}
          <SiteFooter />
          <OnboardingModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
