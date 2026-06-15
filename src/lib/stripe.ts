import Stripe from "stripe";

// Server-side Stripe instance. Only import in API routes / server code.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
