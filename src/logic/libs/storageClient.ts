import { S3Client } from "@aws-sdk/client-s3";
import { config } from "../utils/config.js";

let s3ClientInstance: S3Client | null = null;

/**
 * LIBS/STORAGECLIENT.TS
 * Bridge for Tigris (S3-Compatible) Object Storage.
 * Uses Lazy Initialization to prevent startup crashes.
 */
export const getS3Client = (): S3Client => {
  if (s3ClientInstance) return s3ClientInstance;

  const { accessKeyId, secretAccessKey, endpoint } = config.tigris;

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    console.warn("[Storage Warning]: Tigris configuration is incomplete. Uploads and deletes will fail.");
  }

  s3ClientInstance = new S3Client({
    region: "auto",
    endpoint: endpoint || "https://t3.storage.dev",
    credentials: {
      accessKeyId: accessKeyId || "placeholder",
      secretAccessKey: secretAccessKey || "placeholder",
    },
    forcePathStyle: true, // MANDATORY for Tigris
  });

  return s3ClientInstance;
};
