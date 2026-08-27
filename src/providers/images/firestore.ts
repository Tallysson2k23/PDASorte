import "server-only";

import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { ImageStorageProvider, StoredImage } from "./types";
import { validateAndTransformImage } from "./validation";

const MAX_STORED_VARIANT_BYTES = 900 * 1024;

export class FirestoreImageStorageProvider implements ImageStorageProvider {
  async store(input: { bytes: Uint8Array; uploadedBy: string }): Promise<StoredImage> {
    const transformed = await validateAndTransformImage(input.bytes);
    if (transformed.card.byteLength > MAX_STORED_VARIANT_BYTES || transformed.thumbnail.byteLength > MAX_STORED_VARIANT_BYTES) {
      throw new Error("STORED_IMAGE_TOO_LARGE");
    }

    const id = randomUUID();
    const result: StoredImage = {
      originalMime: transformed.originalMime,
      originalSize: transformed.originalSize,
      width: transformed.width,
      height: transformed.height,
      cardUrl: `/api/media/${id}/card`,
      thumbnailUrl: `/api/media/${id}/thumb`,
    };
    const db = adminDb();
    const now = FieldValue.serverTimestamp();
    await db.runTransaction(async (transaction) => {
      transaction.create(db.collection("media").doc(id), { ...result, provider: "firestore", uploadedBy: input.uploadedBy, createdAt: now });
      transaction.create(db.collection("media").doc(id).collection("variants").doc("card"), { bytes: transformed.card, contentType: "image/webp" });
      transaction.create(db.collection("media").doc(id).collection("variants").doc("thumb"), { bytes: transformed.thumbnail, contentType: "image/webp" });
      transaction.create(db.collection("auditLogs").doc(), { actorId: input.uploadedBy, action: "media.uploaded", entity: `media/${id}`, after: result, createdAt: now });
    });
    return result;
  }
}
