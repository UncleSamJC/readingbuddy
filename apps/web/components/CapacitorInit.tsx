"use client";

import { useEffect } from "react";

export function CapacitorInit() {
  useEffect(() => {
    // Only runs in Capacitor native app environment
    if (typeof window === "undefined") return;

    async function initStatusBar() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Light }); // dark text on light background
        await StatusBar.setBackgroundColor({ color: "#ffffff" });
      } catch {
        // Not in Capacitor environment, ignore
      }
    }

    initStatusBar();
  }, []);

  return null;
}
