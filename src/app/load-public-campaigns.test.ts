import { describe, expect, it, vi } from "vitest";
import { loadPublicCampaigns } from "./load-public-campaigns";

describe("carregamento de campanhas públicas", () => {
  it("devolve as campanhas quando o Firestore responde", async () => {
    const campaigns = [{ id: "campaign-1" }];
    const result = await loadPublicCampaigns(async () => campaigns as never, 10);
    expect(result).toEqual({ campaigns, dataUnavailable: false });
  });

  it("mantém a página disponível quando a consulta falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(loadPublicCampaigns(async () => { throw new Error("offline"); }, 10)).resolves.toEqual({ campaigns: [], dataUnavailable: true });
  });

  it("não espera indefinidamente por uma conexão inacessível", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const never = new Promise<never>(() => undefined);
    await expect(loadPublicCampaigns(() => never, 5)).resolves.toEqual({ campaigns: [], dataUnavailable: true });
  });
});
