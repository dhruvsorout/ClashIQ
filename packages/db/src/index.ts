import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

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