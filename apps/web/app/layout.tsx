import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nunito } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/auth-context";
import { CapacitorInit } from "@/components/CapacitorInit";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-sans" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Read with Roz - AI Reading Tutor",
  description: "AI-powered English reading tutor for children",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Read with Roz",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", nunito.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased touch-manipulation">
        <CapacitorInit />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
