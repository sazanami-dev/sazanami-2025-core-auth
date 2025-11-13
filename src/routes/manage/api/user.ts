import { Router } from "express";
import prisma from "@/prisma";
import Logger from "@/logger";
import { buildPagination, getPaginationParams, sendError, sendJson, sendNoContent } from "./helpers";

const router = Router();
const logger = new Logger('routes', 'manage', 'user');

router.get("/", async (req, res) => {
  const { page, pageSize, skip } = getPaginationParams(req);

  try {
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        orderBy: { id: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.user.count(),
    ]);

    return sendJson(res, {
      data: users,
      pagination: buildPagination(page, pageSize, totalCount),
    });
  } catch (error) {
    logger.error(`Failed to fetch users: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to fetch users.");
  }
});

router.get("/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return sendError(res, 404, "User not found.");
    }
    return sendJson(res, user);
  } catch (error) {
    logger.error(`Failed to fetch user ${userId}: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to fetch user.");
  }
});

router.post("/", async (req, res) => {
  const { id, displayName, isInitialized } = req.body ?? {};

  try {
    const newUser = await prisma.user.create({
      data: {
        id: id || undefined,
        displayName: displayName ?? null,
        isInitialized: Boolean(isInitialized),
      },
    });
    return sendJson(res, newUser, 201);
  } catch (error) {
    logger.error(`Failed to create user: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to create user.");
  }
});

router.put("/:id", async (req, res) => {
  const userId = req.params.id;
  const { isInitialized, displayName } = req.body ?? {};
  const updateData: Record<string, unknown> = {};

  if (typeof isInitialized === "boolean") {
    updateData.isInitialized = isInitialized;
  }
  if (displayName !== undefined) {
    updateData.displayName = displayName;
  }

  if (Object.keys(updateData).length === 0) {
    return sendError(res, 400, "No update fields provided.");
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    return sendJson(res, updatedUser);
  } catch (error) {
    logger.error(`Failed to update user ${userId}: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to update user.");
  }
});

router.delete("/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return sendError(res, 404, "User not found.");
    }

    await prisma.user.delete({ where: { id: userId } });
    return sendNoContent(res);
  } catch (error) {
    logger.error(`Failed to delete user ${userId}: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to delete user.");
  }
});

export default router;
