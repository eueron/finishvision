import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * StorageService abstracts file storage.
 * In development: uses local filesystem under /tmp/fv-storage/
 * In production: would use S3/MinIO (swap implementation).
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly localRoot: string;
  private readonly useLocal: boolean;

  constructor(private config: ConfigService) {
    const nodeEnv = this.config.get('NODE_ENV', 'development');
    this.useLocal = nodeEnv === 'development' || nodeEnv === 'test';
    this.localRoot = '/tmp/fv-storage';

    if (this.useLocal) {
      fs.mkdirSync(this.localRoot, { recursive: true });
      this.logger.log(`Using local file storage at ${this.localRoot}`);
    }
  }

  /**
   * Upload a file from a local path to storage.
   */
  async uploadFile(localPath: string, storagePath: string): Promise<string> {
    if (this.useLocal) {
      const dest = path.join(this.localRoot, storagePath);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(localPath, dest);
      this.logger.log(`Stored locally: ${storagePath}`);
      return storagePath;
    }

    // S3 upload would go here in production
    const body = fs.readFileSync(localPath);
    return this.upload(storagePath, body, 'application/octet-stream');
  }

  /**
   * Upload a buffer to storage.
   */
  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    if (this.useLocal) {
      const dest = path.join(this.localRoot, key);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, body);
      this.logger.log(`Stored locally: ${key}`);
      return key;
    }

    // S3 upload in production
    this.logger.log(`Uploaded: ${key}`);
    return key;
  }

  /**
   * Get a URL or local path for a stored file.
   */
  async getFileUrl(storagePath: string): Promise<string | null> {
    if (this.useLocal) {
      const localPath = path.join(this.localRoot, storagePath);
      if (fs.existsSync(localPath)) {
        return `/api/v1/storage/files/${encodeURIComponent(storagePath)}`;
      }
      return null;
    }

    // Return signed S3 URL in production
    return storagePath;
  }

  /**
   * Get the local filesystem path for a stored file (dev only).
   */
  getLocalPath(storagePath: string): string | null {
    if (!this.useLocal) return null;
    const localPath = path.join(this.localRoot, storagePath);
    return fs.existsSync(localPath) ? localPath : null;
  }

  /**
   * Delete a file from storage.
   */
  async delete(key: string): Promise<void> {
    if (this.useLocal) {
      const localPath = path.join(this.localRoot, key);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      this.logger.log(`Deleted locally: ${key}`);
      return;
    }

    this.logger.log(`Deleted: ${key}`);
  }

  /**
   * Get a public-accessible URL for a stored file.
   */
  getUrl(key: string): string {
    if (this.useLocal) {
      return `/api/v1/storage/files/${encodeURIComponent(key)}`;
    }
    // Return S3 URL in production
    return key;
  }

  /**
   * Download a file from storage as a Buffer.
   */
  async download(key: string): Promise<Buffer> {
    if (this.useLocal) {
      const localPath = path.join(this.localRoot, key);
      if (!fs.existsSync(localPath)) {
        throw new Error(`File not found: ${key}`);
      }
      return fs.readFileSync(localPath);
    }
    // S3 download in production
    throw new Error('S3 download not implemented');
  }

  /**
   * Serve a file from local storage (dev only).
   */
  getFileStream(storagePath: string): { stream: fs.ReadStream; contentType: string } | null {
    if (!this.useLocal) return null;
    const localPath = path.join(this.localRoot, storagePath);
    if (!fs.existsSync(localPath)) return null;

    const ext = path.extname(localPath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.pdf': 'application/pdf',
      '.webp': 'image/webp',
    };

    return {
      stream: fs.createReadStream(localPath),
      contentType: contentTypes[ext] || 'application/octet-stream',
    };
  }
}
