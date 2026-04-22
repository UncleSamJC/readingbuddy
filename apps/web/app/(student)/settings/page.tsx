"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore, TTS_VOICES, TTS_SPEED_OPTIONS, ROZ_LANGUAGES, type TtsVoiceId, type RozLanguage } from "@/lib/store";
import { fetchTtsAudio, deleteAccount } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Volume2, Check, Crown } from "lucide-react";
import { PLAN_CHAPTER_LIMITS, type UserPlan } from "@readbuddy/shared-types";

const PLAN_COLOR: Record<UserPlan, string> = {
  Free: "text-muted-foreground",
  Plus: "text-blue-600",
  Pro:  "text-amber-500",
};

const PREVIEW_TEXT = "Hello! I am Roz, your reading teacher. Let's read together!";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const ttsVoice = useAppStore((s) => s.ttsVoice);
  const ttsSpeed = useAppStore((s) => s.ttsSpeed);
  const userPlan = useAppStore((s) => s.userPlan);
  const rozLanguage = useAppStore((s) => s.rozLanguage);
  const setTtsVoice = useAppStore((s) => s.setTtsVoice);
  const setTtsSpeed = useAppStore((s) => s.setTtsSpeed);
  const setRozLanguage = useAppStore((s) => s.setRozLanguage);

  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canConfirmDelete = deleteConfirmText.trim().toUpperCase() === "DELETE";

  async function handleDeleteAccount() {
    if (!canConfirmDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      if (user?.id) {
        localStorage.removeItem(`ai_data_consent_v1_${user.id}`);
      }
      await supabase.auth.signOut();
      router.replace("/login");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  }

  const handlePreview = useCallback(async (voiceId: string) => {
    // Stop current preview
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setPreviewingVoice(voiceId);
    try {
      const url = await fetchTtsAudio(PREVIEW_TEXT, voiceId, ttsSpeed);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setPreviewingVoice(null); audioRef.current = null; };
      audio.onerror = () => { setPreviewingVoice(null); audioRef.current = null; };
      await audio.play();
    } catch {
      setPreviewingVoice(null);
    }
  }, [ttsSpeed]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Plan card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-5 w-5 text-amber-500" />
            Your Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-xl border border-primary bg-primary/5 px-4 py-4">
            <div>
              <p className={cn("text-xl font-bold", PLAN_COLOR[userPlan])}>{userPlan}</p>
              <p className="text-sm text-muted-foreground">
                Up to {PLAN_CHAPTER_LIMITS[userPlan]} chapters
              </p>
            </div>
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              Current
            </span>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            To manage your subscription, visit readingbuddy.app
          </p>
        </CardContent>
      </Card>

      {/* Voice selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voice</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose a voice for reading aloud. Tap the play button to preview.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TTS_VOICES.map((v) => {
            const isSelected = ttsVoice === v.id;
            const isPreviewing = previewingVoice === v.id;

            return (
              <div
                key={v.id}
                onClick={() => setTtsVoice(v.id as TtsVoiceId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") setTtsVoice(v.id as TtsVoiceId); }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{v.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{v.desc}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(v.id);
                  }}
                >
                  <Volume2 className={cn(
                    "h-4 w-4",
                    isPreviewing && "animate-pulse text-primary"
                  )} />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => { if (!isDeleting) setShowDeleteDialog(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account, all books, chapters, and learning data. This action{" "}
              <span className="font-semibold text-destructive">cannot be undone</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={isDeleting}
              autoCapitalize="characters"
            />
            {deleteError && (
              <p className="text-sm font-medium text-destructive">{deleteError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!canConfirmDelete || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete My Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reading card: language + speed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Language selector */}
          <div>
            <p className="mb-2 text-sm font-medium">
              Teacher Roz will explain and answer questions in
            </p>
            <select
              value={rozLanguage}
              onChange={(e) => setRozLanguage(e.target.value as RozLanguage)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {ROZ_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Speed */}
          <div>
            <p className="mb-2 text-sm font-medium">Reading speed</p>
            <div className="flex gap-2">
              {TTS_SPEED_OPTIONS.map((opt) => {
                const isSelected = ttsSpeed === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTtsSpeed(opt.value)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-3 text-center text-sm font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    {opt.label}
                    <p className="mt-0.5 text-xs text-muted-foreground">{opt.value}x</p>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account — always last */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteError(null);
              setShowDeleteDialog(true);
            }}
          >
            Delete Account
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Permanently deletes your account and all associated data. This action cannot be undone.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
