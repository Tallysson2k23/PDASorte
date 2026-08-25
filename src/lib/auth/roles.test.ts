import { describe, expect, it } from "vitest";
import { can, isRole } from "./roles";

describe("RBAC", () => {
  it("reconhece somente funções permitidas", () => {
    expect(isRole("superadmin")).toBe(true);
    expect(isRole("cliente")).toBe(false);
  });

  it("não concede gestão de usuários ao organizador", () => {
    expect(can("organizador", "users:manage")).toBe(false);
    expect(can("superadmin", "users:manage")).toBe(true);
  });
});
