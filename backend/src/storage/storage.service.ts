import { DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Readable } from "node:stream";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.getOrThrow<string>("objectStorageBucket");
    this.client = new S3Client({
      endpoint: config.getOrThrow<string>("objectStorageEndpoint"),
      region: config.getOrThrow<string>("objectStorageRegion"),
      forcePathStyle: config.getOrThrow<boolean>("objectStorageForcePathStyle"),
      credentials: {
        accessKeyId: config.getOrThrow<string>("objectStorageAccessKey"),
        secretAccessKey: config.getOrThrow<string>("objectStorageSecretKey"),
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
  }

  async putPrivateObject(key: string, body: Uint8Array, contentType: string, metadata: Record<string, string> = {}): Promise<void> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType, Metadata: metadata, ServerSideEncryption: "AES256" }));
  }

  async getPrivateObject(key: string): Promise<Uint8Array> {
    const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    if (!response.Body) throw new Error("Object storage returned an empty response.");
    const body = response.Body as Readable & { transformToByteArray?: () => Promise<Uint8Array> };
    if (body.transformToByteArray) return body.transformToByteArray();
    const chunks: Buffer[] = [];
    for await (const chunk of body) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
    return new Uint8Array(Buffer.concat(chunks));
  }

  async deletePrivateObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async createViewUrl(key: string): Promise<string> {
    const expiresIn = this.config.getOrThrow<number>("objectStorageDownloadTtlSeconds");
    return getSignedUrl(this.client, new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: "inline",
    }), { expiresIn });
  }

  async createDownloadUrl(key: string, filename: string): Promise<string> {
    const expiresIn = this.config.getOrThrow<number>("objectStorageDownloadTtlSeconds");
    return getSignedUrl(this.client, new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: `attachment; filename="${filename.replace(/["\\]/g, "-")}"`,
    }), { expiresIn });
  }
}
