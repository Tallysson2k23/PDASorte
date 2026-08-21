import "server-only";

import { can } from "./roles";
import { getAdminActor, type AdminActor } from "./session";

export async function requireAdminPermission(permission: string): Promise<AdminActor> {
  const actor = await getAdminActor();
  if (!actor || !can(actor.role, permission)) throw new Error("FORBIDDEN");
  return actor;
}
