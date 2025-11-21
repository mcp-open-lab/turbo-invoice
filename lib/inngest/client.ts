/**
 * Inngest client configuration
 */

import { Inngest } from "inngest";

// Create Inngest client
// In production, uses INNGEST_EVENT_KEY from env (set by Vercel integration)
// In local dev, uses Inngest Dev Server (no key needed)
export const inngest = new Inngest({
  id: "turbo-invoice",
  name: "Turbo Invoice",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

