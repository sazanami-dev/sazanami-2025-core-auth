import prisma from "@/prisma";
import Logger from "@/logger";
import { EnvUtil, EnvKey } from "@/utils/env-util";

export const testPsqlConnection = async () => {
  const dbLogger = new Logger('boot', 'psql');

  dbLogger.info('Testing PostgreSQL connection...');

  try {
    if (EnvUtil.get(EnvKey.NODE_ENV) === 'test') {
      dbLogger.info('Running in test mode, skipping actual database connection.', 'psql');
      return;
    }
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT version()` as [{ version: string }];
    dbLogger.success("Success: " + result[0].version.split(" ").slice(0, 2).join(" "));
    // dbLogger.debug("raw: " + JSON.stringify(result));
  } catch (error) {
    dbLogger.error("Failed to connect to database");
    dbLogger.debug("Error: " + error);
    throw new Error("Database connection failed");
  }
}
