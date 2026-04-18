"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ConsentDialogProps {
  open: boolean;
  title: string;
  description: string;
  onAgree: () => void;
  onCancel: () => void;
}

export function ConsentDialog({ open, title, description, onAgree, onCancel }: ConsentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm rounded-2xl px-6 py-6" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        <p className="text-sm text-gray-600 mt-1">
          For more details please see our{" "}
          <Link href="/privacy" target="_blank" className="underline text-blue-600">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="text-sm text-gray-600 mt-1">Do you agree?</p>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={onAgree}>
            Agree
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ttsConsentKey = (userId: string) => `tts_consent_v1_${userId}`;
export const chatConsentKey = (userId: string) => `chat_consent_v1_${userId}`;
