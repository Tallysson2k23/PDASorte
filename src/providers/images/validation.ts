import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 5_000;
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function validateAndTransformImage(bytes: Uint8Array) {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) throw new Error("INVALID_SIZE");
  const buffer = Buffer.from(bytes);
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !allowed.has(detected.mime)) throw new Error("INVALID_TYPE");
  const image = sharp(buffer, { failOn: "error", limitInputPixels: MAX_DIMENSION * MAX_DIMENSION }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) throw new Error("INVALID_DIMENSIONS");
  const [card, thumbnail] = await Promise.all([
    image.clone().resize({ width: 1_600, height: 1_200, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer(),
    image.clone().resize({ width: 480, height: 360, fit: "cover", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
  ]);
  return { card, thumbnail, originalMime: detected.mime, originalSize: buffer.byteLength, width: metadata.width, height: metadata.height };
}
