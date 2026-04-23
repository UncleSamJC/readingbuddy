import Link from "next/link";
import { BookOpen, MessageCircle, Volume2, Star, ArrowRight, Check } from "lucide-react";
import { SubscribeButton } from "@/components/subscribe-button";

const features = [
  {
    icon: BookOpen,
    title: "Book-Centered Learning",
    desc: "Upload any English book (up to 5 chapters). Teacher Roz knows every word and helps your child understand the story deeply.",
  },
  {
    icon: MessageCircle,
    title: "AI Conversation",
    desc: "Your child can ask questions, discuss the plot, and explore vocabulary — in a safe, guided conversation with no distractions.",
  },
  {
    icon: Volume2,
    title: "Read-Along & Pronunciation",
    desc: "Native-quality text-to-speech and real-time pronunciation feedback so kids build speaking confidence chapter by chapter.",
  },
  {
    icon: Star,
    title: "Vocabulary Practice",
    desc: "Mark interesting words while reading. Revisit them with flashcards, fill-in-the-blank, and read-aloud exercises.",
  },
];

const steps = [
  {
    number: "01",
    title: "Pick a book",
    desc: "Enter any English book your child is reading. Add chapters one at a time — it takes just a few minutes.",
  },
  {
    number: "02",
    title: "Read with Roz",
    desc: "Teacher Roz reads along, answers questions, and gently corrects pronunciation in real time.",
  },
  {
    number: "03",
    title: "Practice & grow",
    desc: "Review vocabulary, replay sentences, and track progress — all in one place.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: false,
    features: [
      "5 chapters total",
      "30 AI sessions / month",
      "Text-to-speech playback",
      "Vocabulary flashcards",
    ],
    cta: "Get Started",
    ctaHref: "https://app.readwithroz.com",
    ctaStyle: "outline" as const,
  },
  {
    name: "Plus",
    price: "$10",
    period: "/ month",
    highlight: true,
    features: [
      "60 chapters total",
      "200 AI sessions / month",
      "Text-to-speech playback",
      "Vocabulary flashcards",
      "Pronunciation feedback",
    ],
    cta: "Subscribe",
    ctaHref: "#",
    ctaStyle: "solid" as const,
  },
  {
    name: "Pro",
    price: "$15",
    period: "/ month",
    highlight: false,
    features: [
      "120 chapters total",
      "Unlimited AI sessions",
      "Text-to-speech playback",
      "Vocabulary flashcards",
      "Pronunciation feedback",
      "Priority support",
    ],
    cta: "Subscribe",
    ctaHref: "#",
    ctaStyle: "outline" as const,
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-warm-muted border-b border-warm-border">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-light text-brand rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            Designed for Chinese-American families
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6 text-warm-text">
            Your Child&apos;s AI
            <br />
            Reading Partner
          </h1>
          <p className="text-lg md:text-xl text-warm-subtle max-w-2xl mx-auto mb-10 leading-relaxed">
            Read With Roz helps children aged 6–12 read English books with confidence.
            Teacher Roz guides every session — answering questions, correcting
            pronunciation, and making reading genuinely fun.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://app.readwithroz.com"
              className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white rounded-full px-8 py-3.5 text-base font-semibold transition-colors"
            >
              Start Free <ArrowRight size={16} />
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center bg-white hover:bg-warm-muted border border-warm-border text-warm-text rounded-full px-8 py-3.5 text-base font-semibold transition-colors"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-warm-text mb-3">
              Everything a young reader needs
            </h2>
            <div className="w-12 h-1 bg-brand rounded-full" />
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex gap-5 p-6 rounded-2xl border border-warm-border hover:border-brand/40 hover:bg-brand-light/30 transition-colors"
              >
                <div className="flex-shrink-0 w-11 h-11 bg-warm-muted rounded-xl flex items-center justify-center">
                  <f.icon size={20} className="text-brand" />
                </div>
                <div>
                  <h3 className="font-semibold text-warm-text mb-1.5">{f.title}</h3>
                  <p className="text-sm text-warm-subtle leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-warm-muted border-y border-warm-border py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-warm-text mb-3">
              How it works
            </h2>
            <div className="w-12 h-1 bg-brand rounded-full" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col gap-4">
                <div className="text-4xl font-bold text-brand/20 leading-none">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold text-warm-text text-lg mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-warm-subtle leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-warm-text mb-3">
              Simple, honest pricing
            </h2>
            <div className="w-12 h-1 bg-brand rounded-full mx-auto mb-4" />
            <p className="text-warm-subtle">
              Start free. Upgrade when your child needs more books and sessions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={[
                  "rounded-2xl p-7 flex flex-col",
                  plan.highlight
                    ? "border-2 border-brand shadow-lg shadow-brand/10"
                    : "border border-warm-border",
                ].join(" ")}
              >
                {plan.highlight && (
                  <div className="bg-brand text-white text-xs font-semibold rounded-full px-3 py-1 w-fit mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-warm-text mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-warm-text">{plan.price}</span>
                  <span className="text-sm text-warm-subtle">{plan.period}</span>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-warm-text">
                      <Check size={15} className="text-brand mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.name === "Free" ? (
                  <a
                    href={plan.ctaHref}
                    className="block text-center rounded-full py-3 text-sm font-semibold transition-colors border border-warm-border hover:bg-warm-muted text-warm-text"
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <SubscribeButton
                    plan={plan.name as "Plus" | "Pro"}
                    className={[
                      "w-full block text-center rounded-full py-3 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60",
                      plan.ctaStyle === "solid"
                        ? "bg-brand hover:bg-brand-dark text-white"
                        : "border border-warm-border hover:bg-warm-muted text-warm-text",
                    ].join(" ")}
                  >
                    {plan.cta}
                  </SubscribeButton>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-warm-subtle mt-10">
            All paid plans include a{" "}
            <strong className="text-warm-text">7-day free trial</strong>. No credit card required. Cancel anytime.{" "}
            Questions?{" "}
            <a href="mailto:hello@readwithroz.com" className="text-brand hover:underline font-medium">
              hello@readwithroz.com
            </a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to start reading together?
          </h2>
          <p className="text-white/75 mb-8 text-base">
            Free plan available. No credit card required.
          </p>
          <a
            href="https://app.readwithroz.com"
            className="inline-flex items-center gap-2 bg-white text-brand hover:bg-warm-muted rounded-full px-8 py-3.5 text-base font-semibold transition-colors"
          >
            Get Started Free <ArrowRight size={16} />
          </a>
        </div>
      </section>
    </>
  );
}
