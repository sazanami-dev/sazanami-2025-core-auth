import { Router } from "express";
import prisma from "@/prisma";
import Logger from "@/logger";
import { buildPagination, getPaginationParams, sendError, sendJson, sendNoContent } from "./helpers";

const router = Router();
const logger = new Logger('routes', 'manage', 'pending-redirect');

const parseExpiresAt = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

router.get("/", async (req, res) => {
  const { page, pageSize, skip } = getPaginationParams(req);

  try {
    const [redirects, totalCount] = await Promise.all([
      prisma.pendingRedirect.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.pendingRedirect.count(),
    ]);

    return sendJson(res, {
      data: redirects,
      pagination: buildPagination(page, pageSize, totalCount),
    });
  } catch (error) {
    logger.error(`Failed to fetch pending redirects: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to fetch pending redirects.");
  }
});

router.delete("/:id", async (req, res) => {
  const redirectId = req.params.id;

  try {
    const target = await prisma.pendingRedirect.findUnique({ where: { id: redirectId } });
    if (!target) {
      return sendError(res, 404, "Pending redirect not found.");
    }

    await prisma.pendingRedirect.delete({ where: { id: redirectId } });
    return sendNoContent(res);
  } catch (error) {
    logger.error(`Failed to delete pending redirect ${redirectId}: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to delete pending redirect.");
  }
});

router.put("/:id", async (req, res) => {
  const redirectId = req.params.id;
  const { data } = req.body ?? {};

  if (!data || typeof data !== "object") {
    return sendError(res, 400, "data payload is required.");
  }

  const updatePayload: Record<string, unknown> = { ...data };

  if (data.expiresAt) {
    const date = parseExpiresAt(data.expiresAt);
    if (!date) {
      return sendError(res, 400, "expiresAt must be a valid date string.");
    }
    updatePayload.expiresAt = date;
  }

  if (Object.keys(updatePayload).length === 0) {
    return sendError(res, 400, "No update fields provided.");
  }

  try {
    const updatedRedirect = await prisma.pendingRedirect.update({
      where: { id: redirectId },
      data: updatePayload,
    });
    return sendJson(res, updatedRedirect);
  } catch (error) {
    logger.error(`Failed to update pending redirect ${redirectId}: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to update pending redirect.");
  }
});

router.post("/", async (req, res) => {
  const { id, redirectUrl, postbackUrl, state, expiresAt, sessionId, used } = req.body ?? {};

  if (!sessionId) {
    return sendError(res, 400, "sessionId is required.");
  }

  const parsedExpiresAt = expiresAt ? parseExpiresAt(expiresAt) : new Date(Date.now() + 10 * 60 * 1000);
  if (expiresAt && !parsedExpiresAt) {
    return sendError(res, 400, "expiresAt must be a valid date string.");
  }

  try {
    const newRedirect = await prisma.pendingRedirect.create({
      data: {
        id,
        redirectUrl,
        postbackUrl: postbackUrl ?? null,
        state: state ?? null,
        expiresAt: parsedExpiresAt!,
        sessionId,
        used: used ?? false,
      },
    });

    return sendJson(res, newRedirect, 201);
  } catch (error) {
    logger.error(`Failed to create pending redirect: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to create pending redirect.");
  }
});

export default router;
