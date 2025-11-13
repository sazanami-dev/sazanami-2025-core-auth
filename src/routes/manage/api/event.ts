import { Router } from "express";
import prisma from "@/prisma";
import Logger from "@/logger";
import { buildPagination, getPaginationParams, sendError, sendJson } from "./helpers";

const router = Router();
const logger = new Logger('routes', 'manage', 'event');

router.get("/", async (req, res) => {
  const { page, pageSize, skip } = getPaginationParams(req);

  try {
    const [logs, totalCount] = await Promise.all([
      prisma.eventLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.eventLog.count(),
    ]);

    return sendJson(res, {
      data: logs,
      pagination: buildPagination(page, pageSize, totalCount),
    });
  } catch (error) {
    logger.error(`Failed to fetch event logs: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to fetch event logs.");
  }
});

export default router;
