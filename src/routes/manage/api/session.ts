import { Router } from "express";
import prisma from "@/prisma";
import Logger from "@/logger";
import { buildPagination, getPaginationParams, sendError, sendJson, sendNoContent } from "./helpers";

const router = Router();
const logger = new Logger('routes', 'manage', 'session');

router.get("/", async (req, res) => {
  const { page, pageSize, skip } = getPaginationParams(req);

  try {
    const [sessions, totalCount] = await Promise.all([
      prisma.session.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.session.count(),
    ]);

    return sendJson(res, {
      data: sessions,
      pagination: buildPagination(page, pageSize, totalCount),
    });
  } catch (error) {
    logger.error(`Failed to fetch sessions: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to fetch sessions.");
  }
});

router.get("/:id", async (req, res) => {
  const sessionId = req.params.id;

  try {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      return sendError(res, 404, "Session not found.");
    }
    return sendJson(res, session);
  } catch (error) {
    logger.error(`Failed to fetch session ${sessionId}: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to fetch session.");
  }
});

router.post("/", async (req, res) => {
  const { id, userId } = req.body ?? {};

  try {
    const newSession = await prisma.session.create({
      data: {
        id: id || undefined,
        userId: userId || null,
      },
    });
    return sendJson(res, newSession, 201);
  } catch (error) {
    logger.error(`Failed to create session: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to create session.");
  }
});

router.put("/:id", async (req, res) => {
  const sessionId = req.params.id;
  const { userId } = req.body ?? {};
  const updateData: Record<string, unknown> = {};

  if (userId !== undefined) {
    updateData.userId = userId;
  }

  if (Object.keys(updateData).length === 0) {
    return sendError(res, 400, "No update fields provided.");
  }

  try {
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: updateData,
    });
    return sendJson(res, updatedSession);
  } catch (error) {
    logger.error(`Failed to update session ${sessionId}: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to update session.");
  }
});

router.delete("/:id", async (req, res) => {
  const sessionId = req.params.id;

  try {
    const target = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!target) {
      return sendError(res, 404, "Session not found.");
    }

    await prisma.session.delete({ where: { id: sessionId } });
    return sendNoContent(res);
  } catch (error) {
    logger.error(`Failed to delete session ${sessionId}: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to delete session.");
  }
});

export default router;
