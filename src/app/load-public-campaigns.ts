import type { CampaignDTO } from "@/modules/campaigns/schema";

type PublicCampaignResult = {
  campaigns: CampaignDTO[];
  dataUnavailable: boolean;
};

export async function loadPublicCampaigns(
  loader: () => Promise<CampaignDTO[]>,
  timeoutMs = 4_000,
): Promise<PublicCampaignResult> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const campaigns = await Promise.race([
      loader(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("FIRESTORE_TIMEOUT")), timeoutMs);
      }),
    ]);
    return { campaigns, dataUnavailable: false };
  } catch (error) {
    console.error("Falha ao carregar campanhas públicas", error);
    return { campaigns: [], dataUnavailable: true };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
