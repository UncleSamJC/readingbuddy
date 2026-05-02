"use client";

import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "1 book at a time",
      "Up to 5 chapters",
      "20 AI chat sessions / month",
      "Text-to-speech playback",
      "Vocabulary marking",
    ],
    cta: "Get Started Free",
    plan: null,
    highlighted: false,
  },
  {
    name: "Plus",
    price: "$10",
    period: "CAD / month",
    description: "For regular readers",
    features: [
      "1 books at a time",
      "Up to 60 chapters",
      "500 AI chat sessions / month",
      "TTS voices & speeds",
      "Vocabulary flashcards & exercises",
    ],
    cta: "Subscribe to Plus",
    plan: "Plus",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$15",
    period: "CAD / month",
    description: "For the serious reader",
    features: [
      "1 books at a time",
      "Up to 120 chapters",
      "1000 AI chat sessions",
      "TTS voices & speeds",
      "Vocabulary flashcards & exercises",
    ],
    cta: "Subscribe to Pro",
    plan: "Pro",
    highlighted: false,
  },
];

export function PricingCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((p) => (
        <div
          key={p.name}
          className={`rounded-2xl border p-7 flex flex-col ${
            p.highlighted
              ? "border-brand bg-brand/5 shadow-md"
              : "border-warm-border bg-white"
          }`}
        >
          {p.highlighted && (
            <span className="self-start mb-3 text-xs font-semibold bg-brand text-white rounded-full px-3 py-1">
              Most Popular
            </span>
          )}
          <h3 className="text-lg font-bold text-warm-text">{p.name}</h3>
          <p className="text-sm text-warm-subtle mt-1 mb-4">{p.description}</p>
          <div className="mb-6">
            <span className="text-3xl font-bold text-warm-text">{p.price}</span>
            <span className="text-sm text-warm-subtle ml-1">{p.period}</span>
          </div>
          <ul className="space-y-2.5 flex-1">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-warm-text">
                <Check size={15} className="text-brand mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
