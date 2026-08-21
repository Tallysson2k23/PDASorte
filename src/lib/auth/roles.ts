export const roles = ["superadmin", "admin", "financeiro", "operador", "vendedor", "auditor"] as const;
export type Role = (typeof roles)[number];

export const permissions = {
  superadmin: ["admin:access", "users:manage", "settings:manage", "campaigns:manage", "media:upload", "audit:read"],
  admin: ["admin:access", "settings:manage", "campaigns:manage", "media:upload", "audit:read"],
  financeiro: ["admin:access", "finance:read", "audit:read"],
  operador: ["admin:access", "campaigns:manage", "media:upload"],
  vendedor: ["admin:access", "seller:self:read"],
  auditor: ["admin:access", "audit:read"],
} as const satisfies Record<Role, readonly string[]>;

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

export function can(role: Role, permission: string): boolean {
  return permissions[role].some((candidate) => candidate === permission);
}
