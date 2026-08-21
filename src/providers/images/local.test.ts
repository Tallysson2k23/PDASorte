import { describe, expect, it } from "vitest";
import { validateAndTransformImage } from "./validation";

describe("upload local", () => {
  it("rejeita SVG mesmo quando declarado como imagem", async () => {
    const bytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    await expect(validateAndTransformImage(bytes)).rejects.toThrow("INVALID_TYPE");
  });

  it("rejeita arquivo acima do limite antes de processar", async () => {
    await expect(validateAndTransformImage(new Uint8Array(5 * 1024 * 1024 + 1))).rejects.toThrow("INVALID_SIZE");
  });
});
