import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { ImageStorageProvider, StoredImage } from "./types";
import { validateAndTransformImage } from "./validation";

export class LocalImageStorageProvider implements ImageStorageProvider {
  async store(input: { bytes: Uint8Array; uploadedBy: string }): Promise<StoredImage> {
    const transformed = await validateAndTransformImage(input.bytes);

    const id = randomUUID();
    const uploadRoot = path.resolve(process.cwd(), "public", "uploads");
    await mkdir(uploadRoot, { recursive: true });
    const cardName = `${id}-card.webp`;
    const thumbName = `${id}-thumb.webp`;
    const cardPath = path.join(uploadRoot, cardName);
    const thumbPath = path.join(uploadRoot, thumbName);
    if (!cardPath.startsWith(uploadRoot + path.sep) || !thumbPath.startsWith(uploadRoot + path.sep)) throw new Error("INVALID_PATH");

    await Promise.all([writeFile(cardPath, transformed.card, { flag: "wx" }), writeFile(thumbPath, transformed.thumbnail, { flag: "wx" })]);

    const result: StoredImage = { originalMime: transformed.originalMime, originalSize: transformed.originalSize, width: transformed.width, height: transformed.height, cardUrl: `/uploads/${cardName}`, thumbnailUrl: `/uploads/${thumbName}` };
    await adminDb().collection("media").doc(id).set({ ...result, provider: "local-development", uploadedBy: input.uploadedBy, createdAt: FieldValue.serverTimestamp() });
    await adminDb().collection("auditLogs").add({ actorId: input.uploadedBy, action: "media.uploaded", entity: `media/${id}`, after: result, createdAt: FieldValue.serverTimestamp() });
    return result;
  }
}
