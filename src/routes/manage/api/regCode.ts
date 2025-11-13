import { Router } from "express";
import prisma from "@/prisma";
import Logger from "@/logger";
import { buildPagination, getPaginationParams, sendError, sendJson, sendNoContent } from "./helpers";

const router = Router();
const logger = new Logger('routes', 'manage', 'regCode');

router.get("/", async (req, res) => {
  const { page, pageSize, skip } = getPaginationParams(req);

  try {
    const [codes, totalCount] = await Promise.all([
      prisma.registrationCode.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.registrationCode.count(),
    ]);

    return sendJson(res, {
      data: codes,
      pagination: buildPagination(page, pageSize, totalCount),
    });
  } catch (error) {
    logger.error(`Failed to fetch registration codes: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to fetch registration codes.");
  }
});

router.get("/:code", async (req, res) => {
  const code = req.params.code;

  try {
    const registrationCode = await prisma.registrationCode.findUnique({ where: { code } });
    if (!registrationCode) {
      return sendError(res, 404, "Registration code not found.");
    }
    return sendJson(res, registrationCode);
  } catch (error) {
    logger.error(`Failed to fetch registration code ${code}: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to fetch registration code.");
  }
});

router.post("/", async (req, res) => {
  const { code, userId } = req.body ?? {};

  if (!userId) {
    return sendError(res, 400, "userId is required.");
  }

  try {
    const newCode = await prisma.registrationCode.create({
      data: {
        code: code || undefined,
        userId,
      },
    });
    return sendJson(res, newCode, 201);
  } catch (error) {
    logger.error(`Failed to create registration code: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to create registration code.");
  }
});

router.put("/:code", async (req, res) => {
  const code = req.params.code;
  const { userId } = req.body ?? {};

  if (!userId) {
    return sendError(res, 400, "userId is required.");
  }

  try {
    const updatedCode = await prisma.registrationCode.update({
      where: { code },
      data: { userId },
    });
    return sendJson(res, updatedCode);
  } catch (error) {
    logger.error(`Failed to update registration code ${code}: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to update registration code.");
  }
});

router.delete("/:code", async (req, res) => {
  const code = req.params.code;

  try {
    const target = await prisma.registrationCode.findUnique({ where: { code } });
    if (!target) {
      return sendError(res, 404, "Registration code not found.");
    }

    await prisma.registrationCode.delete({ where: { code } });
    return sendNoContent(res);
  } catch (error) {
    logger.error(`Failed to delete registration code ${code}: ${(error as Error).message}`);
    return sendError(res, 500, "Failed to delete registration code.");
  }
});

export default router;
