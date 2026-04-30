"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Idle auto-logout: 30 min of no user activity or audio playback
  useEffect(() => {
    const reset = () => {
      if (!userRef.current) return;
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(async () => {
        if (userRef.current) {
          await supabase.auth.signOut();
          localStorage.removeItem("readbuddy-storage");
        }
      }, IDLE_TIMEOUT_MS);
    };

    const userEvents = ["mousemove", "keydown", "click", "touchstart", "scroll"] as const;
    userEvents.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    // TTS playback on any Audio element counts as activity
    document.addEventListener("play", reset, true);

    reset(); // start timer on mount

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      userEvents.forEach((e) => window.removeEventListener(e, reset));
      document.removeEventListener("play", reset, true);
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    // Supabase silently "succeeds" for existing emails but returns empty identities
    if (data.user && data.user.identities?.length === 0) {
      return { error: "This email is already registered. Please sign in instead." };
    }

    if (data.user && !data.user.email_confirmed_at) {
      return { needsConfirmation: true };
    }

    // Email confirmation disabled — auto sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return { error: signInError.message };

    return {};
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    // Clear persisted store so next user starts fresh
    localStorage.removeItem("readbuddy-storage");
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
