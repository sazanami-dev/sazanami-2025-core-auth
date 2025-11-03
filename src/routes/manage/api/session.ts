import { Router } from "express";
import prisma from "@/prisma";

const router = Router();

router.get("/", (req, res) => {
  const page = parseInt(String(req.query.page || "1"));
  const pageSize = parseInt(String(req.query.pageSize || "20"));
  const skip = (page - 1) * pageSize;

  // WONTFIX: 自作ページネーションやめるべき
  prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    skip: skip,
    take: pageSize,
  })
    .then(async (sessions) => {
      const totalCount = await prisma.session.count();
      res.json({
        data: sessions,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
          totalCount,
        },
      });
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to fetch sessions." });
    });
});

router.delete("/:id", (req, res) => {
  const sessionId = req.params.id;
  prisma.session.delete({
    where: { id: sessionId },
  })
    .then(() => {
      res.status(204).end();
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to delete session." });
    });
});

router.put("/:id", (req, res) => {
  const sessionId = req.params.id;
  const { data } = req.body;
  prisma.session.update({
    where: { id: sessionId },
    data: data,
  })
    .then((updatedSession) => {
      res.json(updatedSession);
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to update session." });
    });
});

router.get("/:id", (req, res) => {
  const sessionId = req.params.id;
  prisma.session.findUnique({
    where: { id: sessionId },
  })
    .then((session) => {
      if (session) {
        res.json(session);
      } else {
        res.status(404).json({ error: "Session not found." });
      }
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to fetch session." });
    });
});

router.post("/", (req, res) => {
  const { id, userId } = req.body;
  prisma.session.create({
    data: {
      id: id || undefined,
      userId,
    },
  })
    .then((newSession) => {
      res.status(201).json(newSession);
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to create session." });
    });
});

export default router;
