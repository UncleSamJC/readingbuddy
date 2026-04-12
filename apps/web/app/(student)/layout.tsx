"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";

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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />
      <div
        className="mx-auto max-w-4xl px-3 pb-4 sm:px-4 sm:pb-6"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + var(--navbar-h) + 1rem)' }}
      >
        {children}
      </div>
    </>
  );
}
