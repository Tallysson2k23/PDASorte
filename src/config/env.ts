import { z } from "zod";

const schema = z.object({ DEMO_MODE: z.enum(["true", "false"]).default("true") });

export function getServerEnvironment() {
  return schema.parse({ DEMO_MODE: process.env.DEMO_MODE });
}

export function assertDemoMode(): void {
  if (getServerEnvironment().DEMO_MODE !== "true") {
    throw new Error("Operação real bloqueada: mantenha DEMO_MODE=true até a aprovação jurídica e regulatória.");
  }
}
