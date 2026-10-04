import { Client } from "minio";

const endpoint = new URL(process.env.MINIO_ENDPOINT ?? "http://127.0.0.1:9000");
const bucket = process.env.MINIO_BUCKET ?? "academy-assets";

const client = new Client({
  endPoint: endpoint.hostname,
  port: endpoint.port ? Number(endpoint.port) : endpoint.protocol === "https:" ? 443 : 80,
  useSSL: endpoint.protocol === "https:",
  accessKey: process.env.MINIO_ACCESS_KEY ?? "academy",
  secretKey: process.env.MINIO_SECRET_KEY ?? "academy-secret",
});

export async function putImage({ key, buffer, contentType }: { key: string; buffer: Buffer; contentType: string }) {
  if (!(await client.bucketExists(bucket))) {
    await client.makeBucket(bucket);
  }

  await client.putObject(bucket, key, buffer, buffer.length, {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  return key;
}

export async function getImage(key: string) {
  const [object, stats] = await Promise.all([client.getObject(bucket, key), client.statObject(bucket, key)]);
  return { object, contentType: stats.metaData["content-type"] ?? "application/octet-stream" };
}
