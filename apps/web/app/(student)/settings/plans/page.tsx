"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { PLAN_CHAPTER_LIMITS, PLAN_CHAT_LIMITS, type UserPlan } from "@readbuddy/shared-types";
import { IAP_PRODUCTS, purchasePlan, restorePurchases, type IAPProductId } from "@/lib/iap";
import { Check, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS: {
  id: UserPlan;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  productId: IAPProductId | null;
  highlighted: boolean;
}[] = [
  {
    id: "Free",
    price: "$0",
    period: "forever",
    tagline: "Perfect for getting started",
    features: [
      `Up to ${PLAN_CHAPTER_LIMITS.Free} chapters`,
      `${PLAN_CHAT_LIMITS.Free} AI chats / month`,
      "Text-to-speech playback",
      "Vocabulary marking",
    ],
    productId: null,
    highlighted: false,
  },
  {
    id: "Plus",
    price: "$9.99",
    period: "CAD / month",
    tagline: "For regular readers",
    features: [
      `Up to ${PLAN_CHAPTER_LIMITS.Plus} chapters`,
      `${PLAN_CHAT_LIMITS.Plus} AI chats / month`,
      "TTS voices & speeds",
      "Vocabulary flashcards & exercises",
    ],
    productId: IAP_PRODUCTS.PLUS,
    highlighted: true,
  },
  {
    id: "Pro",
    price: "$14.99",
    period: "CAD / month",
    tagline: "For the serious reader",
    features: [
      `Up to ${PLAN_CHAPTER_LIMITS.Pro} chapters`,
      `${PLAN_CHAT_LIMITS.Pro} AI chats / month`,
      "TTS voices & speeds",
      "Vocabulary flashcards & exercises",
    ],
    productId: IAP_PRODUCTS.PRO,
    highlighted: false,
  },
];

export default function PlansPage() {
  const router = useRouter();
  const userPlan = useAppStore((s) => s.userPlan);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase(productId: IAPProductId) {
    setLoading(productId);
    setError(null);
    try {
      await purchasePlan(productId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleRestore() {
    setLoading("restore");
    setError(null);
    try {
      await restorePurchases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  function openAppleSubscriptions() {
    window.open("https://apps.apple.com/account/subscriptions", "_blank");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Choose Your Plan</h1>
      </div>

      {/* Plan cards */}
      <div className="space-y-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === userPlan;
          const isUpgrade =
            (userPlan === "Free" && plan.id !== "Free") ||
            (userPlan === "Plus" && plan.id === "Pro");
          const isDowngrade =
            (userPlan === "Pro" && plan.id !== "Pro") ||
            (userPlan === "Plus" && plan.id === "Free");

          return (
            <div
              key={plan.id}
              className={cn(
                "rounded-2xl border p-5 flex flex-col gap-4 transition-colors",
                plan.highlighted && !isCurrent
                  ? "border-amber-400 bg-amber-50/60"
                  : isCurrent
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  {plan.highlighted && (
                    <span className="mb-1.5 inline-block rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  )}
                  <h2 className="text-lg font-bold">{plan.id}</h2>
                  <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                </div>
                {isCurrent && (
                  <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Current
                  </span>
                )}
              </div>

              {/* Price */}
              <div>
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="ml-1 text-sm text-muted-foreground">{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Action */}
              {isCurrent ? (
                <Button variant="outline" disabled className="w-full rounded-full">
                  Current Plan
                </Button>
              ) : isUpgrade && plan.productId ? (
                <Button
                  className="w-full rounded-full bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={!!loading}
                  onClick={() => handlePurchase(plan.productId!)}
                >
                  {loading === plan.productId ? "Processing..." : `Subscribe to ${plan.id}`}
                </Button>
              ) : isDowngrade ? (
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={openAppleSubscriptions}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Manage in Settings
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      {/* Footer actions */}
      <div className="space-y-3 pt-2">
        {userPlan !== "Free" && (
          <p className="text-center text-xs text-muted-foreground">
            To cancel or downgrade, go to{" "}
            <button
              className="underline underline-offset-2"
              onClick={openAppleSubscriptions}
            >
              Apple Subscriptions
            </button>
          </p>
        )}
        <button
          className="w-full text-center text-sm text-muted-foreground underline underline-offset-2"
          disabled={loading === "restore"}
          onClick={handleRestore}
        >
          {loading === "restore" ? "Restoring..." : "Restore Purchases"}
        </button>
      </div>
    </div>
  );
}
