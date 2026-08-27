/**
 * lib/paddle.ts
 * Server-side Paddle SDK client
 */
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

const paddleApiKey = process.env.PADDLE_API_KEY || "";
const isProduction =
  (process.env.NEXT_PUBLIC_PADDLE_ENV || "").toLowerCase() === "production";

export const paddle = new Paddle(paddleApiKey, {
  environment: isProduction ? Environment.production : Environment.sandbox,
});
