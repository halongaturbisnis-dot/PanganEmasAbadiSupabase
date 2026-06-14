import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { config } from '../utils/config.js';
import { fileProcessor } from '../libs/fileProcessor.js';
import { getS3Client } from '../libs/storageClient.js';

/**
 * STORAGE SERVICE
 * Handles interactions with Tigris (S3-Compatible) Object Storage.
 * Implements client-side compression and orphan file prevention.
 */

export const storageService = {
  /**
   * Uploads a file to Tigris with optional compression and public access.
   */
  async upload(file: File, path: string = 'uploads'): Promise<{ url: string; key: string }> {
    if (typeof window === 'undefined') {
      throw new Error('[Storage Error] Upload is only supported in browser environment');
    }

    // 1. Client-side compression (per StorageRule.md)
    const processedBlob = await fileProcessor.process(file);
    const finalFile = processedBlob instanceof Blob ? new File([processedBlob], file.name, { type: processedBlob.type }) : processedBlob;

    const timestamp = Date.now();
    const key = `${path}/${timestamp}-${finalFile.name}`;
    
    console.log(`[Storage] Uploading ${finalFile.name} to Tigris at ${key}`);

    const client = getS3Client();
    const arrayBuffer = await finalFile.arrayBuffer();

    try {
      await client.send(new PutObjectCommand({
        Bucket: config.tigris.bucket,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: finalFile.type,
      }));

      // Because the bucket is Private, use the internal backend proxy URL
      const imageUrl = `/api/images/${key}`;
      
      return { url: imageUrl, key };
    } catch (error) {
      console.error('[Storage Error] Upload failed:', error);
      throw error;
    }
  },

  /**
   * Deletes a file from storage to prevent "orphan files".
   */
  async delete(key: string): Promise<void> {
    if (!key) return;

    // DEFENSIVE: If key is a full URL, extract the actual S3 Key
    // Pattern: /api/images/profile-photos/file.jpg -> profile-photos/file.jpg
    let actualKey = key;
    if (key.includes('/api/images/')) {
      actualKey = key.split('/api/images/').pop() || key;
    }
    
    console.log(`[Storage] Permanently deleting file with key: ${actualKey}`);
    
    const client = getS3Client();
    try {
      await client.send(new DeleteObjectCommand({
        Bucket: config.tigris.bucket,
        Key: actualKey,
      }));
    } catch (error) {
      console.warn('[Storage Warning] Delete failed (might be already gone):', error);
    }
  },

  /**
   * Specialized method to handle file updates.
   * Deletes the old file if it exists and a new one is provided.
   */
  async updateFile(oldKey: string | null, newFile: File | null, path: string = 'uploads'): Promise<{ url: string; key: string } | null> {
    if (!newFile) {
      if (oldKey) await this.delete(oldKey);
      return null;
    }

    if (oldKey) {
      await this.delete(oldKey);
    }

    return this.upload(newFile, path);
  }
};
