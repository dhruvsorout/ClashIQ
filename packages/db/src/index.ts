import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

dotenv.config({
  path: "../../packages/db/.env",
});

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

console.log(
  "DATABASE_URL exists:",
  Boolean(process.env.DATABASE_URL)
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