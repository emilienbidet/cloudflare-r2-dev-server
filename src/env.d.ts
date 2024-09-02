declare module "bun" {
  interface Env {
    R2_BUCKET_NAME: string;
    R2_BUCKET_DATABASE_NAME: string;
    R2_BUCKET_PATH: string;
  }
}
