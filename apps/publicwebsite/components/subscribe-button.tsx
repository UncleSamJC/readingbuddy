"use client";

import { useState } from "react";

interface SubscribeButtonProps {
  plan: "Plus" | "Pro";
  className?: string;
  children: React.ReactNode;
}

export function SubscribeButton({ plan, className, children }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className={className}>
      {loading ? "Redirecting…" : children}
    </button>
  );
}
