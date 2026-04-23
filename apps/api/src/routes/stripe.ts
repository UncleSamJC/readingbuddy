import Stripe from "stripe";
import type { FastifyInstance } from "fastify";
import { supabase } from "../db/supabase.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function updatePlanByEmail(
  email: string,
  plan: string,
  customerId: string,
  subscriptionId: string
) {
  // Use RPC to find user_id by email (auth.users is not directly queryable)
  const { data: userId, error } = await supabase.rpc("get_user_id_by_email", {
    p_email: email,
  });
  if (error || !userId) {
    console.error(`[stripe] User not found for email: ${email}`, error);
    return;
  }
  await supabase
    .from("user_settings")
    .update({ plan, stripe_customer_id: customerId, stripe_subscription_id: subscriptionId })
    .eq("user_id", userId);
}

async function downgradePlanByCustomer(customerId: string) {
  await supabase
    .from("user_settings")
    .update({ plan: "Free", stripe_subscription_id: null })
    .eq("stripe_customer_id", customerId);
}

export async function stripeRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/webhook/stripe",
    { config: { rawBody: true } },
    async (request, reply) => {
      const sig = request.headers["stripe-signature"] as string;
      const rawBody = (request as any).rawBody as Buffer;

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err: any) {
        console.error("[stripe] Webhook signature invalid:", err.message);
        return reply.status(400).send({ error: "Invalid signature" });
      }

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const email = session.customer_details?.email;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;
          const plan = session.metadata?.plan;

          if (email && plan && customerId && subscriptionId) {
            await updatePlanByEmail(email, plan, customerId, subscriptionId);
            console.log(`[stripe] Upgraded ${email} to ${plan}`);
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await downgradePlanByCustomer(subscription.customer as string);
          console.log(`[stripe] Downgraded customer ${subscription.customer} to Free`);
          break;
        }

        default:
          break;
      }

      return reply.send({ received: true });
    }
  );
}
