import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10" as Stripe.LatestApiVersion,
});

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "LifeOS Premium",
              description: "Unlimited habits, smart insights, and more",
            },
            unit_amount: 9900, // ₹99 in paise
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}&user_id=${payload.userId}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { userId: payload.userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session. Make sure Stripe keys are configured." },
      { status: 500 }
    );
  }
}
