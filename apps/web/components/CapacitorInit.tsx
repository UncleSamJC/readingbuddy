"use client";

import { useEffect } from "react";

export function CapacitorInit() {
  useEffect(() => {
    // Capacitor injects itself as window.Capacitor in the native WebView.
    // This code never runs in a normal browser build, so no npm dependency needed.
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: Record<string, unknown> } }).Capacitor;
    if (!cap?.isNativePlatform?.()) return;

    const StatusBar = cap.Plugins?.["StatusBar"] as {
      setStyle?: (o: { style: string }) => Promise<void>;
      setBackgroundColor?: (o: { color: string }) => Promise<void>;
    } | undefined;

    if (!StatusBar) return;
    StatusBar.setStyle?.({ style: "LIGHT" }).catch(() => {});
    StatusBar.setBackgroundColor?.({ color: "#ffffff" }).catch(() => {});
  }, []);

  return null;
}
