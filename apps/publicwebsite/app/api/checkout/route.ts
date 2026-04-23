import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { plan } = await req.json();

  if (!["Plus", "Pro"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const PRICE_IDS: Record<string, string> = {
    Plus: process.env.STRIPE_PRICE_PLUS!,
    Pro: process.env.STRIPE_PRICE_PRO!,
  };

  if (!PRICE_IDS[plan]) {
    return NextResponse.json({ error: "Price not configured" }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    metadata: { plan },
    subscription_data: { metadata: { plan } },
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/#pricing`,
  });

  return NextResponse.json({ url: session.url });
}
