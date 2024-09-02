import { Database } from "bun:sqlite";
import { Hono } from "hono";

class R2Object {
  key!: string;
  blob_id!: string;
  version!: string;
  size!: number;
  etag!: string;
  uploaded!: number;
  checksums!: { [key: string]: string };
  http_metadata!: { [key: string]: string };
  custom_metadata!: { [key: string]: string };
}

export const { R2_BUCKET_NAME, R2_BUCKET_DATABASE_NAME, R2_BUCKET_PATH } =
  Bun.env;

const databasePath = `${R2_BUCKET_PATH}/miniflare-R2BucketObject/${R2_BUCKET_DATABASE_NAME}.sqlite`;
const database = new Database(databasePath, { strict: true });

const app = new Hono();

app.get("/:key", (c) => {
  const key = c.req.param("key");
  const object = database
    .query(`SELECT * FROM _mf_objects WHERE key = $key`)
    .as(R2Object)
    .get({ key });

  if (!object) {
    return c.notFound();
  }

  const path = `${R2_BUCKET_PATH}/${R2_BUCKET_NAME}/blobs/${object.blob_id}`;
  const file = Bun.file(path);
  const stream = file.stream();

  const headers = new Headers();

  headers.set("Content-Type", "application/octet-stream");
  headers.set("Content-Disposition", `attachment; filename="${object.key}"`);
  headers.set("Content-Length", object.size.toString());
  headers.set("ETag", object.etag);
  headers.set("Last-Modified", new Date(object.uploaded).toUTCString());
  headers.set("Cache-Control", "public, max-age=31536000");

  return c.body(stream, { headers });
});

export default app;
