// db.ts
import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { dotEnvConfig } from "../../deps.ts";

const env = dotEnvConfig({ export: true });
const dbPool = new Pool(env.DB_URL, 3 , true);
export async function getDbClient() {
  return await dbPool.connect();
}


