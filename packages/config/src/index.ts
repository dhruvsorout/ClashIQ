import dotenv from "dotenv";
import { z } from "zod";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: fileURLToPath(
    new URL("../../../.env", import.meta.url)
  ),
});

const envSchema = z.object({
  JWT_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
});

const env = envSchema.parse(process.env);

export const config = {
  jwtSecret: env.JWT_SECRET,
  databaseUrl: env.DATABASE_URL,
};