import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { env } from "../config/env";

// Prisma 7 uses a driver adapter for PostgreSQL. Keeping the client in one file
// avoids creating multiple database connection pools across controllers/services.
const postgresAdapter = new PrismaPg({
  connectionString: env.databaseUrl,
});

export const prisma = new PrismaClient({
  adapter: postgresAdapter,
});
