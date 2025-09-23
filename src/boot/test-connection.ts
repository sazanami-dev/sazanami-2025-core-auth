import prisma from "@/prisma";
import Logger from "@/logger";

export const testPsqlConnection = async () => {
  const dbLogger = new Logger('boot', 'psql');

  dbLogger.info('Testing PostgreSQL connection...');

  try {
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
