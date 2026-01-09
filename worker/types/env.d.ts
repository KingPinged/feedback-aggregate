import type { D1Database, Ai, VectorizeIndex } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  AI: Ai;
  VECTOR_INDEX: VectorizeIndex;
  ENVIRONMENT: string;
}

declare global {
  interface CloudflareEnv extends Env {}
}
