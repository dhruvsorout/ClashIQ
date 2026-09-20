import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { config } from "@ClashIQ/config";

dotenv.config({
  path: "../../packages/db/.env",
});

const connectionString = config.databaseUrl;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

console.log(
  "DATABASE_URL exists:",
  Boolean(config.databaseUrl)
);

const adapter = new PrismaPg({ connectionString });

const globalForDb = globalThis as unknown as {
    db: PrismaClient | undefined;
};

export const db = 
    globalForDb.db ??
    new PrismaClient({
        adapter,
    });

if (process.env.NODE_ENV !== "PRODUCTION") {
  globalForDb.db = db;
}