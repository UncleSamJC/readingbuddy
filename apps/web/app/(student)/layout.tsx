"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { AIConsentDialog } from "@/components/AIConsentDialog";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />
      <AIConsentDialog />
      {/* Scroll container — body is overflow:hidden so bounce comes from here, not WKWebView */}
      <div
        id="main-scroll"
        className="h-full overflow-y-auto overscroll-none"
      >
        <div
          className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-6"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
