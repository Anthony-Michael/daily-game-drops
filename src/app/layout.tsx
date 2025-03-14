import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://dailygamedrops.com'),
  title: {
    default: "Daily Game Drops - Best Game Deals & Free Games",
    template: "%s | Daily Game Drops"
  },
  description: "Find the best daily game deals, discounts, and free games across all platforms. Updated daily with the hottest gaming promotions.",
  keywords: ["game deals", "video games", "free games", "game discounts", "gaming", "PC games", "PlayStation games", "Xbox games"],
  creator: "Daily Game Drops Team",
  publisher: "Daily Game Drops",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dailygamedrops.com",
    siteName: "Daily Game Drops",
    title: "Daily Game Drops - Best Game Deals & Free Games",
    description: "Find the best daily game deals, discounts, and free games across all platforms. Updated daily with the hottest gaming promotions.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Daily Game Drops - Best Game Deals & Free Games"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Game Drops - Best Game Deals & Free Games",
    description: "Find the best daily game deals, discounts, and free games across all platforms.",
    creator: "@dailygamedrops",
    images: ["/og-image.jpg"]
  },
  applicationName: "Daily Game Drops",
  formatDetection: {
    telephone: false
  },
  verification: {
    // Add verification details if needed
    // google: "google-site-verification-code",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full dark:bg-gray-900 bg-gray-50 transition-colors duration-300`}
      >
        {children}
      </body>
    </html>
  );
}
