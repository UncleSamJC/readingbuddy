import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <CheckCircle size={56} className="text-brand" />
        </div>
        <h1 className="text-2xl font-bold text-warm-text mb-3">
          You&apos;re all set!
        </h1>
        <p className="text-warm-subtle mb-8 leading-relaxed">
          Your subscription is now active. Open the app and your new plan will be
          reflected automatically. Happy reading!
        </p>
        <a
          href="https://app.readingbuddy.app"
          className="inline-block bg-brand hover:bg-brand-dark text-white rounded-full px-8 py-3 text-sm font-semibold transition-colors"
        >
          Open ReadingBuddy
        </a>
        <p className="mt-4 text-xs text-warm-subtle">
          Questions?{" "}
          <a href="mailto:hello@readingbuddy.app" className="text-brand hover:underline">
            hello@readingbuddy.app
          </a>
        </p>
      </div>
    </div>
  );
}
