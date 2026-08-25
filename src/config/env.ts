import { z } from "zod";

const schema = z.object({
  INTERNAL_USE_ONLY: z.literal("true").default("true"),
  APP_TIME_ZONE: z.literal("America/Recife").default("America/Recife"),
});

export function getServerEnvironment() {
  return schema.parse({ INTERNAL_USE_ONLY: process.env.INTERNAL_USE_ONLY, APP_TIME_ZONE: process.env.APP_TIME_ZONE });
}

export function assertInternalUseOnly(): void {
  getServerEnvironment();
}
