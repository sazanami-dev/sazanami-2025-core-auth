import { Router } from "express";
import prisma from "@/prisma";

const router = Router();

router.get("/", (req, res) => {
  const page = parseInt(String(req.query.page || "1"));
  const pageSize = parseInt(String(req.query.pageSize || "20"));
  const skip = (page - 1) * pageSize;

  // WONTFIX: 自作ページネーションやめるべき
  prisma.pendingRedirect.findMany({
    orderBy: { createdAt: "desc" },
    skip: skip,
    take: pageSize,
  })
    .then(async (redirects) => {
      const totalCount = await prisma.pendingRedirect.count();
      res.json({
        data: redirects,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
          totalCount,
        },
      });
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to fetch pending redirects." });
    });
});

router.delete("/:id", (req, res) => {
  const redirectId = req.params.id;
  prisma.pendingRedirect.delete({
    where: { id: redirectId },
  })
    .then(() => {
      res.status(204).end();
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to delete pending redirect." });
    });
});

router.put("/:id", (req, res) => {
  const redirectId = req.params.id;
  const { data } = req.body;
  prisma.pendingRedirect.update({
    where: { id: redirectId },
    data: data,
  })
    .then((updatedRedirect) => {
      res.json(updatedRedirect);
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to update pending redirect." });
    });
});

router.post("/", (req, res) => {
  const { id, redirectUrl, postbackUrl, state, expiresAt, sessionId, used } = req.body;
  prisma.pendingRedirect.create({
    data: {
      id,
      redirectUrl,
      postbackUrl: postbackUrl || null,
      state: state || null,
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 10 * 60 * 1000),
      sessionId,
      used,
    },
  })
    .then((newRedirect) => {
      res.status(201).json(newRedirect);
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to create pending redirect." });
    });
});

export default router;
