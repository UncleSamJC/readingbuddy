"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const consentKey = (userId: string) => `ai_data_consent_v1_${userId}`;

export function AIConsentDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!localStorage.getItem(consentKey(user.id))) {
      setOpen(true);
    }
  }, [user]);

  function handleAgree() {
    if (!user) return;
    localStorage.setItem(consentKey(user.id), "true");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-sm rounded-2xl px-6 py-6"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            Before You Continue
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-600 mt-1">
          Read with Roz uses AI services to power the reading tutor. To use
          this app, your content is shared with the following third-party
          services:
        </p>

        <ul className="mt-3 space-y-3 text-sm">
          <li className="flex gap-2">
            <span className="mt-0.5 text-blue-500 shrink-0">●</span>
            <span>
              <strong>Anthropic (Claude AI)</strong> — Your chat messages and
              book text are sent to Anthropic to generate Roz&apos;s tutoring
              responses.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 text-green-500 shrink-0">●</span>
            <span>
              <strong>OpenAI (Text-to-Speech)</strong> — Sentence text is sent
              to OpenAI to generate read-aloud audio. No account information is
              included.
            </span>
          </li>
        </ul>

        <p className="text-sm text-gray-600 mt-3">
          Neither service uses your data to train AI models. See our{" "}
          <Link
            href="/privacy"
            className="underline text-blue-600"
            target="_blank"
          >
            Privacy Policy
          </Link>{" "}
          for full details.
        </p>

        <Button
          className="mt-5 w-full rounded-xl"
          onClick={handleAgree}
        >
          I Understand &amp; Agree
        </Button>
      </DialogContent>
    </Dialog>
  );
}
