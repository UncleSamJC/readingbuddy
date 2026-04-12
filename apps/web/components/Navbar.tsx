"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Home, BookOpen, Mic, LogOut } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/books/setup", label: "My Book", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: Mic },
];

export function Navbar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-3 sm:h-14 sm:px-4">
        <Link href="/" className="flex items-center text-lg font-bold text-primary sm:text-xl">
          Read with Roz
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg p-2 text-sm font-medium transition-colors hover:bg-secondary sm:px-3 sm:py-2 sm:justify-start",
                  isActive
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4 sm:hidden md:block" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => signOut()}
            className="ml-1 flex items-center justify-center rounded-lg p-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary sm:px-3 sm:py-2"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
