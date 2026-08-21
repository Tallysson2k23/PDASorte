export type StoredImage = {
  originalMime: string;
  originalSize: number;
  width: number;
  height: number;
  cardUrl: string;
  thumbnailUrl: string;
};

export interface ImageStorageProvider {
  store(input: { bytes: Uint8Array; uploadedBy: string }): Promise<StoredImage>;
}
