/**
 * lib/paddle-plans.ts
 * NicheFX Pricing Plans & Paddle Price IDs Configuration.
 */

export interface PlanConfig {
  name: string;
  price: string;
  limit: number;
  description: string;
  features: string[];
  popular?: boolean;
  priceId?: string;
}

export const PLANS_CONFIG: PlanConfig[] = [
  {
    name: "Free",
    price: "0",
    limit: 20,
    description: "Ideal for trying out the platform",
    features: [
      "20 generations per month",
      "Access to standard AI models",
      "Standard quality output",
      "Community support",
    ],
  },
  {
    name: "Starter",
    price: "9",
    limit: 150,
    description: "For individual creators and freelancers",
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || "",
    features: [
      "150 generations per month",
      "Standard + mid-tier AI models",
      "High quality output",
      "Private collections",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "19",
    limit: 400,
    popular: true,
    description: "Best for professionals & power users",
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || "",
    features: [
      "400 generations per month",
      "Access to all advanced AI models",
      "Ultra high quality output",
      "Priority generation queue",
      "Commercial usage rights",
    ],
  },
];

export function getPlanConfig(name: string): PlanConfig {
  return (
    PLANS_CONFIG.find((p) => p.name.toLowerCase() === name.toLowerCase()) ||
    PLANS_CONFIG[0]
  );
}

export function getPlanByPriceId(priceId: string): PlanConfig | null {
  if (!priceId) return null;
  return PLANS_CONFIG.find((p) => p.priceId === priceId) || null;
}
